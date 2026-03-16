/**
 * FileBrowser.js — Phase 2
 *
 * Uses the real SFTP subsystem (ssh2 via IPC) to browse the remote filesystem.
 * Features: navigate dirs, upload, download, delete, new folder.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './FileBrowser.css';

export default function FileBrowser({ sessionId, connected }) {
  const [path,    setPath]    = useState('~');
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [selected, setSelected] = useState(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Load directory whenever path or connection state changes
  const loadDir = useCallback(async (targetPath) => {
    if (!connected) return;
    setLoading(true);
    setError('');
    setSelected(null);

    const result = await window.macterm.sftp.readdir(sessionId, targetPath);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Sort: dirs first, then files, both alphabetical
    const sorted = result.files.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    setFiles(sorted);
    setPath(targetPath);
  }, [sessionId, connected]);

  useEffect(() => {
    if (connected) loadDir('~');
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = (file) => {
    if (file.type !== 'dir') return;
    const next = file.name === '..'
      ? parentOf(path)
      : joinPath(path, file.name);
    loadDir(next);
  };

  const handleDownload = async () => {
    if (!selected) return;
    const file = files.find(f => f.name === selected);
    if (!file || file.type === 'dir') return;
    const result = await window.macterm.sftp.download(sessionId, joinPath(path, file.name));
    if (!result.success && result.error !== 'Cancelled') {
      setError(result.error);
    }
  };

  const handleUpload = async () => {
    const result = await window.macterm.sftp.upload(sessionId, path + '/');
    if (result.success) loadDir(path);
    else if (result.error !== 'Cancelled') setError(result.error);
  };

  const handleDelete = async () => {
    if (!selected) return;
    const file = files.find(f => f.name === selected);
    if (!file) return;
    if (!window.confirm(`Delete ${file.name}?`)) return;
    const result = await window.macterm.sftp.delete(
      sessionId,
      joinPath(path, file.name),
      file.type === 'dir'
    );
    if (result.success) loadDir(path);
    else setError(result.error);
  };

  const handleNewFolder = async () => {
    if (!newFolderName.trim()) return;
    const result = await window.macterm.sftp.mkdir(
      sessionId,
      joinPath(path, newFolderName.trim())
    );
    setNewFolderMode(false);
    setNewFolderName('');
    if (result.success) loadDir(path);
    else setError(result.error);
  };

  return (
    <div className="file-browser">
      <div className="fb-header">
        <span className="fb-title">SFTP</span>
        <button
          className="fb-reload"
          onClick={() => loadDir(path)}
          disabled={loading || !connected}
          title="Refresh"
        >⟳</button>
      </div>

      {/* Breadcrumb path */}
      <div className="fb-path" title={path}>{path}</div>

      {/* File list */}
      <div className="fb-list">
        {!connected && (
          <div className="fb-message">Waiting for SSH connection…</div>
        )}
        {connected && loading && (
          <div className="fb-message">Loading…</div>
        )}
        {connected && error && (
          <div className="fb-message fb-error">{error}</div>
        )}

        {/* Parent dir link */}
        {connected && !loading && path !== '~' && path !== '/' && (
          <div className="fb-item" onDoubleClick={() => navigate({ name: '..', type: 'dir' })}>
            <span className="fb-icon">📁</span>
            <span className="fb-name">..</span>
          </div>
        )}

        {connected && !loading && files.map(file => (
          <div
            key={file.name}
            className={`fb-item ${selected === file.name ? 'fb-selected' : ''}`}
            onClick={() => setSelected(file.name)}
            onDoubleClick={() => navigate(file)}
          >
            <span className="fb-icon">{fileIcon(file)}</span>
            <span className="fb-name">{file.name}</span>
            {file.type === 'file' && (
              <span className="fb-size">{fmtSize(file.size)}</span>
            )}
          </div>
        ))}

        {/* New folder input */}
        {newFolderMode && (
          <div className="fb-new-folder">
            <input
              autoFocus
              className="fb-new-folder-input"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleNewFolder();
                if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName(''); }
              }}
              placeholder="folder name"
            />
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="fb-toolbar">
        <button
          className="fb-btn"
          onClick={handleUpload}
          disabled={!connected}
          title="Upload file to current directory"
        >Upload</button>
        <button
          className="fb-btn"
          onClick={handleDownload}
          disabled={!selected || !connected}
          title="Download selected file"
        >Download</button>
        <button
          className="fb-btn"
          onClick={() => setNewFolderMode(true)}
          disabled={!connected}
          title="New folder"
        >+ Folder</button>
        <button
          className="fb-btn fb-btn-danger"
          onClick={handleDelete}
          disabled={!selected || !connected}
          title="Delete selected"
        >Delete</button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parentOf(p) {
  if (p === '~' || p === '/') return '/';
  const parts = p.replace(/\/$/, '').split('/');
  parts.pop();
  return parts.join('/') || '/';
}

function joinPath(base, name) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${b}/${name}`;
}

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024)        return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}

function fileIcon(file) {
  if (file.type === 'dir') return '📁';
  const ext = file.name.split('.').pop().toLowerCase();
  if (['js','ts','jsx','tsx','mjs','cjs'].includes(ext))         return '📜';
  if (['json','yaml','yml','toml','ini','conf','env'].includes(ext)) return '⚙';
  if (['html','css','scss','sass','less'].includes(ext))          return '🌐';
  if (['sh','bash','zsh','fish'].includes(ext))                   return '⚡';
  if (['jpg','jpeg','png','gif','svg','webp','ico'].includes(ext)) return '🖼';
  if (['zip','tar','gz','bz2','xz','7z'].includes(ext))          return '📦';
  if (['pdf'].includes(ext))                                      return '📕';
  if (['md','txt','log'].includes(ext))                           return '📝';
  if (['py','rb','go','rs','java','php','c','cpp','h'].includes(ext)) return '💻';
  return '📄';
}
