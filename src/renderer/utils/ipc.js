/**
 * ipc.js — Safe wrapper around window.macterm
 *
 * When running inside Electron, window.macterm is injected by preload.js.
 * When running in a plain browser (dev preview), it doesn't exist.
 * All calls through this module are safe in both environments.
 */

const noop     = async () => null;
const noopArr  = async () => [];
const noopBool = async () => false;
const noopUnsub = () => () => {};

const mockSettings = { get: async () => null, save: async (p) => p };
const mockProfiles = { getAll: noopArr, save: noopBool, delete: noopBool, export: noopBool, import: async () => ({ success: false }) };
const mockVault    = { getAll: noopArr, save: noopBool, delete: noopBool };
const mockTunnels  = { get: noopArr, save: noopBool, delete: noopBool };
const mockSsh      = { connect: async () => ({ success: false }), sendData: noop, resize: noop, disconnect: noop, onData: noopUnsub, onClose: noopUnsub };
const mockSftp     = { readdir: async () => ({ success: false, files: [] }), download: async () => ({ success: false }), upload: async () => ({ success: false }), mkdir: async () => ({ success: false }), delete: async () => ({ success: false }) };
const mockVnc      = { start: async () => ({ success: false }), stop: noop };
const mockRdp      = { detect: async () => ({ found: false }), start: async () => ({ success: false }), stop: noop, onOutput: noopUnsub, onClose: noopUnsub };
const mockShell    = { openExternal: noop };
const mockUi       = { onOpenSettings: noopUnsub, onNewConnection: noopUnsub, onNewTab: noopUnsub, onCloseTab: noopUnsub, onClearTerminal: noopUnsub, onCommandPalette: noopUnsub, onToggleSftp: noopUnsub, onSwitchTab: noopUnsub, onImport: noopUnsub, onExport: noopUnsub };

const w = () => (typeof window !== 'undefined' && window.macterm) ? window.macterm : null;

const ipc = {
  get settings() { return w()?.settings || mockSettings; },
  get profiles() { return w()?.profiles || mockProfiles; },
  get vault()    { return w()?.vault    || mockVault;    },
  get tunnels()  { return w()?.tunnels  || mockTunnels;  },
  get ssh()      { return w()?.ssh      || mockSsh;      },
  get sftp()     { return w()?.sftp     || mockSftp;     },
  get vnc()      { return w()?.vnc      || mockVnc;      },
  get rdp()      { return w()?.rdp      || mockRdp;      },
  get shell()    { return w()?.shell    || mockShell;    },
  get ui()       { return w()?.ui       || mockUi;       },
};

export default ipc;
