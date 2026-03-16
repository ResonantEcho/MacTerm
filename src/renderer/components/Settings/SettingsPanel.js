import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

const TABS = ['Terminal', 'Appearance', 'Connections', 'Tunnels', 'About'];

export default function SettingsPanel({ settings, onSave, onClose, profiles }) {
  const [active, setActive] = useState('Terminal');
  const [draft,  setDraft]  = useState(settings);

  // Keep draft in sync if parent reloads settings
  useEffect(() => setDraft(settings), [settings]);

  const setNested = (section, key, value) => {
    setDraft(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>

        <div className="settings-sidebar">
          <div className="settings-logo">⚙ Settings</div>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`settings-nav-item ${active === tab ? 'active' : ''}`}
              onClick={() => setActive(tab)}
            >{tab}</button>
          ))}
        </div>

        <div className="settings-content">
          <div className="settings-body">

            {active === 'Terminal' && (
              <Section title="Terminal">
                <Row label="Font Family">
                  <select className="s-select" value={draft.terminal?.fontFamily}
                    onChange={e => setNested('terminal', 'fontFamily', e.target.value)}>
                    {['Menlo', 'Monaco', 'Cascadia Code', 'Fira Mono', 'JetBrains Mono', 'SF Mono', 'Courier New'].map(f =>
                      <option key={f}>{f}</option>)}
                  </select>
                </Row>
                <Row label="Font Size">
                  <div className="s-number-row">
                    <input className="s-input s-number" type="number" min={8} max={24}
                      value={draft.terminal?.fontSize}
                      onChange={e => setNested('terminal', 'fontSize', parseInt(e.target.value))} />
                    <span className="s-unit">px</span>
                  </div>
                </Row>
                <Row label="Line Height">
                  <input className="s-input s-number" type="number" min={1} max={2} step={0.1}
                    value={draft.terminal?.lineHeight}
                    onChange={e => setNested('terminal', 'lineHeight', parseFloat(e.target.value))} />
                </Row>
                <Row label="Cursor Style">
                  <select className="s-select" value={draft.terminal?.cursorStyle}
                    onChange={e => setNested('terminal', 'cursorStyle', e.target.value)}>
                    <option value="block">Block</option>
                    <option value="bar">Bar</option>
                    <option value="underline">Underline</option>
                  </select>
                </Row>
                <Row label="Cursor Blink">
                  <Toggle
                    value={draft.terminal?.cursorBlink}
                    onChange={v => setNested('terminal', 'cursorBlink', v)}
                  />
                </Row>
                <Row label="Scrollback Lines">
                  <input className="s-input s-number" type="number" min={100} max={50000} step={500}
                    value={draft.terminal?.scrollback}
                    onChange={e => setNested('terminal', 'scrollback', parseInt(e.target.value))} />
                </Row>
                <Row label="Copy on Select">
                  <Toggle
                    value={draft.terminal?.copyOnSelect}
                    onChange={v => setNested('terminal', 'copyOnSelect', v)}
                  />
                </Row>
                <Row label="Bell">
                  <Toggle
                    value={draft.terminal?.bellEnabled}
                    onChange={v => setNested('terminal', 'bellEnabled', v)}
                  />
                </Row>
              </Section>
            )}

            {active === 'Appearance' && (
              <Section title="Appearance">
                <Row label="Show SFTP Browser by Default">
                  <Toggle
                    value={draft.appearance?.showFileBrowserByDefault}
                    onChange={v => setNested('appearance', 'showFileBrowserByDefault', v)}
                  />
                </Row>
                <Row label="Sidebar Width">
                  <div className="s-number-row">
                    <input className="s-input s-number" type="number" min={160} max={360} step={10}
                      value={draft.appearance?.sidebarWidth}
                      onChange={e => setNested('appearance', 'sidebarWidth', parseInt(e.target.value))} />
                    <span className="s-unit">px</span>
                  </div>
                </Row>
              </Section>
            )}

            {active === 'Connections' && (
              <Section title="Connections">
                <Row label="Default Protocol">
                  <select className="s-select" value={draft.connections?.defaultProtocol}
                    onChange={e => setNested('connections', 'defaultProtocol', e.target.value)}>
                    {['SSH', 'RDP', 'VNC', 'SFTP'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </Row>
                <Row label="Auto-reconnect on Drop">
                  <Toggle
                    value={draft.connections?.reconnectOnDrop}
                    onChange={v => setNested('connections', 'reconnectOnDrop', v)}
                  />
                </Row>
                <Row label="Reconnect Delay">
                  <div className="s-number-row">
                    <input className="s-input s-number" type="number" min={1} max={60}
                      value={draft.connections?.reconnectDelay}
                      onChange={e => setNested('connections', 'reconnectDelay', parseInt(e.target.value))} />
                    <span className="s-unit">sec</span>
                  </div>
                </Row>
                <Row label="Max Retries">
                  <input className="s-input s-number" type="number" min={1} max={20}
                    value={draft.connections?.reconnectMaxRetries}
                    onChange={e => setNested('connections', 'reconnectMaxRetries', parseInt(e.target.value))} />
                </Row>
                <Row label="Keep-alive Interval">
                  <div className="s-number-row">
                    <input className="s-input s-number" type="number" min={5} max={120}
                      value={draft.connections?.keepAliveInterval}
                      onChange={e => setNested('connections', 'keepAliveInterval', parseInt(e.target.value))} />
                    <span className="s-unit">sec</span>
                  </div>
                </Row>
              </Section>
            )}

            {active === 'Tunnels' && (
              <TunnelsTab profiles={profiles} />
            )}

            {active === 'About' && (
              <Section title="About MacTerm">
                <div className="about-logo">MacTerm</div>
                <div className="about-version">Version 0.4.0 — Phase 4</div>
                <div className="about-desc">
                  An open-source MobaXterm-inspired connection manager for macOS.
                  Built with Electron, React, xterm.js, noVNC, and FreeRDP.
                </div>
                <div className="about-links">
                  <button className="about-link"
                    onClick={() => window.macterm.shell.openExternal('https://github.com/ResonantEcho/MacTerm')}>
                    GitHub →
                  </button>
                </div>
                <div className="about-shortcuts">
                  <div className="about-shortcuts-title">Keyboard Shortcuts</div>
                  {[
                    ['Cmd+T',     'New tab / connection'],
                    ['Cmd+W',     'Close tab'],
                    ['Cmd+P',     'Command palette'],
                    ['Cmd+K',     'Clear terminal'],
                    ['Cmd+B',     'Toggle SFTP browser'],
                    ['Cmd+,',     'Settings'],
                    ['Cmd+1–9',   'Switch to tab N'],
                  ].map(([k, v]) => (
                    <div key={k} className="shortcut-row">
                      <kbd className="shortcut-key">{k}</kbd>
                      <span className="shortcut-desc">{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>

          {active !== 'Tunnels' && active !== 'About' && (
            <div className="settings-footer">
              <button className="s-btn-cancel" onClick={onClose}>Cancel</button>
              <button className="s-btn-save"   onClick={handleSave}>Save Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tunnels tab ────────────────────────────────────────────────────────────────

function TunnelsTab({ profiles }) {
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id || '');
  const [tunnels, setTunnels] = useState([]);
  const [adding,  setAdding]  = useState(false);
  const [newTunnel, setNewTunnel] = useState({ localPort: '', remoteHost: '', remotePort: '', direction: 'local' });

  useEffect(() => {
    if (selectedProfileId) {
      window.macterm?.tunnels.get(selectedProfileId).then(setTunnels);
    }
  }, [selectedProfileId]);

  const handleAdd = async () => {
    if (!newTunnel.localPort || !newTunnel.remoteHost || !newTunnel.remotePort) return;
    await window.macterm?.tunnels.save({ ...newTunnel, profileId: selectedProfileId });
    const updated = await window.macterm?.tunnels.get(selectedProfileId);
    setTunnels(updated);
    setAdding(false);
    setNewTunnel({ localPort: '', remoteHost: '', remotePort: '', direction: 'local' });
  };

  const handleDelete = async (id) => {
    await window.macterm?.tunnels.delete(id);
    setTunnels(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Section title="SSH Port Tunnels">
      <div className="tunnels-profile-row">
        <label className="s-label">Profile</label>
        <select className="s-select" value={selectedProfileId}
          onChange={e => setSelectedProfileId(e.target.value)}>
          {profiles.filter(p => p.protocol === 'SSH').map(p =>
            <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="tunnels-list">
        {tunnels.length === 0 && (
          <div className="tunnels-empty">No tunnels configured for this profile.</div>
        )}
        {tunnels.map(t => (
          <div key={t.id} className="tunnel-item">
            <span className="tunnel-direction">{t.direction === 'local' ? 'L' : 'R'}</span>
            <span className="tunnel-desc">
              localhost:{t.localPort} → {t.remoteHost}:{t.remotePort}
            </span>
            <button className="tunnel-delete" onClick={() => handleDelete(t.id)}>×</button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="tunnel-add-form">
          <select className="s-select s-select-sm"
            value={newTunnel.direction}
            onChange={e => setNewTunnel(p => ({ ...p, direction: e.target.value }))}>
            <option value="local">Local (L)</option>
            <option value="remote">Remote (R)</option>
          </select>
          <input className="s-input s-input-sm" placeholder="Local port"
            value={newTunnel.localPort}
            onChange={e => setNewTunnel(p => ({ ...p, localPort: e.target.value }))} />
          <span className="tunnel-arrow">→</span>
          <input className="s-input s-input-sm" placeholder="Remote host"
            value={newTunnel.remoteHost}
            onChange={e => setNewTunnel(p => ({ ...p, remoteHost: e.target.value }))} />
          <input className="s-input s-input-sm" placeholder="Port" style={{ width: 70 }}
            value={newTunnel.remotePort}
            onChange={e => setNewTunnel(p => ({ ...p, remotePort: e.target.value }))} />
          <button className="s-btn-save s-btn-sm" onClick={handleAdd}>Add</button>
          <button className="s-btn-cancel s-btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : (
        <button className="tunnel-add-btn" onClick={() => setAdding(true)}>+ Add Tunnel</button>
      )}
    </Section>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-rows">{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="settings-row">
      <label className="s-label">{label}</label>
      <div className="s-control">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={`s-toggle ${value ? 'toggle-on' : ''}`}
      onClick={() => onChange(!value)}
      type="button"
    >
      <span className="s-toggle-thumb" />
    </button>
  );
}
