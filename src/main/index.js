/**
 * src/main/index.js — Phase 4
 * Adds: settings IPC, SSH tunnel IPC, native macOS menu bar
 */

const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const ssh  = require('./sshManager');
const vnc  = require('./vncManager');
const rdp  = require('./rdpManager');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    backgroundColor: '#1a1c20',
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  isDev
    ? mainWindow.loadURL('http://localhost:3000')
    : mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  buildMenu();
}

app.whenReady().then(() => {
  app.setAboutPanelOptions({
    applicationName: 'MacTerm', applicationVersion: '0.4.0',
    copyright: '© 2026 ResonantEcho',
    website: 'https://github.com/ResonantEcho/MacTerm',
  });
  createWindow();
});

app.on('window-all-closed', () => { vnc.stopAll(); rdp.stopAll(); if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit',       () => { vnc.stopAll(); rdp.stopAll(); });
app.on('activate',          () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ─── Native menu ─────────────────────────────────────────────────────────────

function buildMenu() {
  const send = (ch) => mainWindow?.webContents.send(ch);
  const template = [
    { label: app.name, submenu: [
      { role: 'about' }, { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' },
    ]},
    { label: 'File', submenu: [
      { label: 'New Connection',   accelerator: 'Cmd+T',       click: () => send('menu:new-connection') },
      { label: 'Close Tab',        accelerator: 'Cmd+W',       click: () => send('menu:close-tab') },
      { type: 'separator' },
      { label: 'Settings',         accelerator: 'Cmd+,',       click: () => send('menu:open-settings') },
      { label: 'Vault',            accelerator: 'Cmd+Shift+V', click: () => send('menu:open-vault') },
      { type: 'separator' },
      { label: 'Export Profiles…', click: () => send('menu:export-profiles') },
      { label: 'Import Profiles…', click: () => send('menu:import-profiles') },
    ]},
    { label: 'Session', submenu: [
      { label: 'Disconnect',        accelerator: 'Cmd+D',       click: () => send('menu:disconnect') },
      { label: 'Reconnect',         accelerator: 'Cmd+Shift+R', click: () => send('menu:reconnect') },
      { type: 'separator' },
      { label: 'Clear Terminal',    accelerator: 'Cmd+K',       click: () => send('menu:clear-terminal') },
      { label: 'Toggle SFTP',       accelerator: 'Cmd+Shift+F', click: () => send('menu:toggle-sftp') },
      { type: 'separator' },
      { label: 'Next Tab',          accelerator: 'Cmd+]',       click: () => send('menu:next-tab') },
      { label: 'Previous Tab',      accelerator: 'Cmd+[',       click: () => send('menu:prev-tab') },
    ]},
    { label: 'View', submenu: [
      ...(isDev ? [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' }] : []),
      { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
      { type: 'separator' }, { role: 'togglefullscreen' },
    ]},
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
    ]},
    { label: 'Help', submenu: [
      { label: 'View on GitHub', click: () => shell.openExternal('https://github.com/ResonantEcho/MacTerm') },
      { label: 'Report an Issue', click: () => shell.openExternal('https://github.com/ResonantEcho/MacTerm/issues') },
    ]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC: Settings ───────────────────────────────────────────────────────────

ipcMain.handle('settings:get-all', async () => getStore().get('settings', {}));
ipcMain.handle('settings:save',    async (_, { key, value }) => {
  const s = getStore(); const settings = s.get('settings', {});
  settings[key] = value; s.set('settings', settings); return true;
});
ipcMain.handle('settings:reset',   async () => { getStore().delete('settings'); return true; });

// ─── IPC: SSH ────────────────────────────────────────────────────────────────

ipcMain.handle('ssh:connect', async (_, { sessionId, profile }) => {
  try {
    const p = await resolveCredential(profile);
    await ssh.connect(sessionId, p,
      (d) => mainWindow?.webContents.send(`ssh:data:${sessionId}`, d),
      (r) => mainWindow?.webContents.send(`ssh:closed:${sessionId}`, r));
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.on('ssh:data',   (_, { sessionId, data })       => ssh.sendData(sessionId, data));
ipcMain.on('ssh:resize', (_, { sessionId, cols, rows }) => ssh.resize(sessionId, cols, rows));
ipcMain.handle('ssh:disconnect',   async (_, id)                    => { ssh.disconnect(id);             return true; });
ipcMain.handle('ssh:open-tunnel',  async (_, { sessionId, tunnel }) => ssh.openTunnel(sessionId, tunnel).catch(e => ({ success: false, error: e.message })));
ipcMain.handle('ssh:close-tunnel', async (_, { sessionId, tunnelId }) => { ssh.closeTunnel(sessionId, tunnelId); return { success: true }; });

// ─── IPC: SFTP ───────────────────────────────────────────────────────────────

ipcMain.handle('sftp:readdir', async (_, { sessionId, remotePath }) => {
  try { return { success: true, files: await ssh.readdir(sessionId, remotePath) }; }
  catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('sftp:download', async (_, { sessionId, remotePath }) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: path.join(require('os').homedir(), 'Downloads', path.basename(remotePath)),
    });
    if (canceled || !filePath) return { success: false, error: 'Cancelled' };
    require('fs').renameSync(await ssh.download(sessionId, remotePath), filePath);
    return { success: true, localPath: filePath };
  } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('sftp:upload', async (_, { sessionId, remotePath }) => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
    if (canceled || !filePaths.length) return { success: false, error: 'Cancelled' };
    await ssh.upload(sessionId, filePaths[0], remotePath.endsWith('/') ? remotePath + path.basename(filePaths[0]) : remotePath);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle('sftp:mkdir',  async (_, { sessionId, remotePath }) => { try { await ssh.mkdir(sessionId, remotePath);                  return { success: true }; } catch (e) { return { success: false, error: e.message }; } });
ipcMain.handle('sftp:delete', async (_, { sessionId, remotePath, isDir }) => { try { await ssh.deleteRemote(sessionId, remotePath, isDir); return { success: true }; } catch (e) { return { success: false, error: e.message }; } });

// ─── IPC: VNC ────────────────────────────────────────────────────────────────

ipcMain.handle('vnc:start', async (_, { sessionId, host, port, password }) => vnc.start(sessionId, host, port || 5900, password));
ipcMain.handle('vnc:stop',  async (_, id) => { vnc.stop(id); return true; });

// ─── IPC: RDP ────────────────────────────────────────────────────────────────

ipcMain.handle('rdp:detect', async () => rdp.detect());
ipcMain.handle('rdp:start',  async (_, { sessionId, profile }) => {
  const p = await resolveCredential(profile);
  return rdp.start(sessionId, p,
    (o) => mainWindow?.webContents.send(`rdp:output:${sessionId}`, o),
    (r) => mainWindow?.webContents.send(`rdp:closed:${sessionId}`, r));
});
ipcMain.handle('rdp:stop', async (_, id) => { rdp.stop(id); return true; });

// ─── IPC: Profiles ───────────────────────────────────────────────────────────

ipcMain.handle('profiles:get-all', async () => getStore().get('profiles', getDefaultProfiles()));
ipcMain.handle('profiles:save', async (_, profile) => {
  const s = getStore(); const profiles = s.get('profiles', []);
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile; else profiles.push({ ...profile, id: Date.now().toString() });
  s.set('profiles', profiles); return true;
});
ipcMain.handle('profiles:delete', async (_, id) => {
  const s = getStore(); s.set('profiles', s.get('profiles', []).filter(p => p.id !== id)); return true;
});

// ─── IPC: Vault ──────────────────────────────────────────────────────────────

ipcMain.handle('vault:get-all', async () => getStore().get('vault', []));
ipcMain.handle('vault:save', async (_, credential) => {
  const s = getStore(); const vault = s.get('vault', []);
  const idx = vault.findIndex(c => c.id === credential.id);
  if (idx >= 0) vault[idx] = credential; else vault.push({ ...credential, id: Date.now().toString() });
  s.set('vault', vault); return true;
});
ipcMain.handle('vault:delete', async (_, id) => {
  const s = getStore(); s.set('vault', s.get('vault', []).filter(c => c.id !== id)); return true;
});

ipcMain.handle('shell:open-external', async (_, url) => shell.openExternal(url));

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _store = null;
function getStore() {
  if (!_store) { const Store = require('electron-store'); _store = new Store({ encryptionKey: 'macterm-local-v1' }); }
  return _store;
}

async function resolveCredential(profile) {
  if (profile.authType !== 'vault' || !profile.vaultCredId) return profile;
  const cred = getStore().get('vault', []).find(c => c.id === profile.vaultCredId);
  if (!cred) return profile;
  return { ...profile, authType: cred.authType,
    password: cred.authType === 'password' ? cred.secret : undefined,
    keyPath:  cred.authType === 'sshkey'   ? cred.secret : undefined };
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
