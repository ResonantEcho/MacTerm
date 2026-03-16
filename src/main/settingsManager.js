/**
 * settingsManager.js — Main process settings store
 *
 * All user preferences live here. The renderer reads/writes them via IPC.
 * Defaults are defined once and merged on first load so new settings
 * added in future phases appear automatically.
 */

const DEFAULT_SETTINGS = {
  // Terminal
  terminal: {
    fontFamily:   'Menlo',
    fontSize:     13,
    lineHeight:   1.4,
    cursorStyle:  'block',   // block | bar | underline
    cursorBlink:  true,
    scrollback:   5000,
    bellEnabled:  false,
    copyOnSelect: true,
  },

  // Appearance
  appearance: {
    theme:       'dark',     // dark | light  (light coming in Phase 5)
    sidebarWidth: 220,
    showFileBrowserByDefault: true,
  },

  // Connections
  connections: {
    defaultProtocol:    'SSH',
    reconnectOnDrop:    true,
    reconnectDelay:     3,    // seconds
    reconnectMaxRetries: 5,
    keepAliveInterval:  15,   // seconds
  },

  // SSH tunnels (global list, referenced by profile id)
  tunnels: [],

  // Startup
  startup: {
    restoreLastSession: false,
    openOnLaunch:       null,   // profile id or null
  },
};

let _store  = null;
let _settings = null;

function getStore() {
  if (!_store) {
    const Store = require('electron-store');
    _store = new Store({ encryptionKey: 'macterm-local-v1' });
  }
  return _store;
}

function load() {
  if (_settings) return _settings;
  const stored = getStore().get('settings', {});
  // Deep merge: stored values override defaults, but new default keys appear
  _settings = deepMerge(DEFAULT_SETTINGS, stored);
  return _settings;
}

function save(partial) {
  _settings = deepMerge(load(), partial);
  getStore().set('settings', _settings);
  return _settings;
}

function get(key) {
  const s = load();
  return key ? s[key] : s;
}

// ── Tunnel helpers ─────────────────────────────────────────────────────────────

function getTunnels(profileId) {
  return load().tunnels.filter(t => t.profileId === profileId);
}

function saveTunnel(tunnel) {
  const settings = load();
  const tunnels  = settings.tunnels || [];
  const idx = tunnels.findIndex(t => t.id === tunnel.id);
  const updated = idx >= 0
    ? tunnels.map((t, i) => (i === idx ? tunnel : t))
    : [...tunnels, { ...tunnel, id: Date.now().toString() }];
  save({ tunnels: updated });
  return updated;
}

function deleteTunnel(id) {
  const settings = load();
  save({ tunnels: (settings.tunnels || []).filter(t => t.id !== id) });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override || {})) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

module.exports = { load, save, get, getTunnels, saveTunnel, deleteTunnel, DEFAULT_SETTINGS };
