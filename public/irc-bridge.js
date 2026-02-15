#!/usr/bin/env node
/**
 * JustAChat IRC Bridge - TCP-to-HTTP proxy
 * Listens on port 6669 and proxies IRC client connections
 * to the irc-gateway Edge Function via HTTP POST + polling.
 *
 * Usage: node irc-bridge.js
 * PM2:   pm2 start irc-bridge.js --name irc-bridge
 *
 * VPS deploy:
 *   cp /var/www/justachat/public/irc-bridge.js /var/www/justachat/irc-bridge.js
 *   pm2 start /var/www/justachat/irc-bridge.js --name irc-bridge
 */

const net = require('net');
const http = require('http');
const https = require('https');

// ── Configuration ──────────────────────────────────────────
const IRC_PORT = 6669;
const GATEWAY_URL = 'https://justachat.net/functions/v1/irc-gateway';
const POLL_INTERVAL_MS = 2000;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Use the anon key for bridge requests (service key optional for admin ops)
const API_KEY = ANON_KEY || SERVICE_KEY;

// ── Helpers ────────────────────────────────────────────────
function postJSON(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'apikey': API_KEY,
        ...extraHeaders,
      },
    };

    const transport = parsed.protocol === 'https:' ? https : http;
    const req = transport.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Per-client handler ─────────────────────────────────────
function handleClient(socket) {
  const remoteAddr = socket.remoteAddress;
  console.log(`[BRIDGE] New IRC client from ${remoteAddr}`);

  const sessionId = `bridge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let authToken = null;
  let nick = null;
  let registered = false;
  let pollTimer = null;
  let alive = true;

  // Buffer for incomplete lines
  let lineBuffer = '';

  // Start polling for server->client messages
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      if (!alive) { clearInterval(pollTimer); return; }
      try {
        const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const res = await postJSON(GATEWAY_URL, {
          command: 'POLL',
          sessionId,
        }, headers);

        if (res.lines && res.lines.length > 0) {
          for (const line of res.lines) {
            if (alive) socket.write(line + '\r\n');
          }
        }
      } catch (err) {
        console.error(`[BRIDGE] Poll error for ${nick || sessionId}:`, err.message);
      }
    }, POLL_INTERVAL_MS);
  }

  // Send an IRC command to the gateway
  async function sendCommand(command, args) {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await postJSON(GATEWAY_URL, {
        command,
        args: args || '',
        sessionId,
        nick,
      }, headers);

      // PASS returns token/userId
      if (command === 'PASS' && res.token) {
        authToken = res.token;
        console.log(`[BRIDGE] Authenticated ${nick || 'user'} (session ${sessionId})`);
        // After auth, start polling
        startPolling();
        return;
      }

      if (res.error) {
        socket.write(`:jac.chat NOTICE * :${res.error}\r\n`);
        return;
      }

      // Send response lines to client
      if (res.lines && res.lines.length > 0) {
        for (const line of res.lines) {
          socket.write(line + '\r\n');
        }
      }

      // After NICK + USER are sent and we have auth, ensure polling is running
      if (command === 'USER' && authToken) {
        registered = true;
        startPolling();
      }
    } catch (err) {
      console.error(`[BRIDGE] Command error (${command}):`, err.message);
    }
  }

  // Parse incoming IRC data
  socket.on('data', (data) => {
    lineBuffer += data.toString();
    const lines = lineBuffer.split(/\r?\n/);
    // Keep incomplete last line in buffer
    lineBuffer = lines.pop() || '';

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      // Parse IRC command
      const spaceIdx = line.indexOf(' ');
      let command, args;
      if (spaceIdx === -1) {
        command = line.toUpperCase();
        args = '';
      } else {
        command = line.substring(0, spaceIdx).toUpperCase();
        args = line.substring(spaceIdx + 1);
      }

      console.log(`[BRIDGE] ${nick || remoteAddr} -> ${command} ${args ? args.substring(0, 80) : ''}`);

      // Handle locally: PING/PONG for keepalive
      if (command === 'PONG') {
        // Client responding to our PING - just ignore
        continue;
      }
      if (command === 'PING') {
        // Respond with PONG
        const token = args.startsWith(':') ? args : `:${args}`;
        socket.write(`PONG ${token}\r\n`);
        continue;
      }

      // Track NICK locally
      if (command === 'NICK') {
        nick = args.replace(/^:/, '').trim();
      }

      // CAP negotiation - handle minimally
      if (command === 'CAP') {
        const subCmd = args.split(' ')[0]?.toUpperCase();
        if (subCmd === 'LS') {
          socket.write(':jac.chat CAP * LS :\r\n');
          continue;
        }
        if (subCmd === 'END') {
          continue;
        }
        if (subCmd === 'REQ') {
          socket.write(':jac.chat CAP * NAK :' + args.split(' ').slice(1).join(' ') + '\r\n');
          continue;
        }
        continue;
      }

      // QUIT - clean up
      if (command === 'QUIT') {
        sendCommand('QUIT', args).finally(() => {
          alive = false;
          if (pollTimer) clearInterval(pollTimer);
          socket.end();
        });
        continue;
      }

      // Forward everything else to gateway
      sendCommand(command, args);
    }
  });

  socket.on('close', () => {
    console.log(`[BRIDGE] Client disconnected: ${nick || remoteAddr}`);
    alive = false;
    if (pollTimer) clearInterval(pollTimer);
    // Notify gateway of disconnect
    sendCommand('QUIT', ':Connection closed').catch(() => {});
  });

  socket.on('error', (err) => {
    console.error(`[BRIDGE] Socket error for ${nick || remoteAddr}:`, err.message);
    alive = false;
    if (pollTimer) clearInterval(pollTimer);
  });

  // Send initial notice
  socket.write(':jac.chat NOTICE * :*** Welcome to JACNet IRC Bridge\r\n');
  socket.write(':jac.chat NOTICE * :*** Use PASS email:password to authenticate\r\n');
  socket.write(':jac.chat NOTICE * :*** Or use NickServ IDENTIFY after connecting\r\n');
}

// ── Start TCP server ───────────────────────────────────────
const server = net.createServer(handleClient);

server.listen(IRC_PORT, '0.0.0.0', () => {
  console.log(`[BRIDGE] JustAChat IRC Bridge listening on port ${IRC_PORT}`);
  console.log(`[BRIDGE] Gateway: ${GATEWAY_URL}`);
  console.log(`[BRIDGE] API key configured: ${API_KEY ? 'yes' : 'NO - set SUPABASE_ANON_KEY env var'}`);
});

server.on('error', (err) => {
  console.error(`[BRIDGE] Server error:`, err.message);
  process.exit(1);
});
