import React, { useState, useMemo } from 'react';
import './Sidebar.css';

const PROTOCOL_COLORS = { SSH: 'dot-ssh', RDP: 'dot-rdp', VNC: 'dot-vnc' };
const PROTOCOL_BADGES = { SSH: 'badge-ssh', RDP: 'badge-rdp', VNC: 'badge-vnc' };

export default function Sidebar({
  profiles = [],
  activeProfileId,
  onOpenSession,
  onNewConnection,
  onDeleteProfile,
  onOpenVault,
}) {
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [contextMenu, setContextMenu] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.host?.toLowerCase().includes(q) ||
      p.group?.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      const g = p.group || 'Ungrouped';
      if (!map[g]) map[g] = [];
      map[g].push(p);
    });
    return map;
  }, [filtered]);

  const toggleGroup = (g) =>
    setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const handleContextMenu = (e, profile) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, profile });
  };

  const dismissContext = () => setContextMenu(null);

  return (
    <aside className="sidebar" onClick={dismissContext}>
      {/* macOS traffic lights spacer */}
      <div className="sidebar-titlebar-spacer" />

      <div className="sidebar-header">
        <span className="sidebar-title">Sessions</span>
        <button className="sidebar-add-btn" onClick={onNewConnection} title="New connection">+</button>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-list">
        {Object.entries(groups).map(([groupName, groupProfiles]) => (
          <div key={groupName} className="sidebar-group">
            <div className="group-label" onClick={() => toggleGroup(groupName)}>
              <span className="group-arrow">{collapsedGroups[groupName] ? '▶' : '▼'}</span>
              {groupName}
              <span className="group-count">{groupProfiles.length}</span>
            </div>

            {!collapsedGroups[groupName] && groupProfiles.map(profile => (
              <div
                key={profile.id}
                className={`conn-item ${profile.id === activeProfileId ? 'active' : ''}`}
                onClick={() => onOpenSession(profile)}
                onContextMenu={e => handleContextMenu(e, profile)}
              >
                <div className={`conn-dot ${PROTOCOL_COLORS[profile.protocol] || 'dot-ssh'}`} />
                <span className="conn-name">{profile.name}</span>
                <span className={`conn-badge ${PROTOCOL_BADGES[profile.protocol] || 'badge-ssh'}`}>
                  {profile.protocol}
                </span>
              </div>
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="sidebar-empty">
            {search ? 'No matches' : 'No connections yet'}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sf-btn" onClick={onOpenVault}>🔑 Vault</button>
        <button className="sf-btn" onClick={onNewConnection}>+ New</button>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="ctx-item" onClick={() => { onOpenSession(contextMenu.profile); dismissContext(); }}>
            Open Session
          </div>
          <div className="ctx-item ctx-danger" onClick={() => { onDeleteProfile(contextMenu.profile.id); dismissContext(); }}>
            Delete
          </div>
        </div>
      )}
    </aside>
  );
}
