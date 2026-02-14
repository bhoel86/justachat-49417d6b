/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import { ArrowLeft, Server, Lock, Hash, User, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageSEO from "@/components/seo/PageSEO";
import { ValentinesFloatingHearts } from "@/components/theme/ValentinesFloatingHearts";
import { StPatricksFloatingIcons } from "@/components/theme/StPatricksFloatingIcons";
import { MatrixFloatingCode } from "@/components/theme/MatrixFloatingCode";
import SiteFooter from "@/components/layout/SiteFooter";

const MircConnect = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <PageSEO
        title="Connect with mIRC"
        description="How to connect to JustAChat using mIRC. Step-by-step setup guide with server details, NickServ commands, and our custom theme package."
        path="/mirc"
        keywords="mirc setup, irc connection, justachat irc, mirc theme, irc client setup, nickserv"
      />

      {/* Theme floating decorations */}
      <ValentinesFloatingHearts />
      <StPatricksFloatingIcons />
      <MatrixFloatingCode />

      {/* Header */}
      <div className="bg-primary text-primary-foreground py-3 px-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded flex items-center justify-center">
              <span className="font-bold text-sm">mIRC</span>
            </div>
            <h1 className="text-xl font-bold">Connect to Justachat with mIRC</h1>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/lobby" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Lobby
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Server Info Card */}
        <Card className="mb-6">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-2 px-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Server className="w-4 h-4" />
              Server Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 border border-border p-3 rounded-lg">
              <p className="text-sm font-bold text-primary mb-1">Server Address:</p>
              <code className="text-lg font-mono bg-accent/20 px-2 py-1 rounded border border-border">24.199.122.60</code>
            </div>
            <div className="bg-muted/50 border border-border p-3 rounded-lg">
              <p className="text-sm font-bold text-primary mb-1">Port:</p>
              <code className="text-lg font-mono bg-accent/20 px-2 py-1 rounded border border-border">6667</code>
            </div>
          </CardContent>
        </Card>

        {/* Step by Step Guide */}
        <Card className="mb-6">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-2 px-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Step-by-Step Connection Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Step 1 */}
            <div className="bg-card border border-border p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary mb-2">Open mIRC and go to Options</h3>
                  <p className="text-sm text-muted-foreground mb-3">Press <kbd className="bg-muted px-2 py-0.5 border border-border font-mono text-xs rounded">Alt + O</kbd> or go to <strong>Tools → Options</strong></p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary mb-2">Add Justachat Server</h3>
                  <p className="text-sm text-muted-foreground mb-3">In the <strong>Connect → Servers</strong> section, click <strong>Add</strong> and enter:</p>
                  <div className="bg-muted/50 border border-border p-3 font-mono text-sm space-y-1 rounded-lg">
                    <p><span className="text-muted-foreground">Description:</span> <span className="text-primary">Justachat</span></p>
                    <p><span className="text-muted-foreground">IRC Server:</span> <span className="text-primary">24.199.122.60</span></p>
                    <p><span className="text-muted-foreground">Ports:</span> <span className="text-primary">6667</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Set Your Nickname
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">In <strong>Connect → Options</strong>, set your <strong>Nickname</strong> to match your Justachat username.</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-card border border-border p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Connect
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">Click <strong>Connect</strong>. You can also type:</p>
                  <div className="bg-foreground text-background font-mono p-3 rounded-lg text-sm">
                    <p>/server 24.199.122.60 6667</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-card border border-border p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold shrink-0">5</div>
                <div className="flex-1">
                  <h3 className="font-bold text-accent-foreground mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Identify with NickServ
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">Once connected, identify yourself to start chatting:</p>
                  <div className="bg-foreground text-background font-mono p-3 rounded-lg text-sm">
                    <p>/msg NickServ IDENTIFY your-password</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">This uses your nickname to find your account — just enter your password.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NickServ Commands */}
        <Card className="mb-6">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-2 px-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              NickServ Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-foreground text-background font-mono text-sm p-4 rounded-b-lg space-y-2">
              <p><span className="text-accent">/msg NickServ IDENTIFY &lt;password&gt;</span> - Log in to your account</p>
              <p><span className="text-accent">/msg NickServ REGISTER &lt;email&gt; &lt;password&gt;</span> - Create a new account</p>
              <p><span className="text-accent">/msg NickServ SET PASSWORD &lt;new-password&gt;</span> - Change your password</p>
              <p><span className="text-accent">/msg NickServ INFO [nickname]</span> - View registration info</p>
              <p><span className="text-accent">/msg NickServ HELP</span> - Show available commands</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Command Reference */}
        <Card className="mb-6">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-2 px-3">
            <CardTitle className="text-sm font-bold">Quick Commands</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-foreground text-background font-mono text-sm p-4 rounded-b-lg space-y-1">
              <p><span className="text-accent">/join #channel</span> - Join a channel</p>
              <p><span className="text-accent">/part #channel</span> - Leave a channel</p>
              <p><span className="text-accent">/msg nickname message</span> - Send a private message</p>
              <p><span className="text-accent">/nick newnickname</span> - Change your nickname</p>
              <p><span className="text-accent">/quit</span> - Disconnect from the server</p>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mb-6">
          <CardHeader className="bg-destructive text-destructive-foreground rounded-t-lg py-2 px-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="bg-card border border-border p-3 rounded-lg">
              <p className="font-bold text-sm text-destructive">Connection Refused?</p>
              <p className="text-sm text-muted-foreground">Make sure you're using port <strong>6667</strong>.</p>
            </div>
            <div className="bg-card border border-border p-3 rounded-lg">
              <p className="font-bold text-sm text-destructive">NickServ says "not registered"?</p>
              <p className="text-sm text-muted-foreground">Make sure your <strong>nickname</strong> matches your Justachat username exactly, then try <code className="bg-muted px-1 rounded">/msg NickServ IDENTIFY password</code>.</p>
            </div>
            <div className="bg-card border border-border p-3 rounded-lg">
              <p className="font-bold text-sm text-destructive">Don't have an account?</p>
              <p className="text-sm text-muted-foreground">Register directly from mIRC: <code className="bg-muted px-1 rounded">/msg NickServ REGISTER email password</code></p>
            </div>
            <div className="bg-card border border-border p-3 rounded-lg">
              <p className="font-bold text-sm text-destructive">Need Help?</p>
              <p className="text-sm text-muted-foreground">Join <strong>#help</strong> in the web client or email <a href="mailto:support@justachat.net" className="text-primary underline">support@justachat.net</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Login */}
        <Card className="mb-6">
          <CardHeader className="bg-muted rounded-t-lg py-2 px-3">
            <CardTitle className="text-sm font-bold text-muted-foreground">Alternative: PASS Login</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">You can also authenticate using the PASS command before connecting:</p>
            <div className="bg-foreground text-background font-mono p-3 rounded-lg text-sm">
              <p>PASS email;password</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Set this in mIRC's <strong>Connect → Options → Password</strong> field using a semicolon separator.</p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          <p>Don't have an account? <Link to="/login" className="text-primary underline">Sign up on the web</Link> or register via <code className="bg-muted px-1 rounded">/msg NickServ REGISTER</code></p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default MircConnect;
