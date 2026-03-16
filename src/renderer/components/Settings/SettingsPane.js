import React, { useState, useEffect, useCallback } from 'react';
import { THEMES, applyTheme, getSavedThemeId } from '../../utils/themes';
import { getSettings, setSetting, resetSettings, DEFAULTS } from '../../utils/settings';
import { notifySuccess, notifyError } from '../Notifications/Notifications';
import './SettingsPane.css';

const SECTIONS = ['Appearance', 'Terminal', 'Behaviour', 'SSH', 'Import / Export'];

export default function SettingsPane({ onClose }) {
  const [section,  setSection]  = useState('Appearance');
  const [settings, setSettings] = useState({ ...DEFAULTS });
  const [loading,  setLoading]  = useState(true);
  const [activeTheme, setActiveTheme] = useState(getSavedThemeId());

  useEffect(() => {
    getSettings().then(s => { setSettings(s); setLoading(false); });
  }, []);

  const set = useCallback(async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await setSetting(key, value);
  }, []);

  const handleTheme = (id) => {
    setActiveTheme(id);
    applyTheme(id);
    set('theme', id);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    await resetSettings();
    applyTheme('dark');
    setActiveTheme('dark');
    const fresh = await getSettings();
    setSettings(fresh);
    notifySuccess('Settings reset to defaults');
  };

  // ── Import / Export ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const profiles = await window.macterm.profiles.getAll();
      const blob = new Blob(
        [JSON.stringify({ version: 1, profiles }, null, 2)],
        { type: 'application/json' }
      );
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `macterm-profiles-${dateStamp()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess(`Exported ${profiles.length} profiles`);
    } catch (err) {
      notifyError(`Export failed: ${err.message}`);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.profiles || !Array.isArray(data.profiles)) {
          throw new Error('Invalid format — expected { profiles: [...] }');
        }
        let imported = 0;
        for (const profile of data.profiles) {
          await window.macterm.profiles.save({ ...profile, id: Date.now().toString() + imported });
          imported++;
        }
        notifySuccess(`Imported ${imported} profiles — reload to see them`);
      } catch (err) {
        notifyError(`Import failed: ${err.message}`);
      }
    };
    input.click();
  };

  if (loading) return <div className="settings-pane"><div className="settings-loading">Loading…</div></div>;

  return (
    <div className="settings-pane">
      {/* Sidebar */}
      <div className="settings-sidebar">
        <div className="settings-sidebar-title">Settings</div>
        {SECTIONS.map(s => (
          <div
            key={s}
            className={`settings-nav-item ${section === s ? 'settings-nav-active' : ''}`}
            onClick={() => setSection(s)}
          >{s}</div>
        ))}
        <div className="settings-sidebar-footer">
          <button className="settings-close-btn" onClick={onClose}>Done</button>
        </div>
      </div>

      {/* Content */}
      <div className="settings-content">

        {/* ── Appearance ── */}
        {section === 'Appearance' && (
          <Section title="Appearance">
            <Label>Theme</Label>
            <div className="theme-grid">
              {Object.values(THEMES).map(theme => (
                <div
                  key={theme.id}
                  className={`theme-card ${activeTheme === theme.id ? 'theme-active' : ''}`}
                  onClick={() => handleTheme(theme.id)}
                >
                  <ThemePreview theme={theme} />
                  <span className="theme-label">{theme.label}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Terminal ── */}
        {section === 'Terminal' && (
          <Section title="Terminal">
            <Row label="Font size">
              <input type="range" min="10" max="22" step="1"
                value={settings.termFontSize}
                onChange={e => set('termFontSize', parseInt(e.target.value))} />
              <span className="settings-range-val">{settings.termFontSize}px</span>
            </Row>

            <Row label="Line height">
              <input type="range" min="1.0" max="2.0" step="0.05"
                value={settings.termLineHeight}
                onChange={e => set('termLineHeight', parseFloat(e.target.value))} />
              <span className="settings-range-val">{settings.termLineHeight.toFixed(2)}</span>
            </Row>

            <Row label="Scrollback lines">
              <input type="number" className="settings-input-sm"
                min="100" max="50000" step="500"
                value={settings.termScrollback}
                onChange={e => set('termScrollback', parseInt(e.target.value))} />
            </Row>

            <Row label="Cursor style">
              <select className="settings-select" value={settings.termCursorStyle}
                onChange={e => set('termCursorStyle', e.target.value)}>
                <option value="block">Block</option>
                <option value="underline">Underline</option>
                <option value="bar">Bar</option>
              </select>
            </Row>

            <Row label="Cursor blink">
              <Toggle
                value={settings.termCursorBlink}
                onChange={v => set('termCursorBlink', v)}
              />
            </Row>
          </Section>
        )}

        {/* ── Behaviour ── */}
        {section === 'Behaviour' && (
          <Section title="Behaviour">
            <Row label="Default protocol">
              <select className="settings-select" value={settings.defaultProtocol}
                onChange={e => set('defaultProtocol', e.target.value)}>
                {['SSH', 'RDP', 'VNC', 'SFTP'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Row>

            <Row label="Connect on sidebar click">
              <Toggle value={settings.connectOnClick} onChange={v => set('connectOnClick', v)} />
            </Row>

            <Row label="Confirm before closing tab">
              <Toggle value={settings.confirmOnClose} onChange={v => set('confirmOnClose', v)} />
            </Row>

            <Row label="Open SFTP panel with SSH">
              <Toggle value={settings.sftpOpenOnSSH} onChange={v => set('sftpOpenOnSSH', v)} />
            </Row>

            <Row label="Show hidden files in SFTP">
              <Toggle value={settings.sftpShowHidden} onChange={v => set('sftpShowHidden', v)} />
            </Row>
          </Section>
        )}

        {/* ── SSH ── */}
        {section === 'SSH' && (
          <Section title="SSH">
            <Row label="Connect timeout (seconds)">
              <input type="number" className="settings-input-sm" min="5" max="60"
                value={settings.sshConnectTimeout}
                onChange={e => set('sshConnectTimeout', parseInt(e.target.value))} />
            </Row>

            <Row label="Keep-alive interval (seconds)">
              <input type="number" className="settings-input-sm" min="0" max="120"
                value={settings.sshKeepAliveInterval}
                onChange={e => set('sshKeepAliveInterval', parseInt(e.target.value))} />
              <span className="settings-hint">0 = disabled</span>
            </Row>

            <div className="settings-divider" />
            <div className="settings-shortcut-table">
              <div className="sst-header">Keyboard shortcuts</div>
              {SHORTCUTS.map(s => (
                <div key={s.key} className="sst-row">
                  <span className="sst-label">{s.label}</span>
                  <kbd className="sst-key">{s.key}</kbd>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Import / Export ── */}
        {section === 'Import / Export' && (
          <Section title="Import / Export">
            <div className="ie-card">
              <div className="ie-card-title">Export profiles</div>
              <div className="ie-card-body">
                Save all your connection profiles to a JSON file.
                Useful for backups or sharing with your team.
              </div>
              <button className="ie-btn" onClick={handleExport}>
                ↓ Export profiles.json
              </button>
            </div>

            <div className="ie-card">
              <div className="ie-card-title">Import profiles</div>
              <div className="ie-card-body">
                Import profiles from a MacTerm JSON export file.
                Existing profiles are not overwritten.
              </div>
              <button className="ie-btn" onClick={handleImport}>
                ↑ Import from file…
              </button>
            </div>

            <div className="settings-divider" />

            <div className="ie-danger-zone">
              <div className="ie-dz-title">Danger zone</div>
              <button className="ie-btn ie-btn-danger" onClick={handleReset}>
                Reset all settings to defaults
              </button>
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div className="settings-label">{children}</div>;
}

function Row({ label, children }) {
  return (
    <div className="settings-row">
      <span className="settings-row-label">{label}</span>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={`settings-toggle ${value ? 'toggle-on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function ThemePreview({ theme }) {
  const v = theme.vars;
  return (
    <div className="theme-preview" style={{ background: v['--bg-app'], border: `1px solid ${v['--border-accent']}` }}>
      <div className="tp-sidebar" style={{ background: v['--bg-sidebar'] }}>
        {[1,2,3].map(i => (
          <div key={i} className="tp-row" style={{ background: i === 1 ? v['--bg-active'] : 'transparent' }}>
            <div className="tp-dot" style={{ background: v['--accent'] }} />
            <div className="tp-bar" style={{ background: v['--text-muted'], width: `${50 - i * 8}%` }} />
          </div>
        ))}
      </div>
      <div className="tp-terminal" style={{ background: v['--bg-terminal'] }}>
        <div className="tp-line" style={{ color: v['--accent'] }}>$ ls</div>
        <div className="tp-line" style={{ color: v['--text-secondary'] }}>app.js</div>
        <div className="tp-cursor" style={{ background: v['--accent'] }} />
      </div>
    </div>
  );
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

const SHORTCUTS = [
  { label: 'New connection',    key: '⌘T' },
  { label: 'Close tab',         key: '⌘W' },
  { label: 'Next tab',          key: '⌘]' },
  { label: 'Previous tab',      key: '⌘[' },
  { label: 'Jump to tab 1–9',   key: '⌘1–9' },
  { label: 'Clear terminal',    key: '⌘K' },
  { label: 'Disconnect',        key: '⌘D' },
  { label: 'Toggle SFTP panel', key: '⌘⇧F' },
  { label: 'Open settings',     key: '⌘,' },
  { label: 'Open vault',        key: '⌘⇧V' },
];
