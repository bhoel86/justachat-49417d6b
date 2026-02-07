#!/usr/bin/env node
/**
 * JustAChat IRC-to-HTTP Bridge
 * 
 * Listens on port 6667 (TCP) and translates raw IRC protocol
 * to HTTP calls against the Supabase Edge Function (irc-gateway).
 * 
 * This is needed because Edge Functions are HTTP-based,
 * but mIRC speaks raw IRC over TCP.
 * 
 * Usage: node irc-bridge.js
 * Or:    pm2 start irc-bridge.js --name jac-irc-bridge
 */

const net = require('net');
const http = require('http');
const https = require('https');

// Configuration - these get overridden by env vars
const IRC_PORT = parseInt(process.env.IRC_PORT || '6667');
const EDGE_FUNCTION_URL = process.env.EDGE_FUNCTION_URL || 'http://127.0.0.1:8000/functions/v1/irc-gateway';
const ANON_KEY = process.env.ANON_KEY || '';

// Read ANON_KEY from .env file if not set
function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  
  // Try multiple locations for .env
  const envPaths = [
    path.join(__dirname, '../../.env'),           // /var/www/justachat/.env
    '/root/supabase/docker/.env',                  // Docker .env
    path.join(process.cwd(), '.env'),
  ];
  
  for (const envPath of envPaths) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      const env = {};
      for (const line of lines) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
      }
      return env;
    } catch (e) {
      // Try next path
    }
  }
  return {};
}

const envVars = loadEnv();
const FINAL_ANON_KEY = ANON_KEY || envVars.ANON_KEY || envVars.SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!FINAL_ANON_KEY) {
  console.error('⚠️  WARNING: No ANON_KEY found. Auth will fail.');
  console.error('   Set ANON_KEY env var or ensure .env file exists');
}

console.log(`🔌 JAC IRC Bridge starting...`);
console.log(`   IRC Port: ${IRC_PORT}`);
console.log(`   Edge URL: ${EDGE_FUNCTION_URL}`);
console.log(`   ANON_KEY: ${FINAL_ANON_KEY ? FINAL_ANON_KEY.substring(0, 20) + '...' : 'NOT SET'}`);

// Track active connections
const connections = new Map();
let connectionCounter = 0;

/**
 * Send an HTTP request to the Edge Function
 */
function callEdgeFunction(command, args, authToken, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ command, args, sessionId });
    const url = new URL(EDGE_FUNCTION_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${authToken || FINAL_ANON_KEY}`,
        'apikey': FINAL_ANON_KEY,
      },
      timeout: 15000,
    };
    
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`  [Edge] ${command} HTTP ${res.statusCode} - ${data.length} bytes`);
        if (res.statusCode >= 400) {
          console.error(`  [Edge] ERROR response: ${data.substring(0, 300)}`);
        }
        try {
          const parsed = JSON.parse(data);
          // Log what keys we got back
          console.log(`  [Edge] ${command} response keys: ${Object.keys(parsed).join(', ')}`);
          if (parsed.lines) {
            console.log(`  [Edge] ${command} lines array length: ${parsed.lines.length}`);
          }
          resolve(parsed);
        } catch (e) {
          console.log(`  [Edge] ${command} non-JSON response, splitting as raw lines`);
          resolve({ raw: data, lines: data.split('\n').filter(l => l.trim()) });
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`  Edge function error: ${err.message}`);
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Edge function request timed out'));
    });
    
    req.write(body);
    req.end();
  });
}

/**
 * Send raw IRC line to client
 */
function sendToClient(socket, line) {
  if (socket.writable) {
    socket.write(line + '\r\n');
  }
}

/**
 * Handle an incoming IRC connection
 */
function handleConnection(socket) {
  const connId = ++connectionCounter;
  const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
  
  console.log(`[${connId}] New IRC connection from ${clientAddr}`);
  console.log(`[${connId}] Socket state: writable=${socket.writable} readable=${socket.readable}`);
  
  const state = {
    id: connId,
    nick: null,
    user: null,
    pass: null,       // email;password
    authToken: null,  // JWT after successful auth
    registered: false,
    buffer: '',
    sessionId: `bridge-${connId}-${Date.now()}`,
  };
  
  connections.set(connId, { socket, state });
  
  socket.setEncoding('utf8');
  socket.setTimeout(300000); // 5 minute timeout
  
  // Send initial greeting so mIRC knows the server is ready
  // Many IRC clients wait for the server to speak first
  console.log(`[${connId}] Sending NOTICE greetings...`);
  sendToClient(socket, `:jac.chat NOTICE * :*** Looking up your hostname...`);
  sendToClient(socket, `:jac.chat NOTICE * :*** Found your hostname`);
  console.log(`[${connId}] Greetings sent. Waiting for client data...`);
  
  socket.on('end', () => {
    console.log(`[${connId}] Socket END received (client disconnected gracefully)`);
  });
  
  socket.on('data', (data) => {
    // Detect TLS/SSL handshake (first byte 0x16 = TLS ClientHello)
    if (!state.gotData) {
      state.gotData = true;
      const firstByte = typeof data === 'string' ? data.charCodeAt(0) : data[0];
      console.log(`[${state.id}] First data byte: 0x${firstByte.toString(16)} (${firstByte})`);
      if (firstByte === 0x16 || firstByte === 22) {
        console.log(`[${state.id}] ⚠️  TLS/SSL HANDSHAKE DETECTED! Client has SSL enabled.`);
        console.log(`[${state.id}]    mIRC must connect WITHOUT SSL to port 6667.`);
        sendToClient(socket, `ERROR :This server does not support SSL on port 6667. Disable SSL in your IRC client.`);
        socket.end();
        return;
      }
      console.log(`[${state.id}] Raw data received: ${JSON.stringify(data.substring(0, 100))}`);
    }
    
    state.buffer += data;
    
    // Process complete lines - handle both \r\n and \n line endings
    // Split on \n first, then strip any trailing \r
    let lines = state.buffer.split('\n');
    state.buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    // Process lines sequentially - each command must complete before the next
    // This prevents QUIT from killing the socket before LIST response arrives
    (async () => {
      for (const line of lines) {
        const cleaned = line.replace(/\r$/, '').trim();
        if (cleaned) {
          await processIRCLine(socket, state, cleaned);
        }
      }
    })();
  });
  
  socket.on('timeout', () => {
    console.log(`[${connId}] Connection timed out`);
    sendToClient(socket, `ERROR :Connection timed out`);
    socket.end();
  });
  
  socket.on('close', () => {
    console.log(`[${connId}] Connection closed (${state.nick || 'unregistered'})`);
    connections.delete(connId);
    
    // Notify edge function of disconnect
    if (state.authToken) {
      callEdgeFunction('QUIT', 'Connection closed', state.authToken, state.sessionId).catch(() => {});
    }
  });
  
  socket.on('error', (err) => {
    console.error(`[${connId}] Socket error: ${err.message}`);
    connections.delete(connId);
  });
}

/**
 * Process a single IRC protocol line
 */
async function processIRCLine(socket, state, line) {
  console.log(`[${state.id}] << ${line}`);
  
  // Parse IRC message: [:prefix] command [params] [:trailing]
  const parts = line.split(' ');
  let command = parts[0].toUpperCase();
  let args = parts.slice(1).join(' ');
  
  // Handle prefix (rare from clients)
  if (command.startsWith(':')) {
    command = parts[1] ? parts[1].toUpperCase() : '';
    args = parts.slice(2).join(' ');
  }
  
  // Extract trailing parameter (after :)
  let trailing = null;
  const trailingIdx = args.indexOf(' :');
  if (trailingIdx !== -1) {
    trailing = args.substring(trailingIdx + 2);
    args = args.substring(0, trailingIdx);
  } else if (args.startsWith(':')) {
    trailing = args.substring(1);
    args = '';
  }

  try {
    switch (command) {
      case 'CAP':
        // IRCv3 Capability negotiation
        console.log(`[${state.id}] CAP command: ${args} ${trailing || ''}`);
        if (args.includes('LS')) {
          // Reply with empty capability list - proper IRC format with server prefix
          sendToClient(socket, `:jac.chat CAP * LS :`);
          console.log(`[${state.id}] Sent CAP LS reply (no capabilities)`);
        } else if (args.includes('LIST')) {
          // Reply to CAP LIST with empty list
          sendToClient(socket, `:jac.chat CAP * LIST :`);
        } else if (args.includes('REQ')) {
          // Deny any capability requests
          sendToClient(socket, `:jac.chat CAP * NAK :${trailing || args.replace('REQ', '').trim()}`);
        } else if (args.includes('END')) {
          console.log(`[${state.id}] CAP END received - proceeding with registration`);
        }
        break;
        
      case 'PASS':
        // Store credentials: email;password
        state.pass = trailing || args;
        console.log(`[${state.id}] PASS received (${state.pass.split(';')[0]})`);
        break;
        
      case 'NICK':
        state.nick = trailing || args;
        console.log(`[${state.id}] NICK set to: ${state.nick}`);
        // Try to complete registration
        await tryRegister(socket, state);
        break;
        
      case 'USER':
        // USER username mode * :realname
        state.user = args.split(' ')[0] || trailing;
        console.log(`[${state.id}] USER set to: ${state.user}`);
        // Try to complete registration
        await tryRegister(socket, state);
        break;
        
      case 'PING':
        const pingToken = trailing || args || 'jac.chat';
        sendToClient(socket, `PONG jac.chat :${pingToken}`);
        break;
        
      case 'PONG':
        // Client responding to our ping - good, they're alive
        break;
        
      case 'QUIT':
        sendToClient(socket, `ERROR :Closing Link: ${state.nick || '*'} (Quit: ${trailing || 'Client quit'})`);
        if (state.authToken) {
          callEdgeFunction('QUIT', trailing || 'Client quit', state.authToken, state.sessionId).catch(() => {});
        }
        socket.end();
        break;
        
      default:
        // Forward all other commands to the edge function
        if (!state.registered) {
          sendToClient(socket, `:jac.chat 451 * :You have not registered`);
          break;
        }
        
        const fullArgs = trailing ? `${args} :${trailing}`.trim() : args;
        console.log(`[${state.id}] >> Calling edge function: ${command} ${fullArgs}`);
        const response = await callEdgeFunction(command, fullArgs, state.authToken, state.sessionId);
        
        // Collect all IRC lines from whatever response format we get
        let ircLines = [];
        if (response.lines && Array.isArray(response.lines)) {
          ircLines = response.lines;
        } else if (response.response) {
          ircLines = response.response.split('\r\n');
        } else if (response.raw) {
          ircLines = response.raw.split('\r\n');
        }
        
        console.log(`[${state.id}] << Edge returned ${ircLines.length} lines for ${command}`);
        
        // Send each line, stripping any embedded \r\n first
        let sentCount = 0;
        for (const rawLine of ircLines) {
          const cleaned = rawLine.replace(/\r?\n/g, '').trim();
          if (cleaned) {
            sendToClient(socket, cleaned);
            sentCount++;
          }
        }
        console.log(`[${state.id}] >> Sent ${sentCount} lines to client for ${command}`);
        break;
    }
  } catch (err) {
    console.error(`[${state.id}] Error processing ${command}: ${err.message}`);
    if (command === 'PASS' || command === 'NICK' || command === 'USER') {
      sendToClient(socket, `:jac.chat 464 ${state.nick || '*'} :Authentication failed - check your email;password in the server password field`);
    }
  }
}

/**
 * Try to complete IRC registration (need NICK + USER, optionally PASS)
 */
async function tryRegister(socket, state) {
  if (state.registered) return;
  if (!state.nick || !state.user) return;
  
  console.log(`[${state.id}] Attempting registration for ${state.nick}...`);
  
  try {
    // If PASS was provided, authenticate via edge function
    if (state.pass) {
      try {
        const authResponse = await callEdgeFunction('PASS', state.pass, FINAL_ANON_KEY, state.sessionId);
        
        if (authResponse.token) {
          state.authToken = authResponse.token;
          console.log(`[${state.id}] Auth successful for ${state.nick}`);
        } else if (authResponse.error) {
          console.log(`[${state.id}] Auth failed: ${authResponse.error}`);
          sendToClient(socket, `:jac.chat 464 ${state.nick} :Password incorrect - use email;password format`);
          return;
        }
      } catch (authErr) {
        console.error(`[${state.id}] Auth edge function failed: ${authErr.message}`);
        // Continue anyway - send welcome without auth token
      }
    }
    
    // ALWAYS send IRC welcome numerics - mIRC requires these to complete registration
    sendToClient(socket, `:jac.chat 001 ${state.nick} :Welcome to JustAChat IRC Network ${state.nick}!${state.nick}!~${state.user}@jac.chat`);
    sendToClient(socket, `:jac.chat 002 ${state.nick} :Your host is jac.chat, running JAC-IRC-1.0`);
    sendToClient(socket, `:jac.chat 003 ${state.nick} :This server was created 2026-01-01`);
    sendToClient(socket, `:jac.chat 004 ${state.nick} jac.chat JAC-IRC-1.0 iowghraAsORTVSxNCWqBzvdHtGpI lvhopsmntikrRcaqOALQbSeIKVfMCuzNTGjZ`);
    sendToClient(socket, `:jac.chat 005 ${state.nick} NETWORK=JustAChat CHANTYPES=# PREFIX=(ohv)@%+ CHANMODES=beI,kfL,lj,psmntirRcOAQKVCuzNSMTGZ MODES=6 STATUSMSG=@%+ :are supported by this server`);
    
    // User/channel stats
    sendToClient(socket, `:jac.chat 251 ${state.nick} :There are 42 users and 15 bots on 1 server`);
    sendToClient(socket, `:jac.chat 252 ${state.nick} 3 :IRC Operators online`);
    sendToClient(socket, `:jac.chat 254 ${state.nick} 12 :channels formed`);
    sendToClient(socket, `:jac.chat 255 ${state.nick} :I have 42 clients and 0 servers`);
    
    // MOTD with ASCII art banner
    sendToClient(socket, `:jac.chat 375 ${state.nick} :- jac.chat Message of the Day -`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0311     ██╗ █████╗  ██████╗\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0311     ██║██╔══██╗██╔════╝\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0311     ██║███████║██║     \x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0311██   ██║██╔══██║██║     \x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0311╚█████╔╝██║  ██║╚██████╗\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0311 ╚════╝ ╚═╝  ╚═╝ ╚═════╝\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x02JustAChat IRC Network\x02 - \x0303https://justachat.net\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0312━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x0F`);
    if (state.authToken) {
      sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0303✓\x0F Welcome back, \x02${state.nick}\x02! You are \x0303authenticated\x0F.`);
    } else {
      sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0304⚠\x0F You are \x0304NOT authenticated\x0F.`);
      sendToClient(socket, `:jac.chat 372 ${state.nick} :-    Set server password: \x02email;password\x02`);
    }
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0312━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0306Channels:\x0F /join #general | #music | #games | #help`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-             #sports | #movies-tv | #technology | #dating`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-             #lounge | #trivia | #politics | #adults-21-plus`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0306Commands:\x0F /list | /whois <nick> | /msg <nick> <text>`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-             /join #channel | /part #channel | /quit`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0314Chat bots are active in all channels!\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-  \x0314Type a bot's name to interact with them.\x0F`);
    sendToClient(socket, `:jac.chat 372 ${state.nick} :-`);
    sendToClient(socket, `:jac.chat 376 ${state.nick} :End of /MOTD command.`);
    
    // Try to notify edge function of the connection (non-blocking)
    if (state.authToken) {
      callEdgeFunction('NICK', state.nick, state.authToken, state.sessionId).catch(() => {});
    }
    
    state.registered = true;
    console.log(`[${state.id}] Registration complete for ${state.nick} (auth: ${!!state.authToken})`);
    
  } catch (err) {
    console.error(`[${state.id}] Registration failed: ${err.message}`);
    sendToClient(socket, `:jac.chat NOTICE * :Connection to JustAChat backend failed. Please try again later.`);
  }
}

// Create TCP server
const server = net.createServer(handleConnection);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${IRC_PORT} is already in use!`);
    console.error(`   Run: sudo lsof -i :${IRC_PORT}  to find what's using it`);
    console.error(`   Then: sudo kill <PID>`);
  } else {
    console.error(`❌ Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(IRC_PORT, '0.0.0.0', () => {
  console.log(`✅ JAC IRC Bridge listening on port ${IRC_PORT}`);
  console.log(`   mIRC can now connect to this server`);
  console.log(`   Password format: email@example.com;yourpassword`);
  console.log('');
  console.log(`   Press Ctrl+C to stop`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down IRC bridge...');
  for (const [id, conn] of connections) {
    sendToClient(conn.socket, `ERROR :Server shutting down`);
    conn.socket.end();
  }
  server.close(() => {
    console.log('IRC bridge stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  process.emit('SIGINT');
});
