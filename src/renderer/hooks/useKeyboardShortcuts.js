/**
 * useKeyboardShortcuts.js
 *
 * Global keyboard shortcut handler. All shortcuts use Cmd (Mac) modifier.
 *
 * Cmd+T          → new connection
 * Cmd+W          → close active tab
 * Cmd+]  / Cmd+→ → next tab
 * Cmd+[  / Cmd+← → previous tab
 * Cmd+1..9       → jump to tab N
 * Cmd+K          → clear terminal (fires custom event)
 * Cmd+D          → disconnect active session
 * Cmd+Shift+F    → toggle SFTP panel (fires custom event)
 * Cmd+,          → open settings
 * Cmd+Shift+V    → open vault
 */

import { useEffect } from 'react';

export default function useKeyboardShortcuts({
  tabs,
  activeTabId,
  onNewTab,
  onCloseTab,
  onSelectTab,
  onOpenSettings,
  onOpenVault,
}) {
  useEffect(() => {
    const handler = (e) => {
      const cmd = e.metaKey;   // Cmd on Mac
      if (!cmd) return;

      // Cmd+T — new tab
      if (e.key === 't' && !e.shiftKey) {
        e.preventDefault();
        onNewTab?.();
        return;
      }

      // Cmd+W — close active tab
      if (e.key === 'w' && !e.shiftKey) {
        e.preventDefault();
        if (activeTabId) onCloseTab?.(activeTabId);
        return;
      }

      // Cmd+, — settings
      if (e.key === ',') {
        e.preventDefault();
        onOpenSettings?.();
        return;
      }

      // Cmd+Shift+V — vault
      if (e.key === 'v' && e.shiftKey) {
        e.preventDefault();
        onOpenVault?.();
        return;
      }

      // Cmd+] or Cmd+ArrowRight — next tab
      if (e.key === ']' || (e.key === 'ArrowRight' && e.shiftKey)) {
        e.preventDefault();
        cycleTab(tabs, activeTabId, onSelectTab, 1);
        return;
      }

      // Cmd+[ or Cmd+ArrowLeft — prev tab
      if (e.key === '[' || (e.key === 'ArrowLeft' && e.shiftKey)) {
        e.preventDefault();
        cycleTab(tabs, activeTabId, onSelectTab, -1);
        return;
      }

      // Cmd+1..9 — jump to tab
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && tabs.length > 0) {
        e.preventDefault();
        const target = tabs[num - 1];
        if (target) onSelectTab?.(target.id);
        return;
      }

      // Cmd+K — clear terminal
      if (e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('macterm:clear-terminal', {
          detail: { tabId: activeTabId },
        }));
        return;
      }

      // Cmd+D — disconnect
      if (e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('macterm:disconnect', {
          detail: { tabId: activeTabId },
        }));
        return;
      }

      // Cmd+Shift+F — toggle SFTP
      if (e.key === 'f' && e.shiftKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('macterm:toggle-sftp', {
          detail: { tabId: activeTabId },
        }));
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, activeTabId, onNewTab, onCloseTab, onSelectTab, onOpenSettings, onOpenVault]);
}

function cycleTab(tabs, activeId, onSelectTab, direction) {
  if (!tabs.length) return;
  const idx = tabs.findIndex(t => t.id === activeId);
  const next = (idx + direction + tabs.length) % tabs.length;
  onSelectTab?.(tabs[next].id);
}
