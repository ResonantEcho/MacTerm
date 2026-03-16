/**
 * VNCSession.js — Phase 3
 *
 * Renders a live VNC desktop inside the app using react-vnc (noVNC wrapper).
 *
 * Flow:
 *  1. On mount → call vnc:start IPC → main process starts websockify proxy
 *  2. Get back a ws:// URL → pass to <VncScreen> component
 *  3. noVNC connects to the proxy, which forwards to the real VNC server
 *  4. On unmount → call vnc:stop IPC → proxy is killed
 *
 * Requirements:
 *   npm install react-vnc
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VncScreen } from 'react-vnc';
import './VNCSession.css';

export default function VNCSession({ tab }) {
  const { profile, id: sessionId } = tab;

  const vncRef                        = useRef(null);
  const [wsUrl,      setWsUrl]        = useState(null);
  const [status,     setStatus]       = useState('connecting');
  const [errorMsg,   setErrorMsg]     = useState('');
  const [desktopName, setDesktopName] = useState('');
  const [viewOnly,   setViewOnly]     = useState(false);
  const [scaling,    setScaling]      = useState(true);

  // Start proxy on mount, stop on unmount
  useEffect(() => {
    let cancelled = false;

    async function startVnc() {
      setStatus('connecting');
      setErrorMsg('');

      const result = await window.macterm.vnc.start(
        sessionId,
        profile.host,
        profile.port || 5900,
        profile.password || ''
      );

      if (cancelled) return;

      if (!result.success) {
        setStatus('error');
        setErrorMsg(result.error);
        return;
      }

      // Small delay to let the proxy fully start
      await new Promise(r => setTimeout(r, 300));
      if (!cancelled) setWsUrl(result.wsUrl);
    }

    startVnc();

    return () => {
      cancelled = true;
      window.macterm.vnc.stop(sessionId);
    };
  }, [sessionId, profile.host, profile.port]); // eslint-disable-line

  const handleConnect = useCallback(() => {
    setStatus('connected');
    setErrorMsg('');
  }, []);

  const handleDisconnect = useCallback((rfb) => {
    setStatus('disconnected');
  }, []);

  const handleCredentialsRequired = useCallback(() => {
    // noVNC will prompt, or we can send from profile
    if (vncRef.current && profile.password) {
      vncRef.current.sendCredentials({ password: profile.password });
    }
  }, [profile.password]);

  const handleDesktopName = useCallback((e) => {
    setDesktopName(e.detail.name || '');
  }, []);

  const sendCtrlAltDel = () => vncRef.current?.sendCtrlAltDel();

  return (
    <div className="vnc-session">

      {/* Toolbar */}
      <div className="vnc-toolbar">
        <StatusDot status={status} />
        <span className="vnc-tb-label">
          {profile.host}:{profile.port || 5900}
          {desktopName && ` — ${desktopName}`}
        </span>

        <div className="vnc-tb-spacer" />

        <label className="vnc-tb-toggle">
          <input
            type="checkbox"
            checked={scaling}
            onChange={e => setScaling(e.target.checked)}
          />
          Scale
        </label>

        <label className="vnc-tb-toggle">
          <input
            type="checkbox"
            checked={viewOnly}
            onChange={e => setViewOnly(e.target.checked)}
          />
          View only
        </label>

        <button
          className="vnc-tb-btn"
          onClick={sendCtrlAltDel}
          disabled={status !== 'connected'}
          title="Send Ctrl+Alt+Del"
        >
          Ctrl+Alt+Del
        </button>

        <button
          className="vnc-tb-btn"
          onClick={() => { window.macterm.vnc.stop(sessionId); setWsUrl(null); setTimeout(() => setWsUrl(wsUrl), 100); }}
          title="Reconnect"
        >
          ⟳ Reconnect
        </button>
      </div>

      {/* VNC canvas area */}
      <div className="vnc-canvas-wrap">
        {status === 'connecting' && !wsUrl && (
          <div className="vnc-overlay">
            <div className="vnc-overlay-spinner" />
            <div className="vnc-overlay-text">Starting VNC proxy…</div>
            <div className="vnc-overlay-sub">{profile.host}:{profile.port || 5900}</div>
          </div>
        )}

        {status === 'error' && (
          <div className="vnc-overlay">
            <div className="vnc-overlay-icon">⚠</div>
            <div className="vnc-overlay-text">Connection failed</div>
            <div className="vnc-overlay-error">{errorMsg}</div>
            <div className="vnc-overlay-sub">
              Make sure the VNC server is running and accessible.
            </div>
          </div>
        )}

        {status === 'disconnected' && (
          <div className="vnc-overlay">
            <div className="vnc-overlay-icon" style={{ color: 'var(--text-muted)' }}>⊘</div>
            <div className="vnc-overlay-text">Disconnected</div>
            <button
              className="vnc-reconnect-btn"
              onClick={() => { setWsUrl(null); setStatus('connecting'); setTimeout(() => setWsUrl(wsUrl), 200); }}
            >Reconnect</button>
          </div>
        )}

        {wsUrl && (
          <VncScreen
            ref={vncRef}
            url={wsUrl}
            style={{ width: '100%', height: '100%' }}
            viewOnly={viewOnly}
            scaleViewport={scaling}
            resizeSession={!viewOnly}
            background="#1a1c20"
            rfbOptions={{
              credentials: profile.password
                ? { password: profile.password }
                : undefined,
            }}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onCredentialsRequired={handleCredentialsRequired}
            onDesktopName={handleDesktopName}
          />
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = {
    connecting:   'var(--accent-amber)',
    connected:    'var(--accent)',
    disconnected: 'var(--text-muted)',
    error:        'var(--accent-red)',
  }[status] || 'var(--text-muted)';

  return (
    <div className="vnc-status-dot-wrap">
      <span className="vnc-status-dot" style={{ background: color }} />
      <span className="vnc-status-label" style={{ color }}>{status}</span>
    </div>
  );
}
