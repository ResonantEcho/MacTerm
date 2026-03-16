/**
 * src/main/index.js  — Electron main process (Phase 2)
 *
 * Changes from Phase 1:
 *  - Imports sshManager
 *  - Adds IPC handlers: ssh:connect, ssh:data, ssh:resize, ssh:disconnect
 *  - Adds IPC handlers: sftp:readdir, sftp:download, sftp:upload,
 *                       sftp:mkdir, sftp:delete
 *  - ssh:connect streams output back to the renderer via webContents.send()
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const ssh  = require('./sshManager');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#1a1c20',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ─── IPC: SSH ─────────────────────────────────────────────────────────────────

/**
 * ssh:connect
 * Opens a real SSH connection + shell for the given session.
 * Streams terminal output back via 'ssh:data:<sessionId>' events.
 */
ipcMain.handle('ssh:connect', async (event, { sessionId, profile }) => {
  try {
    // Resolve vault credential if needed
    const resolvedProfile = await resolveCredential(profile);

    await ssh.connect(
      sessionId,
      resolvedProfile,
      // onData — stream output to renderer
      (data) => {
        if (!mainWindow?.isDestroyed()) {
          mainWindow.webContents.send(`ssh:data:${sessionId}`, data);
        }
      },
      // onClose
      (reason) => {
        if (!mainWindow?.isDestroyed()) {
          mainWindow.webContents.send(`ssh:closed:${sessionId}`, reason);
        }
      }
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

/** ssh:data — renderer sends keystrokes to the shell */
ipcMain.on('ssh:data', (_, { sessionId, data }) => {
  ssh.sendData(sessionId, data);
});

/** ssh:resize — terminal window was resized */
ipcMain.on('ssh:resize', (_, { sessionId, cols, rows }) => {
  ssh.resize(sessionId, cols, rows);
});

/** ssh:disconnect — close the session */
ipcMain.handle('ssh:disconnect', async (_, sessionId) => {
  ssh.disconnect(sessionId);
  return true;
});

// ─── IPC: SFTP ────────────────────────────────────────────────────────────────

ipcMain.handle('sftp:readdir', async (_, { sessionId, remotePath }) => {
  try {
    const files = await ssh.readdir(sessionId, remotePath);
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sftp:download', async (_, { sessionId, remotePath }) => {
  try {
    // Ask user where to save
    const basename = path.basename(remotePath);
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(require('os').homedir(), 'Downloads', basename),
    });
    if (canceled || !filePath) return { success: false, error: 'Cancelled' };

    const tmpPath = await ssh.download(sessionId, remotePath);
    require('fs').renameSync(tmpPath, filePath);
    return { success: true, localPath: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sftp:upload', async (_, { sessionId, remotePath }) => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
    });
    if (canceled || !filePaths.length) return { success: false, error: 'Cancelled' };

    const localPath  = filePaths[0];
    const remoteFile = remotePath.endsWith('/')
      ? remotePath + path.basename(localPath)
      : remotePath;

    await ssh.upload(sessionId, localPath, remoteFile);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sftp:mkdir', async (_, { sessionId, remotePath }) => {
  try {
    await ssh.mkdir(sessionId, remotePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('sftp:delete', async (_, { sessionId, remotePath, isDir }) => {
  try {
    await ssh.deleteRemote(sessionId, remotePath, isDir);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── IPC: Profiles ────────────────────────────────────────────────────────────

ipcMain.handle('profiles:get-all', async () => getStore().get('profiles', getDefaultProfiles()));

ipcMain.handle('profiles:save', async (_, profile) => {
  const store = getStore();
  const profiles = store.get('profiles', []);
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push({ ...profile, id: Date.now().toString() });
  store.set('profiles', profiles);
  return true;
});

ipcMain.handle('profiles:delete', async (_, id) => {
  const store = getStore();
  store.set('profiles', store.get('profiles', []).filter(p => p.id !== id));
  return true;
});

// ─── IPC: Vault ───────────────────────────────────────────────────────────────

ipcMain.handle('vault:get-all', async () => getStore().get('vault', []));

ipcMain.handle('vault:save', async (_, credential) => {
  const store = getStore();
  const vault = store.get('vault', []);
  const idx = vault.findIndex(c => c.id === credential.id);
  if (idx >= 0) vault[idx] = credential;
  else vault.push({ ...credential, id: Date.now().toString() });
  store.set('vault', vault);
  return true;
});

ipcMain.handle('vault:delete', async (_, id) => {
  const store = getStore();
  store.set('vault', store.get('vault', []).filter(c => c.id !== id));
  return true;
});

// ─── IPC: Shell ───────────────────────────────────────────────────────────────

ipcMain.handle('shell:open-external', async (_, url) => {
  await shell.openExternal(url);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _store = null;
function getStore() {
  if (!_store) {
    const Store = require('electron-store');
    _store = new Store({ encryptionKey: 'macterm-local-v1' });
  }
  return _store;
}

/**
 * If the profile uses a vault credential reference, resolve the secret
 * from the vault before passing to sshManager.
 */
async function resolveCredential(profile) {
  if (profile.authType !== 'vault' || !profile.vaultCredId) return profile;
  const vault = getStore().get('vault', []);
  const cred  = vault.find(c => c.id === profile.vaultCredId);
  if (!cred) return profile;
  return {
    ...profile,
    authType: cred.authType,
    password: cred.authType === 'password' ? cred.secret : undefined,
    keyPath:  cred.authType === 'sshkey'   ? cred.secret : undefined,
  };
}

function getDefaultProfiles() {
  return [
    { id: '1', name: 'web-01.prod',   group: 'Production', protocol: 'SSH', host: '192.168.1.10', port: 22,   username: 'ubuntu',        authType: 'sshkey' },
    { id: '2', name: 'win-dc01.prod', group: 'Production', protocol: 'RDP', host: '192.168.1.20', port: 3389, username: 'Administrator', authType: 'password' },
    { id: '3', name: 'dev-desktop',   group: 'Production', protocol: 'VNC', host: '192.168.1.30', port: 5900, username: '',              authType: 'password' },
    { id: '4', name: 'app-02.stg',    group: 'Staging',    protocol: 'SSH', host: '10.0.0.10',    port: 22,   username: 'ubuntu',        authType: 'sshkey' },
    { id: '5', name: 'db-01.stg',     group: 'Staging',    protocol: 'SSH', host: '10.0.0.11',    port: 22,   username: 'postgres',      authType: 'sshkey' },
  ];
}
