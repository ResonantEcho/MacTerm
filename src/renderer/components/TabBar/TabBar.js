import React from 'react';
import './TabBar.css';

const DOT_CLASS = { SSH: 'dot-ssh', RDP: 'dot-rdp', VNC: 'dot-vnc' };

export default function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab, onVaultTab }) {
  return (
    <div className="tabbar">
      {/* macOS traffic lights spacer (right of the sidebar) */}
      <div className="tabbar-spacer" />

      <div className="tabbar-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <div className={`tab-dot ${DOT_CLASS[tab.protocol] || 'dot-ssh'}`} />
            <span className="tab-label">{tab.label}</span>
            <button
              className="tab-close"
              onClick={e => onCloseTab(tab.id, e)}
              title="Close tab"
            >×</button>
          </div>
        ))}

        <button className="tab-new" onClick={onNewTab} title="New connection">+</button>
      </div>

      <div className="tabbar-actions">
        <button className="tabbar-action-btn" onClick={onVaultTab} title="Credential vault">🔑</button>
      </div>
    </div>
  );
}
