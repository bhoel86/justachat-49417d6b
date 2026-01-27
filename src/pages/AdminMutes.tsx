import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { VolumeX, Clock, User, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logModerationAction } from "@/lib/moderationAudit";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface MuteRecord {
  id: string;
  user_id: string;
  reason: string | null;
  muted_by: string | null;
  expires_at: string | null;
  created_at: string;
  profiles?: { username: string };
  muted_by_profile?: { username: string };
}

const AdminMutes = () => {
  const { user, loading, isOwner, isAdmin, isModerator } = useAuth();
  const [mutes, setMutes] = useState<MuteRecord[]>([]);
  const [mutesLoading, setMutesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMutes = async () => {
    try {
      const { data: muteData, error } = await supabase
        .from('mutes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames
      const userIds = [...new Set([
        ...(muteData?.map(m => m.user_id) || []),
        ...(muteData?.map(m => m.muted_by).filter(Boolean) || [])
      ])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]));

      const mutesWithProfiles = muteData?.map(mute => ({
        ...mute,
        profiles: { username: profileMap.get(mute.user_id) || 'Unknown' },
        muted_by_profile: mute.muted_by ? { username: profileMap.get(mute.muted_by) || 'Unknown' } : undefined
      })) || [];

      setMutes(mutesWithProfiles);
    } catch (error) {
      console.error('Error fetching mutes:', error);
      toast.error('Failed to load mutes');
    } finally {
      setMutesLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isModerator) {
      fetchMutes();
    }
  }, [isModerator]);

  const handleUnmute = async (muteId: string, username: string, targetUserId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('mutes')
        .delete()
        .eq('id', muteId);

      if (error) throw error;

      // Log the unmute action
      await logModerationAction({
        action: 'unmute_user',
        moderatorId: user.id,
        targetUserId,
        targetUsername: username,
      });

      toast.success(`${username} has been unmuted`);
      fetchMutes();
    } catch (error) {
      toast.error('Failed to unmute user');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMutes();
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

  const activeMutes = mutes.filter(m => !m.expires_at || new Date(m.expires_at) > new Date());
  const expiredMutes = mutes.filter(m => m.expires_at && new Date(m.expires_at) <= new Date());

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <VolumeX className="h-6 w-6 text-amber-500" />
              Mute List
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage muted users
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
                Active Mutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{activeMutes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expired Mutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{expiredMutes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mute List */}
        <Card>
          <CardHeader>
            <CardTitle>Muted Users</CardTitle>
          </CardHeader>
          <CardContent>
            {mutesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading mutes...</div>
              </div>
            ) : mutes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <VolumeX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No mutes recorded</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {mutes.map((mute) => {
                    const isExpired = mute.expires_at && new Date(mute.expires_at) <= new Date();
                    
                    return (
                      <div
                        key={mute.id}
                        className={`p-4 rounded-lg border ${isExpired ? 'bg-muted/30 border-muted' : 'bg-amber-500/5 border-amber-500/20'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isExpired ? 'bg-muted text-muted-foreground' : 'bg-amber-500/20 text-amber-500'}`}>
                              {mute.profiles?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {mute.profiles?.username || 'Unknown User'}
                                </span>
                                {isExpired ? (
                                  <Badge variant="secondary">Expired</Badge>
                                ) : (
                                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Active</Badge>
                                )}
                              </div>
                              {mute.reason && (
                                <p className="text-sm text-muted-foreground">
                                  Reason: {mute.reason}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  By: {mute.muted_by_profile?.username || 'System'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(mute.created_at), 'MMM d, yyyy HH:mm')}
                                </span>
                                {mute.expires_at && (
                                  <span>
                                    Expires: {format(new Date(mute.expires_at), 'MMM d, yyyy HH:mm')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!isExpired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnmute(mute.id, mute.profiles?.username || 'user', mute.user_id)}
                              className="text-amber-500 hover:text-amber-500 hover:bg-amber-500/10"
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

export default AdminMutes;
