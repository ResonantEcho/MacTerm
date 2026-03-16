/**
 * RDPSession.js — Phase 3
 *
 * RDP sessions work by spawning xfreerdp (FreeRDP) as a native subprocess.
 * FreeRDP opens its own OS window — we don't render the remote desktop
 * inside Electron directly (that would require a custom video pipeline).
 *
 * This component:
 *  1. Checks if FreeRDP is installed
 *  2. If not → shows a friendly install guide
 *  3. If yes → launches xfreerdp and shows a log console with its output
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './RDPSession.css';

export default function RDPSession({ tab }) {
  const { profile, id: sessionId } = tab;

  const logRef = useRef(null);
  const [detected,  setDetected]  = useState(null);   // null | { found, path }
  const [status,    setStatus]    = useState('idle');  // idle|connecting|connected|error|disconnected
  const [log,       setLog]       = useState([]);
  const [pid,       setPid]       = useState(null);

  const appendLog = useCallback((line) => {
    setLog(prev => [...prev.slice(-300), line]);   // cap at 300 lines
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // Detect FreeRDP on mount
  useEffect(() => {
    window.macterm.rdp.detect().then(setDetected);
  }, []);

  // Subscribe to RDP process events
  useEffect(() => {
    const unsubOutput = window.macterm.rdp.onOutput(sessionId, (line) => {
      appendLog(line.trimEnd());
    });
    const unsubClose = window.macterm.rdp.onClose(sessionId, (reason) => {
      setStatus('disconnected');
      appendLog(`\n[session closed: ${reason}]`);
      setPid(null);
    });

    return () => {
      unsubOutput();
      unsubClose();
      window.macterm.rdp.stop(sessionId);
    };
  }, [sessionId, appendLog]);

  const handleConnect = async () => {
    setStatus('connecting');
    setLog([]);
    appendLog(`Connecting to ${profile.host}:${profile.port || 3389}…`);

    const result = await window.macterm.rdp.start(sessionId, profile);

    if (!result.success) {
      setStatus('error');
      appendLog(`\nError: ${result.error}`);
      if (result.notInstalled) setDetected({ found: false });
      return;
    }

    setStatus('connected');
    setPid(result.pid);
    appendLog(`FreeRDP started (PID ${result.pid})`);
    appendLog(`Remote desktop window should open shortly…\n`);
  };

  const handleDisconnect = async () => {
    await window.macterm.rdp.stop(sessionId);
    setStatus('disconnected');
    setPid(null);
    appendLog('\n[disconnected by user]');
  };

  // ── Not installed screen ───────────────────────────────────────────────────
  if (detected && !detected.found) {
    return (
      <div className="rdp-session rdp-not-installed">
        <div className="rdp-ni-icon">🍺</div>
        <div className="rdp-ni-title">FreeRDP not installed</div>
        <div className="rdp-ni-body">
          MacTerm uses FreeRDP (xfreerdp) to connect to RDP servers.
          Install it with Homebrew:
        </div>
        <div className="rdp-ni-cmd">
          <code>brew install freerdp</code>
          <button
            className="rdp-ni-copy"
            onClick={() => navigator.clipboard.writeText('brew install freerdp')}
          >Copy</button>
        </div>
        <div className="rdp-ni-note">
          After installing, close and re-open this tab.
        </div>
        <button
          className="rdp-ni-recheck"
          onClick={() => window.macterm.rdp.detect().then(setDetected)}
        >
          ⟳ Re-check
        </button>
      </div>
    );
  }

  // ── Main RDP UI ────────────────────────────────────────────────────────────
  return (
    <div className="rdp-session">

      {/* Header bar */}
      <div className="rdp-toolbar">
        <StatusDot status={status} />
        <span className="rdp-tb-label">
          {profile.username}@{profile.host}:{profile.port || 3389}
        </span>
        {detected?.path && (
          <span className="rdp-tb-bin" title="FreeRDP binary">{detected.path}</span>
        )}

        <div className="rdp-tb-spacer" />

        {(status === 'idle' || status === 'disconnected' || status === 'error') && (
          <button className="rdp-btn rdp-btn-connect" onClick={handleConnect}>
            Connect
          </button>
        )}
        {(status === 'connecting' || status === 'connected') && (
          <button className="rdp-btn rdp-btn-disconnect" onClick={handleDisconnect}>
            Disconnect
          </button>
        )}
      </div>

      {/* Connected banner */}
      {status === 'connected' && (
        <div className="rdp-connected-banner">
          <span className="rdp-banner-dot" />
          RDP window is open (PID {pid}) — switch to it or use the taskbar to bring it forward.
        </div>
      )}

      {/* Log console */}
      <div className="rdp-log-wrap">
        <div className="rdp-log-header">Session log</div>
        <div className="rdp-log" ref={logRef}>
          {log.length === 0 && (
            <span className="rdp-log-empty">
              {detected === null
                ? 'Checking for FreeRDP…'
                : `Ready — click Connect to open ${profile.host}`}
            </span>
          )}
          {log.map((line, i) => (
            <div key={i} className={`rdp-log-line ${classifyLine(line)}`}>
              {line}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    idle:         { color: 'var(--text-muted)',   label: 'Idle' },
    connecting:   { color: 'var(--accent-amber)', label: 'Connecting' },
    connected:    { color: 'var(--accent)',        label: 'Connected' },
    disconnected: { color: 'var(--text-muted)',   label: 'Disconnected' },
    error:        { color: 'var(--accent-red)',   label: 'Error' },
  };
  const { color, label } = map[status] || map.idle;
  return (
    <div className="rdp-status-wrap">
      <span className="rdp-status-dot" style={{ background: color }} />
      <span className="rdp-status-label" style={{ color }}>{label}</span>
    </div>
  );
}

function classifyLine(line) {
  const l = line.toLowerCase();
  if (l.includes('error') || l.includes('failed')) return 'rdp-log-err';
  if (l.includes('warn'))                           return 'rdp-log-warn';
  if (l.includes('connect') || l.includes('pid'))  return 'rdp-log-info';
  if (line.startsWith('['))                         return 'rdp-log-sys';
  return '';
}
