/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import MircThemePackage from "@/components/proxy/MircThemePackage";

const DownloadProxy = () => {
  const [isDownloadingTheme, setIsDownloadingTheme] = useState(false);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Lobby
        </Link>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Connect with mIRC</h1>
          <p className="text-muted-foreground">Use your favorite IRC client to chat on Justachat™</p>
        </div>

        {/* Connection Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Details</CardTitle>
            <CardDescription>Use these settings to connect mIRC or any IRC client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground min-w-24 font-medium">Server:</span>
                <code className="bg-background px-3 py-1 rounded border font-mono">157.245.174.197</code>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground min-w-24 font-medium">Port:</span>
                <code className="bg-background px-3 py-1 rounded border font-mono">6667</code>
                <span className="text-xs text-muted-foreground">(or 6697 for SSL)</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground min-w-24 font-medium">Password:</span>
                <code className="bg-background px-3 py-1 rounded border font-mono text-xs sm:text-sm">username@email.com:password</code>
              </div>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
              <p className="font-medium text-primary mb-2">💡 Password Format</p>
              <p className="text-muted-foreground">
                Your server password is your <strong>JAC email</strong> and <strong>account password</strong> separated by a colon.
              </p>
              <p className="text-muted-foreground mt-1">
                Example: <code className="bg-background px-1.5 py-0.5 rounded">myname@gmail.com:MySecretPass123</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Package Download */}
        <MircThemePackage 
          isDownloadingZip={isDownloadingTheme} 
          setIsDownloadingZip={setIsDownloadingTheme} 
        />

        {/* Manual Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Manual mIRC Setup</CardTitle>
            <CardDescription>Step-by-step instructions if you prefer to configure manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal list-inside space-y-3">
              <li>Open mIRC and press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Alt+O</kbd> to open Options</li>
              <li>Navigate to <strong>Connect → Servers</strong></li>
              <li>Click <strong>Add</strong> and fill in:
                <div className="ml-6 mt-2 space-y-1 text-muted-foreground">
                  <div>Description: <code className="bg-muted px-1 rounded">Justachat</code></div>
                  <div>Address: <code className="bg-muted px-1 rounded">157.245.174.197</code></div>
                  <div>Port: <code className="bg-muted px-1 rounded">6667</code></div>
                  <div>Password: <code className="bg-muted px-1 rounded">username@email.com:password</code></div>
                </div>
              </li>
              <li>Click <strong>Add</strong>, then <strong>Select</strong>, then <strong>Connect</strong></li>
            </ol>

            <div className="border-t pt-4 mt-4 space-y-3">
              <p className="font-medium">No-script quick connect (type in the status window)</p>
              <p className="text-muted-foreground text-xs">
                If you don't want to use any script, you must either set the <strong>Password</strong> field in your server entry
                (recommended), or connect with <code className="bg-muted px-1 rounded">/server</code> including the password.
                If mIRC connects without sending PASS right away, you'll get disconnected ("timed out").
              </p>

              <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-2">
                <div>
                  <span className="text-muted-foreground">Non-SSL:</span>
                  <code className="block mt-1 text-foreground">/server 157.245.174.197 6667 username@email.com:password</code>
                </div>
                <div className="border-t border-border pt-2">
                  <span className="text-muted-foreground">SSL:</span>
                  <code className="block mt-1 text-foreground">/server -ssl 157.245.174.197 6697 username@email.com:password</code>
                </div>
                <div className="border-t border-border pt-2">
                  <span className="text-muted-foreground">Then join a room:</span>
                  <code className="block mt-1 text-foreground">/join #general</code>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                <strong>Important:</strong> the <code className="bg-muted px-1 rounded">/join</code> command is only for after you're connected.
                It won't log you in.
              </p>
            </div>
            
            <div className="border-t pt-4 mt-4 space-y-3">
              <p className="font-medium text-sm">⚠️ Important: Password Escaping in Scripts</p>
              <p className="text-muted-foreground text-xs">
                If your password contains <code className="bg-muted px-1 rounded">$</code> characters, 
                you must <strong>double each $</strong> in mIRC scripts and Perform blocks:
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2 font-mono">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Example password: <code className="text-foreground">MyPass$$123</code></span>
                  <span className="text-muted-foreground">In mIRC script: <code className="text-primary">MyPass$$$$123</code></span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Command in script:</span>
                  <code className="block mt-1 text-primary">/raw -q PASS username@email.com:MyPass$$$$123</code>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                <strong>Note:</strong> When typing directly in the mIRC status window (not in a script), use your password as-is without doubling.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Supported Clients */}
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-center text-sm text-muted-foreground">
              Works with <strong>mIRC</strong>, <strong>HexChat</strong>, <strong>irssi</strong>, and other IRC clients
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DownloadProxy;
