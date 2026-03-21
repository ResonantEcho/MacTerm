import React, { useEffect, useRef, useState, useCallback } from 'react';
import './VNCSession.css';

export default function VNCSession({ tab }) {
  const { profile, id: sessionId } = tab;
  const containerRef = useRef(null);
  const rfbRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [desktopName, setDesktopName] = useState('');
  const [viewOnly, setViewOnly] = useState(false);
  const [scaling, setScaling] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function startVnc() {
      setStatus('connecting');
      setErrorMsg('');

      const result = await window.macterm.vnc.start(
        sessionId, profile.host, profile.port || 5900, profile.password || ''
      );

      if (cancelled) return;

      if (!result.success) {
        setStatus('error');
        setErrorMsg(result.error);
        return;
      }

      await new Promise(r => setTimeout(r, 400));
      if (cancelled) return;

      let RFB;
      try {
        const mod = await import('@novnc/novnc/core/rfb.js');
        RFB = mod.default;
      } catch (err) {
        setStatus('error');
        setErrorMsg('Failed to load noVNC: ' + err.message);
        return;
      }

      if (cancelled || !containerRef.current) return;

      try {
        const rfb = new RFB(containerRef.current, result.wsUrl, {
          credentials: profile.password ? { password: profile.password } : undefined,
        });

        rfb.viewOnly = viewOnly;
        rfb.scaleViewport = scaling;
        rfb.resizeSession = !viewOnly;

        rfb.addEventListener('connect', () => { if (!cancelled) setStatus('connected'); });
        rfb.addEventListener('disconnect', (e) => {
          if (!cancelled) {
            setStatus(e.detail?.clean ? 'disconnected' : 'error');
            if (!e.detail?.clean) setErrorMsg('Connection lost unexpectedly');
          }
        });
        rfb.addEventListener('credentialsrequired', () => {
          if (profile.password) rfb.sendCredentials({ password: profile.password });
        });
        rfb.addEventListener('desktopname', (e) => {
          if (!cancelled) setDesktopName(e.detail?.name || '');
        });

        rfbRef.current = rfb;
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    }

    startVnc();

    return () => {
      cancelled = true;
      try { rfbRef.current?.disconnect(); } catch (_) {}
      rfbRef.current = null;
      window.macterm.vnc.stop(sessionId);
    };
  }, [sessionId, profile.host, profile.port, profile.password]);

  useEffect(() => {
    if (rfbRef.current) {
      rfbRef.current.viewOnly = viewOnly;
      rfbRef.current.scaleViewport = scaling;
    }
  }, [viewOnly, scaling]);

  const sendCtrlAltDel = useCallback(() => {
    rfbRef.current?.sendCtrlAltDel();
  }, []);

  return (
    <div className="vnc-session">
      <div className="vnc-toolbar">
        <StatusDot status={status} />
        <span className="vnc-tb-label">
          {profile.host}:{profile.port || 5900}
          {desktopName && ` — ${desktopName}`}
        </span>
        <div className="vnc-tb-spacer" />
        <label className="vnc-tb-toggle">
          <input type="checkbox" checked={scaling} onChange={e => setScaling(e.target.checked)} />
          Scale
        </label>
        <label className="vnc-tb-toggle">
          <input type="checkbox" checked={viewOnly} onChange={e => setViewOnly(e.target.checked)} />
          View only
        </label>
        <button className="vnc-tb-btn" onClick={sendCtrlAltDel} disabled={status !== 'connected'}>
          Ctrl+Alt+Del
        </button>
      </div>

      <div className="vnc-canvas-wrap" ref={containerRef}>
        {status === 'connecting' && (
          <div className="vnc-overlay">
            <div className="vnc-overlay-spinner" />
            <div className="vnc-overlay-text">Connecting…</div>
            <div className="vnc-overlay-sub">{profile.host}:{profile.port || 5900}</div>
          </div>
        )}
        {status === 'error' && (
          <div className="vnc-overlay">
            <div className="vnc-overlay-icon">⚠</div>
            <div className="vnc-overlay-text">Connection failed</div>
            <div className="vnc-overlay-error">{errorMsg}</div>
          </div>
        )}
        {status === 'disconnected' && (
          <div className="vnc-overlay">
            <div className="vnc-overlay-icon" style={{ color: 'var(--text-muted)' }}>⊘</div>
            <div className="vnc-overlay-text">Disconnected</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = {
    connecting: 'var(--accent-amber)',
    connected: 'var(--accent)',
    disconnected: 'var(--text-muted)',
    error: 'var(--accent-red)',
  }[status] || 'var(--text-muted)';
  return (
    <div className="vnc-status-dot-wrap">
      <span className="vnc-status-dot" style={{ background: color }} />
      <span className="vnc-status-label" style={{ color }}>{status}</span>
    </div>
  );
}
