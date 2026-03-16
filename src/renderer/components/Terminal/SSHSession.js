import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import FileBrowser from '../FileBrowser/FileBrowser';
import { useAutoReconnect } from '../../hooks/useAutoReconnect';
import './SSHSession.css';

const BASE_THEME = {
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

export default function SSHSession({ tab, settings, showFileBrowserByDefault = true }) {
  const termDomRef  = useRef(null);
  const xtermRef    = useRef(null);
  const fitAddonRef = useRef(null);
  const sessionId   = tab.id;

  const [status,          setStatus]          = useState('connecting');
  const [errorMsg,        setErrorMsg]        = useState('');
  const [showFileBrowser, setShowFileBrowser] = useState(showFileBrowserByDefault);
  const [bytesUp,         setBytesUp]         = useState(0);
  const [bytesDown,       setBytesDown]       = useState(0);
  const [reconnectMsg,    setReconnectMsg]     = useState('');

  const { profile } = tab;
  const termSettings = settings?.terminal || {};

  // ── Auto-reconnect ─────────────────────────────────────────────────────────
  const { arm, disarm, trigger } = useAutoReconnect({
    onReconnecting: (_, attempt, delay) => {
      setStatus('connecting');
      setReconnectMsg(`Reconnecting (attempt ${attempt}) in ${Math.round(delay / 1000)}s…`);
      xtermRef.current?.writeln(`\r\n\x1b[33m[Reconnecting in ${Math.round(delay / 1000)}s…]\x1b[0m`);
    },
    onReconnected: () => {
      setStatus('connected');
      setReconnectMsg('');
      xtermRef.current?.writeln('\r\n\x1b[32m[Reconnected]\x1b[0m\r\n');
    },
    onGaveUp: () => {
      setStatus('error');
      setReconnectMsg('');
      xtermRef.current?.writeln('\r\n\x1b[31m[Auto-reconnect gave up]\x1b[0m');
    },
  });

  // ── Keyboard events from App (clear, toggle SFTP) ──────────────────────────
  useEffect(() => {
    const onClear = (e) => {
      if (e.detail?.tabId === sessionId) xtermRef.current?.clear();
    };
    const onToggle = (e) => {
      if (e.detail?.tabId === sessionId) setShowFileBrowser(v => !v);
    };
    window.addEventListener('macterm:clear-terminal', onClear);
    window.addEventListener('macterm:toggle-sftp',    onToggle);
    return () => {
      window.removeEventListener('macterm:clear-terminal', onClear);
      window.removeEventListener('macterm:toggle-sftp',    onToggle);
    };
  }, [sessionId]);

  // ── Bootstrap xterm ────────────────────────────────────────────────────────
  useEffect(() => {
    const term = new Terminal({
      theme:       BASE_THEME,
      fontFamily:  `'${termSettings.fontFamily || 'Menlo'}', 'Monaco', monospace`,
      fontSize:    termSettings.fontSize    || 13,
      lineHeight:  termSettings.lineHeight  || 1.4,
      cursorBlink: termSettings.cursorBlink ?? true,
      cursorStyle: termSettings.cursorStyle || 'block',
      scrollback:  termSettings.scrollback  || 5000,
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

    term.writeln('\x1b[32mMacTerm\x1b[0m — SSH');
    term.writeln(`\x1b[90mConnecting to \x1b[36m${profile.host}:${profile.port || 22}\x1b[90m as \x1b[33m${profile.username}\x1b[0m`);
    term.writeln('');

    window.macterm.ssh.connect(sessionId, profile).then(result => {
      if (!result.success) {
        term.writeln(`\r\n\x1b[31mConnection failed: ${result.error}\x1b[0m`);
        setStatus('error');
        setErrorMsg(result.error);
        return;
      }
      setStatus('connected');
      arm(sessionId, profile, settings);
    });

    const unsubData = window.macterm.ssh.onData(sessionId, (data) => {
      term.write(data);
      setBytesDown(n => n + data.length);
      // Copy-on-select
      if (termSettings.copyOnSelect && term.hasSelection()) {
        navigator.clipboard.writeText(term.getSelection()).catch(() => {});
      }
    });

    const unsubClose = window.macterm.ssh.onClose(sessionId, (reason) => {
      setStatus('disconnected');
      term.writeln(`\r\n\x1b[33m[session closed: ${reason}]\x1b[0m`);
      trigger(sessionId);
    });

    term.onData((data) => {
      window.macterm.ssh.sendData(sessionId, data);
      setBytesUp(n => n + data.length);
    });

    term.onResize(({ cols, rows }) => {
      window.macterm.ssh.resize(sessionId, cols, rows);
    });

    const ro = new ResizeObserver(() => fitAddon.fit());
    if (termDomRef.current) ro.observe(termDomRef.current);

    return () => {
      ro.disconnect();
      unsubData();
      unsubClose();
      disarm(sessionId);
      window.macterm.ssh.disconnect(sessionId);
      term.dispose();
    };
  }, []); // eslint-disable-line

  return (
    <div className="ssh-session">
      <div className="ssh-main">
        <div className="ssh-terminal-wrap">
          <div ref={termDomRef} className="ssh-terminal" />
          <div className="ssh-status-bar">
            <StatusDot status={status} />
            <span className="ssb-item">{profile.username}@{profile.host}:{profile.port || 22}</span>
            <span className="ssb-item ssb-dim">SSH-2 · AES-256</span>
            {(errorMsg || reconnectMsg) && (
              <span className="ssb-error">{reconnectMsg || errorMsg}</span>
            )}
            <div className="ssb-spacer" />
            <span className="ssb-item ssb-dim">↑ {fmt(bytesUp)} &nbsp; ↓ {fmt(bytesDown)}</span>
            <button className="ssb-toggle" onClick={() => setShowFileBrowser(v => !v)}>
              {showFileBrowser ? '⇥' : '⇤'} SFTP
            </button>
          </div>
        </div>

        {showFileBrowser && (
          <FileBrowser sessionId={sessionId} connected={status === 'connected'} />
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = { connecting: 'var(--accent-amber)', connected: 'var(--accent)', disconnected: 'var(--text-muted)', error: 'var(--accent-red)' }[status] || 'var(--text-muted)';
  return (
    <span className="ssb-item" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {status}
    </span>
  );
}

function fmt(bytes) {
  if (bytes < 1024)        return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}
