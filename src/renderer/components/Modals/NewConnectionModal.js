import React, { useState } from 'react';
import './NewConnectionModal.css';

const DEFAULT_PORTS = { SSH: 22, RDP: 3389, VNC: 5900, SFTP: 22 };

const EMPTY = {
  name: '', group: '', protocol: 'SSH',
  host: '', port: 22, username: '',
  authType: 'sshkey', vaultCredId: null,
};

export default function NewConnectionModal({ onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: null }));
  };

  const selectProtocol = (proto) => {
    setForm(p => ({ ...p, protocol: proto, port: DEFAULT_PORTS[proto] }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'Name is required';
    if (!form.host.trim())  e.host = 'Host is required';
    if (!form.port)         e.port = 'Port is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: Date.now().toString() });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Connection</span>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        {/* Protocol selector */}
        <div className="proto-tabs">
          {['SSH', 'RDP', 'VNC', 'SFTP'].map(p => (
            <button
              key={p}
              className={`proto-tab ${form.protocol === p ? 'proto-selected' : ''}`}
              onClick={() => selectProtocol(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="modal-body">
          <Field label="Display Name" error={errors.name}>
            <input className={`modal-input ${errors.name ? 'input-error' : ''}`}
              value={form.name} placeholder="e.g. prod-web-01"
              onChange={e => set('name', e.target.value)} />
          </Field>

          <Field label="Group (optional)">
            <input className="modal-input" value={form.group}
              placeholder="Production, Staging, Local…"
              onChange={e => set('group', e.target.value)} />
          </Field>

          <div className="modal-row-2">
            <Field label="Hostname / IP" error={errors.host}>
              <input className={`modal-input ${errors.host ? 'input-error' : ''}`}
                value={form.host} placeholder="192.168.1.10"
                onChange={e => set('host', e.target.value)} />
            </Field>
            <Field label="Port" error={errors.port} style={{ maxWidth: 90 }}>
              <input className={`modal-input ${errors.port ? 'input-error' : ''}`}
                type="number" value={form.port}
                onChange={e => set('port', parseInt(e.target.value) || '')} />
            </Field>
          </div>

          <Field label="Username">
            <input className="modal-input" value={form.username}
              placeholder="ubuntu"
              onChange={e => set('username', e.target.value)} />
          </Field>

          {(form.protocol === 'SSH' || form.protocol === 'SFTP') && (
            <Field label="Auth Method">
              <select className="modal-input" value={form.authType}
                onChange={e => set('authType', e.target.value)}>
                <option value="sshkey">SSH Key (recommended)</option>
                <option value="password">Password</option>
                <option value="vault">Use Vault Credential</option>
              </select>
            </Field>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn-connect" onClick={handleSave}>Save & Connect</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children, style }) {
  return (
    <div className="modal-field" style={style}>
      <div className="modal-label">{label}</div>
      {children}
      {error && <div className="modal-field-error">{error}</div>}
    </div>
  );
}
