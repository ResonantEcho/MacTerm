import { useState, useEffect, useCallback } from 'react';

const DEFAULT = {
  terminal:    { fontFamily: 'Menlo', fontSize: 13, lineHeight: 1.4, cursorStyle: 'block', cursorBlink: true, scrollback: 5000, bellEnabled: false, copyOnSelect: true },
  appearance:  { theme: 'dark', sidebarWidth: 220, showFileBrowserByDefault: true },
  connections: { defaultProtocol: 'SSH', reconnectOnDrop: true, reconnectDelay: 3, reconnectMaxRetries: 5, keepAliveInterval: 15 },
  startup:     { restoreLastSession: false, openOnLaunch: null },
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    window.macterm?.settings.get().then(s => {
      if (s) setSettings(s);
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (partial) => {
    const updated = await window.macterm?.settings.save(partial);
    if (updated) setSettings(updated);
    return updated;
  }, []);

  return { settings, save, loaded };
}
