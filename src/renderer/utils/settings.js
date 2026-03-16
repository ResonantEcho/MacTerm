/**
 * settings.js — User preferences store
 *
 * Settings are persisted via the main process (electron-store).
 * This module provides a React-friendly interface with change listeners.
 */

const DEFAULTS = {
  // Terminal
  termFontSize:   13,
  termFontFamily: "'Menlo', 'Monaco', 'Cascadia Code', monospace",
  termScrollback: 5000,
  termCursorStyle: 'block',   // block | underline | bar
  termCursorBlink: true,
  termLineHeight:  1.4,

  // Behaviour
  confirmOnClose:  true,
  reopenTabs:      false,
  defaultProtocol: 'SSH',
  connectOnClick:  true,

  // SFTP
  sftpShowHidden:  false,
  sftpOpenOnSSH:   true,

  // Theme
  theme: 'dark',

  // SSH
  sshKeepAliveInterval: 15,
  sshConnectTimeout:    10,
};

let _cache    = null;
let _listeners = [];

export async function getSettings() {
  if (_cache) return _cache;
  const saved = await window.macterm?.settings?.getAll?.() ?? {};
  _cache = { ...DEFAULTS, ...saved };
  return _cache;
}

export async function setSetting(key, value) {
  const settings = await getSettings();
  settings[key] = value;
  _cache = settings;
  await window.macterm?.settings?.save?.({ key, value });
  _listeners.forEach(fn => fn(key, value, settings));
}

export async function resetSettings() {
  _cache = { ...DEFAULTS };
  await window.macterm?.settings?.reset?.();
  _listeners.forEach(fn => fn('*', null, _cache));
}

export function onSettingChange(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export { DEFAULTS };
