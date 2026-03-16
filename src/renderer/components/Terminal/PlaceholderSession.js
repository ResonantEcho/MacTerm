import React from 'react';
import './PlaceholderSession.css';

const ICONS = { RDP: '🖥', VNC: '📺', default: '⚡' };
const COLORS = { RDP: 'var(--accent-blue)', VNC: 'var(--accent-amber)', default: 'var(--accent)' };
const PHASES = { RDP: 'Phase 3', VNC: 'Phase 3' };

export default function PlaceholderSession({ tab }) {
  const { protocol, label, profile } = tab;
  const icon = ICONS[protocol] || ICONS.default;
  const color = COLORS[protocol] || COLORS.default;
  const phase = PHASES[protocol] || 'upcoming';

  return (
    <div className="placeholder-session">
      <div className="placeholder-icon" style={{ color }}>{icon}</div>
      <div className="placeholder-title">{label}</div>
      <div className="placeholder-subtitle">
        {protocol} · {profile.host}:{profile.port}
      </div>
      <div className="placeholder-badge" style={{ borderColor: color, color }}>
        {phase} — coming soon
      </div>
      <p className="placeholder-note">
        SSH sessions are fully functional. {protocol} rendering will be<br />
        added in a future phase using {protocol === 'RDP' ? 'FreeRDP' : 'noVNC'}.
      </p>
    </div>
  );
}
