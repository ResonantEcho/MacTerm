/**
 * ThemePicker.js — standalone component used inside SettingsPanel Appearance tab.
 * Shows three cards: Dark / Light / System with visual preview swatches.
 */
import React from 'react';
import './ThemePicker.css';

const OPTIONS = [
  {
    value: 'dark',
    label: 'Dark',
    desc:  'Always dark',
    preview: { bg: '#1a1c20', sidebar: '#14161a', accent: '#2ecc8a', text: '#e8e6e0' },
  },
  {
    value: 'light',
    label: 'Light',
    desc:  'Always light',
    preview: { bg: '#f5f5f0', sidebar: '#ebebе6', accent: '#107c46', text: '#1a1c20' },
  },
  {
    value: 'system',
    label: 'System',
    desc:  'Follows macOS',
    preview: null,   // rendered specially
  },
];

export default function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-picker">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          className={`theme-card ${value === opt.value ? 'theme-card-active' : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {/* Mini app preview */}
          <div className="theme-preview" style={{ background: opt.preview?.bg || 'transparent' }}>
            {opt.value === 'system' ? (
              <SystemPreview />
            ) : (
              <MiniAppPreview p={opt.preview} />
            )}
          </div>

          <div className="theme-card-label">{opt.label}</div>
          <div className="theme-card-desc">{opt.desc}</div>

          {value === opt.value && (
            <span className="theme-card-check">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}

function MiniAppPreview({ p }) {
  return (
    <svg viewBox="0 0 80 52" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Sidebar */}
      <rect x="0"  y="0"  width="22" height="52" fill={p.sidebar} />
      {/* Main area */}
      <rect x="22" y="0"  width="58" height="52" fill={p.bg} />
      {/* Tab bar */}
      <rect x="22" y="0"  width="58" height="8"  fill={p.sidebar} opacity="0.7" />
      {/* Active tab */}
      <rect x="24" y="1"  width="18" height="7"  rx="2" fill={p.bg} />
      {/* Sidebar items */}
      <rect x="4"  y="12" width="14" height="2" rx="1" fill={p.accent} opacity="0.9" />
      <rect x="4"  y="17" width="12" height="2" rx="1" fill={p.text}   opacity="0.3" />
      <rect x="4"  y="22" width="13" height="2" rx="1" fill={p.text}   opacity="0.3" />
      <rect x="4"  y="27" width="11" height="2" rx="1" fill={p.text}   opacity="0.2" />
      {/* Terminal text lines */}
      <rect x="26" y="14" width="8"  height="1.5" rx="0.5" fill={p.accent} opacity="0.8" />
      <rect x="26" y="18" width="24" height="1.5" rx="0.5" fill={p.text}   opacity="0.4" />
      <rect x="26" y="22" width="20" height="1.5" rx="0.5" fill={p.text}   opacity="0.4" />
      <rect x="26" y="26" width="28" height="1.5" rx="0.5" fill={p.text}   opacity="0.3" />
      <rect x="26" y="30" width="16" height="1.5" rx="0.5" fill={p.text}   opacity="0.3" />
      {/* Cursor */}
      <rect x="26" y="34" width="5"  height="1.5" rx="0.5" fill={p.accent} />
    </svg>
  );
}

function SystemPreview() {
  return (
    <svg viewBox="0 0 80 52" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Left half dark */}
      <rect x="0"  y="0" width="40" height="52" fill="#1a1c20" />
      <rect x="0"  y="0" width="12" height="52" fill="#14161a" />
      <rect x="4"  y="12" width="4" height="1.5" rx="0.5" fill="#2ecc8a" opacity="0.9" />
      <rect x="14" y="0" width="26" height="6" fill="#111316" opacity="0.8" />
      <rect x="14" y="10" width="12" height="1.5" rx="0.5" fill="#e8e6e0" opacity="0.35" />
      <rect x="14" y="14" width="18" height="1.5" rx="0.5" fill="#e8e6e0" opacity="0.25" />
      {/* Right half light */}
      <rect x="40" y="0" width="40" height="52" fill="#f5f5f0" />
      <rect x="40" y="0" width="12" height="52" fill="#ebebе6" />
      <rect x="43" y="12" width="4" height="1.5" rx="0.5" fill="#107c46" opacity="0.9" />
      <rect x="53" y="0" width="27" height="6" fill="#e2e2dc" opacity="0.8" />
      <rect x="53" y="10" width="12" height="1.5" rx="0.5" fill="#1a1c20" opacity="0.35" />
      <rect x="53" y="14" width="18" height="1.5" rx="0.5" fill="#1a1c20" opacity="0.25" />
      {/* Divider */}
      <line x1="40" y1="0" x2="40" y2="52" stroke="rgba(128,128,128,0.3)" strokeWidth="1" />
    </svg>
  );
}
