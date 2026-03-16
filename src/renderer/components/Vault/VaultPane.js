import React, { useState, useEffect } from 'react';
import './VaultPane.css';

const PROTO_COLORS = {
  SSH:  { badge: 'badge-ssh',  icon: '🔑' },
  RDP:  { badge: 'badge-rdp',  icon: '🔒' },
  VNC:  { badge: 'badge-vnc',  icon: '🔒' },
  SFTP: { badge: 'badge-ssh',  icon: '🔑' },
};

const EMPTY_FORM = {
  id: null, label: '', host: '', username: '',
  authType: 'password', secret: '', protocol: 'SSH',
};

export default function VaultPane({ onClose }) {
  const [credentials, setCredentials] = useState([]);
  const [editing, setEditing] = useState(null);   // null | credential object
  const [showSecret, setShowSecret] = useState(false);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    window.macterm?.vault.getAll().then(setCredentials);
  }, []);

  const filtered = credentials.filter(c =>
    c.label?.toLowerCase().includes(search.toLowerCase()) ||
    c.host?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!editing.label) return;
    await window.macterm?.vault.save(editing);
    const updated = await window.macterm?.vault.getAll();
    setCredentials(updated);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this credential?')) return;
    await window.macterm?.vault.delete(id);
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const copySecret = async (c) => {
    await navigator.clipboard.writeText(c.secret || '');
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="vault-pane">
      <div className="vault-header">
        <div>
          <div className="vault-title">Credential Vault</div>
          <div className="vault-subtitle">Encrypted and stored locally on this machine</div>
        </div>
        <div className="vault-header-actions">
          <button className="vault-add-btn" onClick={() => setEditing({ ...EMPTY_FORM })}>
            + Add Credential
          </button>
          <button className="vault-close-btn" onClick={onClose} title="Close vault">×</button>
        </div>
      </div>

      <div className="vault-search-row">
        <input
          className="vault-search"
          type="text"
          placeholder="Search credentials…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="vault-list">
        {filtered.length === 0 && (
          <div className="vault-empty">
            {search ? 'No matches' : 'No credentials saved yet. Add one to get started.'}
          </div>
        )}

        {filtered.map(c => {
          const meta = PROTO_COLORS[c.protocol] || PROTO_COLORS.SSH;
          return (
            <div key={c.id} className="vault-item">
              <span className="vault-item-icon">{meta.icon}</span>
              <div className="vault-item-info">
                <div className="vault-item-label">{c.label}</div>
                <div className="vault-item-sub">
                  {c.username}{c.host ? ` @ ${c.host}` : ''} · {c.authType}
                </div>
              </div>
              <span className={`conn-badge ${meta.badge}`}>{c.protocol}</span>
              <div className="vault-item-actions">
                <button
                  className="vault-action-btn"
                  onClick={() => copySecret(c)}
                  title="Copy password / key path"
                >
                  {copied === c.id ? '✓' : 'Copy'}
                </button>
                <button
                  className="vault-action-btn"
                  onClick={() => setEditing({ ...c })}
                >Edit</button>
                <button
                  className="vault-action-btn vault-action-danger"
                  onClick={() => handleDelete(c.id)}
                >Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add modal */}
      {editing && (
        <div className="vault-modal-overlay" onClick={() => setEditing(null)}>
          <div className="vault-modal" onClick={e => e.stopPropagation()}>
            <div className="vault-modal-title">
              {editing.id ? 'Edit Credential' : 'New Credential'}
            </div>

            <FormRow label="Label">
              <input className="vault-input" value={editing.label}
                onChange={e => setEditing(p => ({ ...p, label: e.target.value }))}
                placeholder="e.g. prod web server" />
            </FormRow>

            <FormRow label="Protocol">
              <select className="vault-input" value={editing.protocol}
                onChange={e => setEditing(p => ({ ...p, protocol: e.target.value }))}>
                {['SSH','RDP','VNC','SFTP'].map(pr => <option key={pr}>{pr}</option>)}
              </select>
            </FormRow>

            <div className="vault-form-row-2">
              <FormRow label="Host">
                <input className="vault-input" value={editing.host}
                  onChange={e => setEditing(p => ({ ...p, host: e.target.value }))}
                  placeholder="192.168.1.10" />
              </FormRow>
              <FormRow label="Username">
                <input className="vault-input" value={editing.username}
                  onChange={e => setEditing(p => ({ ...p, username: e.target.value }))}
                  placeholder="ubuntu" />
              </FormRow>
            </div>

            <FormRow label="Auth Type">
              <select className="vault-input" value={editing.authType}
                onChange={e => setEditing(p => ({ ...p, authType: e.target.value }))}>
                <option value="password">Password</option>
                <option value="sshkey">SSH Key (path)</option>
              </select>
            </FormRow>

            <FormRow label={editing.authType === 'sshkey' ? 'Key Path' : 'Password'}>
              <div className="vault-secret-row">
                <input
                  className="vault-input"
                  type={showSecret ? 'text' : 'password'}
                  value={editing.secret}
                  onChange={e => setEditing(p => ({ ...p, secret: e.target.value }))}
                  placeholder={editing.authType === 'sshkey' ? '~/.ssh/id_rsa' : '••••••••'}
                />
                <button className="vault-show-btn" onClick={() => setShowSecret(v => !v)}>
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormRow>

            <div className="vault-modal-actions">
              <button className="vault-btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="vault-btn-save" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div className="vault-form-row">
      <div className="vault-form-label">{label}</div>
      {children}
    </div>
  );
}
