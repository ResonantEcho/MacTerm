import React, { useState } from 'react';
import './FileBrowser.css';

// Placeholder file tree — will be populated via ssh2 SFTP in Phase 2
const MOCK_FILES = [
  { name: '..', type: 'dir',  size: null },
  { name: 'assets',    type: 'dir',  size: null },
  { name: 'index.html',type: 'file', size: '12K' },
  { name: 'app.js',    type: 'file', size: '8.1K' },
  { name: 'style.css', type: 'file', size: '3.2K' },
  { name: '.htaccess', type: 'file', size: '512B' },
  { name: 'robots.txt',type: 'file', size: '128B' },
];

export default function FileBrowser({ profile }) {
  const [path, setPath] = useState('~');
  const [selected, setSelected] = useState(null);

  const navigate = (file) => {
    if (file.type === 'dir') {
      setPath(prev => file.name === '..' ? parentOf(prev) : `${prev}/${file.name}`);
      setSelected(null);
    } else {
      setSelected(file.name);
    }
  };

  return (
    <div className="file-browser">
      <div className="fb-header">
        <span className="fb-title">SFTP</span>
        <button className="fb-reload" title="Refresh">⟳</button>
      </div>

      <div className="fb-path" title={path}>{path}</div>

      <div className="fb-list">
        {MOCK_FILES.map(file => (
          <div
            key={file.name}
            className={`fb-item ${selected === file.name ? 'fb-selected' : ''}`}
            onDoubleClick={() => navigate(file)}
            onClick={() => setSelected(file.name)}
          >
            <span className="fb-icon">
              {file.type === 'dir' ? '📁' : fileIcon(file.name)}
            </span>
            <span className="fb-name">{file.name}</span>
            {file.size && <span className="fb-size">{file.size}</span>}
          </div>
        ))}
      </div>

      <div className="fb-toolbar">
        <button className="fb-btn">Upload</button>
        <button className="fb-btn">Download</button>
        <button className="fb-btn">New Folder</button>
      </div>
    </div>
  );
}

function parentOf(path) {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '~';
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['js','ts','jsx','tsx'].includes(ext)) return '📜';
  if (['json','yaml','yml','toml','ini','conf'].includes(ext)) return '⚙';
  if (['html','css','scss'].includes(ext)) return '🌐';
  if (['sh','bash','zsh'].includes(ext)) return '⚡';
  if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return '🖼';
  if (['zip','tar','gz','bz2'].includes(ext)) return '📦';
  return '📄';
}
