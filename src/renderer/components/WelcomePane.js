import React from 'react';
import './WelcomePane.css';

const QUICK_ACTIONS = [
  { label: 'SSH',  icon: '⚡', color: 'var(--accent)',        desc: 'Terminal session' },
  { label: 'RDP',  icon: '🖥', color: 'var(--accent-blue)',   desc: 'Remote desktop' },
  { label: 'VNC',  icon: '📺', color: 'var(--accent-amber)',  desc: 'Screen share' },
  { label: 'SFTP', icon: '📁', color: 'var(--accent-purple)', desc: 'File transfer' },
];

export default function WelcomePane({ onNewConnection }) {
  return (
    <div className="welcome-pane">
      <div className="welcome-logo">MacTerm</div>
      <div className="welcome-tagline">Your server connections, all in one place</div>

      <div className="welcome-cards">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} className="welcome-card" onClick={onNewConnection}>
            <span className="wc-icon" style={{ color: a.color }}>{a.icon}</span>
            <span className="wc-label">{a.label}</span>
            <span className="wc-desc">{a.desc}</span>
          </button>
        ))}
      </div>

      <div className="welcome-hint">
        Select a saved connection from the sidebar, or click a protocol above to start.
      </div>
    </div>
  );
}
