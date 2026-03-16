/**
 * sshManager.js — Main process SSH connection manager
 *
 * Runs in Electron's main process where Node.js (and ssh2) are fully available.
 * Each connection is stored by sessionId. The renderer communicates via IPC.
 *
 * Session lifecycle:
 *   ssh:connect      → open TCP + auth → reply with success/error
 *   ssh:data         → renderer → shell (keystrokes)
 *   ssh:resize       → renderer → shell (terminal resize)
 *   ssh:disconnect   → close shell + connection
 *
 * SFTP lifecycle:
 *   sftp:readdir     → list a remote directory
 *   sftp:download    → stream a file to a local temp path
 *   sftp:upload      → stream a local file to remote path
 *   sftp:mkdir       → create remote directory
 *   sftp:delete      → delete remote file or directory
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Map of sessionId → { client, shell, sftp }
const sessions = new Map();

/**
 * Open an SSH connection and start an interactive shell.
 * Calls onData(chunk) for every chunk of output from the remote shell.
 * Calls onClose(reason) when the connection drops.
 */
async function connect(sessionId, profile, onData, onClose) {
  return new Promise((resolve, reject) => {
    const client = new Client();

    const connConfig = buildConnConfig(profile);

    client.on('ready', () => {
      client.shell({ term: 'xterm-256color' }, (err, stream) => {
        if (err) {
          client.end();
          return reject(new Error(`Shell error: ${err.message}`));
        }

        sessions.set(sessionId, { client, shell: stream, sftp: null });

        stream.on('data', (data) => onData(data.toString('utf8')));
        stream.stderr.on('data', (data) => onData(data.toString('utf8')));

        stream.on('close', () => {
          sessions.delete(sessionId);
          onClose('shell closed');
        });

        resolve({ success: true });
      });
    });

    client.on('error', (err) => {
      sessions.delete(sessionId);
      // Resolve instead of reject so the renderer gets a clean error message
      // rather than an unhandled promise rejection.
      reject(new Error(err.message));
    });

    client.on('end', () => {
      sessions.delete(sessionId);
      onClose('connection ended');
    });

    try {
      client.connect(connConfig);
    } catch (err) {
      reject(err);
    }
  });
}

/** Send raw keystrokes / paste data to the remote shell. */
function sendData(sessionId, data) {
  const session = sessions.get(sessionId);
  if (session?.shell) {
    session.shell.write(data);
  }
}

/** Notify the remote shell of a terminal resize. */
function resize(sessionId, cols, rows) {
  const session = sessions.get(sessionId);
  if (session?.shell) {
    session.shell.setWindow(rows, cols, 0, 0);
  }
}

/** Gracefully close a session. */
function disconnect(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    try { session.shell?.end(); } catch (_) {}
    try { session.client?.end(); } catch (_) {}
    sessions.delete(sessionId);
  }
}

// ─── SFTP ─────────────────────────────────────────────────────────────────────

/** Get or open an SFTP subsystem for an existing SSH session. */
function getSftp(sessionId) {
  return new Promise((resolve, reject) => {
    const session = sessions.get(sessionId);
    if (!session) return reject(new Error('No SSH session found'));

    if (session.sftp) return resolve(session.sftp);

    session.client.sftp((err, sftp) => {
      if (err) return reject(err);
      session.sftp = sftp;
      resolve(sftp);
    });
  });
}

/** List a remote directory. Returns array of file stat objects. */
async function readdir(sessionId, remotePath) {
  const sftp = await getSftp(sessionId);
  return new Promise((resolve, reject) => {
    sftp.readdir(remotePath, (err, list) => {
      if (err) return reject(err);
      resolve(
        list.map(item => ({
          name:     item.filename,
          type:     item.longname.startsWith('d') ? 'dir' : 'file',
          size:     item.attrs.size,
          modified: item.attrs.mtime * 1000,
          mode:     item.attrs.mode,
        }))
      );
    });
  });
}

/** Download a remote file to a local temp path. Returns the local path. */
async function download(sessionId, remotePath) {
  const sftp = await getSftp(sessionId);
  const localPath = path.join(os.tmpdir(), path.basename(remotePath));
  return new Promise((resolve, reject) => {
    sftp.fastGet(remotePath, localPath, (err) => {
      if (err) return reject(err);
      resolve(localPath);
    });
  });
}

/** Upload a local file to a remote path. */
async function upload(sessionId, localPath, remotePath) {
  const sftp = await getSftp(sessionId);
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

/** Create a remote directory. */
async function mkdir(sessionId, remotePath) {
  const sftp = await getSftp(sessionId);
  return new Promise((resolve, reject) => {
    sftp.mkdir(remotePath, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

/** Delete a remote file (not recursive — directories must be empty). */
async function deleteRemote(sessionId, remotePath, isDir) {
  const sftp = await getSftp(sessionId);
  return new Promise((resolve, reject) => {
    const fn = isDir ? sftp.rmdir.bind(sftp) : sftp.unlink.bind(sftp);
    fn(remotePath, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function buildConnConfig(profile) {
  const base = {
    host:           profile.host,
    port:           profile.port || 22,
    username:       profile.username,
    readyTimeout:   10000,
    keepaliveInterval: 15000,
  };

  if (profile.authType === 'sshkey') {
    const keyPath = expandHome(profile.keyPath || '~/.ssh/id_rsa');
    if (fs.existsSync(keyPath)) {
      base.privateKey = fs.readFileSync(keyPath);
      if (profile.passphrase) base.passphrase = profile.passphrase;
    } else {
      // Fall back to ssh-agent
      base.agent = process.env.SSH_AUTH_SOCK;
    }
  } else {
    base.password = profile.password || profile.secret || '';
  }

  return base;
}

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

module.exports = {
  connect,
  sendData,
  resize,
  disconnect,
  readdir,
  download,
  upload,
  mkdir,
  deleteRemote,
};
