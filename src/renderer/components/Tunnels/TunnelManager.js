/**
 * TunnelManager.js
 *
 * Manages SSH port-forward tunnels within an active SSH session.
 * Supports:
 *   Local forward  — localhost:localPort → remoteHost:remotePort
 *   Remote forward — remoteHost:remotePort → localhost:localPort
 *
 * Tunnels are opened via the ssh2 session already connected for this tab.
 */

import React, { useState, useEffect } from 'react';
import './TunnelManager.css';

const EMPTY_TUNNEL = {
  type: 'local',
  localPort: '',
  remoteHost: 'localhost',
  remotePort: '',
  label: '',
};

export default function TunnelManager({ sessionId, connected }) {
  const [tunnels,    setTunnels]    = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ ...EMPTY_TUNNEL });
  const [errors,     setErrors]     = useState({});

  // Load saved tunnels for this session from localStorage
  useEffect(() => {
    const key = `tunnels:${sessionId}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setTunnels(saved);
    } catch (_) {}
  }, [sessionId]);

  const saveTunnels = (next) => {
    setTunnels(next);
    localStorage.setItem(`tunnels:${sessionId}`, JSON.stringify(next));
  };

  const validate = () => {
    const e = {};
    if (!form.localPort)  e.localPort  = 'Required';
    if (!form.remotePort) e.remotePort = 'Required';
    if (!form.remoteHost) e.remoteHost = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    const tunnel = { ...form, id: Date.now().toString(), status: 'inactive' };

    if (connected) {
      const result = await window.macterm.ssh.openTunnel(sessionId, tunnel);
      tunnel.status = result.success ? 'active' : 'error';
      tunnel.error  = result.error;
    }

    saveTunnels([...tunnels, tunnel]);
    setShowForm(false);
    setForm({ ...EMPTY_TUNNEL });
    setErrors({});
  };

  const handleToggle = async (tunnel) => {
    if (!connected) return;

    if (tunnel.status === 'active') {
      await window.macterm.ssh.closeTunnel(sessionId, tunnel.id);
      saveTunnels(tunnels.map(t => t.id === tunnel.id ? { ...t, status: 'inactive' } : t));
    } else {
      const result = await window.macterm.ssh.openTunnel(sessionId, tunnel);
      saveTunnels(tunnels.map(t =>
        t.id === tunnel.id
          ? { ...t, status: result.success ? 'active' : 'error', error: result.error }
          : t
      ));
    }
  };

  const handleDelete = (id) => {
    window.macterm.ssh.closeTunnel(sessionId, id).catch(() => {});
    saveTunnels(tunnels.filter(t => t.id !== id));
  };

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); };

  return (
    <div className="tunnel-manager">
      <div className="tunnel-header">
        <span className="tunnel-title">SSH Tunnels</span>
        <button
          className="tunnel-add-btn"
          onClick={() => setShowForm(v => !v)}
          disabled={!connected}
          title={connected ? 'Add tunnel' : 'Connect SSH first'}
        >+</button>
      </div>

      {!connected && (
        <div className="tunnel-note">Connect SSH session to manage tunnels.</div>
      )}

      {tunnels.length === 0 && connected && !showForm && (
        <div className="tunnel-note">No tunnels configured. Click + to add one.</div>
      )}

      {/* Tunnel list */}
      <div className="tunnel-list">
        {tunnels.map(tunnel => (
          <div key={tunnel.id} className={`tunnel-item tunnel-${tunnel.status}`}>
            <div className="tunnel-item-top">
              <span className={`tunnel-status-dot dot-${tunnel.status}`} />
              <span className="tunnel-item-label">
                {tunnel.label || `${tunnel.type === 'local' ? 'L' : 'R'}:${tunnel.localPort}`}
              </span>
              <span className="tunnel-item-type">{tunnel.type}</span>
              <div className="tunnel-item-actions">
                <button
                  className="tunnel-action-btn"
                  onClick={() => handleToggle(tunnel)}
                  disabled={!connected}
                  title={tunnel.status === 'active' ? 'Stop tunnel' : 'Start tunnel'}
                >
                  {tunnel.status === 'active' ? '⏹' : '▶'}
                </button>
                <button
                  className="tunnel-action-btn tunnel-action-danger"
                  onClick={() => handleDelete(tunnel.id)}
                  title="Delete tunnel"
                >✕</button>
              </div>
            </div>
            <div className="tunnel-item-detail">
              localhost:{tunnel.localPort} → {tunnel.remoteHost}:{tunnel.remotePort}
            </div>
            {tunnel.error && (
              <div className="tunnel-item-error">{tunnel.error}</div>
            )}
          </div>
        ))}
      </div>

      {/* Add tunnel form */}
      {showForm && (
        <div className="tunnel-form">
          <div className="tunnel-form-row">
            <label className="tunnel-form-label">Type</label>
            <select className="tunnel-input" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="local">Local (L)</option>
              <option value="remote">Remote (R)</option>
            </select>
          </div>
          <div className="tunnel-form-row">
            <label className="tunnel-form-label">Label (optional)</label>
            <input className="tunnel-input" value={form.label}
              placeholder="e.g. DB forward"
              onChange={e => set('label', e.target.value)} />
          </div>
          <div className="tunnel-form-2col">
            <div className="tunnel-form-row">
              <label className="tunnel-form-label">Local port {errors.localPort && <span className="tunnel-err">{errors.localPort}</span>}</label>
              <input className={`tunnel-input ${errors.localPort ? 'tunnel-input-err' : ''}`}
                type="number" value={form.localPort} placeholder="5432"
                onChange={e => set('localPort', e.target.value)} />
            </div>
            <div className="tunnel-form-row">
              <label className="tunnel-form-label">Remote port {errors.remotePort && <span className="tunnel-err">{errors.remotePort}</span>}</label>
              <input className={`tunnel-input ${errors.remotePort ? 'tunnel-input-err' : ''}`}
                type="number" value={form.remotePort} placeholder="5432"
                onChange={e => set('remotePort', e.target.value)} />
            </div>
          </div>
          <div className="tunnel-form-row">
            <label className="tunnel-form-label">Remote host {errors.remoteHost && <span className="tunnel-err">{errors.remoteHost}</span>}</label>
            <input className={`tunnel-input ${errors.remoteHost ? 'tunnel-input-err' : ''}`}
              value={form.remoteHost} placeholder="localhost"
              onChange={e => set('remoteHost', e.target.value)} />
          </div>
          <div className="tunnel-form-actions">
            <button className="tunnel-btn-cancel" onClick={() => { setShowForm(false); setErrors({}); }}>Cancel</button>
            <button className="tunnel-btn-add" onClick={handleAdd}>Add Tunnel</button>
          </div>
        </div>
      )}
    </div>
  );
}
