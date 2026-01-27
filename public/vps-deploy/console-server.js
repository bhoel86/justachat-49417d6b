#!/usr/bin/env node
/**
 * JAC VPS Console Server
 * Standalone web console for VPS management
 * 
 * Install: 
 *   cd /opt/jac-deploy
 *   curl -O https://justachat.net/vps-deploy/console-server.js
 *   npm install express
 *   node console-server.js
 */

const http = require('http');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.CONSOLE_PORT || 6680;
const DEPLOY_DIR = process.env.DEPLOY_DIR || '/var/www/justachat';
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups/justachat';
const MANAGE_SCRIPT = '/opt/jac-deploy/manage.sh';

// Simple HTML page embedded
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JAC VPS Console</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #00d4ff; margin-bottom: 20px; font-size: 24px; }
    .buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }
    button {
      background: #1a1a2e;
      border: 1px solid #333;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    button:hover { background: #252545; border-color: #00d4ff; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.danger { border-color: #ff4444; }
    button.danger:hover { background: #3a1a1a; }
    .output {
      background: #0d0d0d;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 15px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      max-height: 500px;
      overflow-y: auto;
      min-height: 200px;
    }
    .output .success { color: #00ff88; }
    .output .error { color: #ff4444; }
    .output .info { color: #00d4ff; }
    .status { margin-bottom: 15px; padding: 10px; background: #1a1a2e; border-radius: 8px; font-size: 13px; }
    .restore-form { display: flex; gap: 10px; margin-bottom: 20px; }
    .restore-form select { 
      flex: 1; padding: 10px; background: #1a1a2e; border: 1px solid #333; 
      color: #fff; border-radius: 8px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖥️ JAC VPS Console</h1>
    
    <div class="status" id="status">Loading status...</div>
    
    <div class="buttons">
      <button onclick="runCommand('status')">📊 Status</button>
      <button onclick="runCommand('deploy')">🚀 Deploy</button>
      <button onclick="runCommand('backup')">💾 Backup Now</button>
      <button onclick="runCommand('list')">📁 List Backups</button>
      <button onclick="runCommand('schedule/daily')">⏰ Schedule Daily</button>
      <button onclick="runCommand('schedule/disable')">🔕 Disable Schedule</button>
    </div>
    
    <div class="restore-form">
      <select id="backupSelect">
        <option value="">-- Select backup to restore --</option>
      </select>
      <button class="danger" onclick="restoreBackup()">⚠️ Restore</button>
      <button onclick="loadBackups()">🔄</button>
    </div>
    
    <div class="output" id="output">Ready. Click a button to run a command.</div>
  </div>

  <script>
    const output = document.getElementById('output');
    const statusEl = document.getElementById('status');
    const backupSelect = document.getElementById('backupSelect');
    
    function log(msg, type = '') {
      const span = document.createElement('span');
      span.className = type;
      span.textContent = msg + '\\n';
      output.appendChild(span);
      output.scrollTop = output.scrollHeight;
    }
    
    function clearOutput() {
      output.innerHTML = '';
    }
    
    async function runCommand(cmd) {
      clearOutput();
      log('> Running: ' + cmd, 'info');
      log('');
      
      document.querySelectorAll('button').forEach(b => b.disabled = true);
      
      try {
        const res = await fetch('/api/' + cmd);
        const data = await res.json();
        
        if (data.success) {
          log(data.output || data.message || 'Done', 'success');
        } else {
          log('Error: ' + (data.error || 'Unknown error'), 'error');
          if (data.stderr) log(data.stderr, 'error');
        }
      } catch (err) {
        log('Request failed: ' + err.message, 'error');
      }
      
      document.querySelectorAll('button').forEach(b => b.disabled = false);
    }
    
    async function loadBackups() {
      try {
        const res = await fetch('/api/list');
        const data = await res.json();
        
        backupSelect.innerHTML = '<option value="">-- Select backup to restore --</option>';
        
        if (data.backups && data.backups.length > 0) {
          data.backups.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.filename;
            opt.textContent = b.filename + ' (' + b.sizeFormatted + ')';
            backupSelect.appendChild(opt);
          });
        }
      } catch (err) {
        console.error('Failed to load backups:', err);
      }
    }
    
    async function restoreBackup() {
      const file = backupSelect.value;
      if (!file) {
        alert('Please select a backup first');
        return;
      }
      if (!confirm('Restore from ' + file + '? This will overwrite current files.')) {
        return;
      }
      await runCommand('restore/' + file);
    }
    
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        if (data.success) {
          statusEl.innerHTML = '<strong>Version:</strong> ' + (data.appVersion || 'Unknown') + 
            ' | <strong>Commit:</strong> ' + (data.git?.hash || 'Unknown');
        }
      } catch (err) {
        statusEl.textContent = 'Could not load status';
      }
    }
    
    loadStatus();
    loadBackups();
  </script>
</body>
</html>`;

function runScript(args) {
  try {
    const output = execSync(`bash ${MANAGE_SCRIPT} ${args}`, {
      encoding: 'utf8',
      timeout: 300000, // 5 min
      maxBuffer: 10 * 1024 * 1024
    });
    return { success: true, output };
  } catch (err) {
    return { 
      success: false, 
      error: err.message,
      output: err.stdout || '',
      stderr: err.stderr || ''
    };
  }
}

function getStatus() {
  try {
    const versionFile = path.join(DEPLOY_DIR, 'src/lib/version.ts');
    let appVersion = 'Unknown';
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, 'utf8');
      const match = content.match(/VERSION\s*=\s*["']([^"']+)/);
      if (match) appVersion = match[1];
    }
    
    let git = null;
    try {
      const hash = execSync('git log -1 --format=%h', { cwd: DEPLOY_DIR, encoding: 'utf8' }).trim();
      const message = execSync('git log -1 --format=%s', { cwd: DEPLOY_DIR, encoding: 'utf8' }).trim();
      const date = execSync('git log -1 --format=%ci', { cwd: DEPLOY_DIR, encoding: 'utf8' }).trim();
      git = { hash, message, date };
    } catch (e) {}
    
    return { success: true, appVersion, git, serverVersion: '2.0' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return { success: true, backups: [] };
    }
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.tar.gz'))
      .map(filename => {
        const stat = fs.statSync(path.join(BACKUP_DIR, filename));
        const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
        return {
          filename,
          size: stat.size,
          sizeFormatted: sizeMB + ' MB',
          created: stat.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return { success: true, backups: files };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Serve HTML page
  if (pathname === '/' || pathname === '/console') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_PAGE);
    return;
  }
  
  // API routes
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    const parts = pathname.replace('/api/', '').split('/');
    const command = parts[0];
    const arg = parts[1] || '';
    
    let result;
    
    switch (command) {
      case 'status':
        result = getStatus();
        break;
      case 'list':
        result = listBackups();
        break;
      case 'deploy':
        result = runScript('deploy');
        break;
      case 'backup':
        result = runScript('backup');
        break;
      case 'restore':
        if (!arg) {
          result = { success: false, error: 'No backup file specified' };
        } else {
          result = runScript(`restore ${arg}`);
        }
        break;
      case 'schedule':
        result = runScript(`schedule ${arg || 'daily'}`);
        break;
      default:
        result = { success: false, error: 'Unknown command: ' + command };
    }
    
    res.writeHead(200);
    res.end(JSON.stringify(result));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`JAC VPS Console running at http://127.0.0.1:${PORT}`);
  console.log('');
  console.log('To access externally, add to nginx:');
  console.log('  location /console { proxy_pass http://127.0.0.1:' + PORT + '/; }');
});
