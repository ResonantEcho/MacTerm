/**
 * vncManager.js — Main process VNC session manager
 *
 * VNC uses the RFB protocol over TCP. noVNC (in the renderer) speaks
 * WebSocket, not raw TCP. So for each VNC session we spin up a
 * websockify proxy (Node.js) that bridges:
 *
 *   noVNC (WebSocket) ←→ websockify ←→ VNC server (TCP:5900)
 *
 * We use the `websockify` npm package which is a pure-JS implementation,
 * so no external binaries are required.
 *
 * Session lifecycle:
 *   vnc:start   → start proxy → return ws URL
 *   vnc:stop    → kill proxy
 */

const net  = require('net');

// Map of sessionId → { wsPort, server }
const sessions = new Map();

/**
 * Start a websockify proxy for the given VNC target.
 * Returns { success, wsUrl, wsPort } or { success: false, error }.
 */
async function start(sessionId, host, port, password) {
  // If already running, return existing URL
  if (sessions.has(sessionId)) {
    const s = sessions.get(sessionId);
    return { success: true, wsUrl: `ws://localhost:${s.wsPort}`, wsPort: s.wsPort };
  }

  try {
    const wsPort = await findFreePort(59000, 59099);
    const server = await startProxy(wsPort, host, port);
    sessions.set(sessionId, { wsPort, server, host, port });
    return { success: true, wsUrl: `ws://localhost:${wsPort}`, wsPort };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Stop a VNC proxy session. */
function stop(sessionId) {
  const session = sessions.get(sessionId);
  if (session?.server) {
    try { session.server.close(); } catch (_) {}
    sessions.delete(sessionId);
  }
}

/** Stop all sessions (called on app quit). */
function stopAll() {
  for (const sessionId of sessions.keys()) stop(sessionId);
}

// ─── WebSocket → TCP proxy ─────────────────────────────────────────────────────

function startProxy(wsPort, targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    // Pure Node.js WebSocket-to-TCP bridge
    // We implement a minimal websockify without external deps
    const http = require('http');
    const { WebSocketServer } = tryRequireWs();

    if (!WebSocketServer) {
      return reject(new Error(
        'ws package not found. Run: npm install ws'
      ));
    }

    const httpServer = http.createServer();
    const wss = new WebSocketServer({ server: httpServer });

    wss.on('connection', (ws) => {
      const tcpSocket = net.createConnection(targetPort, targetHost);
      let open = false;

      tcpSocket.on('connect', () => {
        open = true;
      });

      // TCP → WebSocket
      tcpSocket.on('data', (data) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data, { binary: true });
        }
      });

      tcpSocket.on('end',   () => ws.close());
      tcpSocket.on('error', (err) => { ws.close(); });

      // WebSocket → TCP
      ws.on('message', (data) => {
        if (tcpSocket.writable) {
          tcpSocket.write(Buffer.isBuffer(data) ? data : Buffer.from(data));
        }
      });

      ws.on('close', () => { tcpSocket.destroy(); });
      ws.on('error', () => { tcpSocket.destroy(); });
    });

    httpServer.listen(wsPort, '127.0.0.1', () => {
      resolve(httpServer);
    });

    httpServer.on('error', reject);
  });
}

function tryRequireWs() {
  try { return require('ws'); } catch (_) { return {}; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findFreePort(start, end) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      if (port > end) return reject(new Error('No free port found in range'));
      const server = net.createServer();
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(port));
      });
      server.on('error', () => tryPort(port + 1));
    };
    tryPort(start);
  });
}

module.exports = { start, stop, stopAll };
