import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Ban, Clock, User, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logModerationAction } from "@/lib/moderationAudit";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface BanRecord {
  id: string;
  user_id: string;
  reason: string | null;
  banned_by: string | null;
  expires_at: string | null;
  created_at: string;
  profiles?: { username: string };
  banned_by_profile?: { username: string };
}

const AdminBans = () => {
  const { user, loading, isOwner, isAdmin, isModerator } = useAuth();
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [bansLoading, setBansLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBans = async () => {
    try {
      const { data: banData, error } = await supabase
        .from('bans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames
      const userIds = [...new Set([
        ...(banData?.map(b => b.user_id) || []),
        ...(banData?.map(b => b.banned_by).filter(Boolean) || [])
      ])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]));

      const bansWithProfiles = banData?.map(ban => ({
        ...ban,
        profiles: { username: profileMap.get(ban.user_id) || 'Unknown' },
        banned_by_profile: ban.banned_by ? { username: profileMap.get(ban.banned_by) || 'Unknown' } : undefined
      })) || [];

      setBans(bansWithProfiles);
    } catch (error) {
      console.error('Error fetching bans:', error);
      toast.error('Failed to load bans');
    } finally {
      setBansLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isModerator) {
      fetchBans();
    }
  }, [isModerator]);

  const handleUnban = async (banId: string, username: string, targetUserId: string) => {
    if (!user) return;
    
    try {
      // Check target user's role - admins cannot unban other admins
      const { data: targetRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      const targetRole = targetRoleData?.role || 'user';
      if (targetRole === 'admin' && !isOwner) {
        toast.error('Only owners can manage admin bans');
        return;
      }

      const { error } = await supabase
        .from('bans')
        .delete()
        .eq('id', banId);

      if (error) throw error;

      // Log the unban action
      await logModerationAction({
        action: 'unban_user',
        moderatorId: user.id,
        targetUserId,
        targetUsername: username,
      });

      toast.success(`${username} has been unbanned`);
      fetchBans();
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBans();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  if (!isModerator) {
    return <Navigate to="/" replace />;
  }

  const activeBans = bans.filter(b => !b.expires_at || new Date(b.expires_at) > new Date());
  const expiredBans = bans.filter(b => b.expires_at && new Date(b.expires_at) <= new Date());

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ban className="h-6 w-6 text-destructive" />
              Ban List
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage banned users
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Bans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{activeBans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired Bans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{expiredBans.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Ban List */}
        <Card>
          <CardHeader>
            <CardTitle>Banned Users</CardTitle>
          </CardHeader>
          <CardContent>
            {bansLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading bans...</div>
              </div>
            ) : bans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bans recorded</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {bans.map((ban) => {
                    const isExpired = ban.expires_at && new Date(ban.expires_at) <= new Date();
                    
                    return (
                      <div
                        key={ban.id}
                        className={`p-4 rounded-lg border ${isExpired ? 'bg-muted/30 border-muted' : 'bg-destructive/5 border-destructive/20'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isExpired ? 'bg-muted text-muted-foreground' : 'bg-destructive/20 text-destructive'}`}>
                              {ban.profiles?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {ban.profiles?.username || 'Unknown User'}
                                </span>
                                {isExpired ? (
                                  <Badge variant="secondary">Expired</Badge>
                                ) : (
                                  <Badge variant="destructive">Active</Badge>
                                )}
                              </div>
                              {ban.reason && (
                                <p className="text-sm text-muted-foreground">
                                  Reason: {ban.reason}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  By: {ban.banned_by_profile?.username || 'System'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(ban.created_at), 'MMM d, yyyy')}
                                </span>
                                {ban.expires_at && (
                                  <span>
                                    Expires: {format(new Date(ban.expires_at), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!isExpired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnban(ban.id, ban.profiles?.username || 'user', ban.user_id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>
    </AdminSidebar>
  );
};

export default AdminBans;