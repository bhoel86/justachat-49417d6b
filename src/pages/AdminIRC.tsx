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
  Clock, Lock, Unlock, Megaphone, UserX, Globe, MapPin, Flag
} from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import IRCTestClient from "@/components/admin/IRCTestClient";
import { IRCLogViewer } from "@/components/admin/IRCLogViewer";
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
  country?: string;
  countryCode?: string;
  city?: string;
}

interface AllowlistEntry {
  ip: string;
  label: string;
  addedAt: string;
  addedBy: string;
}

interface GeoIPStats {
  enabled: boolean;
  mode: string;
  countries: string[];
  cacheSize: number;
  lookups: number;
  cacheHits: number;
  blocked: number;
  allowed: number;
  failOpen: boolean;
  cache: Record<string, { country: string; countryCode: string; city: string; cachedAt: number }>;
}

const AdminIRC = () => {
  const { user, isOwner, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  
  // Proxy admin state - load from localStorage
  const [proxyUrl, setProxyUrl] = useState(() => 
    localStorage.getItem('irc_proxy_url') || "http://localhost:6680"
  );
  const [adminToken, setAdminToken] = useState(() => 
    localStorage.getItem('irc_admin_token') || ""
  );
  const [status, setStatus] = useState<ProxyStatus | null>(null);
  const [connections, setConnections] = useState<ProxyConnection[]>([]);
  const [bans, setBans] = useState<string[]>([]);
  const [geoipStats, setGeoipStats] = useState<GeoIPStats | null>(null);
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [banIpInput, setBanIpInput] = useState("");
  const [allowlistIpInput, setAllowlistIpInput] = useState("");
  const [myIp, setMyIp] = useState<string | null>(null);
  const [isUnbanningMyIp, setIsUnbanningMyIp] = useState(false);
  const [allowlistLabelInput, setAllowlistLabelInput] = useState("Admin");

  // Persist proxy URL and token to localStorage
  useEffect(() => {
    localStorage.setItem('irc_proxy_url', proxyUrl);
  }, [proxyUrl]);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('irc_admin_token', adminToken);
    }
  }, [adminToken]);

  useEffect(() => {
    if (!loading && (!user || (!isOwner && !isAdmin))) {
      navigate("/");
    }
  }, [user, isOwner, isAdmin, loading, navigate]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${proxyUrl}/status`, {
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setIsConnected(true);
        toast.success("Connected to IRC proxy");
        return true;
      } else {
        toast.error(`Proxy returned ${res.status}: ${res.statusText}`);
        setIsConnected(false);
      }
    } catch (e) {
      const error = e as Error;
      if (error.name === 'TimeoutError') {
        toast.error("Connection timed out", {
          description: "Check that the proxy URL is correct and accessible"
        });
      } else if (error.message?.includes('Failed to fetch')) {
        toast.error("Cannot reach proxy", {
          description: "CORS issue or proxy is offline. Ensure the proxy allows requests from this domain."
        });
      } else {
        toast.error("Connection failed", {
          description: error.message || "Unknown error"
        });
      }
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

  const fetchGeoIP = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${proxyUrl}/geoip`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGeoipStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch GeoIP stats:", e);
    }
  }, [proxyUrl, adminToken]);

  const fetchAllowlist = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${proxyUrl}/allowlist`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllowlist(data.allowlist || []);
      }
    } catch (e) {
      console.error("Failed to fetch allowlist:", e);
    }
  }, [proxyUrl, adminToken]);

  const refreshAll = useCallback(async () => {
    if (!proxyUrl.trim()) {
      toast.error("Please enter a Proxy Admin URL");
      return;
    }
    setIsLoading(true);
    toast.loading("Connecting to proxy...", { id: "proxy-connect" });
    const connected = await fetchStatus();
    toast.dismiss("proxy-connect");
    if (connected && adminToken) {
      await Promise.all([fetchConnections(), fetchBans(), fetchGeoIP(), fetchAllowlist()]);
    }
    setIsLoading(false);
  }, [fetchStatus, fetchConnections, fetchBans, fetchGeoIP, fetchAllowlist, adminToken, proxyUrl]);

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

  const addToAllowlist = async (ip: string, label: string) => {
    try {
      const res = await fetch(`${proxyUrl}/allowlist`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip, label })
      });
      if (res.ok) {
        toast.success(`Added ${ip} to allowlist`);
        setAllowlistIpInput("");
        await Promise.all([fetchAllowlist(), fetchBans()]);
      } else {
        toast.error("Failed to add to allowlist");
      }
    } catch (e) {
      toast.error("Failed to add to allowlist");
    }
  };

  const removeFromAllowlist = async (ip: string) => {
    try {
      const res = await fetch(`${proxyUrl}/allowlist`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip })
      });
      if (res.ok) {
        toast.success(`Removed ${ip} from allowlist`);
        await fetchAllowlist();
      } else {
        toast.error("Failed to remove from allowlist");
      }
    } catch (e) {
      toast.error("Failed to remove from allowlist");
    }
  };

  const detectMyIp = async (): Promise<string | null> => {
    try {
      // Try multiple IP detection services for reliability
      const services = [
        'https://api.ipify.org?format=json',
        'https://api.my-ip.io/v2/ip.json',
      ];
      
      for (const service of services) {
        try {
          const res = await fetch(service, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json();
            const ip = data.ip || data.IP;
            if (ip) {
              setMyIp(ip);
              return ip;
            }
          }
        } catch {
          continue;
        }
      }
      return null;
    } catch (e) {
      console.error("Failed to detect IP:", e);
      return null;
    }
  };

  const unbanAndAllowlistMyIp = async () => {
    setIsUnbanningMyIp(true);
    try {
      // Detect user's current IP
      const ip = myIp || await detectMyIp();
      if (!ip) {
        toast.error("Could not detect your IP address");
        return;
      }

      // Check if IP is currently banned
      const isBanned = bans.includes(ip);
      
      // Unban if needed
      if (isBanned) {
        const unbanRes = await fetch(`${proxyUrl}/unban`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ip })
        });
        if (!unbanRes.ok) {
          toast.error(`Failed to unban IP: ${ip}`);
          return;
        }
      }

      // Add to allowlist
      const isAllowlisted = allowlist.some(e => e.ip === ip);
      if (!isAllowlisted) {
        const allowRes = await fetch(`${proxyUrl}/allowlist`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ip, label: `Admin (${user?.email?.split('@')[0] || 'self'})` })
        });
        if (!allowRes.ok) {
          toast.error(`Failed to allowlist IP: ${ip}`);
          return;
        }
      }

      // Refresh data
      await Promise.all([fetchBans(), fetchAllowlist()]);
      
      if (isBanned && !isAllowlisted) {
        toast.success(`Unbanned & allowlisted your IP: ${ip}`);
      } else if (isBanned) {
        toast.success(`Unbanned your IP: ${ip}`);
      } else if (!isAllowlisted) {
        toast.success(`Allowlisted your IP: ${ip}`);
      } else {
        toast.info(`Your IP (${ip}) is already allowlisted`);
      }
    } catch (e) {
      toast.error("Failed to unban/allowlist your IP");
    } finally {
      setIsUnbanningMyIp(false);
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

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getCountryBreakdown = () => {
    if (!geoipStats?.cache) return [];
    const countryCounts: Record<string, { count: number; country: string; code: string }> = {};
    
    // Count from cache
    Object.values(geoipStats.cache).forEach((entry) => {
      const code = entry.countryCode;
      if (code) {
        if (!countryCounts[code]) {
          countryCounts[code] = { count: 0, country: entry.country, code };
        }
        countryCounts[code].count++;
      }
    });

    // Also count from active connections
    connections.forEach((conn) => {
      if (conn.countryCode) {
        if (!countryCounts[conn.countryCode]) {
          countryCounts[conn.countryCode] = { count: 0, country: conn.country || conn.countryCode, code: conn.countryCode };
        }
      }
    });

    return Object.values(countryCounts).sort((a, b) => b.count - a.count);
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
                    <TableHead>Location</TableHead>
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
                        {conn.countryCode ? (
                          <div className="flex items-center gap-1">
                            <span className="text-lg" title={conn.country}>
                              {getFlagEmoji(conn.countryCode)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {conn.city || conn.country || conn.countryCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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

        {/* Admin/Owner Allowlist - Exempt from rate-limiting & auto-bans */}
        {isConnected && adminToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Allowlist ({allowlist.length})
              </CardTitle>
              <CardDescription>
                IPs on this list are exempt from rate-limiting, auto-bans, and GeoIP blocks. Use for admin/owner IPs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick unban/allowlist my IP button */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Button 
                  onClick={unbanAndAllowlistMyIp} 
                  disabled={isUnbanningMyIp}
                  variant="default"
                  className="flex-shrink-0"
                >
                  {isUnbanningMyIp ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Unban & Allowlist My IP
                </Button>
                <span className="text-sm text-muted-foreground">
                  {myIp ? (
                    <>Your detected IP: <code className="font-mono text-foreground">{myIp}</code></>
                  ) : (
                    <>Quickly unban your current IP and add it to the allowlist</>
                  )}
                </span>
              </div>

              <div className="flex gap-2">
                <Input 
                  value={allowlistIpInput}
                  onChange={(e) => setAllowlistIpInput(e.target.value)}
                  placeholder="IP address..."
                  className="flex-1"
                />
                <Input 
                  value={allowlistLabelInput}
                  onChange={(e) => setAllowlistLabelInput(e.target.value)}
                  placeholder="Label (e.g. Admin)"
                  className="w-40"
                />
                <Button onClick={() => addToAllowlist(allowlistIpInput, allowlistLabelInput)} disabled={!allowlistIpInput.trim()}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {allowlist.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowlist.map((entry) => (
                    <Badge key={entry.ip} variant="default" className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30">
                      <Shield className="h-3 w-3" />
                      {entry.ip}
                      <span className="text-xs opacity-70">({entry.label})</span>
                      <button 
                        onClick={() => removeFromAllowlist(entry.ip)}
                        className="ml-1 hover:bg-primary/30 rounded p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {allowlist.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No IPs allowlisted. Add admin/owner IPs here to prevent accidental rate-limit bans.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* GeoIP Stats */}
        {isConnected && adminToken && geoipStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                GeoIP Statistics
                <Badge variant={geoipStats.enabled ? "default" : "secondary"} className="ml-2">
                  {geoipStats.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                {geoipStats.enabled && (
                  <Badge variant={geoipStats.mode === 'block' ? "destructive" : "outline"}>
                    Mode: {geoipStats.mode}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Lookups</span>
                    </div>
                    <p className="text-2xl font-bold">{geoipStats.lookups}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Cache Hits</span>
                    </div>
                    <p className="text-2xl font-bold">{geoipStats.cacheHits}</p>
                    <p className="text-xs text-muted-foreground">
                      {geoipStats.lookups > 0 
                        ? `${Math.round((geoipStats.cacheHits / geoipStats.lookups) * 100)}% hit rate`
                        : 'No lookups yet'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Allowed</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{geoipStats.allowed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">Blocked</span>
                    </div>
                    <p className="text-2xl font-bold text-destructive">{geoipStats.blocked}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Country Filter List */}
              {geoipStats.enabled && geoipStats.countries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    {geoipStats.mode === 'block' ? 'Blocked Countries' : 'Allowed Countries'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {geoipStats.countries.map((code) => (
                      <Badge 
                        key={code} 
                        variant={geoipStats.mode === 'block' ? "destructive" : "default"}
                        className="flex items-center gap-1"
                      >
                        <span className="text-sm">{getFlagEmoji(code)}</span>
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Breakdown */}
              {getCountryBreakdown().length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Connection Origins (from cache)
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {getCountryBreakdown().slice(0, 12).map((item) => (
                      <div 
                        key={item.code} 
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFlagEmoji(item.code)}</span>
                          <span className="text-sm font-medium">{item.country}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuration Info */}
              <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                <p>Cache size: {geoipStats.cacheSize} entries</p>
                <p>Fail-open: {geoipStats.failOpen ? 'Yes (allows on lookup failure)' : 'No (blocks on lookup failure)'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log Viewer */}
        <IRCLogViewer 
          proxyUrl={proxyUrl} 
          adminToken={adminToken} 
          isConnected={isConnected} 
        />

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
