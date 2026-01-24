/**
 * JAC IRC Proxy - WebSocket to TCP/TLS Bridge
 * Allows mIRC and other traditional IRC clients to connect to JAC
 * 
 * Environment Variables:
 *   WS_URL      - WebSocket gateway URL (default: production JAC gateway)
 *   HOST        - Host to bind to (default: 127.0.0.1, use 0.0.0.0 for public)
 *   PORT        - Port to listen on (default: 6667)
 *   SSL_ENABLED - Enable SSL/TLS (default: false)
 *   SSL_PORT    - SSL port (default: 6697)
 *   SSL_CERT    - Path to SSL certificate file
 *   SSL_KEY     - Path to SSL private key file
 *   SSL_CA      - Path to CA bundle (optional)
 *   LOG_LEVEL   - Logging level: debug, info, warn, error (default: info)
 * 
 * Usage: 
 *   Local:      node proxy.js
 *   Public:     HOST=0.0.0.0 node proxy.js
 *   With SSL:   SSL_ENABLED=true SSL_CERT=cert.pem SSL_KEY=key.pem node proxy.js
 */

const net = require('net');
const tls = require('tls');
const fs = require('fs');
const WebSocket = require('ws');

// Load .env file if present
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, use process.env directly
}

// Configuration from environment
const config = {
  wsUrl: process.env.WS_URL || 'wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway',
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '6667', 10),
  sslEnabled: process.env.SSL_ENABLED === 'true',
  sslPort: parseInt(process.env.SSL_PORT || '6697', 10),
  sslCert: process.env.SSL_CERT || '',
  sslKey: process.env.SSL_KEY || '',
  sslCa: process.env.SSL_CA || '',
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Logging levels
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[config.logLevel] || 1;

function log(level, ...args) {
  if (LOG_LEVELS[level] >= currentLogLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
  }
}

// Track active connections
let connectionCount = 0;
const activeConnections = new Map();

// Connection handler (shared between TCP and TLS)
function handleConnection(socket, isSecure = false) {
  const connId = ++connectionCount;
  const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
  const connType = isSecure ? 'SSL' : 'TCP';
  
  log('info', `[${connId}] New ${connType} client connected from ${clientAddr}`);
  
  let ws = null;
  let buffer = '';
  let authenticated = false;
  
  activeConnections.set(connId, { 
    socket, 
    clientAddr, 
    connected: new Date(),
    secure: isSecure 
  });
  
  // Connect to JAC WebSocket
  try {
    ws = new WebSocket(config.wsUrl);
    
    ws.on('open', () => {
      log('info', `[${connId}] Connected to JAC IRC Gateway`);
    });
    
    ws.on('message', (data) => {
      const message = data.toString();
      log('debug', `[${connId}] [JAC->IRC]`, message.trim());
      socket.write(message);
    });
    
    ws.on('close', (code, reason) => {
      log('info', `[${connId}] JAC connection closed (code: ${code})`);
      socket.end();
    });
    
    ws.on('error', (err) => {
      log('error', `[${connId}] WebSocket error:`, err.message);
      socket.end();
    });
  } catch (err) {
    log('error', `[${connId}] Failed to connect to JAC:`, err.message);
    socket.end();
    return;
  }
  
  // Handle IRC client data
  socket.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\r\n');
    buffer = lines.pop(); // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        log('debug', `[${connId}] [IRC->JAC]`, line);
        
        // Track authentication
        if (line.startsWith('PASS ')) {
          authenticated = true;
          log('info', `[${connId}] Client authenticating...`);
        }
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(line);
        }
      }
    }
  });
  
  socket.on('close', () => {
    log('info', `[${connId}] ${connType} client disconnected from ${clientAddr}`);
    activeConnections.delete(connId);
    if (ws) ws.close();
  });
  
  socket.on('error', (err) => {
    log('error', `[${connId}] Socket error:`, err.message);
    activeConnections.delete(connId);
    if (ws) ws.close();
  });
}

// Create TCP server
const tcpServer = net.createServer((socket) => {
  handleConnection(socket, false);
});

// Create TLS server if SSL is enabled
let tlsServer = null;
if (config.sslEnabled) {
  if (!config.sslCert || !config.sslKey) {
    log('error', 'SSL_ENABLED=true but SSL_CERT and SSL_KEY not provided');
    process.exit(1);
  }
  
  try {
    const tlsOptions = {
      cert: fs.readFileSync(config.sslCert),
      key: fs.readFileSync(config.sslKey),
    };
    
    if (config.sslCa) {
      tlsOptions.ca = fs.readFileSync(config.sslCa);
    }
    
    tlsServer = tls.createServer(tlsOptions, (socket) => {
      handleConnection(socket, true);
    });
    
    log('info', 'SSL/TLS server initialized');
  } catch (err) {
    log('error', 'Failed to initialize SSL:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown() {
  log('info', 'Shutting down proxy...');
  
  for (const [id, conn] of activeConnections) {
    log('info', `Closing connection ${id}`);
    conn.socket.end();
  }
  
  const servers = [tcpServer];
  if (tlsServer) servers.push(tlsServer);
  
  let closed = 0;
  servers.forEach(server => {
    server.close(() => {
      closed++;
      if (closed === servers.length) {
        log('info', 'Proxy shut down complete');
        process.exit(0);
      }
    });
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    log('warn', 'Forced shutdown');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start servers
console.log('');
console.log('='.repeat(60));
console.log('JAC IRC Proxy Started');
console.log('='.repeat(60));
console.log('');
console.log('Configuration:');
console.log(`  Host:      ${config.host}`);
console.log(`  TCP Port:  ${config.port}`);
if (config.sslEnabled) {
  console.log(`  SSL Port:  ${config.sslPort}`);
  console.log(`  SSL Cert:  ${config.sslCert}`);
}
console.log(`  Gateway:   ${config.wsUrl}`);
console.log(`  Log Level: ${config.logLevel}`);
console.log('');

// Start TCP server
tcpServer.listen(config.port, config.host, () => {
  log('info', `TCP server listening on ${config.host}:${config.port}`);
});

// Start TLS server if enabled
if (tlsServer) {
  tlsServer.listen(config.sslPort, config.host, () => {
    log('info', `SSL server listening on ${config.host}:${config.sslPort}`);
  });
}

if (config.host === '0.0.0.0') {
  console.log('⚠️  PUBLIC MODE - Accepting connections from any IP');
  console.log('');
  console.log('mIRC Settings (for remote users):');
  console.log('  Server: <your-server-ip>');
  console.log(`  Port: ${config.port} (plain) or ${config.sslPort} (SSL)`);
  console.log('  Password: email@example.com:password');
  if (config.sslEnabled) {
    console.log('  SSL: Enable for port ' + config.sslPort);
  }
} else {
  console.log('mIRC Settings:');
  console.log(`  Server: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log('  Password: email@example.com:password');
}

console.log('');
console.log('Waiting for connections...');
console.log('');

tcpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log('error', `Port ${config.port} is already in use.`);
  } else if (err.code === 'EADDRNOTAVAIL') {
    log('error', `Cannot bind to ${config.host}.`);
  } else {
    log('error', 'TCP server error:', err.message);
  }
  process.exit(1);
});

if (tlsServer) {
  tlsServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('error', `SSL port ${config.sslPort} is already in use.`);
    } else {
      log('error', 'SSL server error:', err.message);
    }
    process.exit(1);
  });
}
