/**
 * importExport.js — Main process profile import/export
 *
 * Supports:
 *   Export: MacTerm JSON format
 *   Import: MacTerm JSON, MobaXterm .mobalink (XML), basic CSV
 */

const fs   = require('fs');
const path = require('path');

// ── Export ─────────────────────────────────────────────────────────────────────

/**
 * Export profiles to a JSON file chosen by the user.
 * Returns { success, filePath } or { success: false, error }.
 */
async function exportProfiles(profiles, mainWindow) {
  const { dialog } = require('electron');
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    title:       'Export Connections',
    defaultPath: `macterm-connections-${datestamp()}.json`,
    filters:     [{ name: 'JSON', extensions: ['json'] }],
  });

  if (canceled || !filePath) return { success: false, error: 'Cancelled' };

  const payload = {
    version:    4,
    exportedAt: new Date().toISOString(),
    app:        'MacTerm',
    profiles:   profiles.map(sanitiseForExport),
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return { success: true, filePath, count: profiles.length };
}

// ── Import ─────────────────────────────────────────────────────────────────────

/**
 * Show a file picker and import profiles from the chosen file.
 * Returns { success, profiles, format, count } or { success: false, error }.
 */
async function importProfiles(mainWindow) {
  const { dialog } = require('electron');
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    title:      'Import Connections',
    properties: ['openFile'],
    filters: [
      { name: 'All Supported',    extensions: ['json', 'mobalink', 'csv'] },
      { name: 'MacTerm JSON',     extensions: ['json'] },
      { name: 'MobaXterm Link',   extensions: ['mobalink'] },
      { name: 'CSV',              extensions: ['csv'] },
    ],
  });

  if (canceled || !filePaths.length) return { success: false, error: 'Cancelled' };

  const filePath = filePaths[0];
  const ext      = path.extname(filePath).toLowerCase();

  try {
    let profiles;
    let format;

    if (ext === '.json') {
      ({ profiles, format } = parseJson(filePath));
    } else if (ext === '.mobalink') {
      ({ profiles, format } = parseMobalink(filePath));
    } else if (ext === '.csv') {
      ({ profiles, format } = parseCsv(filePath));
    } else {
      return { success: false, error: `Unsupported file type: ${ext}` };
    }

    // Assign fresh IDs so we never collide with existing profiles
    const stamped = profiles.map(p => ({
      ...p,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    }));

    return { success: true, profiles: stamped, format, count: stamped.length };
  } catch (err) {
    return { success: false, error: `Parse error: ${err.message}` };
  }
}

// ── Parsers ────────────────────────────────────────────────────────────────────

function parseJson(filePath) {
  const raw  = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // Support both MacTerm format and a plain array
  const list = Array.isArray(raw) ? raw : (raw.profiles || []);
  const profiles = list.map(p => ({
    name:     p.name     || p.label || 'Imported',
    group:    p.group    || 'Imported',
    protocol: normaliseProtocol(p.protocol),
    host:     p.host     || p.hostname || '',
    port:     p.port     || defaultPort(p.protocol),
    username: p.username || p.user || '',
    authType: p.authType || 'password',
    keyPath:  p.keyPath  || '',
  }));
  return { profiles, format: 'MacTerm JSON' };
}

/**
 * Parse MobaXterm .mobalink XML format.
 * MobaXterm stores sessions in an INI-like XML; we handle the common subset.
 */
function parseMobalink(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const profiles = [];

  // MobaXterm bookmark format: [Bookmarks]  SubRep= ImgNum= ...
  // Each session line: <Name>=<Type>|<Host>|<Port>|<User>|...
  const sessionRegex = /^([^=\[#][^=]*)=(\d+)\s*\|([^|]*)\|(\d*)\|([^|]*)/gm;
  let match;
  while ((match = sessionRegex.exec(raw)) !== null) {
    const [, name, typeNum, host, port, user] = match;
    const protocol = mobaTypeToProtocol(parseInt(typeNum));
    if (!protocol || !host.trim()) continue;
    profiles.push({
      name:     name.trim(),
      group:    'Imported from MobaXterm',
      protocol,
      host:     host.trim(),
      port:     parseInt(port) || defaultPort(protocol),
      username: user.trim(),
      authType: 'password',
      keyPath:  '',
    });
  }

  if (!profiles.length) {
    // Try a simpler single-connection format
    const hostMatch = raw.match(/Hostname=([^\s<]+)/i);
    const portMatch = raw.match(/Port=(\d+)/i);
    const userMatch = raw.match(/Username=([^\s<]+)/i);
    const typeMatch = raw.match(/Protocol=([^\s<]+)/i);
    if (hostMatch) {
      profiles.push({
        name:     path.basename(filePath, '.mobalink'),
        group:    'Imported from MobaXterm',
        protocol: normaliseProtocol(typeMatch?.[1] || 'SSH'),
        host:     hostMatch[1],
        port:     parseInt(portMatch?.[1]) || 22,
        username: userMatch?.[1] || '',
        authType: 'password',
        keyPath:  '',
      });
    }
  }

  return { profiles, format: 'MobaXterm' };
}

function parseCsv(filePath) {
  const lines    = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const headers  = lines[0].split(',').map(h => h.trim().toLowerCase());
  const profiles = lines.slice(1).map(line => {
    const values = line.split(',');
    const row    = Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()]));
    return {
      name:     row.name || row.label || row.host || 'Imported',
      group:    row.group || 'Imported',
      protocol: normaliseProtocol(row.protocol || row.type || 'SSH'),
      host:     row.host || row.hostname || row.ip || '',
      port:     parseInt(row.port) || 22,
      username: row.username || row.user || '',
      authType: row.authtype || 'password',
      keyPath:  row.keypath  || '',
    };
  }).filter(p => p.host);
  return { profiles, format: 'CSV' };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function sanitiseForExport(p) {
  // Never export passwords — export key paths only
  const { password, secret, ...safe } = p;
  return safe;
}

function normaliseProtocol(raw) {
  const p = (raw || '').toUpperCase().trim();
  if (p === 'SSH' || p === '0' || p === 'SECURE_SHELL') return 'SSH';
  if (p === 'RDP' || p === '4' || p === 'REMOTE_DESKTOP') return 'RDP';
  if (p === 'VNC' || p === '2') return 'VNC';
  if (p === 'SFTP' || p === '9') return 'SFTP';
  if (p === 'TELNET' || p === '1') return 'SSH'; // map to SSH
  return 'SSH';
}

function mobaTypeToProtocol(n) {
  // MobaXterm session type numbers
  const map = { 0: 'SSH', 1: 'SSH', 2: 'VNC', 3: 'RDP', 4: 'RDP', 9: 'SFTP' };
  return map[n] || null;
}

function defaultPort(protocol) {
  return { SSH: 22, RDP: 3389, VNC: 5900, SFTP: 22 }[(protocol || '').toUpperCase()] || 22;
}

function datestamp() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { exportProfiles, importProfiles };
