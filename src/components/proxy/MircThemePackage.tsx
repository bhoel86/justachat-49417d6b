import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, Loader2, Eye, EyeOff, Sparkles, Radio, Smile, Zap, Palette, Command, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { generateThemeScript, generateMircReadme, generateServersIni, generateUpdaterBat, generateJacConfigIni, THEME_VERSION, type MircPackageConfig } from "@/lib/mircThemeGenerator";
import { Badge } from "@/components/ui/badge";

interface MircThemePackageProps {
  isDownloadingZip: boolean;
  setIsDownloadingZip: (value: boolean) => void;
}

const MircThemePackage = ({ isDownloadingZip, setIsDownloadingZip }: MircThemePackageProps) => {
  const [serverAddress, setServerAddress] = useState("24.199.122.60");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const downloadThemePackage = async () => {
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
      const config: MircPackageConfig = {
        serverAddress,
        email,
        password,
        nickname,
        radioStreamUrl: "https://justachat.net"
      };

      const zip = new JSZip();
      
      // Main theme script with credentials
      zip.file("jac-2026-theme.mrc", generateThemeScript(config));

      // Persisted credentials file (NOT overwritten by updater)
      zip.file("jac-config.ini", generateJacConfigIni(config));
      
      // 1-click updater
      zip.file("jac-updater.bat", generateUpdaterBat());
      
      // Server configuration
      zip.file("servers.ini", generateServersIni(serverAddress));
      
      // README
      zip.file("README.txt", generateMircReadme());
      
      const content = await zip.generateAsync({ type: "blob" });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jac-2026-mirc-theme.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Downloaded JAC 2026 Theme! Load jac-2026-theme.mrc and type /jac");
    } catch (err) {
      console.error("Failed to create theme package:", err);
      toast.error("Failed to create package");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const downloadUpdaterOnly = () => {
    const updater = generateUpdaterBat();
    const blob = new Blob([updater], { type: "application/x-batch" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jac-updater.bat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded updater! Run it to get the latest theme.");
  };

  const features = [
    { icon: Palette, label: "Dark Theme", desc: "Matches web" },
    { icon: Smile, label: "Emoji Picker", desc: "4 categories" },
    { icon: Zap, label: "User Actions", desc: "Slap, hug..." },
    { icon: Command, label: "Quick Cmds", desc: "One-click" },
    { icon: Palette, label: "Formatter", desc: "Colors" },
    { icon: Radio, label: "Radio", desc: "Embedded" },
  ];

  return (
    <Card className="border-primary relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            JAC 2026 mIRC Theme
          </CardTitle>
          <Badge variant="secondary" className="text-xs">v{THEME_VERSION}</Badge>
        </div>
        <CardDescription>
          Complete mIRC customization with dark theme, emoji picker, user actions, radio player & 1-click updater
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Feature grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 text-center">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Credentials form */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme-server">Server</Label>
            <Input
              id="theme-server"
              placeholder="24.199.122.60"
              value={serverAddress}
              onChange={(e) => setServerAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-nickname">Nickname</Label>
            <Input
              id="theme-nickname"
              placeholder="YourNickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme-email">Email</Label>
            <Input
              id="theme-email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-password">Password</Label>
            <div className="relative">
              <Input
                id="theme-password"
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

        {/* Download buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={downloadThemePackage}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            disabled={isDownloadingZip}
          >
            {isDownloadingZip ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
            ) : (
              <><Archive className="mr-2 h-5 w-5" /> Download Full Package</>
            )}
          </Button>
          
          <Button
            onClick={downloadUpdaterOnly}
            size="lg"
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-5 w-5" /> 1-Click Updater Only
          </Button>
        </div>

        {/* Quick start */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick Start:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>Extract ZIP and load <code className="bg-background px-1 rounded">jac-2026-theme.mrc</code> in mIRC (Alt+R)</li>
            <li>Type <code className="bg-background px-1 rounded">/jac</code> to connect!</li>
            <li>Run <code className="bg-background px-1 rounded">jac-updater.bat</code> anytime for updates</li>
          </ol>
        </div>

        {/* Commands preview */}
        <div className="flex flex-wrap gap-2">
          {["/jac", "/jac.emoji", "/jac.actions", "/jac.commands", "/jac.format", "/jac.radio", "/jac.update"].map(cmd => (
            <code key={cmd} className="text-xs bg-muted px-2 py-1 rounded font-mono">{cmd}</code>
          ))}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          <strong>Note:</strong> Credentials are embedded in the script. Keep it private.
        </div>
      </CardContent>
    </Card>
  );
};

export default MircThemePackage;
