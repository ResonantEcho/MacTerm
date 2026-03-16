/**
 * rdpManager.js — Main process RDP session manager
 *
 * RDP is Microsoft's proprietary protocol. The best open-source
 * implementation is FreeRDP (xfreerdp). We spawn it as a native
 * macOS subprocess — it opens its own window, which is the most
 * reliable approach. No screen-sharing inside the Electron window
 * is attempted (that would require rendering FreeRDP's output as
 * a video stream — a much larger undertaking).
 *
 * Prerequisites (macOS):
 *   brew install freerdp
 *
 * Session lifecycle:
 *   rdp:start  → spawn xfreerdp → return { success, pid }
 *   rdp:stop   → kill subprocess
 */

const { spawn, execFile } = require('child_process');
const os   = require('os');
const path = require('path');

// Map of sessionId → ChildProcess
const processes = new Map();

// Possible FreeRDP binary locations on macOS
const FREERDP_PATHS = [
  '/opt/homebrew/bin/xfreerdp',   // Apple Silicon Homebrew
  '/usr/local/bin/xfreerdp',      // Intel Homebrew
  '/opt/homebrew/bin/xfreerdp3',  // FreeRDP v3 (newer)
  '/usr/local/bin/xfreerdp3',
];

/**
 * Detect whether FreeRDP is installed.
 * Returns { found: true, path } or { found: false }.
 */
async function detect() {
  for (const p of FREERDP_PATHS) {
    if (await fileExists(p)) {
      return { found: true, path: p };
    }
  }
  // Also try which
  return new Promise((resolve) => {
    execFile('which', ['xfreerdp'], (err, stdout) => {
      if (!err && stdout.trim()) {
        resolve({ found: true, path: stdout.trim() });
      } else {
        execFile('which', ['xfreerdp3'], (err2, stdout2) => {
          if (!err2 && stdout2.trim()) {
            resolve({ found: true, path: stdout2.trim() });
          } else {
            resolve({ found: false });
          }
        });
      }
    });
  });
}

/**
 * Start an RDP session by spawning xfreerdp.
 * Returns { success, pid } or { success: false, error, notInstalled? }.
 */
async function start(sessionId, profile, onOutput, onClose) {
  // Kill any existing session for this id
  stop(sessionId);

  const detected = await detect();
  if (!detected.found) {
    return {
      success: false,
      notInstalled: true,
      error: 'FreeRDP not found. Install with: brew install freerdp',
    };
  }

  const args = buildArgs(profile);

  return new Promise((resolve) => {
    const proc = spawn(detected.path, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    processes.set(sessionId, proc);

    proc.stdout.on('data', (d) => onOutput(d.toString()));
    proc.stderr.on('data', (d) => onOutput(d.toString()));

    proc.on('spawn', () => {
      resolve({ success: true, pid: proc.pid });
    });

    proc.on('error', (err) => {
      processes.delete(sessionId);
      resolve({ success: false, error: err.message });
    });

    proc.on('close', (code) => {
      processes.delete(sessionId);
      onClose(code === 0 ? 'Session ended' : `Exited with code ${code}`);
    });
  });
}

/** Kill a running RDP subprocess. */
function stop(sessionId) {
  const proc = processes.get(sessionId);
  if (proc) {
    try { proc.kill('SIGTERM'); } catch (_) {}
    processes.delete(sessionId);
  }
}

/** Kill all RDP sessions (called on app quit). */
function stopAll() {
  for (const id of processes.keys()) stop(id);
}

// ─── FreeRDP argument builder ─────────────────────────────────────────────────

function buildArgs(profile) {
  const {
    host, port = 3389, username, password,
    width = 1280, height = 800,
    fullscreen = false,
    ignoreCert = true,
    domain = '',
    gfx = true,
  } = profile;

  const args = [
    `/v:${host}:${port}`,
    `/u:${username}`,
  ];

  if (password)     args.push(`/p:${password}`);
  if (domain)       args.push(`/d:${domain}`);
  if (ignoreCert)   args.push('/cert:ignore');
  if (fullscreen)   args.push('/f');
  else              args.push(`/size:${width}x${height}`);
  if (gfx)          args.push('/gfx');

  // Clipboard, audio, drives
  args.push('+clipboard');
  args.push('/audio-mode:0');   // redirect audio to local

  // macOS-specific: disable ugly window decorations
  args.push('/app:||explorer');

  return args;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileExists(p) {
  return new Promise((resolve) => {
    require('fs').access(p, require('fs').constants.X_OK, (err) => resolve(!err));
  });
}

module.exports = { detect, start, stop, stopAll };
