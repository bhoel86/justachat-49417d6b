/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { restSelect, restDelete, restInsert } from "@/lib/supabaseRest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Clock, User, Trash2, RefreshCw, Plus, Globe, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logModerationAction } from "@/lib/moderationAudit";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface KlineRecord {
  id: string;
  ip_pattern: string;
  reason: string | null;
  set_by: string;
  expires_at: string | null;
  created_at: string;
  set_by_profile?: { username: string };
}

const AdminKlines = () => {
  const { user, session, loading, isOwner, isAdmin } = useAuth();
  const [klines, setKlines] = useState<KlineRecord[]>([]);
  const [klinesLoading, setKlinesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPattern, setNewPattern] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);
  const token = session?.access_token;

  const fetchKlines = async () => {
    try {
      const klineData = await restSelect<any>('klines', 'select=*&order=created_at.desc', token);

      const userIds = [...new Set(klineData.map((k: any) => k.set_by).filter(Boolean))];
      const profiles = userIds.length > 0
        ? await restSelect<any>('profiles', `select=user_id,username&user_id=in.(${userIds.join(',')})`, token)
        : [];

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.username]));

      const klinesWithProfiles = klineData.map((kline: any) => ({
        ...kline,
        set_by_profile: kline.set_by ? { username: profileMap.get(kline.set_by) || 'Unknown' } : undefined
      }));

      setKlines(klinesWithProfiles);
    } catch (error) {
      console.error('Error fetching K-lines:', error);
      toast.error('Failed to load K-lines');
    } finally {
      setKlinesLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isOwner) fetchKlines();
  }, [isAdmin, isOwner]);

  const handleRemoveKline = async (klineId: string, ipPattern: string) => {
    if (!user) return;
    try {
      const ok = await restDelete('klines', `id=eq.${klineId}`, token);
      if (!ok) throw new Error('Delete failed');

      await logModerationAction({ action: 'remove_kline', moderatorId: user.id, targetUsername: ipPattern });
      toast.success(`K-line removed for ${ipPattern}`);
      fetchKlines();
    } catch (error) {
      toast.error('Failed to remove K-line');
    }
  };

  const handleAddKline = async () => {
    if (!user || !newPattern.trim()) { toast.error('Please enter an IP pattern'); return; }
    const validPattern = newPattern.includes("*") || newPattern.match(/^[\d.]+$/);
    if (!validPattern) { toast.error('Invalid IP pattern. Use IP address or wildcards (e.g., 192.168.*.* or 10.0.0.1)'); return; }

    setAdding(true);
    try {
      await restInsert('klines', {
        ip_pattern: newPattern.trim(),
        set_by: user.id,
        reason: newReason.trim() || 'No reason given',
        expires_at: null,
      }, token);

      await logModerationAction({ action: 'add_kline', moderatorId: user.id, targetUsername: newPattern.trim(), reason: newReason.trim() || undefined });
      toast.success(`K-line added for ${newPattern}`);
      setNewPattern(""); setNewReason(""); setAddDialogOpen(false);
      fetchKlines();
    } catch (error) {
      toast.error('Failed to add K-line');
    } finally {
      setAdding(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchKlines(); };

  if (loading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-primary">Loading...</div></div>);
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isOwner) return <Navigate to="/lobby" replace />;

  const activeKlines = klines.filter(k => !k.expires_at || new Date(k.expires_at) > new Date());
  const expiredKlines = klines.filter(k => k.expires_at && new Date(k.expires_at) <= new Date());

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-destructive" />K-Lines (Global IP Bans)</h1>
            <p className="text-sm text-muted-foreground">Manage network-wide IP address bans</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add K-Line</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add K-Line</DialogTitle>
                  <DialogDescription>Ban an IP address or pattern from the entire network. Use wildcards (*) for ranges.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="pattern">IP Pattern</Label>
                    <Input id="pattern" placeholder="192.168.1.* or 10.0.0.1" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Examples: 192.168.*.* (subnet), 10.0.0.1 (single IP)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea id="reason" placeholder="Reason for the K-line..." value={newReason} onChange={(e) => setNewReason(e.target.value)} rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddKline} disabled={adding}>{adding ? "Adding..." : "Add K-Line"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>

        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Network-Wide Ban</p>
                <p className="text-sm text-muted-foreground">K-lines are enforced across all servers and connections. Users matching these patterns will be unable to connect via web or IRC.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active K-Lines</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{activeKlines.length}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expired K-Lines</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-muted-foreground">{expiredKlines.length}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />K-Line List</CardTitle>
            <CardDescription>Global IP bans enforced on both web and IRC connections</CardDescription>
          </CardHeader>
          <CardContent>
            {klinesLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-pulse text-muted-foreground">Loading K-lines...</div></div>
            ) : klines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No K-lines configured</p></div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {klines.map((kline) => {
                    const isExpired = kline.expires_at && new Date(kline.expires_at) <= new Date();
                    return (
                      <div key={kline.id} className={`p-4 rounded-lg border ${isExpired ? 'bg-muted/30 border-muted' : 'bg-destructive/5 border-destructive/20'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isExpired ? 'bg-muted text-muted-foreground' : 'bg-destructive/20 text-destructive'}`}><Globe className="h-5 w-5" /></div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <code className="font-mono font-medium text-destructive">{kline.ip_pattern}</code>
                                {isExpired ? <Badge variant="secondary">Expired</Badge> : <Badge variant="destructive">Active</Badge>}
                              </div>
                              {kline.reason && <p className="text-sm text-muted-foreground">{kline.reason}</p>}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" />By: {kline.set_by_profile?.username || 'System'}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(kline.created_at), 'MMM d, yyyy')}</span>
                                {kline.expires_at ? <span>Expires: {format(new Date(kline.expires_at), 'MMM d, yyyy')}</span> : <span className="text-destructive font-medium">Permanent</span>}
                              </div>
                            </div>
                          </div>
                          {!isExpired && (
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveKline(kline.id, kline.ip_pattern)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">IRC Commands</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><code className="bg-muted px-1 rounded">/KLINE</code> - List all K-lines</p>
            <p><code className="bg-muted px-1 rounded">/KLINE &lt;host&gt; :reason</code> - Add a K-line</p>
            <p><code className="bg-muted px-1 rounded">/UNKLINE &lt;host&gt;</code> - Remove a K-line</p>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminKlines;
