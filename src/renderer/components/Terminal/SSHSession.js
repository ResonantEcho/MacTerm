/**
 * SSHSession.js — Phase 2
 *
 * Connects to a real SSH server via the main-process sshManager.
 * Data flows:  xterm.js ←→ IPC ←→ ssh2 ←→ remote server
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import FileBrowser from '../FileBrowser/FileBrowser';
import './SSHSession.css';

const TERMINAL_THEME = {
  background:          '#1a1c20',
  foreground:          '#e8e6e0',
  cursor:              '#2ecc8a',
  cursorAccent:        '#1a1c20',
  selectionBackground: 'rgba(46,204,138,0.25)',
  black:        '#1a1c20', brightBlack:   '#555550',
  red:          '#e05555', brightRed:     '#ff6b6b',
  green:        '#2ecc8a', brightGreen:   '#50e0a0',
  yellow:       '#f0a030', brightYellow:  '#ffc060',
  blue:         '#4d9ef7', brightBlue:    '#6db4ff',
  magenta:      '#a07ef0', brightMagenta: '#c09aff',
  cyan:         '#2ecccc', brightCyan:    '#50e0e0',
  white:        '#e8e6e0', brightWhite:   '#ffffff',
};

export default function SSHSession({ tab }) {
  const termDomRef  = useRef(null);   // <div> that xterm mounts into
  const xtermRef    = useRef(null);   // Terminal instance
  const fitAddonRef = useRef(null);
  const sessionId   = tab.id;         // reuse tab id as session id

  const [status,          setStatus]          = useState('connecting');
  const [errorMsg,        setErrorMsg]        = useState('');
  const [showFileBrowser, setShowFileBrowser] = useState(true);
  const [bytesUp,         setBytesUp]         = useState(0);
  const [bytesDown,       setBytesDown]       = useState(0);

  const { profile } = tab;

  // ── Bootstrap xterm ─────────────────────────────────────────────────────────
  useEffect(() => {
    const term = new Terminal({
      theme:      TERMINAL_THEME,
      fontFamily: "'Menlo','Monaco','Cascadia Code','Fira Mono',monospace",
      fontSize:   13,
      lineHeight: 1.4,
      cursorBlink:      true,
      cursorStyle:      'block',
      scrollback:       5000,
      allowProposedApi: true,
    });

    const fitAddon   = new FitAddon();
    const linksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(linksAddon);
    term.open(termDomRef.current);
    fitAddon.fit();

    xtermRef.current    = term;
    fitAddonRef.current = fitAddon;

    // ── Connect ───────────────────────────────────────────────────────────────
    term.writeln('\x1b[32mMacTerm\x1b[0m — SSH');
    term.writeln(
      `\x1b[90mConnecting to \x1b[36m${profile.host}:${profile.port || 22}` +
      `\x1b[90m as \x1b[33m${profile.username}\x1b[0m`
    );
    term.writeln('');

    window.macterm.ssh.connect(sessionId, profile).then(result => {
      if (!result.success) {
        term.writeln(`\r\n\x1b[31mConnection failed: ${result.error}\x1b[0m`);
        setStatus('error');
        setErrorMsg(result.error);
        return;
      }
      setStatus('connected');
    });

    // ── Receive data from remote ───────────────────────────────────────────────
    const unsubData = window.macterm.ssh.onData(sessionId, (data) => {
      term.write(data);
      setBytesDown(n => n + data.length);
    });

    // ── Session closed ────────────────────────────────────────────────────────
    const unsubClose = window.macterm.ssh.onClose(sessionId, (reason) => {
      term.writeln(`\r\n\x1b[33m[session closed: ${reason}]\x1b[0m`);
      setStatus('disconnected');
    });

    // ── Send keystrokes to remote ─────────────────────────────────────────────
    term.onData((data) => {
      window.macterm.ssh.sendData(sessionId, data);
      setBytesUp(n => n + data.length);
    });

    // ── Resize ────────────────────────────────────────────────────────────────
    term.onResize(({ cols, rows }) => {
      window.macterm.ssh.resize(sessionId, cols, rows);
    });

    const ro = new ResizeObserver(() => {
      fitAddon.fit();
    });
    if (termDomRef.current) ro.observe(termDomRef.current);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      ro.disconnect();
      unsubData();
      unsubClose();
      window.macterm.ssh.disconnect(sessionId);
      term.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ssh-session">
      <div className="ssh-main">

        <div className="ssh-terminal-wrap">
          <div ref={termDomRef} className="ssh-terminal" />

          <div className="ssh-status-bar">
            <StatusDot status={status} />
            <span className="ssb-item">
              {profile.username}@{profile.host}:{profile.port || 22}
            </span>
            <span className="ssb-item ssb-dim">SSH-2 · AES-256</span>
            {errorMsg && <span className="ssb-error">{errorMsg}</span>}
            <div className="ssb-spacer" />
            <span className="ssb-item ssb-dim">
              ↑ {fmt(bytesUp)} &nbsp; ↓ {fmt(bytesDown)}
            </span>
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
          <FileBrowser
            sessionId={sessionId}
            connected={status === 'connected'}
          />
        )}

      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = {
    connecting:   '#f0a030',
    connected:    '#2ecc8a',
    disconnected: '#555550',
    error:        '#e05555',
  }[status] || '#555550';

  return (
    <span className="ssb-item" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color, display: 'inline-block', flexShrink: 0,
      }} />
      {status}
    </span>
  );
}

function fmt(bytes) {
  if (bytes < 1024)        return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}
