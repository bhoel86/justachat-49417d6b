import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileCode, FileText, Terminal, Server, Copy, CheckCircle, RefreshCw, AlertTriangle, Check, X, Loader2, Archive } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import JSZip from "jszip";

// Current version - must match proxy.js PROXY_VERSION
const LATEST_VERSION = '2.2.0';

const proxyJs = `/**
 * JAC IRC Proxy - WebSocket to TCP Bridge
 * Allows mIRC and other traditional IRC clients to connect to JAC
 * 
 * Usage: node proxy.js
 * Then connect mIRC to 127.0.0.1:6667
 */

const net = require('net');
const WebSocket = require('ws');

const LOCAL_PORT = 6667;
const WS_URL = 'wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway';

const server = net.createServer((socket) => {
  console.log('[+] New IRC client connected');
  
  let ws = null;
  let buffer = '';
  
  // Connect to JAC WebSocket
  try {
    ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
      console.log('[+] Connected to JAC IRC Gateway');
    });
    
    ws.on('message', (data) => {
      const message = data.toString();
      console.log('[JAC->IRC]', message.trim());
      socket.write(message);
    });
    
    ws.on('close', () => {
      console.log('[-] JAC connection closed');
      socket.end();
    });
    
    ws.on('error', (err) => {
      console.error('[!] WebSocket error:', err.message);
      socket.end();
    });
  } catch (err) {
    console.error('[!] Failed to connect to JAC:', err.message);
    socket.end();
    return;
  }
  
  // Handle IRC client data
  socket.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\\r\\n');
    buffer = lines.pop(); // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        console.log('[IRC->JAC]', line);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(line);
        }
      }
    }
  });
  
  socket.on('close', () => {
    console.log('[-] IRC client disconnected');
    if (ws) ws.close();
  });
  
  socket.on('error', (err) => {
    console.error('[!] Socket error:', err.message);
    if (ws) ws.close();
  });
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  console.log('='.repeat(50));
  console.log('JAC IRC Proxy Started');
  console.log('='.repeat(50));
  console.log('');
  console.log('mIRC Settings:');
  console.log('  Server: 127.0.0.1');
  console.log('  Port: 6667');
  console.log('  Password: your-email@example.com:your-password');
  console.log('');
  console.log('Waiting for connections...');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('[!] Port 6667 is already in use. Close other IRC servers first.');
  } else {
    console.error('[!] Server error:', err.message);
  }
  process.exit(1);
});`;

const packageJson = `{
  "name": "jac-irc-proxy",
  "version": "2.2.0",
  "description": "WebSocket to TCP proxy for connecting mIRC to JAC - supports local and VPS hosting",
  "main": "proxy.js",
  "scripts": {
    "start": "node proxy.js",
    "start:public": "HOST=0.0.0.0 node proxy.js",
    "start:debug": "LOG_LEVEL=debug node proxy.js"
  },
  "dependencies": {
    "ws": "^8.14.2"
  },
  "optionalDependencies": {
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}`;

const installBat = `@echo off
echo ========================================
echo JAC IRC Proxy - Installation
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo Choose the LTS version, run the installer,
    echo then run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.
echo Installing dependencies...
call npm install
echo.
echo ========================================
echo Installation complete!
echo.
echo Now run START.bat to start the proxy
echo ========================================
pause`;

const startBat = `@echo off
echo ========================================
echo JAC IRC Proxy
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Run install.bat first or download from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [!] Dependencies not installed. Running install first...
    call npm install
    echo.
)

echo Starting proxy...
echo.
node proxy.js
pause`;

const readmeTxt = `========================================
JAC IRC Proxy - Connect mIRC to JAC
========================================

REQUIREMENTS:
- Node.js (https://nodejs.org/ - download LTS version)

SETUP (one-time):
1. Install Node.js from https://nodejs.org/
2. Double-click "install.bat"

USAGE:
1. Double-click "START.bat" (keep this window open)
2. Open mIRC
3. Connect to:
   - Server: 127.0.0.1
   - Port: 6667
   - Password: your-email@example.com:your-password
   
   Example password: john@example.com:MyPassword123

MIRC SETUP:
1. Open mIRC
2. Press Alt+O to open Options
3. Under "Connect" > "Servers", click "Add"
4. Fill in:
   - Description: JAC Chat
   - Address: 127.0.0.1
   - Port: 6667
   - Password: your-email@example.com:your-password
5. Click "Add", then "Select", then "Connect"

TROUBLESHOOTING:
- "Node.js not installed" - Download from nodejs.org
- "Port 6667 in use" - Close other IRC servers
- "Connection failed" - Make sure START.bat is running

========================================`;

const DownloadProxy = () => {
  const [copied, setCopied] = useState(false);
  const [proxyHost, setProxyHost] = useState('');
  const [versionStatus, setVersionStatus] = useState<'idle' | 'checking' | 'current' | 'outdated' | 'error'>('idle');
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    downloadFile('proxy.js', proxyJs);
    setTimeout(() => downloadFile('package.json', packageJson), 100);
    setTimeout(() => downloadFile('install.bat', installBat), 200);
    setTimeout(() => downloadFile('START.bat', startBat), 300);
    setTimeout(() => downloadFile('README.txt', readmeTxt), 400);
  };

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const downloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      // Fetch the actual production proxy.js from public folder
      const proxyResponse = await fetch('/irc-proxy/proxy.js');
      const actualProxyJs = proxyResponse.ok ? await proxyResponse.text() : proxyJs;
      
      const pkgResponse = await fetch('/irc-proxy/package.json');
      const actualPackageJson = pkgResponse.ok ? await pkgResponse.text() : packageJson;

      const zip = new JSZip();
      
      // Add all files to the zip
      zip.file('proxy.js', actualProxyJs);
      zip.file('package.json', actualPackageJson);
      zip.file('install.bat', installBat);
      zip.file('START.bat', startBat);
      zip.file('README.txt', readmeTxt);
      
      // Generate the zip
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download it
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jac-irc-proxy.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Downloaded jac-irc-proxy.zip');
    } catch (err) {
      console.error('Failed to create zip:', err);
      toast.error('Failed to create zip file');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const downloadVpsZip = async () => {
    setIsDownloadingZip(true);
    try {
      // Fetch the actual production files
      const proxyResponse = await fetch('/irc-proxy/proxy.js');
      const actualProxyJs = proxyResponse.ok ? await proxyResponse.text() : '';
      
      const pkgResponse = await fetch('/irc-proxy/package.json');
      const actualPackageJson = pkgResponse.ok ? await pkgResponse.text() : '';

      if (!actualProxyJs || !actualPackageJson) {
        throw new Error('Could not fetch proxy files');
      }

      const dockerCompose = `version: "3.8"
services:
  irc-proxy:
    image: node:20-alpine
    container_name: irc_proxy_1
    working_dir: /app
    volumes:
      - ./proxy.js:/app/proxy.js:ro
      - ./package.json:/app/package.json:ro
      - ./node_modules:/app/node_modules
    command: sh -c "npm install --silent && node proxy.js"
    ports:
      - "6667:6667"
      - "6697:6697"
      - "6680:6680"
    environment:
      - HOST=0.0.0.0
    restart: unless-stopped
`;

      const installSh = `#!/bin/bash
# JAC IRC Proxy - VPS Install Script
set -e

echo "========================================"
echo "JAC IRC Proxy Installer"
echo "========================================"

# Install deps in container
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine npm install

# Remove old container if exists
docker rm -f irc_proxy_1 2>/dev/null || true

# Start container
docker run -d \\
  --name irc_proxy_1 \\
  --restart unless-stopped \\
  -v "$(pwd)/proxy.js:/app/proxy.js:ro" \\
  -v "$(pwd)/package.json:/app/package.json:ro" \\
  -v "$(pwd)/node_modules:/app/node_modules" \\
  -w /app \\
  -e HOST=0.0.0.0 \\
  -p 6667:6667 \\
  -p 6697:6697 \\
  -p 6680:6680 \\
  node:20-alpine node proxy.js

echo ""
echo "========================================"
echo "IRC Proxy Started!"
echo "========================================"
echo ""
echo "Connect mIRC to:"
echo "  Server: $(curl -s ifconfig.me || echo 'your-server-ip')"
echo "  Port: 6667"
echo "  Password: email@example.com:password"
echo ""
docker logs --tail=20 irc_proxy_1
`;

      const vpsReadme = `JAC IRC Proxy - VPS Installation
=================================

REQUIREMENTS:
- VPS with Docker installed
- Ports 6667, 6697, 6680 open

INSTALLATION:
1. Upload this entire folder to your VPS (e.g., ~/jac-irc-proxy)
2. cd ~/jac-irc-proxy
3. chmod +x install.sh
4. ./install.sh

MANUAL INSTALLATION (if script fails):
  docker run --rm -v "$(pwd):/app" -w /app node:20-alpine npm install
  
  docker run -d --name irc_proxy_1 --restart unless-stopped \\
    -v "$(pwd)/proxy.js:/app/proxy.js:ro" \\
    -v "$(pwd)/package.json:/app/package.json:ro" \\
    -v "$(pwd)/node_modules:/app/node_modules" \\
    -w /app -e HOST=0.0.0.0 \\
    -p 6667:6667 -p 6697:6697 -p 6680:6680 \\
    node:20-alpine node proxy.js

MANAGEMENT:
  View logs:    docker logs -f irc_proxy_1
  Restart:      docker restart irc_proxy_1
  Stop:         docker stop irc_proxy_1
  Start:        docker start irc_proxy_1
  Remove:       docker rm -f irc_proxy_1

USER CONNECTION:
  Server: your-vps-ip
  Port: 6667 (or 6697 for SSL)
  Password: email@example.com:password
`;

      const zip = new JSZip();
      zip.file('proxy.js', actualProxyJs);
      zip.file('package.json', actualPackageJson);
      zip.file('docker-compose.yml', dockerCompose);
      zip.file('install.sh', installSh);
      zip.file('README.txt', vpsReadme);
      
      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jac-irc-proxy-vps.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Downloaded jac-irc-proxy-vps.zip');
    } catch (err) {
      console.error('Failed to create VPS zip:', err);
      toast.error('Failed to create VPS zip file');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const deployCommand = 'curl -sSL https://justachat.net/irc-proxy/deploy.sh | bash';

  const copyCommand = () => {
    navigator.clipboard.writeText(deployCommand);
    setCopied(true);
    toast.success('Command copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const checkVersion = async () => {
    if (!proxyHost.trim()) {
      toast.error('Please enter your VPS IP or domain');
      return;
    }

    setVersionStatus('checking');
    setRemoteVersion(null);

    try {
      // Try admin port 6680 for status endpoint
      const host = proxyHost.trim().replace(/^https?:\/\//, '').replace(/:\d+$/, '');
      const statusUrl = `http://${host}:6680/status`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(statusUrl, { 
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      const version = data.version;

      if (!version) {
        // Old proxy without version field
        setVersionStatus('outdated');
        setRemoteVersion('< 2.2.0');
        toast.warning('Your proxy is outdated and needs an update');
      } else {
        setRemoteVersion(version);
        if (version === LATEST_VERSION) {
          setVersionStatus('current');
          toast.success('Your proxy is up to date!');
        } else if (compareVersions(version, LATEST_VERSION) < 0) {
          setVersionStatus('outdated');
          toast.warning(`Update available: ${version} → ${LATEST_VERSION}`);
        } else {
          setVersionStatus('current');
          toast.success('Your proxy is up to date!');
        }
      }
    } catch (err: any) {
      console.error('Version check failed:', err);
      setVersionStatus('error');
      if (err.name === 'AbortError') {
        toast.error('Connection timed out. Make sure port 6680 is open.');
      } else {
        toast.error('Could not connect to proxy. Check IP/domain and ensure port 6680 is accessible.');
      }
    }
  };

  // Simple version comparison: returns -1 if a < b, 0 if equal, 1 if a > b
  const compareVersions = (a: string, b: string): number => {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA < numB) return -1;
      if (numA > numB) return 1;
    }
    return 0;
  };

  const getVersionBadge = () => {
    switch (versionStatus) {
      case 'checking':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking...</Badge>;
      case 'current':
        return <Badge variant="default" className="gap-1 bg-primary text-primary-foreground"><Check className="h-3 w-3" /> Up to date ({remoteVersion})</Badge>;
      case 'outdated':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Update needed ({remoteVersion} → {LATEST_VERSION})</Badge>;
      case 'error':
        return <Badge variant="outline" className="gap-1 text-destructive border-destructive"><X className="h-3 w-3" /> Connection failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Justachat™ IRC Proxy</h1>
          <p className="text-muted-foreground">Connect mIRC, HexChat, and other IRC clients to Justachat</p>
        </div>

        <Tabs defaultValue="vps" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vps" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              VPS Deployment (Recommended)
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Local Proxy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vps" className="space-y-4 mt-4">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  One-Command VPS Deployment
                </CardTitle>
                <CardDescription>
                  Deploy to your VPS and all mIRC users can connect directly - no downloads needed for users!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm font-medium">SSH into your VPS and run:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background p-3 rounded border text-sm font-mono break-all">
                      {deployCommand}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyCommand}>
                      {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">What this does:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Installs Docker if not present</li>
                    <li>Downloads and configures the IRC proxy</li>
                    <li>Starts the proxy on ports 6667 (IRC) and 6697 (SSL)</li>
                    <li>Opens firewall ports automatically</li>
                    <li>Generates a secure admin token</li>
                  </ul>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm">After installation, users connect with:</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground min-w-20">Server:</span>
                      <code className="bg-muted px-2 py-0.5 rounded">your-vps-ip</code>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground min-w-20">Port:</span>
                      <code className="bg-muted px-2 py-0.5 rounded">6667</code>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground min-w-20">Password:</span>
                      <code className="bg-muted px-2 py-0.5 rounded">email@example.com:password</code>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-3">
                  Recommended VPS providers: DigitalOcean ($4/mo), Vultr, Hetzner, Linode
                </div>
              </CardContent>
            </Card>

            {/* Download VPS ZIP Card */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Alternative: Download VPS Bundle
                </CardTitle>
                <CardDescription>
                  Having trouble with copy-paste? Download a verified ZIP with all files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={downloadVpsZip} 
                  size="lg" 
                  variant="outline"
                  className="w-full"
                  disabled={isDownloadingZip}
                >
                  {isDownloadingZip ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating ZIP...</>
                  ) : (
                    <><Archive className="mr-2 h-5 w-5" /> Download jac-irc-proxy-vps.zip</>
                  )}
                </Button>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium">After downloading:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Upload the extracted folder to your VPS via SFTP (FileZilla, WinSCP)</li>
                    <li>SSH into your VPS and <code className="bg-muted px-1 rounded">cd</code> to the folder</li>
                    <li>Run: <code className="bg-muted px-1 rounded">chmod +x install.sh && ./install.sh</code></li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p><strong>Included files:</strong></p>
                  <ul className="grid grid-cols-2 gap-1 text-muted-foreground">
                    <li>• proxy.js (v{LATEST_VERSION})</li>
                    <li>• package.json</li>
                    <li>• docker-compose.yml</li>
                    <li>• install.sh</li>
                    <li>• README.txt</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Version Check Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Check for Updates
                    </CardTitle>
                    <CardDescription>
                      Verify your VPS proxy is running the latest version (v{LATEST_VERSION})
                    </CardDescription>
                  </div>
                  {getVersionBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter VPS IP or domain (e.g., 157.245.174.197)"
                    value={proxyHost}
                    onChange={(e) => setProxyHost(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkVersion()}
                  />
                  <Button 
                    onClick={checkVersion} 
                    disabled={versionStatus === 'checking'}
                    className="shrink-0"
                  >
                    {versionStatus === 'checking' ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" /> Check Version</>
                    )}
                  </Button>
                </div>

                {versionStatus === 'outdated' && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-destructive">Your proxy needs an update!</p>
                    <p className="text-sm text-muted-foreground">
                      SSH into your VPS and run the update command:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background p-3 rounded border text-sm font-mono break-all">
                        cd ~/jac-irc-proxy && curl -O https://justachat.lovable.app/irc-proxy/proxy.js && docker compose restart
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText('cd ~/jac-irc-proxy && curl -O https://justachat.lovable.app/irc-proxy/proxy.js && docker compose restart');
                          toast.success('Update command copied!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {versionStatus === 'current' && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <p className="text-sm flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Your proxy is running the latest version. No action needed.</span>
                    </p>
                  </div>
                )}

                {versionStatus === 'error' && (
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">Troubleshooting:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Make sure the proxy is running on your VPS</li>
                      <li>Ensure port <code className="bg-background px-1 rounded">6680</code> is open in your firewall</li>
                      <li>Check that you entered the correct IP/domain</li>
                      <li>Try: <code className="bg-background px-1 rounded">docker ps</code> to verify the container is running</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="local" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-primary" />
                  Download Local Proxy
                </CardTitle>
                <CardDescription>
                  Run the proxy on your own computer (each user needs to download and run this)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={downloadZip} 
                  size="lg" 
                  className="w-full"
                  disabled={isDownloadingZip}
                >
                  {isDownloadingZip ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating ZIP...</>
                  ) : (
                    <><Archive className="mr-2 h-5 w-5" /> Download jac-irc-proxy.zip (Recommended)</>
                  )}
                </Button>
                
                <Button onClick={downloadAll} size="lg" variant="outline" className="w-full">
                  <Download className="mr-2 h-5 w-5" />
                  Download Individual Files (5 files)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Individual Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => downloadFile('proxy.js', proxyJs)}>
                  <FileCode className="mr-2 h-4 w-4" />
                  proxy.js
                  <span className="ml-auto text-muted-foreground text-sm">Main proxy script</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => downloadFile('package.json', packageJson)}>
                  <FileCode className="mr-2 h-4 w-4" />
                  package.json
                  <span className="ml-auto text-muted-foreground text-sm">Dependencies</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => downloadFile('install.bat', installBat)}>
                  <Terminal className="mr-2 h-4 w-4" />
                  install.bat
                  <span className="ml-auto text-muted-foreground text-sm">Run first</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => downloadFile('START.bat', startBat)}>
                  <Terminal className="mr-2 h-4 w-4" />
                  START.bat
                  <span className="ml-auto text-muted-foreground text-sm">Run to start proxy</span>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => downloadFile('README.txt', readmeTxt)}>
                  <FileText className="mr-2 h-4 w-4" />
                  README.txt
                  <span className="ml-auto text-muted-foreground text-sm">Instructions</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Setup (Local)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Download all files to a new folder (e.g., <code className="bg-muted px-1 rounded">C:\JAC-Proxy</code>)</li>
                  <li>Install <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Node.js LTS</a> if you don't have it</li>
                  <li>Double-click <strong>install.bat</strong> (one time only)</li>
                  <li>Double-click <strong>START.bat</strong> to run the proxy</li>
                  <li>Connect mIRC to <strong>127.0.0.1:6667</strong> with password <strong>email:password</strong></li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* mIRC Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>mIRC Setup Guide</CardTitle>
            <CardDescription>Step-by-step instructions for configuring mIRC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal list-inside space-y-3">
              <li>Open mIRC and press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt+O</kbd> to open Options</li>
              <li>Navigate to <strong>Connect → Servers</strong></li>
              <li>Click <strong>Add</strong> and fill in:
                <div className="ml-6 mt-2 space-y-1 text-muted-foreground">
                  <div>Description: <code className="bg-muted px-1 rounded">Justachat</code></div>
                  <div>Address: <code className="bg-muted px-1 rounded">your-server-ip</code> or <code className="bg-muted px-1 rounded">127.0.0.1</code></div>
                  <div>Port: <code className="bg-muted px-1 rounded">6667</code></div>
                  <div>Password: <code className="bg-muted px-1 rounded">your-email@example.com:your-password</code></div>
                </div>
              </li>
              <li>Click <strong>Add</strong>, then <strong>Select</strong>, then <strong>Connect</strong></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DownloadProxy;
