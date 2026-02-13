/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { restInvokeFunction, restUpdate, restSelect } from "@/lib/supabaseRest";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserCog, Crown, Shield, ShieldCheck, User, RefreshCw, Trash2, Ban, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { logModerationAction } from "@/lib/moderationAudit";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface UserRecord {
  user_id: string;
  username: string;
  email?: string;
  role: 'owner' | 'admin' | 'moderator' | 'user';
  created_at: string;
  last_sign_in_at?: string;
}

const roleConfig = {
  owner: { icon: Crown, label: 'Owner', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  admin: { icon: ShieldCheck, label: 'Admin', color: 'text-destructive', bg: 'bg-destructive/20' },
  moderator: { icon: Shield, label: 'Moderator', color: 'text-primary', bg: 'bg-primary/20' },
  user: { icon: User, label: 'User', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const AdminUsers = () => {
  const { user, session, loading, isOwner, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [addIpBan, setAddIpBan] = useState(false);
  const token = session?.access_token;

  const handleDeleteUser = async (targetUserId: string, username: string) => {
    if (!user) return;
    setDeletingUserId(targetUserId);
    try {
      const data = await restInvokeFunction('delete-account', { targetUserId, addIpBan }, token);
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`User ${username} has been permanently deleted${addIpBan ? ' and IP banned' : ''}`);
      setAddIpBan(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const canDeleteUser = (targetRole: string, targetUserId: string) => {
    if (targetUserId === user?.id) return false;
    if (targetRole === 'owner') return isOwner;
    return isOwner || isAdmin;
  };

  const fetchUsers = async () => {
    // Always get a fresh token to avoid JWT expired errors
    const { data: sessionData } = await supabase.auth.getSession();
    const freshToken = sessionData?.session?.access_token || token;
    try {
      const data = await restInvokeFunction<any>('admin-list-users', {}, freshToken);
      setUsers((data?.users || []) as UserRecord[]);
    } catch (edgeFnError) {
      console.warn('Edge function failed, falling back to REST:', edgeFnError);
      try {
        const profiles = await restSelect<any>('profiles', 'select=user_id,username,created_at,avatar_url,bio,age', freshToken);
        const roles = await restSelect<any>('user_roles', 'select=user_id,role', freshToken);
        const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role]));
        const fallbackUsers: UserRecord[] = profiles.map((p: any) => ({
          user_id: p.user_id,
          username: p.username || 'Unknown',
          role: (roleMap.get(p.user_id) || 'user') as UserRecord['role'],
          created_at: p.created_at,
        }));
        const rolePriority: Record<string, number> = { owner: 0, admin: 1, moderator: 2, user: 3 };
        fallbackUsers.sort((a, b) => (rolePriority[a.role] ?? 3) - (rolePriority[b.role] ?? 3));
        setUsers(fallbackUsers);
      } catch (restError) {
        console.error('REST fallback also failed:', restError);
        toast.error('Failed to load users');
      }
    } finally {
      setUsersLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner || isAdmin) fetchUsers();
  }, [isOwner, isAdmin]);

  const handleRoleChange = async (userId: string, username: string, previousRole: string, newRole: string) => {
    if (!user) return;
    try {
      // Use REST upsert via POST with Prefer: resolution=merge-duplicates
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${url}/rest/v1/user_roles?on_conflict=user_id`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${token || key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (!res.ok) throw new Error('Upsert failed');

      await logModerationAction({
        action: 'change_role', moderatorId: user.id, targetUserId: userId, targetUsername: username,
        details: { previous_role: previousRole, new_role: newRole }
      });

      toast.success(`Role updated to ${roleConfig[newRole as keyof typeof roleConfig].label}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role. You may not have permission.');
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchUsers(); };

  const canChangeRole = (targetRole: string) => {
    if (targetRole === 'owner') return false;
    if (targetRole === 'admin') return isOwner;
    return isOwner || isAdmin;
  };

  const getAvailableRoles = (targetRole: string) => {
    if (isOwner) return ['admin', 'moderator', 'user'];
    if (isAdmin) return ['moderator', 'user'];
    return [];
  };

  if (loading) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-primary">Loading...</div></div>);
  if (!user) return <Navigate to="/login" replace />;
  if (!isOwner && !isAdmin) return <Navigate to="/lobby" replace />;

  const roleCounts = {
    owner: users.filter(u => u.role === 'owner').length,
    admin: users.filter(u => u.role === 'admin').length,
    moderator: users.filter(u => u.role === 'moderator').length,
    user: users.filter(u => u.role === 'user').length,
  };

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="h-6 w-6 text-primary" />User Management</h1>
            <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <Card key={role}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className={`h-4 w-4 ${config.color}`} />{config.label}s</CardTitle></CardHeader>
                <CardContent><div className={`text-3xl font-bold ${config.color}`}>{roleCounts[role as keyof typeof roleCounts]}</div></CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader><CardTitle>All Users ({users.length})</CardTitle></CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-pulse text-muted-foreground">Loading users...</div></div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {users.map((u) => {
                    const config = roleConfig[u.role];
                    const Icon = config.icon;
                    const isCurrentUser = u.user_id === user?.id;
                    return (
                      <div key={u.user_id} className={`p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors ${isCurrentUser ? 'border-primary/50' : 'border-border'}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${config.bg}`}>{u.username.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{u.username}</span>
                                {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
                              </div>
                              {u.email && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</div>}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Icon className={`h-3 w-3 ${config.color}`} /><span className={config.color}>{config.label}</span>
                                <span>• Joined {format(new Date(u.created_at), 'MMM yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canChangeRole(u.role) && !isCurrentUser && (
                              <Select value={u.role} onValueChange={(value) => handleRoleChange(u.user_id, u.username, u.role, value)}>
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {getAvailableRoles(u.role).map(role => (
                                    <SelectItem key={role} value={role}>{roleConfig[role as keyof typeof roleConfig].label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {canDeleteUser(u.role, u.user_id) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deletingUserId === u.user_id}>
                                    {deletingUserId === u.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Delete User: {u.username}</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-4">
                                      <p>This will <strong>permanently delete</strong> this user's account and all their data. This action cannot be undone.</p>
                                      <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id={`ip-ban-${u.user_id}`} checked={addIpBan} onCheckedChange={(checked) => setAddIpBan(checked === true)} />
                                        <Label htmlFor={`ip-ban-${u.user_id}`} className="flex items-center gap-2 text-foreground cursor-pointer">
                                          <Ban className="h-4 w-4 text-destructive" />Also add global IP ban (K-Line)
                                        </Label>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setAddIpBan(false)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.user_id, u.username)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete User</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
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

export default AdminUsers;
