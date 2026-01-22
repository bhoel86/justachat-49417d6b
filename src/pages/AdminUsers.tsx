import { useEffect, useState } from "react";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserCog, Crown, Shield, ShieldCheck, User, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRecord {
  user_id: string;
  username: string;
  role: 'owner' | 'admin' | 'moderator' | 'user';
  created_at: string;
}

const roleConfig = {
  owner: { icon: Crown, label: 'Owner', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  admin: { icon: ShieldCheck, label: 'Admin', color: 'text-destructive', bg: 'bg-destructive/20' },
  moderator: { icon: Shield, label: 'Moderator', color: 'text-primary', bg: 'bg-primary/20' },
  user: { icon: User, label: 'User', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const AdminUsers = () => {
  const { user, loading, isOwner, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabaseUntyped
        .from('profiles')
        .select('user_id, username, created_at');

      const { data: roles } = await supabaseUntyped
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]));

      const userList = profiles?.map((p: { user_id: string; username: string; created_at: string }) => ({
        user_id: p.user_id,
        username: p.username,
        role: (roleMap.get(p.user_id) || 'user') as UserRecord['role'],
        created_at: p.created_at,
      })) || [];

      // Sort by role priority
      const rolePriority = { owner: 0, admin: 1, moderator: 2, user: 3 };
      userList.sort((a: UserRecord, b: UserRecord) => rolePriority[a.role] - rolePriority[b.role]);

      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner || isAdmin) {
      fetchUsers();
    }
  }, [isOwner, isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabaseUntyped
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Role updated to ${roleConfig[newRole as keyof typeof roleConfig].label}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role. You may not have permission.');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const canChangeRole = (targetRole: string) => {
    if (targetRole === 'owner') return false;
    if (!isOwner && targetRole === 'admin') return false;
    return isOwner || isAdmin;
  };

  const getAvailableRoles = () => {
    if (isOwner) return ['admin', 'moderator', 'user'];
    if (isAdmin) return ['moderator', 'user'];
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isOwner && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <UserCog className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only admins can manage users.
            </p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleCounts = {
    owner: users.filter(u => u.role === 'owner').length,
    admin: users.filter(u => u.role === 'admin').length,
    moderator: users.filter(u => u.role === 'moderator').length,
    user: users.filter(u => u.role === 'user').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserCog className="h-6 w-6 text-primary" />
                User Management
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage user roles and permissions
              </p>
            </div>
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
        <div className="grid gap-4 md:grid-cols-4">
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon;
            return (
              <Card key={role}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    {config.label}s
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${config.color}`}>
                    {roleCounts[role as keyof typeof roleCounts]}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading users...</div>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {users.map((u) => {
                    const config = roleConfig[u.role];
                    const Icon = config.icon;
                    const isCurrentUser = u.user_id === user?.id;
                    
                    return (
                      <div
                        key={u.user_id}
                        className={`p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors ${isCurrentUser ? 'border-primary/50' : 'border-border'}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${config.bg}`}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{u.username}</span>
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Icon className={`h-3 w-3 ${config.color}`} />
                                <span className={config.color}>{config.label}</span>
                                <span>• Joined {format(new Date(u.created_at), 'MMM yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          
                          {canChangeRole(u.role) && !isCurrentUser && (
                            <Select
                              value={u.role}
                              onValueChange={(value) => handleRoleChange(u.user_id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableRoles().map(role => (
                                  <SelectItem key={role} value={role}>
                                    {roleConfig[role as keyof typeof roleConfig].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
    </div>
  );
};

export default AdminUsers;