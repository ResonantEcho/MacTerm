import { useRef, useCallback } from 'react';

/**
 * useAutoReconnect
 *
 * Call `arm(sessionId, profile, settings)` after a successful connect.
 * When the session drops, it will attempt to reconnect up to maxRetries
 * times with exponential backoff, calling onReconnecting / onReconnected
 * / onGaveUp so the UI can update status accordingly.
 */
export function useAutoReconnect({ onReconnecting, onReconnected, onGaveUp }) {
  const timers  = useRef({});   // sessionId → timeout handle
  const counts  = useRef({});   // sessionId → attempt count
  const armed   = useRef({});   // sessionId → { profile, settings }

  const arm = useCallback((sessionId, profile, settings) => {
    armed.current[sessionId] = { profile, settings };
    counts.current[sessionId] = 0;
  }, []);

  const disarm = useCallback((sessionId) => {
    clearTimeout(timers.current[sessionId]);
    delete armed.current[sessionId];
    delete counts.current[sessionId];
    delete timers.current[sessionId];
  }, []);

  const trigger = useCallback((sessionId) => {
    const entry = armed.current[sessionId];
    if (!entry) return;

    const { profile, settings } = entry;
    const maxRetries = settings?.connections?.reconnectOnDrop
      ? (settings?.connections?.reconnectMaxRetries ?? 5)
      : 0;

    if (maxRetries === 0) return;

    const attempt = (counts.current[sessionId] || 0) + 1;
    if (attempt > maxRetries) {
      onGaveUp?.(sessionId);
      disarm(sessionId);
      return;
    }

    counts.current[sessionId] = attempt;
    const baseDelay = settings?.connections?.reconnectDelay ?? 3;
    // Exponential backoff: 3s, 6s, 12s, 24s…
    const delay = baseDelay * Math.pow(2, attempt - 1) * 1000;

    onReconnecting?.(sessionId, attempt, delay);

    timers.current[sessionId] = setTimeout(async () => {
      const result = await window.macterm?.ssh.connect(sessionId, profile);
      if (result?.success) {
        counts.current[sessionId] = 0;
        onReconnected?.(sessionId);
      } else {
        trigger(sessionId);   // try again
      }
    }, delay);
  }, [onReconnecting, onReconnected, onGaveUp, disarm]);

  return { arm, disarm, trigger };
}
