/**
 * Justachat VPS Deploy Server
 * Simple HTTP server to trigger git pull and rebuild from the admin panel
 * 
 * Run: node server.js
 * Or with PM2: pm2 start server.js --name jac-deploy
 */

const http = require('http');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Try to load .env file
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

const PORT = process.env.DEPLOY_PORT || 6680;
const ADMIN_TOKEN = process.env.DEPLOY_TOKEN || process.env.IRC_PROXY_ADMIN_TOKEN;
const DEPLOY_DIR = process.env.DEPLOY_DIR || '/var/www/justachat';
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';

// Get version from package.json in deploy dir
function getAppVersion() {
  try {
    const versionFile = path.join(DEPLOY_DIR, 'src/lib/version.ts');
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, 'utf8');
      const match = content.match(/VERSION\s*=\s*["']([^"']+)["']/);
      if (match) return match[1];
    }
    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

// Get git info
function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', { cwd: DEPLOY_DIR, encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --format=%s', { cwd: DEPLOY_DIR, encoding: 'utf8' }).trim();
    const date = execSync('git log -1 --format=%ci', { cwd: DEPLOY_DIR, encoding: 'utf8' }).trim();
    return { hash, message, date };
  } catch (e) {
    return null;
  }
}

// Run deploy
function runDeploy() {
  return new Promise((resolve) => {
    const script = `
      cd ${DEPLOY_DIR} &&
      git fetch origin ${GIT_BRANCH} &&
      git reset --hard origin/${GIT_BRANCH} &&
      npm install --legacy-peer-deps &&
      npm run build
    `;

    exec(script, { 
      timeout: 300000, // 5 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      cwd: DEPLOY_DIR 
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          error: error.message,
          output: stdout,
          stderr: stderr
        });
      } else {
        resolve({
          success: true,
          message: 'Deploy completed successfully',
          output: stdout,
          stderr: stderr
        });
      }
    });
  });
}

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

// Verify auth token
function verifyToken(req) {
  if (!ADMIN_TOKEN) return false;
  const auth = req.headers.authorization;
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return token === ADMIN_TOKEN;
}

// Create server
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  // Health check (no auth required)
  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({ status: 'ok', service: 'jac-deploy' }));
    return;
  }

  // Status endpoint
  if (url.pathname === '/deploy/status' || url.pathname === '/status') {
    if (!verifyToken(req)) {
      res.writeHead(401, headers);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    res.writeHead(200, headers);
    res.end(JSON.stringify({
      deployDir: DEPLOY_DIR,
      appVersion: getAppVersion(),
      git: getGitInfo(),
      serverVersion: '1.0.0'
    }));
    return;
  }

  // Deploy endpoint
  if (url.pathname === '/deploy' && req.method === 'POST') {
    if (!verifyToken(req)) {
      res.writeHead(401, headers);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    console.log(`[${new Date().toISOString()}] Deploy triggered`);
    
    const result = await runDeploy();
    
    console.log(`[${new Date().toISOString()}] Deploy ${result.success ? 'succeeded' : 'failed'}`);

    res.writeHead(result.success ? 200 : 500, headers);
    res.end(JSON.stringify({
      ...result,
      appVersion: getAppVersion(),
      git: getGitInfo()
    }));
    return;
  }

  // 404 for everything else
  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`JAC Deploy Server running on http://127.0.0.1:${PORT}`);
  console.log(`Deploy directory: ${DEPLOY_DIR}`);
  console.log(`Git branch: ${GIT_BRANCH}`);
  if (!ADMIN_TOKEN) {
    console.warn('WARNING: No DEPLOY_TOKEN set - deploy endpoints will reject all requests');
  }
});
