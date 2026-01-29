/**
 * Justachat VPS Deploy Server v2.0
 * Handles deployments, backups, and GitHub sync
 * 
 * Run: node server.js
 * Or with systemd: systemctl start jac-deploy
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
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups/justachat';
const GIT_BRANCH = process.env.GIT_BRANCH || 'main';
const GITHUB_PAT = process.env.GITHUB_PAT || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'bhoel86/justachat';
const DEPLOY_USER = process.env.DEPLOY_USER || 'unix';
const CRON_FILE = '/etc/cron.d/jac-backup';

// Get version from version.ts
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

// Get backup info
function getBackupInfo() {
  try {
    // Check cron schedule
    let schedule = 'disabled';
    if (fs.existsSync(CRON_FILE)) {
      const content = fs.readFileSync(CRON_FILE, 'utf8');
      if (content.includes('* * * * *')) schedule = 'hourly';
      else if (content.includes('0 2 * * *')) schedule = 'daily';
      else if (content.includes('0 3 * * 0')) schedule = 'weekly';
    }

    // Get last backup
    let lastBackup = null;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.tar.gz'))
        .sort()
        .reverse();
      if (files.length > 0) {
        const stat = fs.statSync(path.join(BACKUP_DIR, files[0]));
        lastBackup = stat.mtime.toISOString();
      }
    }

    return { schedule, lastBackup };
  } catch (e) {
    return { schedule: 'unknown', lastBackup: null };
  }
}

// List available backups
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.tar.gz'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stat.size,
          sizeFormatted: formatBytes(stat.size),
          created: stat.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    return files;
  } catch (e) {
    return [];
  }
}

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Restore from backup
function runRestore(filename) {
  return new Promise((resolve) => {
    const backupPath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      resolve({ success: false, error: 'Backup file not found' });
      return;
    }
    
    // Validate filename to prevent path traversal
    if (filename.includes('..') || !filename.endsWith('.tar.gz')) {
      resolve({ success: false, error: 'Invalid backup filename' });
      return;
    }
    
    const script = `
      cd ${DEPLOY_DIR} &&
      # Create a safety backup first
      tar -czf ${BACKUP_DIR}/pre-restore-$(date +%Y%m%d-%H%M%S).tar.gz --exclude='node_modules' --exclude='.git' . &&
      # Extract the backup
      tar -xzf ${backupPath} -C ${DEPLOY_DIR} &&
      # Reinstall dependencies and rebuild
      npm install --legacy-peer-deps &&
      npm run build
    `;

    exec(script, { 
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: DEPLOY_DIR 
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stdout, stderr });
      } else {
        resolve({ success: true, message: `Restored from ${filename}`, output: stdout, stderr });
      }
    });
  });
}

// Run deploy (pull from GitHub) - runs as unix user with HTTPS + PAT
function runDeploy() {
  return new Promise((resolve) => {
    // Build the HTTPS URL with PAT for authentication
    const repoUrl = GITHUB_PAT 
      ? `https://${GITHUB_PAT}@github.com/${GITHUB_REPO}.git`
      : `https://github.com/${GITHUB_REPO}.git`;
    
    // First, fix permissions and switch to HTTPS if needed, then pull and build as unix user
    const script = `
      # Fix ownership first
      chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_DIR} &&
      
      # Switch remote to HTTPS with PAT (one-time)
      cd ${DEPLOY_DIR} &&
      sudo -u ${DEPLOY_USER} git remote set-url origin ${repoUrl} &&
      
      # Pull and build as unix user
      sudo -u ${DEPLOY_USER} git fetch origin ${GIT_BRANCH} &&
      sudo -u ${DEPLOY_USER} git reset --hard origin/${GIT_BRANCH} &&
      sudo -u ${DEPLOY_USER} npm install --legacy-peer-deps &&
      sudo -u ${DEPLOY_USER} npm run build
    `;

    exec(script, { 
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: DEPLOY_DIR 
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stdout, stderr });
      } else {
        resolve({ success: true, message: 'Deploy completed successfully', output: stdout, stderr });
      }
    });
  });
}

// Push to GitHub - runs as unix user with HTTPS + PAT
function runPush() {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Build the HTTPS URL with PAT for authentication
    const repoUrl = GITHUB_PAT 
      ? `https://${GITHUB_PAT}@github.com/${GITHUB_REPO}.git`
      : `https://github.com/${GITHUB_REPO}.git`;
    
    const script = `
      cd ${DEPLOY_DIR} &&
      sudo -u ${DEPLOY_USER} git remote set-url origin ${repoUrl} &&
      sudo -u ${DEPLOY_USER} git add . &&
      sudo -u ${DEPLOY_USER} git commit -m "VPS update ${timestamp}" --allow-empty &&
      sudo -u ${DEPLOY_USER} git push origin ${GIT_BRANCH}
    `;

    exec(script, { 
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
      cwd: DEPLOY_DIR 
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stdout, stderr });
      } else {
        resolve({ success: true, message: 'Push completed successfully', output: stdout, stderr });
      }
    });
  });
}

// Create backup
function runBackup() {
  return new Promise((resolve) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = `justachat-${timestamp}.tar.gz`;
    
    const script = `
      mkdir -p ${BACKUP_DIR} &&
      cd ${DEPLOY_DIR} &&
      tar -czf ${BACKUP_DIR}/${backupFile} --exclude='node_modules' --exclude='.git' . &&
      # Keep only last 10 backups
      cd ${BACKUP_DIR} &&
      ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm --
    `;

    exec(script, { 
      timeout: 300000,
      maxBuffer: 10 * 1024 * 1024 
    }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stdout, stderr });
      } else {
        resolve({ success: true, message: `Backup created: ${backupFile}`, output: stdout, stderr });
      }
    });
  });
}

// Schedule backup cron
function scheduleBackup(frequency) {
  return new Promise((resolve) => {
    let cronLine = '';
    
    switch (frequency) {
      case 'hourly':
        cronLine = `0 * * * * root /usr/bin/node ${__dirname}/backup-job.js >> /var/log/jac-backup.log 2>&1\n`;
        break;
      case 'daily':
        cronLine = `0 2 * * * root /usr/bin/node ${__dirname}/backup-job.js >> /var/log/jac-backup.log 2>&1\n`;
        break;
      case 'weekly':
        cronLine = `0 3 * * 0 root /usr/bin/node ${__dirname}/backup-job.js >> /var/log/jac-backup.log 2>&1\n`;
        break;
      case 'disable':
        // Remove cron file
        try {
          if (fs.existsSync(CRON_FILE)) {
            fs.unlinkSync(CRON_FILE);
          }
          resolve({ success: true, message: 'Backup schedule disabled' });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
        return;
      default:
        resolve({ success: false, error: 'Invalid frequency' });
        return;
    }

    try {
      fs.writeFileSync(CRON_FILE, cronLine);
      execSync('chmod 644 ' + CRON_FILE);
      resolve({ success: true, message: `Backup scheduled: ${frequency}` });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

// CORS headers
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

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Create server
const server = http.createServer(async (req, res) => {
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
    res.end(JSON.stringify({ status: 'ok', service: 'jac-deploy', version: '2.0.0' }));
    return;
  }

  // All other endpoints require auth
  if (!verifyToken(req)) {
    res.writeHead(401, headers);
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  // Status endpoint
  if (url.pathname === '/deploy/status' || url.pathname === '/status') {
    const backupInfo = getBackupInfo();
    res.writeHead(200, headers);
    res.end(JSON.stringify({
      deployDir: DEPLOY_DIR,
      appVersion: getAppVersion(),
      git: getGitInfo(),
      serverVersion: '2.1.0',
      backupSchedule: backupInfo.schedule,
      lastBackup: backupInfo.lastBackup
    }));
    return;
  }

  // List backups endpoint
  if (url.pathname === '/deploy/backups') {
    const backups = listBackups();
    res.writeHead(200, headers);
    res.end(JSON.stringify({ backups }));
    return;
  }

  // Action endpoints (POST)
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const action = body.action || url.pathname.replace('/deploy/', '').replace('/', '');

    console.log(`[${new Date().toISOString()}] Action: ${action}`);

    let result;

    switch (action) {
      case 'deploy':
        result = await runDeploy();
        break;
      case 'push':
        result = await runPush();
        break;
      case 'backup-now':
        result = await runBackup();
        break;
      case 'schedule-backup':
        result = await scheduleBackup(body.frequency || 'daily');
        break;
      case 'restore':
        if (!body.filename) {
          res.writeHead(400, headers);
          res.end(JSON.stringify({ error: 'Missing filename for restore' }));
          return;
        }
        result = await runRestore(body.filename);
        break;
      default:
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: 'Unknown action: ' + action }));
        return;
    }

    console.log(`[${new Date().toISOString()}] ${action} ${result.success ? 'succeeded' : 'failed'}`);

    res.writeHead(result.success ? 200 : 500, headers);
    res.end(JSON.stringify({
      ...result,
      action,
      appVersion: getAppVersion(),
      git: getGitInfo()
    }));
    return;
  }

  // 404
  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`JAC Deploy Server v2.0 running on http://0.0.0.0:${PORT}`);
  console.log(`Deploy directory: ${DEPLOY_DIR}`);
  console.log(`Backup directory: ${BACKUP_DIR}`);
  console.log(`Git branch: ${GIT_BRANCH}`);
  if (!ADMIN_TOKEN) {
    console.warn('WARNING: No DEPLOY_TOKEN set - all protected endpoints will reject requests');
  }
});
