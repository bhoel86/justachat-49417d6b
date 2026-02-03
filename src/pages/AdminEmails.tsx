/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState } from "react";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, RefreshCw, Search, Copy, Check, Globe, Wifi, Key, Eye, EyeOff, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface UserEmail {
  user_id: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  ip_address: string | null;
  isp: string | null;
}

const AdminEmails = () => {
  const { user, loading, isOwner, session } = useAuth();
  const [users, setUsers] = useState<UserEmail[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Password reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserEmail | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserEmail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles } = await supabaseUntyped
        .from('profiles')
        .select('user_id, username, created_at');

      // Fetch roles
      const { data: roles } = await supabaseUntyped
        .from('user_roles')
        .select('user_id, role');

      // Fetch user locations for IP and ISP info
      const { data: locations } = await supabaseUntyped
        .from('user_locations')
        .select('user_id, ip_address, isp');

      const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]));
      const locationMap = new Map(locations?.map((l: { user_id: string; ip_address: string | null; isp: string | null }) => [l.user_id, { ip_address: l.ip_address, isp: l.isp }]));

      // Since we can't access auth.users directly, we'll show user_id as placeholder
      // In a real scenario, you'd use a service role or edge function to get emails
      const userList = profiles?.map((p: { user_id: string; username: string; created_at: string }) => {
        const locationInfo = locationMap.get(p.user_id);
        return {
          user_id: p.user_id,
          email: `${p.username.toLowerCase().replace(/\s+/g, '.')}@user.local`, // Placeholder
          username: p.username,
          role: roleMap.get(p.user_id) || 'user',
          created_at: p.created_at,
          last_sign_in_at: null,
          ip_address: locationInfo?.ip_address || null,
          isp: locationInfo?.isp || null,
        };
      }) || [];

      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load user emails');
    } finally {
      setUsersLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchUsers();
    }
  }, [isOwner]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCopyEmail = async (email: string, userId: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedId(userId);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenResetModal = (userToReset: UserEmail) => {
    setSelectedUser(userToReset);
    setNewPassword("");
    setShowPassword(false);
    setResetModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          targetUserId: selectedUser.user_id,
          newPassword: newPassword
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`Password reset for ${selectedUser.username}`);
      setResetModalOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    try {
      // Delete profile record (this won't delete the auth user, just the profile)
      const { error } = await supabaseUntyped
        .from('profiles')
        .delete()
        .eq('user_id', userToDelete.user_id);

      if (error) throw error;

      // Also clean up related data
      await supabaseUntyped
        .from('user_locations')
        .delete()
        .eq('user_id', userToDelete.user_id);

      await supabaseUntyped
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.user_id);

      toast.success(`Deleted profile for ${userToDelete.username}`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete profile");
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!isOwner) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              User Emails
            </h1>
            <p className="text-sm text-muted-foreground">
              View registered user email addresses
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
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Filtered Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{filteredUsers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading emails...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.user_id}
                      className="p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{u.username}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {u.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
                              ID: {u.user_id}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                              {u.ip_address && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3 shrink-0" />
                                  <span className="font-mono">{u.ip_address}</span>
                                </span>
                              )}
                              {u.isp && (
                                <span className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3 shrink-0" />
                                  <span>{u.isp}</span>
                                </span>
                              )}
                              <span>
                                Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenResetModal(u)}
                            className="text-xs"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Reset PW
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyEmail(u.email, u.user_id)}
                          >
                            {copiedId === u.user_id ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteConfirmOpen(true);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete profile (not auth user)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Password Reset Modal */}
        <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Reset Password
              </DialogTitle>
              <DialogDescription>
                Set a new password for <span className="font-semibold">{selectedUser?.username}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  User ID: <span className="font-mono">{selectedUser?.user_id}</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetModalOpen(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={resetting || newPassword.length < 6}
              >
                {resetting ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Profile
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the profile data for <span className="font-semibold">{userToDelete?.username}</span>.
                <br /><br />
                <span className="text-muted-foreground text-xs">
                  Note: This removes the profile, location data, and role - but does NOT delete the auth user from Supabase. 
                  Use this to clean up orphaned profiles that have no matching auth user.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProfile}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Profile"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminSidebar>
  );
};

export default AdminEmails;
