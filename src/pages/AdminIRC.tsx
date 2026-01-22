import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Server, Terminal, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AdminIRC = () => {
  const { user, isOwner, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || (!isOwner && !isAdmin))) {
      navigate("/");
    }
  }, [user, isOwner, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const projectId = "hliytlezggzryetekpvo";
  const wsUrl = `wss://${projectId}.supabase.co/functions/v1/irc-gateway`;
  const httpUrl = `https://${projectId}.supabase.co/functions/v1/irc-gateway`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Server className="h-6 w-6" />
              IRC Gateway
            </h1>
            <p className="text-muted-foreground">Connect with external IRC clients</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Connection Information
            </CardTitle>
            <CardDescription>
              Use these details to connect with IRC clients like mIRC, HexChat, WeeChat, or Irssi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">WebSocket URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                  {wsUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(wsUrl, "WebSocket URL")}
                >
                  {copied === "WebSocket URL" ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">HTTP Info Endpoint</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                  {httpUrl}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(httpUrl, "HTTP URL")}
                >
                  {copied === "HTTP URL" ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={httpUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>How to connect using your IRC client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">For WebSocket-capable clients (webircgateway, KiwiIRC):</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Configure WebSocket URL: <code className="bg-muted px-1.5 py-0.5 rounded">{wsUrl}</code></li>
                <li>Set server password to: <code className="bg-muted px-1.5 py-0.5 rounded">your-email@example.com:your-password</code></li>
                <li>Connect and enjoy!</li>
              </ol>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-medium">IRC Commands Reference:</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">PASS email:pass</code>
                  <span className="text-muted-foreground">Authenticate with your JAC credentials</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">NICK nickname</code>
                  <span className="text-muted-foreground">Set your nickname</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">/list</code>
                  <span className="text-muted-foreground">List available channels</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">/join #channel</code>
                  <span className="text-muted-foreground">Join a channel</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">/part #channel</code>
                  <span className="text-muted-foreground">Leave a channel</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">/whois nick</code>
                  <span className="text-muted-foreground">Get info about a user</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">/msg nick message</code>
                  <span className="text-muted-foreground">Send a private message</span>
                </div>
                <div className="flex gap-4">
                  <code className="bg-muted px-2 py-1 rounded min-w-32">/quit</code>
                  <span className="text-muted-foreground">Disconnect</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-2">Supported IRC Clients:</h4>
              <div className="flex flex-wrap gap-2">
                {["KiwiIRC", "The Lounge", "IRCCloud", "Convos", "Quassel", "weechat-relay"].map((client) => (
                  <span key={client} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                    {client}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Traditional IRC clients (mIRC, HexChat, Irssi) require a WebSocket-to-IRC proxy like webircgateway
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminIRC;
