/**
 * JAC IRC Proxy - WebSocket to TCP/TLS Bridge
 * Features: Admin API, Rate Limiting, Persistent Bans
 * 
 * Environment Variables:
 *   WS_URL            - WebSocket gateway URL
 *   HOST              - Host to bind (default: 127.0.0.1)
 *   PORT              - IRC port (default: 6667)
 *   SSL_ENABLED       - Enable SSL/TLS (default: false)
 *   SSL_PORT          - SSL port (default: 6697)
 *   SSL_CERT          - Path to SSL certificate
 *   SSL_KEY           - Path to SSL private key
 *   ADMIN_PORT        - Admin API port (default: 6680)
 *   ADMIN_TOKEN       - Admin API auth token
 *   LOG_LEVEL         - debug, info, warn, error (default: info)
 *   DATA_DIR          - Directory for persistent data (default: ./data)
 * 
 * Rate Limiting:
 *   RATE_CONN_PER_MIN   - Max connections per IP per minute (default: 5)
 *   RATE_MSG_PER_SEC    - Max messages per connection per second (default: 10)
 *   RATE_MSG_BURST      - Message burst allowance (default: 20)
 *   RATE_AUTO_BAN       - Auto-ban after N violations (default: 3, 0=disable)
 *   RATE_BAN_DURATION   - Auto-ban duration in minutes (default: 60)
 */

const net = require('net');
const tls = require('tls');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Load .env
try { require('dotenv').config(); } catch (e) {}

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
  logLevel: process.env.LOG_LEVEL || 'info',
  dataDir: process.env.DATA_DIR || './data',
  // Rate limiting
  rateConnPerMin: parseInt(process.env.RATE_CONN_PER_MIN || '5', 10),
  rateMsgPerSec: parseInt(process.env.RATE_MSG_PER_SEC || '10', 10),
  rateMsgBurst: parseInt(process.env.RATE_MSG_BURST || '20', 10),
  rateAutoBan: parseInt(process.env.RATE_AUTO_BAN || '3', 10),
  rateBanDuration: parseInt(process.env.RATE_BAN_DURATION || '60', 10)
};

// Logging
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[config.logLevel] || 1;

function log(level, ...args) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}]`, ...args);
  }
}

// ============================================
// Persistent Storage
// ============================================

class PersistentStorage {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.bansFile = path.join(dataDir, 'bans.json');
    this.ensureDataDir();
  }
  
  ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        log('info', `[STORAGE] Created data directory: ${this.dataDir}`);
      }
    } catch (err) {
      log('error', `[STORAGE] Failed to create data directory:`, err.message);
    }
  }
  
  loadBans() {
    try {
      if (fs.existsSync(this.bansFile)) {
        const data = fs.readFileSync(this.bansFile, 'utf8');
        const bans = JSON.parse(data);
        log('info', `[STORAGE] Loaded ${Object.keys(bans).length} bans from disk`);
        return bans;
      }
    } catch (err) {
      log('error', `[STORAGE] Failed to load bans:`, err.message);
    }
    return {};
  }
  
  saveBans(bans) {
    try {
      const data = JSON.stringify(bans, null, 2);
      fs.writeFileSync(this.bansFile, data, 'utf8');
      log('debug', `[STORAGE] Saved ${Object.keys(bans).length} bans to disk`);
      return true;
    } catch (err) {
      log('error', `[STORAGE] Failed to save bans:`, err.message);
      return false;
    }
  }
}

const storage = new PersistentStorage(config.dataDir);

// ============================================
// Rate Limiting
// ============================================

class RateLimiter {
  constructor() {
    this.connectionAttempts = new Map();
    this.messageTokens = new Map();
    this.violations = new Map();
    setInterval(() => this.cleanup(), 60000);
  }
  
  canConnect(ip) {
    const now = Date.now();
    const record = this.connectionAttempts.get(ip);
    
    if (!record || now > record.resetAt) {
      this.connectionAttempts.set(ip, { count: 1, resetAt: now + 60000 });
      return { allowed: true };
    }
    
    if (record.count >= config.rateConnPerMin) {
      this.recordViolation(ip, 'connection');
      return { 
        allowed: false, 
        reason: `Too many connections (${config.rateConnPerMin}/min)`,
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      };
    }
    
    record.count++;
    return { allowed: true };
  }
  
  initConnection(connId) {
    this.messageTokens.set(connId, {
      tokens: config.rateMsgBurst,
      lastRefill: Date.now()
    });
  }
  
  canSendMessage(connId, ip) {
    const now = Date.now();
    const bucket = this.messageTokens.get(connId);
    
    if (!bucket) {
      this.initConnection(connId);
      return { allowed: true };
    }
    
    const timePassed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(config.rateMsgBurst, bucket.tokens + timePassed * config.rateMsgPerSec);
    bucket.lastRefill = now;
    
    if (bucket.tokens < 1) {
      this.recordViolation(ip, 'message');
      return { allowed: false, reason: `Rate limited` };
    }
    
    bucket.tokens--;
    return { allowed: true };
  }
  
  recordViolation(ip, type) {
    const now = Date.now();
    const record = this.violations.get(ip) || { count: 0, lastViolation: 0 };
    
    if (now - record.lastViolation > 3600000) record.count = 0;
    
    record.count++;
    record.lastViolation = now;
    this.violations.set(ip, record);
    
    log('warn', `[RATE] Violation #${record.count} from ${ip}: ${type}`);
    
    if (config.rateAutoBan > 0 && record.count >= config.rateAutoBan) {
      return { shouldBan: true, violations: record.count };
    }
    return { shouldBan: false };
  }
  
  removeConnection(connId) {
    this.messageTokens.delete(connId);
  }
  
  getStats() {
    return {
      trackedIPs: this.connectionAttempts.size,
      activeConnections: this.messageTokens.size,
      violatingIPs: this.violations.size,
      config: {
        connPerMin: config.rateConnPerMin,
        msgPerSec: config.rateMsgPerSec,
        msgBurst: config.rateMsgBurst,
        autoBanThreshold: config.rateAutoBan,
        banDurationMin: config.rateBanDuration
      }
    };
  }
  
  getViolations() {
    return Array.from(this.violations.entries())
      .map(([ip, r]) => ({ ip, violations: r.count, lastViolation: new Date(r.lastViolation).toISOString() }))
      .sort((a, b) => b.violations - a.violations);
  }
  
  clearViolations(ip) {
    return this.violations.delete(ip);
  }
  
  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.connectionAttempts) {
      if (now > record.resetAt + 60000) this.connectionAttempts.delete(ip);
    }
    for (const [ip, record] of this.violations) {
      if (now - record.lastViolation > 7200000) this.violations.delete(ip);
    }
  }
}

const rateLimiter = new RateLimiter();

// ============================================
// Ban Management (Persistent)
// ============================================

let connectionCount = 0;
const activeConnections = new Map();
const startTime = Date.now();

// Load bans from disk
const bannedIPsData = storage.loadBans();
const bannedIPs = new Map(Object.entries(bannedIPsData));

// Save bans to disk (debounced)
let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const bansObj = Object.fromEntries(bannedIPs);
    storage.saveBans(bansObj);
  }, 1000);
}

function isIPBanned(ip) {
  const ban = bannedIPs.get(ip);
  if (!ban) return false;
  
  if (!ban.permanent && ban.expires && Date.now() > ban.expires) {
    bannedIPs.delete(ip);
    scheduleSave();
    log('info', `[BAN] Expired: ${ip}`);
    return false;
  }
  
  return true;
}

function banIP(ip, reason = 'Manual ban', durationMinutes = 0, kickExisting = true) {
  const ban = {
    reason,
    bannedAt: new Date().toISOString(),
    permanent: durationMinutes === 0,
    expires: durationMinutes > 0 ? Date.now() + (durationMinutes * 60000) : null
  };
  
  bannedIPs.set(ip, ban);
  scheduleSave();
  
  log('info', `[BAN] Added: ${ip} - ${reason} (${ban.permanent ? 'permanent' : durationMinutes + 'min'})`);
  
  if (kickExisting) {
    for (const [id, conn] of activeConnections) {
      if (conn.ip === ip) {
        conn.socket.write(`:server 465 * :Banned: ${reason}\r\n`);
        conn.socket.end();
      }
    }
  }
  
  return ban;
}

function unbanIP(ip) {
  const existed = bannedIPs.delete(ip);
  if (existed) {
    scheduleSave();
    log('info', `[BAN] Removed: ${ip}`);
  }
  return existed;
}

// Cleanup expired bans periodically
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [ip, ban] of bannedIPs) {
    if (!ban.permanent && ban.expires && now > ban.expires) {
      bannedIPs.delete(ip);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    scheduleSave();
    log('info', `[BAN] Cleaned ${cleaned} expired bans`);
  }
}, 300000); // Every 5 minutes

// ============================================
// Connection Handler
// ============================================

function handleConnection(socket, isSecure = false) {
  const clientIP = socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
  const clientPort = socket.remotePort;
  const connType = isSecure ? 'SSL' : 'TCP';
  
  if (isIPBanned(clientIP)) {
    const ban = bannedIPs.get(clientIP);
    log('warn', `[REJECT] Banned: ${clientIP}`);
    socket.end(`:server 465 * :Banned: ${ban?.reason || 'Banned'}\r\n`);
    return;
  }
  
  const connCheck = rateLimiter.canConnect(clientIP);
  if (!connCheck.allowed) {
    log('warn', `[REJECT] Rate limited: ${clientIP}`);
    socket.end(`:server 465 * :Rate limited. Try in ${connCheck.retryAfter}s\r\n`);
    const violation = rateLimiter.recordViolation(clientIP, 'rejected');
    if (violation.shouldBan) {
      banIP(clientIP, `Auto-ban: ${violation.violations} violations`, config.rateBanDuration, false);
    }
    return;
  }
  
  const connId = ++connectionCount;
  log('info', `[${connId}] ${connType} from ${clientIP}:${clientPort}`);
  
  rateLimiter.initConnection(connId);
  
  let ws = null;
  let buffer = '';
  let throttleWarnings = 0;
  
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
    messageCount: 0,
    throttledCount: 0
  };
  
  activeConnections.set(connId, conn);
  
  try {
    ws = new WebSocket(config.wsUrl);
    
    ws.on('open', () => log('info', `[${connId}] Gateway connected`));
    ws.on('message', (data) => {
      log('debug', `[${connId}] [GW->IRC]`, data.toString().trim());
      socket.write(data.toString());
    });
    ws.on('close', () => { log('info', `[${connId}] Gateway closed`); socket.end(); });
    ws.on('error', (err) => { log('error', `[${connId}] WS error:`, err.message); socket.end(); });
  } catch (err) {
    log('error', `[${connId}] Connect failed:`, err.message);
    socket.end();
    return;
  }
  
  socket.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\r\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const msgCheck = rateLimiter.canSendMessage(connId, clientIP);
      if (!msgCheck.allowed) {
        conn.throttledCount++;
        throttleWarnings++;
        if (throttleWarnings % 5 === 1) {
          socket.write(`:server NOTICE * :Slow down!\r\n`);
        }
        if (throttleWarnings >= 50) {
          const v = rateLimiter.recordViolation(clientIP, 'flooding');
          if (v.shouldBan) banIP(clientIP, 'Auto-ban: Flooding', config.rateBanDuration, true);
        }
        continue;
      }
      
      log('debug', `[${connId}] [IRC->GW]`, line);
      conn.messageCount++;
      
      if (line.startsWith('NICK ')) conn.nickname = line.substring(5).trim();
      else if (line.startsWith('USER ')) conn.username = line.split(' ')[1];
      else if (line.startsWith('PASS ')) conn.authenticated = true;
      
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(line);
    }
  });
  
  socket.on('close', () => {
    log('info', `[${connId}] Disconnected`);
    activeConnections.delete(connId);
    rateLimiter.removeConnection(connId);
    if (ws) ws.close();
  });
  
  socket.on('error', (err) => {
    log('error', `[${connId}] Error:`, err.message);
    activeConnections.delete(connId);
    rateLimiter.removeConnection(connId);
    if (ws) ws.close();
  });
}

// ============================================
// Admin HTTP API
// ============================================

const adminServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  const isAuthed = config.adminToken && token === config.adminToken;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Public status
  if (path === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      uptime: Math.floor((Date.now() - startTime) / 1000),
      connections: activeConnections.size,
      totalConnections: connectionCount,
      bannedIPs: bannedIPs.size,
      ssl: config.sslEnabled,
      rateLimit: rateLimiter.getStats()
    }));
    return;
  }
  
  if (!isAuthed) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  
  // Connections
  if (path === '/connections' && req.method === 'GET') {
    const conns = Array.from(activeConnections.values()).map(c => ({
      id: c.id, ip: c.ip, port: c.port, secure: c.secure,
      nickname: c.nickname, username: c.username, authenticated: c.authenticated,
      connected: c.connected.toISOString(), messageCount: c.messageCount,
      throttledCount: c.throttledCount,
      duration: Math.floor((Date.now() - c.connected.getTime()) / 1000)
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connections: conns }));
    return;
  }
  
  // Kick
  if (path.startsWith('/kick/') && req.method === 'POST') {
    const connId = parseInt(path.split('/')[2], 10);
    const conn = activeConnections.get(connId);
    if (conn) {
      conn.socket.write(`:server KILL ${conn.nickname || '*'} :Kicked\r\n`);
      conn.socket.end();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }
  
  // Bans
  if (path === '/bans' && req.method === 'GET') {
    const bans = Array.from(bannedIPs.entries()).map(([ip, ban]) => ({
      ip, reason: ban.reason, bannedAt: ban.bannedAt,
      permanent: ban.permanent,
      expires: ban.expires ? new Date(ban.expires).toISOString() : null
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ bans }));
    return;
  }
  
  // Ban
  if (path === '/ban' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip, reason, duration, kickExisting } = JSON.parse(body);
        if (!ip || !/^[\d.]+$/.test(ip)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Valid IP required' }));
          return;
        }
        const ban = banIP(ip, reason || 'Manual ban', duration || 0, kickExisting !== false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ban }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Unban
  if (path === '/unban' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip } = JSON.parse(body);
        if (unbanIP(ip)) {
          rateLimiter.clearViolations(ip);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not banned' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Violations
  if (path === '/violations' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ violations: rateLimiter.getViolations() }));
    return;
  }
  
  // Broadcast
  if (path === '/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        if (!message || message.length > 500) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Message required (max 500)' }));
          return;
        }
        const notice = `:server NOTICE * :${message.replace(/[\r\n]/g, ' ')}\r\n`;
        let sent = 0;
        for (const conn of activeConnections.values()) { conn.socket.write(notice); sent++; }
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

// ============================================
// Server Setup
// ============================================

const tcpServer = net.createServer((socket) => handleConnection(socket, false));

let tlsServer = null;
if (config.sslEnabled && config.sslCert && config.sslKey) {
  try {
    tlsServer = tls.createServer({
      cert: fs.readFileSync(config.sslCert),
      key: fs.readFileSync(config.sslKey),
    }, (socket) => handleConnection(socket, true));
  } catch (err) {
    log('error', 'SSL init failed:', err.message);
  }
}

function shutdown() {
  log('info', 'Shutting down...');
  
  // Save bans immediately
  const bansObj = Object.fromEntries(bannedIPs);
  storage.saveBans(bansObj);
  
  for (const conn of activeConnections.values()) {
    conn.socket.end(':server NOTICE * :Server shutting down\r\n');
  }
  tcpServer.close();
  if (tlsServer) tlsServer.close();
  adminServer.close();
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
console.log('\n' + '='.repeat(60));
console.log('JAC IRC Proxy');
console.log('='.repeat(60) + '\n');

console.log('Persistent Storage:');
console.log(`  Data directory: ${config.dataDir}`);
console.log(`  Loaded bans:    ${bannedIPs.size}`);
console.log('');

console.log('Rate Limiting:');
console.log(`  Connections: ${config.rateConnPerMin}/min per IP`);
console.log(`  Messages:    ${config.rateMsgPerSec}/sec (burst: ${config.rateMsgBurst})`);
console.log(`  Auto-ban:    ${config.rateAutoBan > 0 ? `After ${config.rateAutoBan} violations (${config.rateBanDuration}min)` : 'Disabled'}`);
console.log('');

tcpServer.listen(config.port, config.host, () => log('info', `TCP: ${config.host}:${config.port}`));
if (tlsServer) tlsServer.listen(config.sslPort, config.host, () => log('info', `SSL: ${config.host}:${config.sslPort}`));
adminServer.listen(config.adminPort, config.host, () => log('info', `Admin: ${config.host}:${config.adminPort}`));

console.log('\nWaiting for connections...\n');

tcpServer.on('error', (err) => { log('error', 'TCP:', err.message); process.exit(1); });
