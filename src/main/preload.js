const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('macterm', {

  profiles: {
    getAll:  ()         => ipcRenderer.invoke('profiles:get-all'),
    save:    (p)        => ipcRenderer.invoke('profiles:save', p),
    delete:  (id)       => ipcRenderer.invoke('profiles:delete', id),
    export:  (profiles) => ipcRenderer.invoke('profiles:export', profiles),
    import:  ()         => ipcRenderer.invoke('profiles:import'),
  },

  vault: {
    getAll: ()    => ipcRenderer.invoke('vault:get-all'),
    save:   (c)   => ipcRenderer.invoke('vault:save', c),
    delete: (id)  => ipcRenderer.invoke('vault:delete', id),
  },

  settings: {
    get:  ()        => ipcRenderer.invoke('settings:get'),
    save: (partial) => ipcRenderer.invoke('settings:save', partial),
  },

  tunnels: {
    get:    (profileId) => ipcRenderer.invoke('tunnels:get', profileId),
    save:   (tunnel)    => ipcRenderer.invoke('tunnels:save', tunnel),
    delete: (id)        => ipcRenderer.invoke('tunnels:delete', id),
  },

  ssh: {
    connect:    (sessionId, profile) => ipcRenderer.invoke('ssh:connect', { sessionId, profile }),
    sendData:   (sessionId, data)    => ipcRenderer.send('ssh:data', { sessionId, data }),
    resize:     (sessionId, c, r)    => ipcRenderer.send('ssh:resize', { sessionId, cols: c, rows: r }),
    disconnect: (sessionId)          => ipcRenderer.invoke('ssh:disconnect', sessionId),
    onData: (sessionId, cb) => {
      const ch = `ssh:data:${sessionId}`;
      const fn = (_, d) => cb(d);
      ipcRenderer.on(ch, fn);
      return () => ipcRenderer.removeListener(ch, fn);
    },
    onClose: (sessionId, cb) => {
      const ch = `ssh:closed:${sessionId}`;
      const fn = (_, r) => cb(r);
      ipcRenderer.on(ch, fn);
      return () => ipcRenderer.removeListener(ch, fn);
    },
  },

  sftp: {
    readdir:  (s, p)      => ipcRenderer.invoke('sftp:readdir',  { sessionId: s, remotePath: p }),
    download: (s, p)      => ipcRenderer.invoke('sftp:download', { sessionId: s, remotePath: p }),
    upload:   (s, p)      => ipcRenderer.invoke('sftp:upload',   { sessionId: s, remotePath: p }),
    mkdir:    (s, p)      => ipcRenderer.invoke('sftp:mkdir',    { sessionId: s, remotePath: p }),
    delete:   (s, p, dir) => ipcRenderer.invoke('sftp:delete',   { sessionId: s, remotePath: p, isDir: dir }),
  },

  vnc: {
    start: (sessionId, host, port, password) =>
      ipcRenderer.invoke('vnc:start', { sessionId, host, port, password }),
    stop: (sessionId) => ipcRenderer.invoke('vnc:stop', sessionId),
  },

  rdp: {
    detect:   ()                   => ipcRenderer.invoke('rdp:detect'),
    start:    (sessionId, profile) => ipcRenderer.invoke('rdp:start', { sessionId, profile }),
    stop:     (sessionId)          => ipcRenderer.invoke('rdp:stop', sessionId),
    onOutput: (sessionId, cb) => {
      const ch = `rdp:output:${sessionId}`;
      const fn = (_, d) => cb(d);
      ipcRenderer.on(ch, fn);
      return () => ipcRenderer.removeListener(ch, fn);
    },
    onClose: (sessionId, cb) => {
      const ch = `rdp:closed:${sessionId}`;
      const fn = (_, r) => cb(r);
      ipcRenderer.on(ch, fn);
      return () => ipcRenderer.removeListener(ch, fn);
    },
  },

  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  },

  ui: {
    onOpenSettings:   (cb) => on('ui:open-settings',   cb),
    onNewConnection:  (cb) => on('ui:new-connection',  cb),
    onNewTab:         (cb) => on('ui:new-tab',         cb),
    onCloseTab:       (cb) => on('ui:close-tab',       cb),
    onClearTerminal:  (cb) => on('ui:clear-terminal',  cb),
    onCommandPalette: (cb) => on('ui:command-palette', cb),
    onToggleSftp:     (cb) => on('ui:toggle-sftp',     cb),
    onSwitchTab:      (cb) => on('ui:switch-tab',      (_, idx) => cb(idx)),
    onImport:         (cb) => on('ui:import',          cb),
    onExport:         (cb) => on('ui:export',          cb),
  },
});

function on(channel, cb) {
  const fn = (_, ...args) => cb(...args);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
}
