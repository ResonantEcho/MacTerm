import React, { useState, useEffect, useRef, useMemo } from 'react';
import './CommandPalette.css';

const PROTO_ICON = { SSH: '⚡', RDP: '🖥', VNC: '📺', SFTP: '📁' };

export default function CommandPalette({ profiles, onSelect, onClose }) {
  const [query,       setQuery]       = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fuzzy filter
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return profiles.slice(0, 20);
    return profiles
      .map(p => ({ profile: p, score: score(p, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(x => x.profile);
  }, [profiles, query]);

  // Reset highlight when results change
  useEffect(() => setHighlighted(0), [results]);

  // Scroll highlighted item into view
  useEffect(() => {
    const el = listRef.current?.children[highlighted];
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[highlighted]) onSelect(results[highlighted]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-box" onClick={e => e.stopPropagation()}>
        <div className="cp-input-row">
          <span className="cp-search-icon">⌕</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search connections…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <kbd className="cp-esc">esc</kbd>
        </div>

        {results.length > 0 && (
          <div className="cp-list" ref={listRef}>
            {results.map((p, i) => (
              <div
                key={p.id}
                className={`cp-item ${i === highlighted ? 'cp-highlighted' : ''}`}
                onClick={() => onSelect(p)}
                onMouseEnter={() => setHighlighted(i)}
              >
                <span className="cp-item-icon">{PROTO_ICON[p.protocol] || '⚡'}</span>
                <div className="cp-item-info">
                  <span className="cp-item-name">
                    {highlight(p.name, query)}
                  </span>
                  <span className="cp-item-sub">
                    {p.group && <span className="cp-item-group">{p.group}</span>}
                    <span className="cp-item-host">{p.host}:{p.port}</span>
                  </span>
                </div>
                <span className={`cp-proto-badge badge-${p.protocol?.toLowerCase()}`}>
                  {p.protocol}
                </span>
                {i === highlighted && (
                  <kbd className="cp-enter-hint">↵</kbd>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && query && (
          <div className="cp-empty">No connections match "{query}"</div>
        )}

        <div className="cp-footer">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function score(profile, query) {
  const haystack = `${profile.name} ${profile.host} ${profile.group} ${profile.username} ${profile.protocol}`.toLowerCase();
  if (haystack.includes(query)) return 10;
  // Character sequence match
  let qi = 0;
  for (let ci = 0; ci < haystack.length && qi < query.length; ci++) {
    if (haystack[ci] === query[qi]) qi++;
  }
  return qi === query.length ? 1 : 0;
}

function highlight(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="cp-mark">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
