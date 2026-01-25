/**
 * JAC IRC Proxy - WebSocket to TCP/TLS Bridge
 * Features: Admin API, Rate Limiting, Persistent Bans, GeoIP Blocking, File Logging
 * 
 * Environment Variables:
 *   WS_URL              - WebSocket gateway URL
 *   HOST                - Host to bind (default: 127.0.0.1)
 *   PORT                - IRC port (default: 6667)
 *   SSL_ENABLED         - Enable SSL/TLS (default: false)
 *   SSL_PORT            - SSL port (default: 6697)
 *   SSL_CERT            - Path to SSL certificate
 *   SSL_KEY             - Path to SSL private key
 *   ADMIN_PORT          - Admin API port (default: 6680)
 *   ADMIN_TOKEN         - Admin API auth token
 *   LOG_LEVEL           - debug, info, warn, error (default: info)
 *   DATA_DIR            - Directory for persistent data (default: ./data)
 * 
 * File Logging:
 *   LOG_TO_FILE         - Enable file logging (default: true)
 *   LOG_DIR             - Log directory (default: ./logs)
 *   LOG_MAX_SIZE_MB     - Max log file size before rotation (default: 10)
 *   LOG_MAX_FILES       - Max rotated files to keep (default: 5)
 * 
 * Rate Limiting:
 *   RATE_CONN_PER_MIN   - Max connections per IP per minute (default: 5)
 *   RATE_MSG_PER_SEC    - Max messages per connection per second (default: 10)
 *   RATE_MSG_BURST      - Message burst allowance (default: 20)
 *   RATE_AUTO_BAN       - Auto-ban after N violations (default: 3, 0=disable)
 *   RATE_BAN_DURATION   - Auto-ban duration in minutes (default: 60)
 * 
 * GeoIP Blocking:
 *   GEOIP_ENABLED       - Enable GeoIP blocking (default: false)
 *   GEOIP_MODE          - 'block' or 'allow' (default: block)
 *   GEOIP_COUNTRIES     - Comma-separated country codes
 *   GEOIP_CACHE_TTL     - Cache TTL in minutes (default: 60)
 *   GEOIP_FAIL_OPEN     - Allow if lookup fails (default: true)
 */

// Version - update this when making changes
const PROXY_VERSION = '2.4.0';

const net = require('net');
const tls = require('tls');
const http = require('http');
const https = require('https');
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
  adminSslEnabled: process.env.ADMIN_SSL_ENABLED === 'true',
  adminToken: process.env.ADMIN_TOKEN || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  dataDir: process.env.DATA_DIR || './data',
  // File logging
  logToFile: process.env.LOG_TO_FILE !== 'false',
  logDir: process.env.LOG_DIR || './logs',
  logMaxSizeMB: parseInt(process.env.LOG_MAX_SIZE_MB || '10', 10),
  logMaxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10),
  // Rate limiting
  rateConnPerMin: parseInt(process.env.RATE_CONN_PER_MIN || '5', 10),
  rateMsgPerSec: parseInt(process.env.RATE_MSG_PER_SEC || '10', 10),
  rateMsgBurst: parseInt(process.env.RATE_MSG_BURST || '20', 10),
  rateAutoBan: parseInt(process.env.RATE_AUTO_BAN || '3', 10),
  rateBanDuration: parseInt(process.env.RATE_BAN_DURATION || '60', 10),
  // GeoIP
  geoipEnabled: process.env.GEOIP_ENABLED === 'true',
  geoipMode: process.env.GEOIP_MODE || 'block',
  geoipCountries: (process.env.GEOIP_COUNTRIES || '').split(',').map(c => c.trim().toUpperCase()).filter(Boolean),
  geoipCacheTTL: parseInt(process.env.GEOIP_CACHE_TTL || '60', 10),
  geoipFailOpen: process.env.GEOIP_FAIL_OPEN !== 'false'
};

// ============================================
// File Logger
// ============================================

class FileLogger {
  constructor(logDir, maxSizeMB, maxFiles) {
    this.logDir = logDir;
    this.maxSize = maxSizeMB * 1024 * 1024;
    this.maxFiles = maxFiles;
    this.streams = {};
    this.ensureLogDir();
  }
  
  ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      console.error(`[LOGGER] Failed to create log dir:`, err.message);
    }
  }
  
  getLogPath(type) {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }
  
  rotateIfNeeded(type) {
    const logPath = this.getLogPath(type);
    try {
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size >= this.maxSize) {
          // Rotate: rename current to .1, shift others
          for (let i = this.maxFiles - 1; i >= 1; i--) {
            const oldPath = `${logPath}.${i}`;
            const newPath = `${logPath}.${i + 1}`;
            if (fs.existsSync(oldPath)) {
              if (i === this.maxFiles - 1) {
                fs.unlinkSync(oldPath);
              } else {
                fs.renameSync(oldPath, newPath);
              }
            }
          }
          fs.renameSync(logPath, `${logPath}.1`);
          
          // Close and reopen stream
          if (this.streams[type]) {
            this.streams[type].end();
            delete this.streams[type];
          }
        }
      }
    } catch (err) {
      console.error(`[LOGGER] Rotation error:`, err.message);
    }
  }
  
  getStream(type) {
    if (!this.streams[type]) {
      this.rotateIfNeeded(type);
      const logPath = this.getLogPath(type);
      this.streams[type] = fs.createWriteStream(logPath, { flags: 'a' });
    }
    return this.streams[type];
  }
  
  write(type, message) {
    if (!config.logToFile) return;
    
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    
    try {
      const stream = this.getStream(type);
      stream.write(line);
    } catch (err) {
      console.error(`[LOGGER] Write error:`, err.message);
    }
  }
  
  // Specific log methods
  connection(action, connId, ip, details = {}) {
    const detailStr = Object.entries(details).map(([k, v]) => `${k}=${v}`).join(' ');
    this.write('connections', `[${action}] #${connId} ${ip} ${detailStr}`);
  }
  
  audit(action, ip, details = {}) {
    const detailStr = Object.entries(details).map(([k, v]) => `${k}=${v}`).join(' ');
    this.write('audit', `[${action}] ${ip} ${detailStr}`);
  }
  
  security(action, ip, reason, details = {}) {
    const detailStr = Object.entries(details).map(([k, v]) => `${k}=${v}`).join(' ');
    this.write('security', `[${action}] ${ip} ${reason} ${detailStr}`);
  }
  
  error(context, message, details = {}) {
    const detailStr = Object.entries(details).map(([k, v]) => `${k}=${v}`).join(' ');
    this.write('error', `[${context}] ${message} ${detailStr}`);
  }
  
  admin(action, details = {}) {
    const detailStr = Object.entries(details).map(([k, v]) => `${k}=${v}`).join(' ');
    this.write('admin', `[${action}] ${detailStr}`);
  }
  
  // Get recent log entries
  getRecentLogs(type, lines = 100) {
    try {
      const logPath = this.getLogPath(type);
      if (!fs.existsSync(logPath)) return [];
      
      const content = fs.readFileSync(logPath, 'utf8');
      const allLines = content.trim().split('\n');
      return allLines.slice(-lines);
    } catch (err) {
      return [];
    }
  }
  
  // Get log file stats
  getStats() {
    const stats = {};
    const types = ['connections', 'audit', 'security', 'error', 'admin'];
    
    for (const type of types) {
      const logPath = this.getLogPath(type);
      try {
        if (fs.existsSync(logPath)) {
          const fileStats = fs.statSync(logPath);
          stats[type] = {
            size: fileStats.size,
            sizeHuman: this.formatBytes(fileStats.size),
            modified: fileStats.mtime.toISOString()
          };
        } else {
          stats[type] = { size: 0, sizeHuman: '0 B', modified: null };
        }
      } catch (err) {
        stats[type] = { size: 0, sizeHuman: '0 B', modified: null, error: err.message };
      }
    }
    
    return stats;
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  close() {
    for (const stream of Object.values(this.streams)) {
      stream.end();
    }
    this.streams = {};
  }
}

const fileLogger = new FileLogger(config.logDir, config.logMaxSizeMB, config.logMaxFiles);

// Console logging
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[config.logLevel] || 1;

function log(level, ...args) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
  }
}

// ============================================
// GeoIP Lookup
// ============================================

class GeoIPLookup {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, blocked: 0, allowed: 0, errors: 0 };
    setInterval(() => this.cleanup(), 600000);
  }
  
  async lookup(ip) {
    const cached = this.cache.get(ip);
    if (cached && Date.now() < cached.expiry) {
      this.stats.hits++;
      return cached;
    }
    
    this.stats.misses++;
    
    try {
      const data = await this.fetchGeoData(ip);
      const result = {
        ip, countryCode: data.countryCode || 'XX', country: data.country || 'Unknown',
        city: data.city || 'Unknown', region: data.regionName || 'Unknown',
        isp: data.isp || 'Unknown', expiry: Date.now() + (config.geoipCacheTTL * 60000)
      };
      this.cache.set(ip, result);
      return result;
    } catch (err) {
      this.stats.errors++;
      fileLogger.error('GEOIP', `Lookup failed for ${ip}`, { error: err.message });
      return null;
    }
  }
  
  fetchGeoData(ip) {
    return new Promise((resolve, reject) => {
      http.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp`, 
        { timeout: 5000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              json.status === 'success' ? resolve(json) : reject(new Error(json.message));
            } catch (e) { reject(e); }
          });
        }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
  }
  
  async shouldAllow(ip) {
    if (!config.geoipEnabled || config.geoipCountries.length === 0) return { allowed: true };
    if (this.isPrivateIP(ip)) return { allowed: true, reason: 'Private IP' };
    
    const geo = await this.lookup(ip);
    
    if (!geo) {
      if (config.geoipFailOpen) return { allowed: true, reason: 'Lookup failed' };
      this.stats.blocked++;
      return { allowed: false, reason: 'Lookup failed', countryCode: 'XX' };
    }
    
    const isInList = config.geoipCountries.includes(geo.countryCode);
    
    if (config.geoipMode === 'block' ? isInList : !isInList) {
      this.stats.blocked++;
      return { allowed: false, reason: `Country ${config.geoipMode === 'block' ? 'blocked' : 'not allowed'}: ${geo.country}`,
        countryCode: geo.countryCode, country: geo.country, city: geo.city };
    }
    
    this.stats.allowed++;
    return { allowed: true, countryCode: geo.countryCode, country: geo.country, city: geo.city };
  }
  
  isPrivateIP(ip) {
    if (ip === '127.0.0.1' || ip === 'localhost') return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
    if (ip.startsWith('172.')) {
      const second = parseInt(ip.split('.')[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
    return false;
  }
  
  getStats() { return { ...this.stats, cacheSize: this.cache.size, mode: config.geoipMode, countries: config.geoipCountries, enabled: config.geoipEnabled }; }
  getCachedLocations() { return Array.from(this.cache.entries()).filter(([_, d]) => Date.now() < d.expiry).map(([ip, d]) => ({ ip, countryCode: d.countryCode, country: d.country, city: d.city })); }
  cleanup() { const now = Date.now(); for (const [ip, d] of this.cache) if (now >= d.expiry) this.cache.delete(ip); }
}

const geoip = new GeoIPLookup();

// ============================================
// Persistent Storage
// ============================================

class PersistentStorage {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.bansFile = path.join(dataDir, 'bans.json');
    try { if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
  }
  
  loadBans() {
    try {
      if (fs.existsSync(this.bansFile)) {
        const bans = JSON.parse(fs.readFileSync(this.bansFile, 'utf8'));
        log('info', `[STORAGE] Loaded ${Object.keys(bans).length} bans`);
        return bans;
      }
    } catch (err) { log('error', `[STORAGE] Load failed:`, err.message); }
    return {};
  }
  
  saveBans(bans) {
    try { fs.writeFileSync(this.bansFile, JSON.stringify(bans, null, 2), 'utf8'); return true; }
    catch (err) { log('error', `[STORAGE] Save failed:`, err.message); return false; }
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
  
  canConnect(ip, isAllowlisted = false) {
    // Allowlisted IPs bypass connection rate limiting
    if (isAllowlisted) return { allowed: true };
    
    const now = Date.now();
    const record = this.connectionAttempts.get(ip);
    if (!record || now > record.resetAt) {
      this.connectionAttempts.set(ip, { count: 1, resetAt: now + 60000 });
      return { allowed: true };
    }
    if (record.count >= config.rateConnPerMin) {
      // Don't record a violation here; the caller will record ONE violation for the rejected connection.
      // (Previously this double-counted and could auto-ban users after just a couple of retries.)
      return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
    }
    record.count++;
    return { allowed: true };
  }
  
  initConnection(connId) { this.messageTokens.set(connId, { tokens: config.rateMsgBurst, lastRefill: Date.now() }); }
  
  canSendMessage(connId, ip) {
    const now = Date.now();
    const bucket = this.messageTokens.get(connId);
    if (!bucket) { this.initConnection(connId); return { allowed: true }; }
    bucket.tokens = Math.min(config.rateMsgBurst, bucket.tokens + ((now - bucket.lastRefill) / 1000) * config.rateMsgPerSec);
    bucket.lastRefill = now;
    if (bucket.tokens < 1) { this.recordViolation(ip, 'message'); return { allowed: false }; }
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
    fileLogger.security('RATE_VIOLATION', ip, type, { count: record.count });
    return config.rateAutoBan > 0 && record.count >= config.rateAutoBan ? { shouldBan: true, violations: record.count } : { shouldBan: false };
  }
  
  removeConnection(connId) { this.messageTokens.delete(connId); }
  clearViolations(ip) { return this.violations.delete(ip); }
  getStats() { return { trackedIPs: this.connectionAttempts.size, activeConnections: this.messageTokens.size, violatingIPs: this.violations.size }; }
  getViolations() { return Array.from(this.violations.entries()).map(([ip, r]) => ({ ip, violations: r.count, lastViolation: new Date(r.lastViolation).toISOString() })).sort((a, b) => b.violations - a.violations); }
  cleanup() { const now = Date.now(); for (const [ip, r] of this.connectionAttempts) if (now > r.resetAt + 60000) this.connectionAttempts.delete(ip); for (const [ip, r] of this.violations) if (now - r.lastViolation > 7200000) this.violations.delete(ip); }
}

const rateLimiter = new RateLimiter();

// ============================================
// Allowlist Management (exempt from rate-limiting / auto-ban)
// ============================================

class AllowlistManager {
  constructor(dataDir) {
    this.allowlistFile = path.join(dataDir, 'allowlist.json');
    this.allowlist = new Map();
    this.load();
  }
  
  load() {
    try {
      if (fs.existsSync(this.allowlistFile)) {
        const data = JSON.parse(fs.readFileSync(this.allowlistFile, 'utf8'));
        this.allowlist = new Map(Object.entries(data));
        log('info', `[ALLOWLIST] Loaded ${this.allowlist.size} entries`);
      }
    } catch (err) {
      log('error', `[ALLOWLIST] Load failed: ${err.message}`);
    }
  }
  
  save() {
    try {
      fs.writeFileSync(this.allowlistFile, JSON.stringify(Object.fromEntries(this.allowlist), null, 2), 'utf8');
    } catch (err) {
      log('error', `[ALLOWLIST] Save failed: ${err.message}`);
    }
  }
  
  add(ip, label = 'Admin', addedBy = 'system') {
    this.allowlist.set(ip, { label, addedAt: new Date().toISOString(), addedBy });
    this.save();
    fileLogger.audit('ALLOWLIST_ADD', ip, { label, by: addedBy });
    log('info', `[ALLOWLIST] Added: ${ip} (${label})`);
    return true;
  }
  
  remove(ip, removedBy = 'system') {
    const existed = this.allowlist.delete(ip);
    if (existed) {
      this.save();
      fileLogger.audit('ALLOWLIST_REMOVE', ip, { by: removedBy });
      log('info', `[ALLOWLIST] Removed: ${ip}`);
    }
    return existed;
  }
  
  isAllowed(ip) {
    return this.allowlist.has(ip);
  }
  
  getAll() {
    return Array.from(this.allowlist.entries()).map(([ip, data]) => ({ ip, ...data }));
  }
}

const allowlistManager = new AllowlistManager(config.dataDir);

// ============================================
// Ban Management
// ============================================

let connectionCount = 0;
const activeConnections = new Map();
const startTime = Date.now();

// Reconnect telemetry
const reconnectStats = {
  totalReconnects: 0,
  successfulReconnects: 0,
  failedReconnects: 0,
  lastReconnectTime: null,
  lastCloseCode: null,
  lastCloseReason: null,
  reconnectsByConnection: new Map() // Track per-connection reconnect counts
};

const bannedIPsData = storage.loadBans();
const bannedIPs = new Map(Object.entries(bannedIPsData));

let saveTimeout = null;
function scheduleSave() { if (saveTimeout) clearTimeout(saveTimeout); saveTimeout = setTimeout(() => storage.saveBans(Object.fromEntries(bannedIPs)), 1000); }

function isIPBanned(ip) {
  // Allowlisted IPs are never banned
  if (allowlistManager.isAllowed(ip)) return false;
  const ban = bannedIPs.get(ip);
  if (!ban) return false;
  if (!ban.permanent && ban.expires && Date.now() > ban.expires) {
    bannedIPs.delete(ip); scheduleSave();
    fileLogger.audit('BAN_EXPIRED', ip);
    return false;
  }
  return true;
}

function banIP(ip, reason = 'Manual ban', durationMinutes = 0, kickExisting = true, adminIP = null) {
  const ban = { reason, bannedAt: new Date().toISOString(), permanent: durationMinutes === 0, expires: durationMinutes > 0 ? Date.now() + (durationMinutes * 60000) : null };
  bannedIPs.set(ip, ban); scheduleSave();
  log('info', `[BAN] ${ip} - ${reason}`);
  fileLogger.audit('BAN_ADD', ip, { reason, duration: durationMinutes || 'permanent', by: adminIP || 'system' });
  
  if (kickExisting) {
    for (const conn of activeConnections.values()) {
      if (conn.ip === ip) {
        conn.socket.write(`:server 465 * :Banned: ${reason}\r\n`);
        conn.socket.end();
        fileLogger.connection('KICKED', conn.id, ip, { reason: 'Banned' });
      }
    }
  }
  return ban;
}

function unbanIP(ip, adminIP = null) {
  const existed = bannedIPs.delete(ip);
  if (existed) { scheduleSave(); log('info', `[BAN] Removed: ${ip}`); fileLogger.audit('BAN_REMOVE', ip, { by: adminIP || 'admin' }); }
  return existed;
}

setInterval(() => { const now = Date.now(); let cleaned = 0; for (const [ip, ban] of bannedIPs) if (!ban.permanent && ban.expires && now > ban.expires) { bannedIPs.delete(ip); cleaned++; fileLogger.audit('BAN_EXPIRED', ip); } if (cleaned > 0) scheduleSave(); }, 300000);

// ============================================
// Connection Handler
// ============================================

async function handleConnection(socket, isSecure = false) {
  const clientIP = socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
  const clientPort = socket.remotePort;
  const connType = isSecure ? 'SSL' : 'TCP';
  const isAllowlisted = allowlistManager.isAllowed(clientIP);
  
  // Check ban (allowlisted IPs are exempt via isIPBanned)
  if (isIPBanned(clientIP)) {
    const ban = bannedIPs.get(clientIP);
    log('warn', `[REJECT] Banned: ${clientIP}`);
    fileLogger.security('REJECT_BANNED', clientIP, ban?.reason || 'Banned');
    socket.end(`:server 465 * :Banned: ${ban?.reason || 'Banned'}\r\n`);
    return;
  }
  
  // Check GeoIP (allowlisted IPs bypass)
  if (config.geoipEnabled && !isAllowlisted) {
    const geoCheck = await geoip.shouldAllow(clientIP);
    if (!geoCheck.allowed) {
      log('warn', `[REJECT] GeoIP: ${clientIP} (${geoCheck.countryCode})`);
      fileLogger.security('REJECT_GEOIP', clientIP, geoCheck.reason, { country: geoCheck.countryCode });
      socket.end(`:server 465 * :Connection not allowed from your region\r\n`);
      return;
    }
  }
  
  // Check rate limit (allowlisted IPs bypass)
  const connCheck = rateLimiter.canConnect(clientIP, isAllowlisted);
  if (!connCheck.allowed) {
    log('warn', `[REJECT] Rate: ${clientIP}`);
    fileLogger.security('REJECT_RATE', clientIP, 'Rate limited', { retryAfter: connCheck.retryAfter });
    socket.end(`:server 465 * :Rate limited. Try in ${connCheck.retryAfter}s\r\n`);
    const v = rateLimiter.recordViolation(clientIP, 'rejected');
    if (v.shouldBan) banIP(clientIP, `Auto-ban: ${v.violations} violations`, config.rateBanDuration, false);
    return;
  }
  
  const connId = ++connectionCount;
  log('info', `[${connId}] ${connType} from ${clientIP}:${clientPort}`);
  
  rateLimiter.initConnection(connId);
  
  // Get geo info
  const geoInfo = config.geoipEnabled ? await geoip.lookup(clientIP) : null;
  
  const conn = {
    id: connId, socket, ip: clientIP, port: clientPort, secure: isSecure,
    connected: new Date(), nickname: null, username: null, authenticated: false,
    messageCount: 0, throttledCount: 0,
    country: geoInfo?.country || null, countryCode: geoInfo?.countryCode || null, city: geoInfo?.city || null
  };
  
  activeConnections.set(connId, conn);
  fileLogger.connection('CONNECT', connId, clientIP, { type: connType, port: clientPort, country: geoInfo?.countryCode || 'N/A' });
  
  let ws = null;
  let buffer = '';
  let throttleWarnings = 0;
  let reconnectAttempts = 0;
  let isReconnecting = false;
  let intentionalClose = false;
  let lastCredentials = null; // Store PASS/NICK/USER for reconnect
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY_BASE = 500; // 500ms base delay for faster reconnects
  
  // Keep-alive configuration
  const PING_INTERVAL = 30000; // Send PING to client every 30 seconds
  const WS_PING_INTERVAL = 25000; // Send WebSocket ping every 25 seconds
  const PONG_TIMEOUT = 60000; // Client must respond within 60 seconds
  let clientPingInterval = null;
  let wsPingInterval = null;
  let lastPongReceived = Date.now();
  let awaitingPong = false;
  
  // mIRC (and many clients) sends PASS/NICK/USER immediately after TCP connect.
  // If the WebSocket to the gateway isn't OPEN yet, those lines were previously dropped,
  // leaving the client stuck at "Please authenticate". Buffer until WS is ready.
  const pendingToGateway = [];
  const MAX_PENDING_LINES = 200;

  function queueToGateway(line) {
    if (pendingToGateway.length >= MAX_PENDING_LINES) pendingToGateway.shift();
    pendingToGateway.push(line);
    
    // Store credentials for potential reconnect
    if (line.startsWith('PASS ')) lastCredentials = { ...lastCredentials, pass: line };
    if (line.startsWith('NICK ')) lastCredentials = { ...lastCredentials, nick: line };
    if (line.startsWith('USER ')) lastCredentials = { ...lastCredentials, user: line };
  }

  function flushToGateway() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    while (pendingToGateway.length) {
      const queued = pendingToGateway.shift();
      try {
        ws.send(queued);
      } catch (e) {
        // If send fails, stop flushing and re-queue the line.
        pendingToGateway.unshift(queued);
        break;
      }
    }
  }
  
  // Start client keep-alive (PING to IRC client)
  function startClientPing() {
    if (clientPingInterval) clearInterval(clientPingInterval);
    
    clientPingInterval = setInterval(() => {
      if (intentionalClose) {
        clearInterval(clientPingInterval);
        return;
      }
      
      // Check if client responded to previous PING
      if (awaitingPong && Date.now() - lastPongReceived > PONG_TIMEOUT) {
        log('warn', `[${connId}] Client ping timeout, closing connection`);
        fileLogger.connection('PING_TIMEOUT', connId, clientIP, { nick: conn.nickname });
        socket.end();
        return;
      }
      
      // Send PING to keep client connection alive
      try {
        socket.write(`PING :proxy.jac.chat\r\n`);
        awaitingPong = true;
        log('debug', `[${connId}] Sent PING to client`);
      } catch (e) {
        log('error', `[${connId}] Failed to send PING:`, e.message);
      }
    }, PING_INTERVAL);
  }
  
  // Start WebSocket keep-alive
  function startWsPing() {
    if (wsPingInterval) clearInterval(wsPingInterval);
    
    wsPingInterval = setInterval(() => {
      if (intentionalClose || !ws || ws.readyState !== WebSocket.OPEN) {
        clearInterval(wsPingInterval);
        return;
      }
      
      try {
        // WebSocket level ping
        ws.ping();
        log('debug', `[${connId}] Sent WebSocket ping`);
      } catch (e) {
        log('error', `[${connId}] Failed to send WS ping:`, e.message);
      }
    }, WS_PING_INTERVAL);
  }
  
  function stopPingIntervals() {
    if (clientPingInterval) {
      clearInterval(clientPingInterval);
      clientPingInterval = null;
    }
    if (wsPingInterval) {
      clearInterval(wsPingInterval);
      wsPingInterval = null;
    }
  }
  
  function connectToGateway() {
    if (intentionalClose) return;
    
    try {
      ws = new WebSocket(config.wsUrl);
      
      ws.on('open', () => {
        const wasReconnect = reconnectAttempts > 0;
        log('info', `[${connId}] Gateway connected${wasReconnect ? ` (reconnect #${reconnectAttempts})` : ''}`);
        fileLogger.connection('GATEWAY_OPEN', connId, clientIP, { reconnect: reconnectAttempts });
        
        // Track successful reconnects
        if (wasReconnect) {
          reconnectStats.successfulReconnects++;
          reconnectStats.lastReconnectTime = new Date().toISOString();
          const connReconnects = reconnectStats.reconnectsByConnection.get(connId) || 0;
          reconnectStats.reconnectsByConnection.set(connId, connReconnects + 1);
        }
        
        reconnectAttempts = 0;
        isReconnecting = false;
        
        // Start WebSocket keep-alive
        startWsPing();
        
        // On reconnect, re-send credentials to re-authenticate
        if (wasReconnect && lastCredentials) {
          log('info', `[${connId}] Re-authenticating after reconnect`);
          if (lastCredentials.pass) ws.send(lastCredentials.pass);
          if (lastCredentials.nick) ws.send(lastCredentials.nick);
          if (lastCredentials.user) ws.send(lastCredentials.user);
          
          // Small delay before rejoining channels
          setTimeout(() => {
            if (conn.channels && conn.channels.size > 0 && ws && ws.readyState === WebSocket.OPEN) {
              for (const channel of conn.channels) {
                log('info', `[${connId}] Rejoining ${channel}`);
                ws.send(`JOIN ${channel}`);
              }
            }
          }, 500);
        } else if (lastCredentials) {
          // First connect but credentials already queued - flush them
        }
        
        flushToGateway();
      });
      
      ws.on('message', (data) => {
        const msg = data.toString();
        log('debug', `[${connId}] [GW->IRC]`, msg.trim());
        
        // Don't forward gateway PINGs to client - we handle keep-alive ourselves
        // But we need to respond to them to keep the gateway alive
        if (msg.startsWith('PING ')) {
          const pingArg = msg.substring(5).trim();
          try {
            ws.send(`PONG ${pingArg}`);
            log('debug', `[${connId}] Responded to gateway PING`);
          } catch (e) {
            log('error', `[${connId}] Failed to send PONG:`, e.message);
          }
          return;
        }
        
        socket.write(msg);
      });
      
      ws.on('pong', () => {
        log('debug', `[${connId}] Received WebSocket pong`);
      });
      
      ws.on('close', (code, reason) => {
        const reasonStr = reason?.toString() || 'unknown';
        
        // Track close stats
        reconnectStats.totalReconnects++;
        reconnectStats.lastCloseCode = code;
        reconnectStats.lastCloseReason = reasonStr;
        
        if (intentionalClose) {
          log('info', `[${connId}] Gateway closed (intentional)`);
          return;
        }
        
        log('warn', `[${connId}] Gateway closed unexpectedly (code: ${code}, reason: ${reasonStr})`);
        stopPingIntervals();
        
        // Attempt reconnection immediately for edge function timeouts
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !intentionalClose) {
          reconnectAttempts++;
          isReconnecting = true;
          
          // Use shorter delays for better UX
          const delay = reconnectAttempts === 1 ? 100 : Math.min(RECONNECT_DELAY_BASE * Math.pow(1.3, reconnectAttempts - 1), 10000);
          log('info', `[${connId}] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          fileLogger.connection('RECONNECT_ATTEMPT', connId, clientIP, { attempt: reconnectAttempts, delay, closeCode: code });
          
          // Only notify client on first reconnect attempt
          if (reconnectAttempts === 1) {
            socket.write(`:proxy.jac.chat NOTICE * :*** Reconnecting to gateway...\r\n`);
          }
          
          setTimeout(() => {
            if (!intentionalClose) connectToGateway();
          }, delay);
        } else {
          reconnectStats.failedReconnects++;
          log('error', `[${connId}] Max reconnect attempts reached, closing connection`);
          fileLogger.connection('RECONNECT_FAILED', connId, clientIP, { attempts: reconnectAttempts });
          socket.write(`:proxy.jac.chat NOTICE * :*** Unable to reconnect to gateway after ${MAX_RECONNECT_ATTEMPTS} attempts\r\n`);
          socket.end();
        }
      });
      
      ws.on('error', (err) => { 
        log('error', `[${connId}] WS error:`, err.message); 
        fileLogger.error('WEBSOCKET', err.message, { connId }); 
        // Don't end socket here - let close handler manage reconnection
      });
    } catch (err) {
      log('error', `[${connId}] Connect failed:`, err.message);
      fileLogger.error('CONNECT', err.message, { connId, ip: clientIP });
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !intentionalClose) {
        reconnectAttempts++;
        const delay = Math.min(RECONNECT_DELAY_BASE * Math.pow(1.3, reconnectAttempts - 1), 10000);
        setTimeout(() => {
          if (!intentionalClose) connectToGateway();
        }, delay);
      } else {
        socket.end();
      }
    }
  }
  
  // Track channels for reconnect
  conn.channels = new Set();
  
  // Start client keep-alive immediately
  startClientPing();
  
  // Initial connection
  connectToGateway();
  
  socket.on('data', (data) => {
    buffer += data.toString();
    // Some clients may send LF-only. Support both CRLF and LF.
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Handle PONG responses from client (for our keep-alive)
      if (line.startsWith('PONG ')) {
        lastPongReceived = Date.now();
        awaitingPong = false;
        log('debug', `[${connId}] Received PONG from client`);
        continue; // Don't forward to gateway
      }
      
      const msgCheck = rateLimiter.canSendMessage(connId, clientIP);
      if (!msgCheck.allowed) {
        conn.throttledCount++;
        if (++throttleWarnings % 5 === 1) socket.write(`:proxy.jac.chat NOTICE * :Slow down!\r\n`);
        if (throttleWarnings >= 50) {
          const v = rateLimiter.recordViolation(clientIP, 'flooding');
          if (v.shouldBan) banIP(clientIP, 'Auto-ban: Flooding', config.rateBanDuration, true);
        }
        continue;
      }
      
      log('debug', `[${connId}] [IRC->GW]`, line);
      conn.messageCount++;
      
      // Track user info and store for reconnect
      if (line.startsWith('NICK ')) {
        const oldNick = conn.nickname;
        conn.nickname = line.substring(5).trim();
        lastCredentials = { ...lastCredentials, nick: line };
        if (oldNick !== conn.nickname) {
          fileLogger.connection('NICK', connId, clientIP, { nick: conn.nickname, old: oldNick || 'none' });
        }
      } else if (line.startsWith('USER ')) {
        conn.username = line.split(' ')[1];
        lastCredentials = { ...lastCredentials, user: line };
        fileLogger.connection('USER', connId, clientIP, { user: conn.username });
      } else if (line.startsWith('PASS ')) {
        conn.authenticated = true;
        lastCredentials = { ...lastCredentials, pass: line };
        fileLogger.connection('AUTH', connId, clientIP, { nick: conn.nickname || 'unknown' });
      } else if (line.startsWith('JOIN ')) {
        const channel = line.substring(5).split(' ')[0];
        conn.channels.add(channel); // Track for reconnect
        fileLogger.connection('JOIN', connId, clientIP, { nick: conn.nickname, channel });
      } else if (line.startsWith('PART ')) {
        const channel = line.substring(5).split(' ')[0];
        conn.channels.delete(channel); // Remove from reconnect list
        fileLogger.connection('PART', connId, clientIP, { nick: conn.nickname, channel });
      } else if (line.startsWith('QUIT')) {
        intentionalClose = true; // User is quitting, don't reconnect
        stopPingIntervals();
        fileLogger.connection('QUIT', connId, clientIP, { nick: conn.nickname });
      }
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(line);
      } else {
        queueToGateway(line);
      }
    }

    // If the gateway opened mid-chunk, flush any queued lines.
    flushToGateway();
  });
  
  socket.on('close', () => {
    intentionalClose = true; // Stop reconnection attempts
    stopPingIntervals();
    const duration = Math.floor((Date.now() - conn.connected.getTime()) / 1000);
    log('info', `[${connId}] Disconnected`);
    fileLogger.connection('DISCONNECT', connId, clientIP, { nick: conn.nickname, duration, messages: conn.messageCount, throttled: conn.throttledCount });
    activeConnections.delete(connId);
    rateLimiter.removeConnection(connId);
    if (ws) ws.close();
  });
  
  socket.on('error', (err) => {
    intentionalClose = true; // Stop reconnection attempts
    stopPingIntervals();
    log('error', `[${connId}] Error:`, err.message);
    fileLogger.error('SOCKET', err.message, { connId, ip: clientIP });
    activeConnections.delete(connId);
    rateLimiter.removeConnection(connId);
    if (ws) ws.close();
  });
}

// ============================================
// Admin HTTP API
// ============================================

const handleAdminRequest = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  const isAuthed = config.adminToken && token === config.adminToken;
  const adminIP = req.socket.remoteAddress?.replace('::ffff:', '') || 'unknown';
  const url = new URL(req.url, `http://${req.headers.host}`);
  const reqPath = url.pathname;
  
  // Public status (includes version for update checks)
  if (reqPath === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: PROXY_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      connections: activeConnections.size,
      totalConnections: connectionCount,
      bannedIPs: bannedIPs.size,
      ssl: config.sslEnabled,
      rateLimit: rateLimiter.getStats(),
      geoip: geoip.getStats(),
      logs: fileLogger.getStats(),
      gateway: {
        totalReconnects: reconnectStats.totalReconnects,
        successfulReconnects: reconnectStats.successfulReconnects,
        failedReconnects: reconnectStats.failedReconnects,
        lastReconnectTime: reconnectStats.lastReconnectTime,
        lastCloseCode: reconnectStats.lastCloseCode,
        lastCloseReason: reconnectStats.lastCloseReason,
        activeReconnectingConnections: Array.from(activeConnections.values()).filter(c => c.isReconnecting).length
      }
    }));
    return;
  }
  
  if (!isAuthed) {
    fileLogger.security('ADMIN_UNAUTH', adminIP, 'Unauthorized access attempt', { path: reqPath });
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }
  
  fileLogger.admin('API_ACCESS', { ip: adminIP, path: reqPath, method: req.method });
  
  // Connections
  if (reqPath === '/connections' && req.method === 'GET') {
    const conns = Array.from(activeConnections.values()).map(c => ({
      id: c.id, ip: c.ip, port: c.port, secure: c.secure,
      nickname: c.nickname, username: c.username, authenticated: c.authenticated,
      connected: c.connected.toISOString(), messageCount: c.messageCount,
      throttledCount: c.throttledCount, duration: Math.floor((Date.now() - c.connected.getTime()) / 1000),
      country: c.country, countryCode: c.countryCode, city: c.city
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connections: conns }));
    return;
  }
  
  // Kick
  if (reqPath.startsWith('/kick/') && req.method === 'POST') {
    const connId = parseInt(reqPath.split('/')[2], 10);
    const conn = activeConnections.get(connId);
    if (conn) {
      conn.socket.write(`:server KILL ${conn.nickname || '*'} :Kicked\r\n`);
      conn.socket.end();
      fileLogger.admin('KICK', { connId, ip: conn.ip, nick: conn.nickname, by: adminIP });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }
  
  // Bans
  if (reqPath === '/bans' && req.method === 'GET') {
    const bans = Array.from(bannedIPs.entries()).map(([ip, ban]) => ({
      ip, reason: ban.reason, bannedAt: ban.bannedAt, permanent: ban.permanent,
      expires: ban.expires ? new Date(ban.expires).toISOString() : null
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ bans }));
    return;
  }
  
  // Ban
  if (reqPath === '/ban' && req.method === 'POST') {
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
        const ban = banIP(ip, reason || 'Manual ban', duration || 0, kickExisting !== false, adminIP);
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
  if (reqPath === '/unban' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip } = JSON.parse(body);
        if (unbanIP(ip, adminIP)) {
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
  if (reqPath === '/violations' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ violations: rateLimiter.getViolations() }));
    return;
  }
  
  // GeoIP
  if (reqPath === '/geoip' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ stats: geoip.getStats(), cachedLocations: geoip.getCachedLocations() }));
    return;
  }
  
  // Logs
  if (reqPath === '/logs' && req.method === 'GET') {
    const type = url.searchParams.get('type') || 'connections';
    const lines = parseInt(url.searchParams.get('lines') || '100', 10);
    const logs = fileLogger.getRecentLogs(type, Math.min(lines, 500));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ type, count: logs.length, logs }));
    return;
  }
  
  // Allowlist - GET
  if (reqPath === '/allowlist' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ allowlist: allowlistManager.getAll() }));
    return;
  }
  
  // Allowlist - ADD
  if (reqPath === '/allowlist' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip, label } = JSON.parse(body);
        if (!ip || !/^[\d.]+$/.test(ip)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Valid IP required' }));
          return;
        }
        allowlistManager.add(ip, label || 'Admin', adminIP);
        // Also unban if currently banned
        if (bannedIPs.has(ip)) {
          unbanIP(ip, adminIP);
          rateLimiter.clearViolations(ip);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Allowlist - REMOVE
  if (reqPath === '/allowlist' && req.method === 'DELETE') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { ip } = JSON.parse(body);
        if (allowlistManager.remove(ip, adminIP)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not in allowlist' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Broadcast
  if (reqPath === '/broadcast' && req.method === 'POST') {
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
        fileLogger.admin('BROADCAST', { message: message.substring(0, 50), sent, by: adminIP });
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
};

// Admin server can optionally run over HTTPS (recommended when calling from an HTTPS website)
let adminServer = null;
if (config.adminSslEnabled && config.sslCert && config.sslKey) {
  try {
    adminServer = https.createServer(
      {
        cert: fs.readFileSync(config.sslCert),
        key: fs.readFileSync(config.sslKey),
      },
      handleAdminRequest,
    );
  } catch (err) {
    log('error', '[ADMIN] HTTPS init failed:', err.message);
    adminServer = http.createServer(handleAdminRequest);
  }
} else {
  adminServer = http.createServer(handleAdminRequest);
}

// ============================================
// Server Setup
// ============================================

const tcpServer = net.createServer((socket) => handleConnection(socket, false));

let tlsServer = null;
if (config.sslEnabled && config.sslCert && config.sslKey) {
  try {
    tlsServer = tls.createServer({ cert: fs.readFileSync(config.sslCert), key: fs.readFileSync(config.sslKey) }, (socket) => handleConnection(socket, true));
  } catch (err) { log('error', 'SSL init failed:', err.message); }
}

function shutdown() {
  log('info', 'Shutting down...');
  fileLogger.audit('SHUTDOWN', 'system', { uptime: Math.floor((Date.now() - startTime) / 1000), connections: activeConnections.size });
  storage.saveBans(Object.fromEntries(bannedIPs));
  for (const conn of activeConnections.values()) conn.socket.end(':server NOTICE * :Shutting down\r\n');
  tcpServer.close();
  if (tlsServer) tlsServer.close();
  adminServer.close();
  fileLogger.close();
  setTimeout(() => process.exit(0), 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
console.log('\n' + '='.repeat(60));
console.log('JAC IRC Proxy');
console.log('='.repeat(60) + '\n');

console.log('Storage:     ' + config.dataDir + ` (${bannedIPs.size} bans)`);
console.log('Logs:        ' + config.logDir + (config.logToFile ? '' : ' (disabled)'));
console.log('Rate Limit:  ' + `${config.rateConnPerMin} conn/min, ${config.rateMsgPerSec} msg/sec`);
console.log('GeoIP:       ' + (config.geoipEnabled ? `${config.geoipMode.toUpperCase()} ${config.geoipCountries.join(',')}` : 'Disabled'));
console.log('');

fileLogger.audit('STARTUP', 'system', { bans: bannedIPs.size, geoip: config.geoipEnabled });

tcpServer.listen(config.port, config.host, () => log('info', `TCP: ${config.host}:${config.port}`));
if (tlsServer) tlsServer.listen(config.sslPort, config.host, () => log('info', `SSL: ${config.host}:${config.sslPort}`));
adminServer.listen(config.adminPort, config.host, () => log('info', `Admin: ${config.adminSslEnabled ? 'https' : 'http'}://${config.host}:${config.adminPort}`));

console.log('\nWaiting for connections...\n');

tcpServer.on('error', (err) => { log('error', 'TCP:', err.message); process.exit(1); });
