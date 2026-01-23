import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileCode, FileText, Terminal } from "lucide-react";

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
  "version": "1.0.0",
  "description": "WebSocket to TCP proxy for connecting mIRC to JAC",
  "main": "proxy.js",
  "scripts": {
    "start": "node proxy.js"
  },
  "dependencies": {
    "ws": "^8.14.2"
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">JAC IRC Proxy</h1>
          <p className="text-muted-foreground">Download files to connect mIRC to JAC</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download All Files
            </CardTitle>
            <CardDescription>
              Download all proxy files to a folder, then run install.bat followed by START.bat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={downloadAll} size="lg" className="w-full">
              <Download className="mr-2 h-5 w-5" />
              Download All (5 files)
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
            <CardTitle>Quick Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>Download all files to a new folder (e.g., <code className="bg-muted px-1 rounded">C:\JAC-Proxy</code>)</li>
              <li>Install <a href="https://nodejs.org/" target="_blank" className="text-primary underline">Node.js LTS</a> if you don't have it</li>
              <li>Double-click <strong>install.bat</strong> (one time only)</li>
              <li>Double-click <strong>START.bat</strong> to run the proxy</li>
              <li>Connect mIRC to <strong>127.0.0.1:6667</strong> with password <strong>email:password</strong></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DownloadProxy;
