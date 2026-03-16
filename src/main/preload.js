const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, minimal API to the renderer process.
// The renderer never has direct access to Node.js or Electron internals.
contextBridge.exposeInMainWorld('macterm', {
  // Profiles
  profiles: {
    getAll: () => ipcRenderer.invoke('profiles:get-all'),
    save:   (profile) => ipcRenderer.invoke('profiles:save', profile),
    delete: (id) => ipcRenderer.invoke('profiles:delete', id),
  },

  // Vault
  vault: {
    getAll: () => ipcRenderer.invoke('vault:get-all'),
    save:   (credential) => ipcRenderer.invoke('vault:save', credential),
    delete: (id) => ipcRenderer.invoke('vault:delete', id),
  },

  // Shell
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  },
});
