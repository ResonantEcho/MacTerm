import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import TabBar from './components/TabBar/TabBar';
import TerminalPane from './components/Terminal/TerminalPane';
import VaultPane from './components/Vault/VaultPane';
import WelcomePane from './components/WelcomePane';
import NewConnectionModal from './components/Modals/NewConnectionModal';
import './styles/App.css';

let tabIdCounter = 1;

function makeTab(profile) {
  return {
    id: `tab-${tabIdCounter++}`,
    profileId: profile.id,
    label: profile.name,
    protocol: profile.protocol,
    profile,
  };
}

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [showNewConn, setShowNewConn] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  // Load profiles from main process on startup
  useEffect(() => {
    window.macterm?.profiles.getAll().then(setProfiles);
  }, []);

  // Open a session tab for a profile (or focus existing)
  const openSession = useCallback((profile) => {
    const existing = tabs.find(t => t.profileId === profile.id);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const tab = makeTab(profile);
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  }, [tabs]);

  const closeTab = useCallback((tabId, e) => {
    e?.stopPropagation();
    setTabs(prev => {
      const next = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(next.length > 0 ? next[next.length - 1].id : null);
      }
      return next;
    });
  }, [activeTabId]);

  const handleProfileSaved = useCallback(async (profile) => {
    await window.macterm?.profiles.save(profile);
    const updated = await window.macterm?.profiles.getAll();
    setProfiles(updated);
    setShowNewConn(false);
    // Auto-open the new connection
    if (!profile.id) return;
    openSession({ ...profile, id: profile.id || Date.now().toString() });
  }, [openSession]);

  const handleProfileDeleted = useCallback(async (id) => {
    await window.macterm?.profiles.delete(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    // Close any open tab for this profile
    setTabs(prev => prev.filter(t => t.profileId !== id));
  }, []);

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
          onOpenVault={() => setVaultOpen(true)}
        />

        <div className="content-area">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={closeTab}
            onNewTab={() => setShowNewConn(true)}
            onVaultTab={() => setVaultOpen(!vaultOpen)}
          />

          <div className="pane-container">
            {vaultOpen && (
              <VaultPane onClose={() => setVaultOpen(false)} />
            )}

            {!vaultOpen && tabs.length === 0 && (
              <WelcomePane onNewConnection={() => setShowNewConn(true)} />
            )}

            {!vaultOpen && tabs.map(tab => (
              <div
                key={tab.id}
                className="pane-wrapper"
                style={{ display: tab.id === activeTabId ? 'flex' : 'none' }}
              >
                <TerminalPane tab={tab} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNewConn && (
        <NewConnectionModal
          onSave={handleProfileSaved}
          onCancel={() => setShowNewConn(false)}
        />
      )}
    </div>
  );
}
