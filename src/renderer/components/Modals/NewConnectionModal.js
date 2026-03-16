import React, { useState, useEffect } from 'react';
import './NewConnectionModal.css';

const DEFAULT_PORTS = { SSH: 22, RDP: 3389, VNC: 5900, SFTP: 22 };

const EMPTY = {
  name: '', group: '', protocol: 'SSH',
  host: '', port: 22, username: '',
  authType: 'sshkey',
  keyPath: '~/.ssh/id_rsa',
  password: '',
  vaultCredId: null,
};

export default function NewConnectionModal({ onSave, onCancel }) {
  const [form,         setForm]         = useState({ ...EMPTY });
  const [errors,       setErrors]       = useState({});
  const [vaultCreds,   setVaultCreds]   = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    window.macterm?.vault.getAll().then(setVaultCreds);
  }, []);

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: null }));
  };

  const selectProtocol = (proto) => {
    setForm(p => ({
      ...p,
      protocol: proto,
      port: DEFAULT_PORTS[proto],
      // RDP/VNC always use password
      authType: (proto === 'RDP' || proto === 'VNC') ? 'password' : p.authType,
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.host.trim()) e.host = 'Host is required';
    if (!form.port)        e.port = 'Port is required';
    if (!form.username.trim() && form.protocol !== 'VNC') e.username = 'Username is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, id: Date.now().toString() });
  };

  const isSSH   = form.protocol === 'SSH' || form.protocol === 'SFTP';
  const showSSH = isSSH && form.authType === 'sshkey';
  const showPwd = !isSSH || form.authType === 'password';
  const showVault = isSSH && form.authType === 'vault';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">New Connection</span>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        {/* Protocol tabs */}
        <div className="proto-tabs">
          {['SSH', 'RDP', 'VNC', 'SFTP'].map(p => (
            <button
              key={p}
              className={`proto-tab ${form.protocol === p ? 'proto-selected' : ''}`}
              onClick={() => selectProtocol(p)}
            >{p}</button>
          ))}
        </div>

        <div className="modal-body">
          <Field label="Display Name" error={errors.name}>
            <input className={`modal-input ${errors.name ? 'input-error' : ''}`}
              value={form.name} placeholder="e.g. prod-web-01"
              onChange={e => set('name', e.target.value)} autoFocus />
          </Field>

          <Field label="Group (optional)">
            <input className="modal-input" value={form.group}
              placeholder="Production, Staging, Local…"
              onChange={e => set('group', e.target.value)} />
          </Field>

          <div className="modal-row-2">
            <Field label="Hostname / IP" error={errors.host}>
              <input className={`modal-input ${errors.host ? 'input-error' : ''}`}
                value={form.host} placeholder="192.168.1.10 or hostname"
                onChange={e => set('host', e.target.value)} />
            </Field>
            <Field label="Port" error={errors.port}>
              <input className="modal-input" type="number"
                value={form.port} style={{ width: 80 }}
                onChange={e => set('port', parseInt(e.target.value) || '')} />
            </Field>
          </div>

          {form.protocol !== 'VNC' && (
            <Field label="Username" error={errors.username}>
              <input className={`modal-input ${errors.username ? 'input-error' : ''}`}
                value={form.username} placeholder="ubuntu"
                onChange={e => set('username', e.target.value)} />
            </Field>
          )}

          {/* Auth method — SSH/SFTP only */}
          {isSSH && (
            <Field label="Auth Method">
              <select className="modal-input" value={form.authType}
                onChange={e => set('authType', e.target.value)}>
                <option value="sshkey">SSH Key</option>
                <option value="password">Password</option>
                <option value="vault">Vault Credential</option>
              </select>
            </Field>
          )}

          {/* SSH key path */}
          {showSSH && (
            <Field label="Private Key Path">
              <input className="modal-input" value={form.keyPath}
                placeholder="~/.ssh/id_rsa"
                onChange={e => set('keyPath', e.target.value)} />
            </Field>
          )}

          {/* Password */}
          {showPwd && (
            <Field label="Password">
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="modal-input"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  placeholder="••••••••"
                  style={{ flex: 1 }}
                  onChange={e => set('password', e.target.value)}
                />
                <button
                  className="modal-show-btn"
                  onClick={() => setShowPassword(v => !v)}
                >{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </Field>
          )}

          {/* Vault credential picker */}
          {showVault && (
            <Field label="Vault Credential">
              <select className="modal-input" value={form.vaultCredId || ''}
                onChange={e => set('vaultCredId', e.target.value || null)}>
                <option value="">— Select a credential —</option>
                {vaultCreds
                  .filter(c => c.protocol === 'SSH' || c.protocol === 'SFTP')
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.username})
                    </option>
                  ))}
              </select>
              {vaultCreds.length === 0 && (
                <div className="modal-hint">No vault credentials yet — add one in the Vault tab first.</div>
              )}
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

function Field({ label, error, children }) {
  return (
    <div className="modal-field">
      <div className="modal-label">{label}</div>
      {children}
      {error && <div className="modal-field-error">{error}</div>}
    </div>
  );
}
