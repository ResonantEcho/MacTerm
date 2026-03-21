import { useState, useEffect, useCallback } from 'react';

const DEFAULT = {
  terminal: {
    fontFamily: 'Menlo',
    fontSize: 13,
    lineHeight: 1.4,
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 5000,
    bellEnabled: false,
    copyOnSelect: true,
  },
  appearance: {
    theme: 'dark',
    sidebarWidth: 220,
    showFileBrowserByDefault: true,
  },
  connections: {
    defaultProtocol: 'SSH',
    reconnectOnDrop: true,
    reconnectDelay: 3,
    reconnectMaxRetries: 5,
    keepAliveInterval: 15,
  },
  startup: {
    restoreLastSession: false,
    openOnLaunch: null,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const getter = window?.macterm?.settings?.get;
    if (typeof getter === 'function') {
      getter()
        .then(s => { if (s) setSettings(s); setLoaded(true); })
        .catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, []);

  const save = useCallback(async (partial) => {
    const saver = window?.macterm?.settings?.save;
    if (typeof saver === 'function') {
      const updated = await saver(partial);
      if (updated) setSettings(updated);
      return updated;
    }
    setSettings(prev => ({ ...prev, ...partial }));
    return partial;
  }, []);

  return { settings, save, loaded };
}
