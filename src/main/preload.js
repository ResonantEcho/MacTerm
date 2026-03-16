/**
 * preload.js — Secure IPC bridge (Phase 2)
 *
 * Adds ssh and sftp namespaces to window.macterm.
 * The renderer never touches Node.js or ssh2 directly.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('macterm', {

  // ── Profiles ────────────────────────────────────────────────────────────────
  profiles: {
    getAll: ()        => ipcRenderer.invoke('profiles:get-all'),
    save:   (profile) => ipcRenderer.invoke('profiles:save', profile),
    delete: (id)      => ipcRenderer.invoke('profiles:delete', id),
  },

  // ── Vault ────────────────────────────────────────────────────────────────────
  vault: {
    getAll: ()           => ipcRenderer.invoke('vault:get-all'),
    save:   (credential) => ipcRenderer.invoke('vault:save', credential),
    delete: (id)         => ipcRenderer.invoke('vault:delete', id),
  },

  // ── SSH ──────────────────────────────────────────────────────────────────────
  ssh: {
    /** Open a connection. Returns { success, error? } */
    connect:    (sessionId, profile) =>
                  ipcRenderer.invoke('ssh:connect', { sessionId, profile }),

    /** Send keystrokes / paste data to the remote shell (fire-and-forget) */
    sendData:   (sessionId, data) =>
                  ipcRenderer.send('ssh:data', { sessionId, data }),

    /** Notify the shell of a terminal resize */
    resize:     (sessionId, cols, rows) =>
                  ipcRenderer.send('ssh:resize', { sessionId, cols, rows }),

    /** Close the session */
    disconnect: (sessionId) =>
                  ipcRenderer.invoke('ssh:disconnect', sessionId),

    /**
     * Subscribe to output from a specific session.
     * Returns an unsubscribe function — call it on component unmount.
     */
    onData: (sessionId, callback) => {
      const channel = `ssh:data:${sessionId}`;
      const handler = (_, data) => callback(data);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },

    /** Subscribe to session-closed events. Returns unsubscribe fn. */
    onClose: (sessionId, callback) => {
      const channel = `ssh:closed:${sessionId}`;
      const handler = (_, reason) => callback(reason);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },
  },

  // ── SFTP ─────────────────────────────────────────────────────────────────────
  sftp: {
    readdir:  (sessionId, remotePath) =>
                ipcRenderer.invoke('sftp:readdir',  { sessionId, remotePath }),
    download: (sessionId, remotePath) =>
                ipcRenderer.invoke('sftp:download', { sessionId, remotePath }),
    upload:   (sessionId, remotePath) =>
                ipcRenderer.invoke('sftp:upload',   { sessionId, remotePath }),
    mkdir:    (sessionId, remotePath) =>
                ipcRenderer.invoke('sftp:mkdir',    { sessionId, remotePath }),
    delete:   (sessionId, remotePath, isDir) =>
                ipcRenderer.invoke('sftp:delete',   { sessionId, remotePath, isDir }),
  },

  // ── Shell ─────────────────────────────────────────────────────────────────────
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  },
});
