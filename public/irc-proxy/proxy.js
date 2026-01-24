/**
 * JAC IRC Proxy - WebSocket to TCP/TLS Bridge with Admin API
 * 
 * Environment Variables:
 *   WS_URL       - WebSocket gateway URL
 *   HOST         - Host to bind to (default: 127.0.0.1)
 *   PORT         - IRC port (default: 6667)
 *   SSL_ENABLED  - Enable SSL/TLS (default: false)
 *   SSL_PORT     - SSL port (default: 6697)
 *   SSL_CERT     - Path to SSL certificate
 *   SSL_KEY      - Path to SSL private key
 *   ADMIN_PORT   - Admin API port (default: 6680)
 *   ADMIN_TOKEN  - Admin API auth token (required for admin access)
 *   LOG_LEVEL    - debug, info, warn, error (default: info)
 */

const net = require('net');
const tls = require('tls');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

// Load .env file if present
try {
  require('dotenv').config();
} catch (e) {}

// Configuration
const config = {
  wsUrl: process.env.WS_URL || 'wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway',
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '6667', 10),
  sslEnabled: process.env.SSL_ENABLED === 'true',
  sslPort: parseInt(process.env.SSL_PORT || '6697', 10),
  sslCert: process.env.SSL_CERT || '',
  sslKey: process.env.SSL_KEY || '',
  adminPort: parseInt(process.env.ADMIN_PORT || '6680', 10),
  adminToken: process.env.ADMIN_TOKEN || '',
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Logging
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[config.logLevel] || 1;

function log(level, ...args) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
  }
}

// Connection tracking
let connectionCount = 0;
const activeConnections = new Map();
const bannedIPs = new Set();
const startTime = Date.now();

// Connection handler
function handleConnection(socket, isSecure = false) {
  const connId = ++connectionCount;
  const clientIP = socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
  const clientPort = socket.remotePort;
  const connType = isSecure ? 'SSL' : 'TCP';
  
  // Check if IP is banned
  if (bannedIPs.has(clientIP)) {
    log('warn', `[${connId}] Rejected banned IP: ${clientIP}`);
    socket.end(':server 465 * :You are banned from this server\r\n');
    return;
  }
  
  log('info', `[${connId}] New ${connType} client from ${clientIP}:${clientPort}`);
  
  let ws = null;
  let buffer = '';
  let nickname = null;
  let username = null;
  let authenticated = false;
  
  const conn = {
    id: connId,
    socket,
    ip: clientIP,
    port: clientPort,
    secure: isSecure,
    connected: new Date(),
    nickname: null,
    username: null,
    authenticated: false,
    messageCount: 0
  };
  
  activeConnections.set(connId, conn);
  
  // Connect to JAC WebSocket
  try {
    ws = new WebSocket(config.wsUrl);
    
    ws.on('open', () => {
      log('info', `[${connId}] Connected to JAC gateway`);
    });
    
    ws.on('message', (data) => {
      const message = data.toString();
      log('debug', `[${connId}] [JAC->IRC]`, message.trim());
      socket.write(message);
    });
    
    ws.on('close', () => {
      log('info', `[${connId}] JAC connection closed`);
      socket.end();
    });
    
    ws.on('error', (err) => {
      log('error', `[${connId}] WebSocket error:`, err.message);
      socket.end();
    });
  } catch (err) {
    log('error', `[${connId}] Failed to connect:`, err.message);
    socket.end();
    return;
  }
  
  socket.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\r\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      log('debug', `[${connId}] [IRC->JAC]`, line);
      conn.messageCount++;
      
      // Parse commands for tracking
      if (line.startsWith('NICK ')) {
        conn.nickname = line.substring(5).trim();
      } else if (line.startsWith('USER ')) {
        const parts = line.split(' ');
        conn.username = parts[1];
      } else if (line.startsWith('PASS ')) {
        conn.authenticated = true;
      }
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(line);
      }
    }
  });
  
  socket.on('close', () => {
    log('info', `[${connId}] Client disconnected`);
    activeConnections.delete(connId);
    if (ws) ws.close();
  });
  
  socket.on('error', (err) => {
    log('error', `[${connId}] Socket error:`, err.message);
    activeConnections.delete(connId);
    if (ws) ws.close();
  });
}

// Admin HTTP API
const adminServer = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Auth check (skip for status endpoint)
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const isAuthed = config.adminToken && token === config.adminToken;
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Public status endpoint
  if (path === '/status' && req.method === 'GET') {
    const status = {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      connections: activeConnections.size,
      totalConnections: connectionCount,
      bannedIPs: bannedIPs.size,
      ssl: config.sslEnabled
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return;
  }
  
  // Protected endpoints require auth
  if (!isAuthed) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  
  // List connections
  if (path === '/connections' && req.method === 'GET') {
    const conns = Array.from(activeConnections.values()).map(c => ({
      id: c.id,
      ip: c.ip,
      port: c.port,
      secure: c.secure,
      nickname: c.nickname,
      username: c.username,
      authenticated: c.authenticated,
      connected: c.connected.toISOString(),
      messageCount: c.messageCount,
      duration: Math.floor((Date.now() - c.connected.getTime()) / 1000)
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connections: conns }));
    return;
  }
  
  // Kick connection
  if (path.startsWith('/kick/') && req.method === 'POST') {
    const connId = parseInt(path.split('/')[2], 10);
    const conn = activeConnections.get(connId);
    
    if (conn) {
      log('info', `[ADMIN] Kicking connection ${connId}`);
      conn.socket.write(':server KILL ' + (conn.nickname || '*') + ' :Kicked by administrator\r\n');
      conn.socket.end();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Kicked connection ${connId}` }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Connection not found' }));
    }
    return;
  }
  
  // List banned IPs
  if (path === '/bans' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ bans: Array.from(bannedIPs) }));
    return;
  }
  
  // Ban IP
  if (path === '/ban' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip, kickExisting } = JSON.parse(body);
        if (!ip) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'IP required' }));
          return;
        }
        
        bannedIPs.add(ip);
        log('info', `[ADMIN] Banned IP: ${ip}`);
        
        // Optionally kick existing connections from this IP
        if (kickExisting) {
          for (const [id, conn] of activeConnections) {
            if (conn.ip === ip) {
              conn.socket.write(':server 465 * :You have been banned\r\n');
              conn.socket.end();
            }
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Banned ${ip}` }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Unban IP
  if (path === '/unban' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip } = JSON.parse(body);
        if (bannedIPs.delete(ip)) {
          log('info', `[ADMIN] Unbanned IP: ${ip}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: `Unbanned ${ip}` }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'IP not in ban list' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Broadcast message to all connections
  if (path === '/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message required' }));
          return;
        }
        
        const notice = `:server NOTICE * :${message}\r\n`;
        let sent = 0;
        for (const conn of activeConnections.values()) {
          conn.socket.write(notice);
          sent++;
        }
        
        log('info', `[ADMIN] Broadcast to ${sent} connections: ${message}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, sent }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Create servers
const tcpServer = net.createServer((socket) => handleConnection(socket, false));

let tlsServer = null;
if (config.sslEnabled && config.sslCert && config.sslKey) {
  try {
    tlsServer = tls.createServer({
      cert: fs.readFileSync(config.sslCert),
      key: fs.readFileSync(config.sslKey),
    }, (socket) => handleConnection(socket, true));
  } catch (err) {
    log('error', 'Failed to init SSL:', err.message);
  }
}

// Graceful shutdown
function shutdown() {
  log('info', 'Shutting down...');
  for (const conn of activeConnections.values()) {
    conn.socket.end();
  }
  tcpServer.close();
  if (tlsServer) tlsServer.close();
  adminServer.close();
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start servers
console.log('\n' + '='.repeat(60));
console.log('JAC IRC Proxy with Admin API');
console.log('='.repeat(60) + '\n');

tcpServer.listen(config.port, config.host, () => {
  log('info', `TCP server on ${config.host}:${config.port}`);
});

if (tlsServer) {
  tlsServer.listen(config.sslPort, config.host, () => {
    log('info', `SSL server on ${config.host}:${config.sslPort}`);
  });
}

adminServer.listen(config.adminPort, config.host, () => {
  log('info', `Admin API on ${config.host}:${config.adminPort}`);
  if (!config.adminToken) {
    log('warn', 'ADMIN_TOKEN not set - admin endpoints disabled');
  }
});

console.log('\nAdmin API Endpoints:');
console.log(`  GET  /status       - Public status`);
console.log(`  GET  /connections  - List connections (auth required)`);
console.log(`  POST /kick/:id     - Kick connection (auth required)`);
console.log(`  GET  /bans         - List banned IPs (auth required)`);
console.log(`  POST /ban          - Ban IP (auth required)`);
console.log(`  POST /unban        - Unban IP (auth required)`);
console.log(`  POST /broadcast    - Send notice to all (auth required)`);
console.log('\nWaiting for connections...\n');

tcpServer.on('error', (err) => {
  log('error', 'TCP error:', err.message);
  process.exit(1);
});
