#!/usr/bin/env node
/**
 * JustAChat IRC Bridge - TCP-to-HTTP proxy
 * Listens on port 6669 and proxies IRC client connections
 * to the irc-gateway Edge Function via HTTP POST + polling.
 *
 * Usage: node irc-bridge.cjs
 * PM2:   pm2 start irc-bridge.cjs --name irc-bridge
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
  let user = null;
  let pollTimer = null;
  let alive = true;
  let authenticating = false; // true while PASS is in-flight
  let pendingQueue = [];      // commands queued while PASS is processing
  let pendingPass = null;     // stored PASS args, sent after NICK arrives

  let lineBuffer = '';

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

  async function sendCommand(command, args) {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await postJSON(GATEWAY_URL, {
        command,
        args: args || '',
        sessionId,
        nick,
      }, headers);

      if (command === 'PASS' && res.token) {
        authToken = res.token;
        authenticating = false;
        console.log(`[BRIDGE] Authenticated ${nick || 'user'} (session ${sessionId})`);
        startPolling();

        // Flush queued commands now that we have the token
        const queued = [...pendingQueue];
        pendingQueue = [];
        for (const q of queued) {
          await sendCommand(q.command, q.args);
        }
        return;
      }

      if (command === 'PASS' && res.error) {
        authenticating = false;
        socket.write(`:jac.chat NOTICE * :${res.error}\r\n`);
        // Flush queued commands without auth
        const queued = [...pendingQueue];
        pendingQueue = [];
        for (const q of queued) {
          await sendCommand(q.command, q.args);
        }
        return;
      }

      if (res.error) {
        socket.write(`:jac.chat NOTICE * :${res.error}\r\n`);
        return;
      }

      if (res.lines && res.lines.length > 0) {
        for (const line of res.lines) {
          socket.write(line + '\r\n');
        }
      }

      if (command === 'USER' && authToken) {
        startPolling();
      }
    } catch (err) {
      console.error(`[BRIDGE] Command error (${command}):`, err.message);
      if (command === 'PASS') {
        authenticating = false;
      }
    }
  }

  socket.on('data', (data) => {
    lineBuffer += data.toString();
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop() || '';

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

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

      // PONG - ignore
      if (command === 'PONG') continue;

      // PING - respond locally
      if (command === 'PING') {
        const tok = args.startsWith(':') ? args : `:${args}`;
        socket.write(`PONG ${tok}\r\n`);
        continue;
      }

      // Track NICK locally
      if (command === 'NICK') {
        nick = args.replace(/^:/, '').trim();
        // If we have a pending PASS, now send it with the nick
        if (pendingPass !== null) {
          authenticating = true;
          sendCommand('PASS', pendingPass);
          pendingPass = null;
          continue;
        }
      }

      // Track USER locally
      if (command === 'USER') {
        user = args;
      }

      // CAP negotiation
      if (command === 'CAP') {
        const subCmd = args.split(' ')[0]?.toUpperCase();
        if (subCmd === 'LS') {
          socket.write(':jac.chat CAP * LS :\r\n');
          continue;
        }
        if (subCmd === 'END') continue;
        if (subCmd === 'REQ') {
          socket.write(':jac.chat CAP * NAK :' + args.split(' ').slice(1).join(' ') + '\r\n');
          continue;
        }
        continue;
      }

      // QUIT
      if (command === 'QUIT') {
        sendCommand('QUIT', args).finally(() => {
          alive = false;
          if (pollTimer) clearInterval(pollTimer);
          socket.end();
        });
        continue;
      }

      // PASS — store it, wait for NICK to arrive so we can send nick with the request
      if (command === 'PASS') {
        if (nick) {
          // NICK already known, send immediately
          authenticating = true;
          sendCommand('PASS', args);
        } else {
          // Store and wait for NICK
          pendingPass = args;
        }
        continue;
      }

      // If we're waiting for PASS to complete, queue this command
      if (authenticating) {
        pendingQueue.push({ command, args });
        continue;
      }

      // Forward everything else
      sendCommand(command, args);
    }
  });

  socket.on('close', () => {
    console.log(`[BRIDGE] Client disconnected: ${nick || remoteAddr}`);
    alive = false;
    if (pollTimer) clearInterval(pollTimer);
    sendCommand('QUIT', ':Connection closed').catch(() => {});
  });

  socket.on('error', (err) => {
    console.error(`[BRIDGE] Socket error for ${nick || remoteAddr}:`, err.message);
    alive = false;
    if (pollTimer) clearInterval(pollTimer);
  });

  socket.write(':jac.chat NOTICE * :*** Welcome to JACNet IRC Bridge\r\n');
  socket.write(':jac.chat NOTICE * :*** Connecting...\r\n');
}

// ── Start TCP server ───────────────────────────────────────
const server = net.createServer(handleClient);

server.listen(IRC_PORT, '0.0.0.0', () => {
  console.log(`[BRIDGE] JustAChat IRC Bridge listening on port ${IRC_PORT}`);
  console.log(`[BRIDGE] Gateway: ${GATEWAY_URL}`);
  console.log(`[BRIDGE] API key configured: ${API_KEY ? 'yes' : 'NO'}`);
});

server.on('error', (err) => {
  console.error(`[BRIDGE] Server error:`, err.message);
  process.exit(1);
});
