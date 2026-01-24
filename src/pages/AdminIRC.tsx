import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Server, Terminal, Copy, CheckCircle, ExternalLink, 
  Users, Shield, Ban, Wifi, WifiOff, RefreshCw, Send,
  Clock, Lock, Unlock, Megaphone, UserX
} from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import IRCTestClient from "@/components/admin/IRCTestClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProxyStatus {
  uptime: number;
  connections: number;
  totalConnections: number;
  bannedIPs: number;
  ssl: boolean;
}

interface ProxyConnection {
  id: number;
  ip: string;
  port: number;
  secure: boolean;
  nickname: string | null;
  username: string | null;
  authenticated: boolean;
  connected: string;
  messageCount: number;
  duration: number;
}

const AdminIRC = () => {
  const { user, isOwner, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  
  // Proxy admin state
  const [proxyUrl, setProxyUrl] = useState("http://localhost:6680");
  const [adminToken, setAdminToken] = useState("");
  const [status, setStatus] = useState<ProxyStatus | null>(null);
  const [connections, setConnections] = useState<ProxyConnection[]>([]);
  const [bans, setBans] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [banIpInput, setBanIpInput] = useState("");

  useEffect(() => {
    if (!loading && (!user || (!isOwner && !isAdmin))) {
      navigate("/");
    }
  }, [user, isOwner, isAdmin, loading, navigate]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${proxyUrl}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setIsConnected(true);
        return true;
      }
    } catch (e) {
      setIsConnected(false);
    }
    return false;
  }, [proxyUrl]);

  const fetchConnections = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${proxyUrl}/connections`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (e) {
      console.error("Failed to fetch connections:", e);
    }
  }, [proxyUrl, adminToken]);

  const fetchBans = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${proxyUrl}/bans`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBans(data.bans || []);
      }
    } catch (e) {
      console.error("Failed to fetch bans:", e);
    }
  }, [proxyUrl, adminToken]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await fetchStatus();
    if (adminToken) {
      await Promise.all([fetchConnections(), fetchBans()]);
    }
    setIsLoading(false);
  }, [fetchStatus, fetchConnections, fetchBans, adminToken]);

  // Auto-refresh every 5 seconds when connected
  useEffect(() => {
    if (isConnected && adminToken) {
      const interval = setInterval(refreshAll, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, adminToken, refreshAll]);

  const kickConnection = async (id: number) => {
    try {
      const res = await fetch(`${proxyUrl}/kick/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        toast.success(`Kicked connection #${id}`);
        await fetchConnections();
      } else {
        toast.error("Failed to kick connection");
      }
    } catch (e) {
      toast.error("Failed to kick connection");
    }
  };

  const banIP = async (ip: string, kickExisting = true) => {
    try {
      const res = await fetch(`${proxyUrl}/ban`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip, kickExisting })
      });
      if (res.ok) {
        toast.success(`Banned IP: ${ip}`);
        setBanIpInput("");
        await Promise.all([fetchConnections(), fetchBans()]);
      } else {
        toast.error("Failed to ban IP");
      }
    } catch (e) {
      toast.error("Failed to ban IP");
    }
  };

  const unbanIP = async (ip: string) => {
    try {
      const res = await fetch(`${proxyUrl}/unban`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip })
      });
      if (res.ok) {
        toast.success(`Unbanned IP: ${ip}`);
        await fetchBans();
      } else {
        toast.error("Failed to unban IP");
      }
    } catch (e) {
      toast.error("Failed to unban IP");
    }
  };

  const broadcast = async () => {
    if (!broadcastMessage.trim()) return;
    try {
      const res = await fetch(`${proxyUrl}/broadcast`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: broadcastMessage })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Broadcast sent to ${data.sent} connections`);
        setBroadcastMessage("");
      } else {
        toast.error("Failed to broadcast");
      }
    } catch (e) {
      toast.error("Failed to broadcast");
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

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

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="h-6 w-6" />
            IRC Gateway
          </h1>
          <p className="text-muted-foreground">Connect with external IRC clients and manage proxy connections</p>
        </div>

        {/* Proxy Admin Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Proxy Administration
            </CardTitle>
            <CardDescription>
              Connect to your IRC proxy's admin API to manage connections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Proxy Admin URL</Label>
                <Input 
                  value={proxyUrl} 
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="http://your-vps:6680"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Token</Label>
                <Input 
                  type="password"
                  value={adminToken} 
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="Your ADMIN_TOKEN"
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={refreshAll} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : isConnected ? (
                    <Wifi className="h-4 w-4 mr-2" />
                  ) : (
                    <WifiOff className="h-4 w-4 mr-2" />
                  )}
                  {isConnected ? 'Refresh' : 'Connect'}
                </Button>
              </div>
            </div>

            {/* Status Cards */}
            {status && (
              <div className="grid gap-4 md:grid-cols-4 pt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Connected</span>
                    </div>
                    <p className="text-2xl font-bold">{status.connections}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Uptime</span>
                    </div>
                    <p className="text-2xl font-bold">{formatDuration(status.uptime)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">Banned IPs</span>
                    </div>
                    <p className="text-2xl font-bold">{status.bannedIPs}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      {status.ssl ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm text-muted-foreground">SSL</span>
                    </div>
                    <p className="text-2xl font-bold">{status.ssl ? 'Enabled' : 'Disabled'}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Broadcast */}
            {isConnected && adminToken && (
              <div className="flex gap-2 pt-4">
                <Input 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Broadcast message to all connected clients..."
                  onKeyDown={(e) => e.key === 'Enter' && broadcast()}
                />
                <Button onClick={broadcast} disabled={!broadcastMessage.trim()}>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Broadcast
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Users */}
        {isConnected && adminToken && connections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connected Users ({connections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nickname</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((conn) => (
                    <TableRow key={conn.id}>
                      <TableCell className="font-mono">#{conn.id}</TableCell>
                      <TableCell>
                        {conn.nickname || <span className="text-muted-foreground">-</span>}
                        {conn.authenticated && (
                          <Badge variant="outline" className="ml-2 text-xs">Auth</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{conn.ip}</TableCell>
                      <TableCell>
                        <Badge variant={conn.secure ? "default" : "secondary"}>
                          {conn.secure ? 'SSL' : 'TCP'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(conn.duration)}</TableCell>
                      <TableCell>{conn.messageCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => kickConnection(conn.id)}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Ban className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ban IP Address?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will ban {conn.ip} and disconnect the user. They won't be able to reconnect until unbanned.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => banIP(conn.ip)}>
                                  Ban IP
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Banned IPs */}
        {isConnected && adminToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Banned IPs ({bans.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={banIpInput}
                  onChange={(e) => setBanIpInput(e.target.value)}
                  placeholder="IP address to ban..."
                />
                <Button onClick={() => banIP(banIpInput)} disabled={!banIpInput.trim()}>
                  <Ban className="h-4 w-4 mr-2" />
                  Ban
                </Button>
              </div>
              
              {bans.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bans.map((ip) => (
                    <Badge key={ip} variant="destructive" className="flex items-center gap-1">
                      {ip}
                      <button 
                        onClick={() => unbanIP(ip)}
                        className="ml-1 hover:bg-destructive-foreground/20 rounded p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Built-in Test Client */}
        <IRCTestClient />

        {/* Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Connection Information
            </CardTitle>
            <CardDescription>
              WebSocket gateway for IRC clients
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
                  {copied === "WebSocket URL" ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">HTTP Info Endpoint</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                  {httpUrl}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(httpUrl, "HTTP URL")}>
                  {copied === "HTTP URL" ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={httpUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>How to connect using your IRC client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">For WebSocket-capable clients:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Configure WebSocket URL: <code className="bg-muted px-1.5 py-0.5 rounded">{wsUrl}</code></li>
                <li>Set server password to: <code className="bg-muted px-1.5 py-0.5 rounded">your-email@example.com:your-password</code></li>
                <li>Connect and enjoy!</li>
              </ol>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="font-medium">IRC Commands Reference:</h4>
              <div className="grid gap-2 text-sm">
                {[
                  { cmd: "PASS email:pass", desc: "Authenticate with your JAC credentials" },
                  { cmd: "NICK nickname", desc: "Set your nickname" },
                  { cmd: "/list", desc: "List available channels" },
                  { cmd: "/join #channel", desc: "Join a channel" },
                  { cmd: "/part #channel", desc: "Leave a channel" },
                  { cmd: "/whois nick", desc: "Get info about a user" },
                  { cmd: "/msg nick message", desc: "Send a private message" },
                  { cmd: "/quit", desc: "Disconnect" },
                ].map(({ cmd, desc }) => (
                  <div key={cmd} className="flex gap-4">
                    <code className="bg-muted px-2 py-1 rounded min-w-32">{cmd}</code>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-2">Supported IRC Clients:</h4>
              <div className="flex flex-wrap gap-2">
                {["KiwiIRC", "The Lounge", "IRCCloud", "Convos", "Quassel", "mIRC*", "HexChat*"].map((client) => (
                  <span key={client} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                    {client}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Requires the TCP proxy - download from <a href="/download-proxy" className="text-primary hover:underline">/download-proxy</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminIRC;
