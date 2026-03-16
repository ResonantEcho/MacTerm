const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('macterm', {

  profiles: {
    getAll: ()   => ipcRenderer.invoke('profiles:get-all'),
    save:   (p)  => ipcRenderer.invoke('profiles:save', p),
    delete: (id) => ipcRenderer.invoke('profiles:delete', id),
  },

  vault: {
    getAll: ()   => ipcRenderer.invoke('vault:get-all'),
    save:   (c)  => ipcRenderer.invoke('vault:save', c),
    delete: (id) => ipcRenderer.invoke('vault:delete', id),
  },

  settings: {
    getAll: ()           => ipcRenderer.invoke('settings:get-all'),
    save:   (key, value) => ipcRenderer.invoke('settings:save', { key, value }),
    reset:  ()           => ipcRenderer.invoke('settings:reset'),
  },

  ssh: {
    connect:     (sid, profile)    => ipcRenderer.invoke('ssh:connect', { sessionId: sid, profile }),
    sendData:    (sid, data)       => ipcRenderer.send('ssh:data',   { sessionId: sid, data }),
    resize:      (sid, cols, rows) => ipcRenderer.send('ssh:resize', { sessionId: sid, cols, rows }),
    disconnect:  (sid)             => ipcRenderer.invoke('ssh:disconnect', sid),
    openTunnel:  (sid, tunnel)     => ipcRenderer.invoke('ssh:open-tunnel',  { sessionId: sid, tunnel }),
    closeTunnel: (sid, tunnelId)   => ipcRenderer.invoke('ssh:close-tunnel', { sessionId: sid, tunnelId }),
    onData:  (sid, cb) => { const fn = (_, d) => cb(d); const ch = `ssh:data:${sid}`;   ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); },
    onClose: (sid, cb) => { const fn = (_, r) => cb(r); const ch = `ssh:closed:${sid}`; ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); },
  },

  sftp: {
    readdir:  (s, p)      => ipcRenderer.invoke('sftp:readdir',  { sessionId: s, remotePath: p }),
    download: (s, p)      => ipcRenderer.invoke('sftp:download', { sessionId: s, remotePath: p }),
    upload:   (s, p)      => ipcRenderer.invoke('sftp:upload',   { sessionId: s, remotePath: p }),
    mkdir:    (s, p)      => ipcRenderer.invoke('sftp:mkdir',    { sessionId: s, remotePath: p }),
    delete:   (s, p, dir) => ipcRenderer.invoke('sftp:delete',   { sessionId: s, remotePath: p, isDir: dir }),
  },

  vnc: {
    start: (sid, host, port, pwd) => ipcRenderer.invoke('vnc:start', { sessionId: sid, host, port, password: pwd }),
    stop:  (sid)                   => ipcRenderer.invoke('vnc:stop', sid),
  },

  rdp: {
    detect: ()             => ipcRenderer.invoke('rdp:detect'),
    start:  (sid, profile) => ipcRenderer.invoke('rdp:start', { sessionId: sid, profile }),
    stop:   (sid)          => ipcRenderer.invoke('rdp:stop', sid),
    onOutput: (sid, cb) => { const fn = (_, d) => cb(d); const ch = `rdp:output:${sid}`; ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); },
    onClose:  (sid, cb) => { const fn = (_, r) => cb(r); const ch = `rdp:closed:${sid}`; ipcRenderer.on(ch, fn); return () => ipcRenderer.removeListener(ch, fn); },
  },

  onMenu: (channel, cb) => {
    const fn = () => cb();
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },

  shell: { openExternal: (url) => ipcRenderer.invoke('shell:open-external', url) },
});
