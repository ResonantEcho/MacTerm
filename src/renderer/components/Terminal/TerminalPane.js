/**
 * TerminalPane.js — Phase 5
 *
 * Adds split-pane support on top of the Phase 3 protocol routing.
 * Cmd+D  → split horizontally (side by side)
 * Cmd+Shift+D → close split
 *
 * Each split half is an independent session chosen from the sidebar.
 * The "split session" picker is a mini command-palette-style dropdown.
 */

import React, { useState, useEffect, useCallback } from 'react';
import SSHSession         from './SSHSession';
import VNCSession         from './VNCSession';
import RDPSession         from './RDPSession';
import PlaceholderSession from './PlaceholderSession';
import SplitPane          from './SplitPane';
import './TerminalPane.css';

export default function TerminalPane({ tab, settings, showFileBrowserByDefault, profiles = [] }) {
  const [splitTab,       setSplitTab]       = useState(null);   // second session tab
  const [splitDirection, setSplitDirection] = useState('horizontal');
  const [showSplitPicker, setShowSplitPicker] = useState(false);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Only respond when this tab is active (parent hides us otherwise)
      if (e.metaKey && e.shiftKey && e.key === 'd') {
        setSplitTab(null);
      } else if (e.metaKey && !e.shiftKey && e.key === 'd') {
        e.preventDefault();
        setShowSplitPicker(p => !p);
      } else if (e.metaKey && e.shiftKey && e.key === 'ArrowRight') {
        setSplitDirection('horizontal');
      } else if (e.metaKey && e.shiftKey && e.key === 'ArrowDown') {
        setSplitDirection('vertical');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openSplit = useCallback((profile) => {
    setSplitTab({
      id:        `split-${tab.id}-${Date.now()}`,
      profileId: profile.id,
      label:     profile.name,
      protocol:  profile.protocol,
      profile,
    });
    setShowSplitPicker(false);
  }, [tab.id]);

  const primarySession = renderSession(tab, settings, showFileBrowserByDefault);

  if (!splitTab) {
    return (
      <div className="terminal-pane-root">
        {primarySession}

        {/* Split picker overlay */}
        {showSplitPicker && (
          <SplitPicker
            profiles={profiles}
            onSelect={openSplit}
            onClose={() => setShowSplitPicker(false)}
            currentProfileId={tab.profileId}
          />
        )}

        {/* Split button hint */}
        <button
          className="split-open-btn"
          onClick={() => setShowSplitPicker(true)}
          title="Split pane (Cmd+D)"
        >
          ⊞
        </button>
      </div>
    );
  }

  const splitSession = renderSession(splitTab, settings, false);

  return (
    <div className="terminal-pane-root">
      <SplitPane
        direction={splitDirection}
        primaryPane={primarySession}
        splitPane={splitSession}
        onClose={() => setSplitTab(null)}
      />
    </div>
  );
}

// ── Session router ─────────────────────────────────────────────────────────────

function renderSession(tab, settings, showFileBrowserByDefault) {
  switch (tab.protocol) {
    case 'SSH':
    case 'SFTP':
      return <SSHSession key={tab.id} tab={tab} settings={settings} showFileBrowserByDefault={showFileBrowserByDefault} />;
    case 'VNC':
      return <VNCSession key={tab.id} tab={tab} />;
    case 'RDP':
      return <RDPSession key={tab.id} tab={tab} />;
    default:
      return <PlaceholderSession key={tab.id} tab={tab} />;
  }
}

// ── Split picker ───────────────────────────────────────────────────────────────

function SplitPicker({ profiles, onSelect, onClose, currentProfileId }) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  const filtered = profiles
    .filter(p => p.id !== currentProfileId)
    .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.host?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')      { filtered[highlighted] && onSelect(filtered[highlighted]); }
    if (e.key === 'Escape')     { onClose(); }
  };

  const PROTO_COLOR = { SSH: 'var(--accent)', RDP: 'var(--accent-blue)', VNC: 'var(--accent-amber)', SFTP: 'var(--accent-purple)' };

  return (
    <div className="split-picker-overlay" onClick={onClose}>
      <div className="split-picker" onClick={e => e.stopPropagation()}>
        <div className="split-picker-header">
          Open in split pane
        </div>
        <input
          className="split-picker-input"
          autoFocus
          placeholder="Search connections…"
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlighted(0); }}
          onKeyDown={handleKey}
        />
        <div className="split-picker-list">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className={`split-picker-item ${i === highlighted ? 'split-picker-highlighted' : ''}`}
              onClick={() => onSelect(p)}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="split-picker-dot" style={{ background: PROTO_COLOR[p.protocol] }} />
              <div className="split-picker-info">
                <span className="split-picker-name">{p.name}</span>
                <span className="split-picker-host">{p.host}:{p.port}</span>
              </div>
              <span className="split-picker-proto">{p.protocol}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="split-picker-empty">No other connections found</div>
          )}
        </div>
        <div className="split-picker-footer">
          <span>↑↓ navigate · ↵ open · esc cancel</span>
        </div>
      </div>
    </div>
  );
}
