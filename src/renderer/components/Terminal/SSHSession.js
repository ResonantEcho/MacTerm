import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import FileBrowser from '../FileBrowser/FileBrowser';
import './SSHSession.css';

const TERMINAL_THEME = {
  background:   '#1a1c20',
  foreground:   '#e8e6e0',
  cursor:       '#2ecc8a',
  cursorAccent: '#1a1c20',
  selectionBackground: 'rgba(46,204,138,0.25)',
  black:        '#1a1c20',
  red:          '#e05555',
  green:        '#2ecc8a',
  yellow:       '#f0a030',
  blue:         '#4d9ef7',
  magenta:      '#a07ef0',
  cyan:         '#2ecccc',
  white:        '#e8e6e0',
  brightBlack:  '#555550',
  brightRed:    '#ff6b6b',
  brightGreen:  '#50e0a0',
  brightYellow: '#ffc060',
  brightBlue:   '#6db4ff',
  brightMagenta:'#c09aff',
  brightCyan:   '#50e0e0',
  brightWhite:  '#ffffff',
};

export default function SSHSession({ tab }) {
  const termRef = useRef(null);   // DOM node
  const xtermRef = useRef(null);  // Terminal instance
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  const [status, setStatus] = useState('connecting'); // connecting | connected | error | disconnected
  const [stats, setStats] = useState({ up: 0, down: 0 });
  const [showFileBrowser, setShowFileBrowser] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const { profile } = tab;

  useEffect(() => {
    // Initialize xterm
    const term = new Terminal({
      theme: TERMINAL_THEME,
      fontFamily: "'Menlo', 'Monaco', 'Cascadia Code', 'Fira Mono', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const linksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(linksAddon);
    term.open(termRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Show connecting message
    term.writeln('\x1b[32mMacTerm\x1b[0m — SSH session');
    term.writeln(`\x1b[90mConnecting to \x1b[36m${profile.host}:${profile.port}\x1b[90m as \x1b[33m${profile.username}\x1b[0m`);
    term.writeln('');

    // ── NOTE: Real SSH connection via ssh2 will be added in Phase 2. ──────────
    // For now, simulate a connected state so the UI is fully testable.
    setTimeout(() => {
      term.writeln(`\x1b[32m✓ Connected\x1b[0m (demo mode — real SSH in Phase 2)`);
      term.writeln('');
      term.write(`\x1b[32m${profile.username}@${profile.host.split('.')[0]}\x1b[0m:\x1b[34m~\x1b[0m$ `);
      setStatus('connected');
    }, 800);

    // Echo local keypresses (demo mode)
    term.onKey(({ key, domEvent }) => {
      if (status === 'connected' || true) {
        if (domEvent.keyCode === 13) {
          term.writeln('');
          term.write(`\x1b[32m${profile.username}@${profile.host.split('.')[0]}\x1b[0m:\x1b[34m~\x1b[0m$ `);
        } else if (domEvent.keyCode === 8) {
          term.write('\b \b');
        } else {
          term.write(key);
        }
      }
    });

    // Resize observer
    const ro = new ResizeObserver(() => fitAddon.fit());
    if (termRef.current) ro.observe(termRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
      wsRef.current?.close();
    };
  }, [profile.host, profile.port, profile.username]); // eslint-disable-line

  return (
    <div className="ssh-session">
      <div className="ssh-main">
        <div className="ssh-terminal-wrap">
          <div ref={termRef} className="ssh-terminal" />
          <div className="ssh-status-bar">
            <StatusDot status={status} />
            <span className="ssb-item">{profile.username}@{profile.host}:{profile.port}</span>
            <span className="ssb-item ssb-dim">SSH-2 · AES-256</span>
            {errorMsg && <span className="ssb-error">{errorMsg}</span>}
            <div className="ssb-spacer" />
            <span className="ssb-item ssb-dim">↑ {fmt(stats.up)} ↓ {fmt(stats.down)}</span>
            <button
              className="ssb-toggle"
              onClick={() => setShowFileBrowser(v => !v)}
              title="Toggle SFTP browser"
            >
              {showFileBrowser ? '⇥' : '⇤'} SFTP
            </button>
          </div>
        </div>

        {showFileBrowser && (
          <FileBrowser profile={profile} />
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    connecting:   '#f0a030',
    connected:    '#2ecc8a',
    disconnected: '#555550',
    error:        '#e05555',
  };
  return (
    <span className="ssb-item" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: colors[status] || '#555550',
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {status}
    </span>
  );
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}
