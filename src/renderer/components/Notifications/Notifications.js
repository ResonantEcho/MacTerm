import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Notifications.css';

// ── Singleton event bus ────────────────────────────────────────────────────────
let _notify = null;

export function notify(message, type = 'info', duration = 3500) {
  if (_notify) _notify(message, type, duration);
}

// Convenience helpers
export const notifySuccess = (msg, dur) => notify(msg, 'success', dur);
export const notifyError   = (msg, dur) => notify(msg, 'error',   dur ?? 6000);
export const notifyInfo    = (msg, dur) => notify(msg, 'info',    dur);
export const notifyWarn    = (msg, dur) => notify(msg, 'warn',    dur);

// ── Component ─────────────────────────────────────────────────────────────────
let _idCounter = 0;

export default function NotificationContainer() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type, duration) => {
    const id = ++_idCounter;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    _notify = add;
    return () => { _notify = null; };
  }, [add]);

  if (!toasts.length) return null;

  return (
    <div className="notif-container">
      {toasts.map(t => (
        <Toast
          key={t.id}
          toast={t}
          onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const { message, type, duration } = toast;
  const progressRef = useRef(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${duration}ms linear`;
      requestAnimationFrame(() => {
        if (progressRef.current) progressRef.current.style.width = '0%';
      });
    }
  }, [duration]);

  const ICONS = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };

  return (
    <div className={`notif-toast notif-${type}`} onClick={onDismiss}>
      <span className="notif-icon">{ICONS[type] || ICONS.info}</span>
      <span className="notif-message">{message}</span>
      <div className="notif-progress" ref={progressRef} />
    </div>
  );
}
