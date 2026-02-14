import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, Download, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface MircSetupPackageProps {
  isDownloadingZip: boolean;
  setIsDownloadingZip: (value: boolean) => void;
}

const MircSetupPackage = ({ isDownloadingZip, setIsDownloadingZip }: MircSetupPackageProps) => {
  const [serverAddress, setServerAddress] = useState("24.199.122.60");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Escape $ for mIRC scripts (must be doubled)
  const escapeForMirc = (str: string) => str.replace(/\$/g, '$$$$');

  const generateServersIni = () => {
    const server = serverAddress || "127.0.0.1";
    // mIRC servers.ini format
    return `[servers]
n0=Justachat:JAC ChatSERVER:${server}:6667GROUP:JAC

[networks]
n0=JAC Chat
`;
  };

  const generateMircScript = () => {
    const server = serverAddress || "127.0.0.1";
    const escapedEmail = escapeForMirc(email || "your-email@example.com");
    const escapedPassword = escapeForMirc(password || "your-password");
    const nick = nickname || "YourNick";

    return `; ========================================
; JAC Chat - mIRC Auto-Login Script
; ========================================
; 
; INSTALLATION:
; 1. Open mIRC
; 2. Press Alt+R to open Remote Scripts
; 3. File -> Load -> Select this file (jac-auto.mrc)
; 4. Type /jac to connect!
;
; COMMANDS:
;   /jac        - Connect to JAC Chat
;   /jac.rooms  - List all channels
;   /jac.help   - Show help
;
; ========================================

; --- Configuration ---
; Edit these values with your actual credentials
; IMPORTANT: If your password contains $, you must DOUBLE it!
; Example: Password "Test$123" becomes "Test$$123" in this script

alias -l jac.server { return ${server} }
alias -l jac.port { return 6667 }
alias -l jac.email { return ${escapedEmail} }
alias -l jac.pass { return ${escapedPassword} }
alias -l jac.nick { return ${nick} }

; --- Main Connect Command ---
alias jac {
  echo -a 4[JAC] Connecting to JAC Chat...
  server -m $jac.server $jac.port
}

; --- Auto-Login on Connect ---
on *:CONNECT:{
  if ($server == $jac.server) {
    ; Build auth string
    var %auth = $jac.email $+ : $+ $jac.pass
    
    ; Send IRC registration
    raw -q PASS %auth
    raw -q NICK $jac.nick
    raw -q USER $jac.nick 0 * :JAC Chat User
    
    ; Start keepalive timer (prevents timeout disconnects)
    .timerjac.keepalive 0 90 raw -q PING :keepalive
    
    echo -a 3[JAC] Logged in as $jac.nick
  }
}

; --- Auto-Reconnect ---
on *:DISCONNECT:{
  if ($server == $jac.server) {
    .timerjac.keepalive off
    echo -a 7[JAC] Disconnected. Reconnecting in 10 seconds...
    .timerjac.reconnect 1 10 jac
  }
}

; --- Handle server PING (backup) ---
on *:PING:{
  raw -q PONG $1-
}

; --- Helper Commands ---
alias jac.rooms {
  if ($status != connected) {
    echo -a 4[JAC] Not connected! Type /jac to connect first.
    return
  }
  raw LIST
}

alias jac.help {
  echo -a 12========================================
  echo -a 12 JAC Chat - mIRC Script Help
  echo -a 12========================================
  echo -a  
  echo -a 3Commands:
  echo -a   /jac        - Connect to JAC Chat
  echo -a   /jac.rooms  - List available channels
  echo -a   /jac.help   - Show this help
  echo -a  
  echo -a 3Quick Tips:
  echo -a   - Type /join #general to join General chat
  echo -a   - Type /join #lounge for the Lounge
  echo -a   - Type /msg NickName message for private messages
  echo -a   - Type /whois NickName to see user info
  echo -a  
  echo -a 7Server: $jac.server : $+ $jac.port
  echo -a 12========================================
}

; --- Welcome message on script load ---
on *:LOAD:{
  echo -a 12========================================
  echo -a 12 JAC Chat Script Loaded!
  echo -a 12========================================
  echo -a 3Type /jac to connect
  echo -a 3Type /jac.help for more commands
  echo -a 12========================================
}

; --- End of Script ---
`;
  };

  const generateReadme = () => {
    return `========================================
JAC Chat - mIRC Setup Package
========================================

This package contains everything you need to connect mIRC to JAC Chat.

INCLUDED FILES:
  - servers.ini     Server configuration (optional)
  - jac-auto.mrc    Auto-login script with commands

QUICK SETUP (Recommended):
1. Open mIRC
2. Press Alt+R to open "Remote Scripts"
3. Click File -> Load
4. Select "jac-auto.mrc" from this folder
5. Close the Remote window
6. Type /jac in mIRC to connect!

ALTERNATIVE SETUP (servers.ini):
1. Close mIRC completely
2. Copy servers.ini to your mIRC folder
   (Usually C:\\Users\\YourName\\AppData\\Roaming\\mIRC)
3. Open mIRC and connect to "JAC Chat" from server list

COMMANDS AFTER LOADING SCRIPT:
  /jac        - Connect to JAC Chat
  /jac.rooms  - List all available channels
  /jac.help   - Show help and tips

CHANGING YOUR CREDENTIALS:
1. Press Alt+R in mIRC to open Remote Scripts
2. Find and edit the jac-auto.mrc file
3. Update your email and password in the configuration section
4. IMPORTANT: If your password contains $, double it ($ becomes $$)

TROUBLESHOOTING:
- "Password incorrect" - Check email/password in the script
- Keeps disconnecting - Make sure the proxy server is running
- Can't load script - Make sure file extension is .mrc

========================================
`;
  };

  const downloadMircPackage = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    if (!nickname) {
      toast.error("Please enter a nickname");
      return;
    }

    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      
      zip.file("servers.ini", generateServersIni());
      zip.file("jac-auto.mrc", generateMircScript());
      zip.file("README.txt", generateReadme());
      
      const content = await zip.generateAsync({ type: "blob" });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jac-mirc-setup.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Downloaded jac-mirc-setup.zip - Load jac-auto.mrc in mIRC and type /jac to connect!");
    } catch (err) {
      console.error("Failed to create mIRC package:", err);
      toast.error("Failed to create package");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          mIRC One-Click Setup Package
        </CardTitle>
        <CardDescription>
          Generate a personalized mIRC script with auto-login. Just load the script and type <code className="bg-muted px-1 rounded">/jac</code>!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="server">Server Address</Label>
            <Input
              id="server"
              placeholder="24.199.122.60 or 127.0.0.1"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              placeholder="YourNickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={downloadMircPackage}
          size="lg"
          className="w-full"
          disabled={isDownloadingZip}
        >
          {isDownloadingZip ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Package...</>
          ) : (
            <><Archive className="mr-2 h-5 w-5" /> Download mIRC Setup Package</>
          )}
        </Button>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium">After downloading:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Extract the ZIP file</li>
            <li>Open mIRC and press <kbd className="px-1 py-0.5 bg-background rounded text-xs">Alt+R</kbd></li>
            <li>Click <strong>File → Load</strong> and select <code className="bg-background px-1 rounded">jac-auto.mrc</code></li>
            <li>Type <code className="bg-background px-1 rounded">/jac</code> to connect!</li>
          </ol>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <strong>Note:</strong> Your credentials are embedded in the script file. Keep it private and don't share it.
        </div>
      </CardContent>
    </Card>
  );
};

export default MircSetupPackage;
