const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
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
    mainWindow.webContents.openDevTools();
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

// ─── IPC: Vault ───────────────────────────────────────────────────────────────

ipcMain.handle('vault:get-all', async () => {
  return getStore().get('vault', []);
});

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

// ─── IPC: Connection Profiles ─────────────────────────────────────────────────

ipcMain.handle('profiles:get-all', async () => {
  return getStore().get('profiles', getDefaultProfiles());
});

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

function getDefaultProfiles() {
  return [
    { id: '1', name: 'web-01.prod',   group: 'Production', protocol: 'SSH', host: '192.168.1.10', port: 22,   username: 'ubuntu' },
    { id: '2', name: 'win-dc01.prod', group: 'Production', protocol: 'RDP', host: '192.168.1.20', port: 3389, username: 'Administrator' },
    { id: '3', name: 'dev-desktop',   group: 'Production', protocol: 'VNC', host: '192.168.1.30', port: 5900, username: '' },
    { id: '4', name: 'app-02.stg',    group: 'Staging',    protocol: 'SSH', host: '10.0.0.10',   port: 22,   username: 'ubuntu' },
    { id: '5', name: 'db-01.stg',     group: 'Staging',    protocol: 'SSH', host: '10.0.0.11',   port: 22,   username: 'postgres' },
  ];
}
