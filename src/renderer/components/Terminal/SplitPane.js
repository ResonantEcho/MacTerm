/**
 * SplitPane.js — Phase 5
 *
 * Renders two panes separated by a draggable divider.
 * Supports horizontal (side-by-side) and vertical (top/bottom) splits.
 *
 * Props:
 *   direction   — 'horizontal' | 'vertical'  (default: horizontal)
 *   primaryPane — React element for the left/top pane
 *   splitPane   — React element for the right/bottom pane
 *   onClose     — callback to close the split and return to single-pane
 *   defaultSplit — initial split ratio, 0–1 (default 0.5)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import './SplitPane.css';

export default function SplitPane({
  direction    = 'horizontal',
  primaryPane,
  splitPane,
  onClose,
  defaultSplit = 0.5,
}) {
  const containerRef = useRef(null);
  const [split,       setSplit]       = useState(defaultSplit);
  const [isDragging,  setIsDragging]  = useState(false);
  const dragStart = useRef(null);

  const isHoriz = direction === 'horizontal';

  // ── Drag logic ──────────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      pos:   isHoriz ? e.clientX : e.clientY,
      split,
    };
  }, [isHoriz, split]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;

      const rect   = container.getBoundingClientRect();
      const total  = isHoriz ? rect.width  : rect.height;
      const pos    = isHoriz ? e.clientX   : e.clientY;
      const origin = isHoriz ? rect.left   : rect.top;

      const newSplit = Math.min(0.85, Math.max(0.15, (pos - origin) / total));
      setSplit(newSplit);
    };

    const onMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [isDragging, isHoriz]);

  // ── Keyboard: close split with Escape or Cmd+Shift+D ──────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey && e.shiftKey && e.key === 'd') || e.key === 'F8') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const primaryStyle = isHoriz
    ? { width: `${split * 100}%` }
    : { height: `${split * 100}%` };

  const splitStyle = isHoriz
    ? { width: `${(1 - split) * 100}%` }
    : { height: `${(1 - split) * 100}%` };

  return (
    <div
      ref={containerRef}
      className={`split-pane split-pane-${direction} ${isDragging ? 'split-dragging' : ''}`}
    >
      {/* Primary pane */}
      <div className="split-pane-primary" style={primaryStyle}>
        {primaryPane}
      </div>

      {/* Divider */}
      <div
        className={`split-divider split-divider-${direction}`}
        onMouseDown={onMouseDown}
        title="Drag to resize · Cmd+Shift+D to close split"
      >
        <div className="split-divider-handle" />
        <button
          className="split-close-btn"
          onClick={onClose}
          title="Close split pane (Cmd+Shift+D)"
        >×</button>
      </div>

      {/* Split pane */}
      <div className="split-pane-secondary" style={splitStyle}>
        {splitPane}
      </div>
    </div>
  );
}
