import React, { useState, useEffect, useCallback } from 'react';
import Sidebar            from './components/Sidebar/Sidebar';
import TabBar             from './components/TabBar/TabBar';
import TerminalPane       from './components/Terminal/TerminalPane';
import VaultPane          from './components/Vault/VaultPane';
import WelcomePane        from './components/WelcomePane';
import NewConnectionModal from './components/Modals/NewConnectionModal';
import SettingsPanel      from './components/Settings/SettingsPanel';
import CommandPalette     from './components/CommandPalette/CommandPalette';
import { useSettings }    from './hooks/useSettings';
import { useTheme }       from './hooks/useTheme';
import './styles/App.css';

let tabIdCounter = 1;
function makeTab(profile) {
  return { id: `tab-${tabIdCounter++}`, profileId: profile.id, label: profile.name, protocol: profile.protocol, profile };
}

export default function App() {
  const [profiles,      setProfiles]      = useState([]);
  const [tabs,          setTabs]          = useState([]);
  const [activeTabId,   setActiveTabId]   = useState(null);
  const [showNewConn,   setShowNewConn]   = useState(false);
  const [vaultOpen,     setVaultOpen]     = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [paletteOpen,   setPaletteOpen]   = useState(false);
  const [importResult,  setImportResult]  = useState(null);

  const { settings, save: saveSettings, loaded: settingsLoaded } = useSettings();
  const { theme, setTheme } = useTheme(settings?.appearance?.theme || 'dark');

  useEffect(() => {
    window.macterm?.profiles.getAll().then(setProfiles);
  }, []);

  // Sync theme when settings load
  useEffect(() => {
    if (settingsLoaded && settings?.appearance?.theme) {
      setTheme(settings.appearance.theme);
    }
  }, [settingsLoaded]); // eslint-disable-line

  // ── Menu / shortcut events ─────────────────────────────────────────────────
  useEffect(() => {
    const unsubs = [
      window.macterm?.ui.onOpenSettings(  () => setSettingsOpen(true)),
      window.macterm?.ui.onNewConnection( () => setShowNewConn(true)),
      window.macterm?.ui.onNewTab(        () => setShowNewConn(true)),
      window.macterm?.ui.onCommandPalette(() => setPaletteOpen(p => !p)),
      window.macterm?.ui.onCloseTab(() => { if (activeTabId) closeTab(activeTabId); }),
      window.macterm?.ui.onClearTerminal(() => {
        window.dispatchEvent(new CustomEvent('macterm:clear-terminal', { detail: { tabId: activeTabId } }));
      }),
      window.macterm?.ui.onToggleSftp(() => {
        window.dispatchEvent(new CustomEvent('macterm:toggle-sftp', { detail: { tabId: activeTabId } }));
      }),
      window.macterm?.ui.onSwitchTab((idx) => {
        const tab = tabs[idx];
        if (tab) setActiveTabId(tab.id);
      }),
      window.macterm?.ui.onImport(async () => {
        const result = await window.macterm.profiles.import();
        if (result.success) setImportResult(result);
      }),
      window.macterm?.ui.onExport(async () => {
        await window.macterm.profiles.export(profiles);
      }),
    ].filter(Boolean);
    return () => unsubs.forEach(fn => fn?.());
  }, [activeTabId, tabs, profiles]); // eslint-disable-line

  // ── Session management ─────────────────────────────────────────────────────
  const openSession = useCallback((profile) => {
    const existing = tabs.find(t => t.profileId === profile.id);
    if (existing) { setActiveTabId(existing.id); return; }
    const tab = makeTab(profile);
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
    setVaultOpen(false);
  }, [tabs]);

  const closeTab = useCallback((tabId, e) => {
    e?.stopPropagation();
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) setActiveTabId(next.length ? next[next.length - 1].id : null);
      return next;
    });
  }, [activeTabId]);

  const handleProfileSaved = useCallback(async (profile) => {
    await window.macterm?.profiles.save(profile);
    const updated = await window.macterm?.profiles.getAll();
    setProfiles(updated);
    setShowNewConn(false);
    openSession(profile);
  }, [openSession]);

  const handleProfileDeleted = useCallback(async (id) => {
    await window.macterm?.profiles.delete(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    setTabs(prev => prev.filter(t => t.profileId !== id));
  }, []);

  const confirmImport = useCallback(async () => {
    if (!importResult) return;
    for (const p of importResult.profiles) await window.macterm?.profiles.save(p);
    const updated = await window.macterm?.profiles.getAll();
    setProfiles(updated);
    setImportResult(null);
  }, [importResult]);

  // Pass theme change through to settings panel save
  const handleSettingsSave = useCallback(async (draft) => {
    const saved = await saveSettings(draft);
    if (draft.appearance?.theme) setTheme(draft.appearance.theme);
    return saved;
  }, [saveSettings, setTheme]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="app-root">
      <div className="app-layout">
        <Sidebar
          profiles={profiles}
          activeProfileId={activeTab?.profileId}
          onOpenSession={openSession}
          onNewConnection={() => setShowNewConn(true)}
          onDeleteProfile={handleProfileDeleted}
          onOpenVault={() => { setVaultOpen(true); setActiveTabId(null); }}
          onOpenSettings={() => setSettingsOpen(true)}
          sidebarWidth={settings?.appearance?.sidebarWidth}
        />

        <div className="content-area">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={closeTab}
            onNewTab={() => setShowNewConn(true)}
            onVaultTab={() => { setVaultOpen(v => !v); setActiveTabId(null); }}
          />

          <div className="pane-container">
            {vaultOpen && <VaultPane onClose={() => setVaultOpen(false)} />}

            {!vaultOpen && tabs.length === 0 && (
              <WelcomePane onNewConnection={() => setShowNewConn(true)} />
            )}

            {!vaultOpen && tabs.map(tab => (
              <div
                key={tab.id}
                className="pane-wrapper"
                style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              >
                <TerminalPane
                  tab={tab}
                  settings={settings}
                  showFileBrowserByDefault={settings?.appearance?.showFileBrowserByDefault}
                  profiles={profiles}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNewConn && (
        <NewConnectionModal
          defaultProtocol={settings?.connections?.defaultProtocol}
          onSave={handleProfileSaved}
          onCancel={() => setShowNewConn(false)}
        />
      )}

      {settingsOpen && settingsLoaded && (
        <SettingsPanel
          settings={settings}
          profiles={profiles}
          onSave={handleSettingsSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          profiles={profiles}
          onSelect={(profile) => { openSession(profile); setPaletteOpen(false); }}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {importResult && (
        <div className="import-confirm-overlay" onClick={() => setImportResult(null)}>
          <div className="import-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="import-confirm-title">Import Connections</div>
            <div className="import-confirm-body">
              Found <strong>{importResult.count}</strong> connection{importResult.count !== 1 ? 's' : ''} from{' '}
              <strong>{importResult.format}</strong>. Import them now?
            </div>
            <div className="import-confirm-list">
              {importResult.profiles.slice(0, 8).map((p, i) => (
                <div key={i} className="import-confirm-item">
                  <span className="import-item-proto">{p.protocol}</span>
                  {p.name} — {p.host}
                </div>
              ))}
              {importResult.profiles.length > 8 && (
                <div className="import-confirm-more">…and {importResult.profiles.length - 8} more</div>
              )}
            </div>
            <div className="import-confirm-actions">
              <button className="s-btn-cancel" onClick={() => setImportResult(null)}>Cancel</button>
              <button className="s-btn-save"   onClick={confirmImport}>Import All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
