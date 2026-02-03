/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Crown,
  Shield,
  MessageSquareLock,
  Ban,
  VolumeX,
  LogOut,
  User,
  ShieldCheck,
  Eye,
  Pencil,
  ServerCrash,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logModerationAction } from '@/lib/moderationAudit';
import ProfileViewModal from '@/components/profile/ProfileViewModal';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import { VideoUserMenuAdminTools } from '@/components/video/menu/VideoUserMenuAdminTools';

type AppRole = 'owner' | 'admin' | 'moderator' | 'user';

interface VideoUserMenuProps {
  odious: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
  currentUserId: string;
  currentUserRole?: AppRole | null;
  onPmClick?: () => void;
  onSelfProfileUpdated?: () => void;
  children: React.ReactNode;
}

const VideoUserMenu = ({ 
  odious, 
  username, 
  avatarUrl, 
  role,
  currentUserId,
  currentUserRole,
  onPmClick,
  onSelfProfileUpdated,
  children 
}: VideoUserMenuProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [bio, setBio] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<{
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    age: number | null;
  } | null>(null);

  const isCurrentUser = odious === currentUserId;
  const targetIsOwner = role === 'owner';
  const targetIsAdmin = role === 'admin';
  const targetIsMod = role === 'moderator';

  const viewerIsOwner = currentUserRole === 'owner';
  const viewerIsAdmin = currentUserRole === 'admin' || viewerIsOwner;
  const viewerIsModerator = currentUserRole === 'moderator' || viewerIsAdmin;

  // Permission checks
  const canModerate = (): boolean => {
    if (!currentUserId || isCurrentUser) return false;
    if (!viewerIsModerator) return false;
    if (targetIsOwner) return false;
    if (currentUserRole === 'moderator' && (targetIsAdmin || targetIsMod)) return false;
    if (!viewerIsOwner && targetIsAdmin) return false;
    return true;
  };

  const canManageRole = (): boolean => {
    if (!currentUserId) return false;
    if (!viewerIsAdmin) return false;
    if (isCurrentUser) return false;
    if (targetIsOwner) return false;
    if (!viewerIsOwner && targetIsAdmin) return false;
    return true;
  };

  const canKline = (): boolean => {
    if (!currentUserId || isCurrentUser) return false;
    if (!viewerIsAdmin) return false;
    if (targetIsOwner) return false;
    if (!viewerIsOwner && targetIsAdmin) return false;
    return true;
  };

  const handleViewProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('bio')
        .eq('user_id', odious)
        .maybeSingle();
      setBio(data?.bio || null);
      setProfileModalOpen(true);
    } catch {
      setProfileModalOpen(true);
    }
  };

  const handleEditProfile = async () => {
    if (!isCurrentUser) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio, age')
        .eq('user_id', currentUserId)
        .maybeSingle();

      setEditProfile({
        username: data?.username || username,
        avatarUrl: data?.avatar_url ?? avatarUrl ?? null,
        bio: data?.bio ?? null,
        age: data?.age ?? null,
      });
      setEditModalOpen(true);
      setIsOpen(false);
    } catch {
      setEditProfile({ username, avatarUrl: avatarUrl ?? null, bio: null, age: null });
      setEditModalOpen(true);
      setIsOpen(false);
    }
  };

  const handleBan = async () => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('bans')
        .insert({
          user_id: odious,
          banned_by: currentUserId,
          reason: 'Banned from video chat'
        });

      if (error) throw error;

      await logModerationAction({
        action: 'ban_user',
        moderatorId: currentUserId,
        targetUserId: odious,
        targetUsername: username,
        details: { reason: 'Banned from video chat', context: 'video-chat' }
      });

      toast({
        title: "User banned",
        description: `${username} has been banned.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to ban user",
        description: "You don't have permission to ban this user.",
      });
    }
  };

  const handleKick = async () => {
    if (!currentUserId) return;
    try {
      await logModerationAction({
        action: 'kick_user',
        moderatorId: currentUserId,
        targetUserId: odious,
        targetUsername: username,
        details: { context: 'video-chat' }
      });

      toast({
        title: "User kicked",
        description: `${username} has been kicked from video chat.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to kick user",
        description: "An error occurred while kicking the user.",
      });
    }
  };

  const handleMute = async (duration?: number) => {
    if (!currentUserId) return;
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null;
      
      const { error } = await supabase
        .from('mutes')
        .insert({
          user_id: odious,
          muted_by: currentUserId,
          expires_at: expiresAt,
          reason: `Muted for ${duration || 'indefinite'} minutes`
        });

      if (error) throw error;

      await logModerationAction({
        action: 'mute_user',
        moderatorId: currentUserId,
        targetUserId: odious,
        targetUsername: username,
        details: { duration: duration || 'indefinite', expires_at: expiresAt, context: 'video-chat' }
      });

      toast({
        title: "User muted",
        description: `${username} has been muted${duration ? ` for ${duration} minutes` : ''}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to mute user",
        description: "You don't have permission to mute this user.",
      });
    }
  };

  const handleKline = async () => {
    if (!currentUserId) return;

    try {
      const { data: location } = await supabase
        .from('user_locations')
        .select('ip_address')
        .eq('user_id', odious)
        .order('last_seen', { ascending: false })
        .limit(1)
        .maybeSingle();

      const ip = location?.ip_address || null;
      if (!ip) {
        toast({
          variant: 'destructive',
          title: 'Cannot K-Line',
          description: 'No IP address is available for this user yet.',
        });
        return;
      }

      const reason = 'K-Lined from video chat';
      const { error } = await supabase
        .from('klines')
        .insert({ ip_pattern: ip, set_by: currentUserId, reason });

      if (error) throw error;

      await logModerationAction({
        action: 'add_kline',
        moderatorId: currentUserId,
        targetUserId: odious,
        targetUsername: username,
        reason,
        details: { ip_pattern: ip, context: 'video-chat' },
      });

      toast({
        title: 'K-Line added',
        description: `${username} has been K-Lined.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to add K-Line',
        description: "You don't have permission to K-Line this user.",
      });
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!currentUserId) return;
    try {
      // First try to update existing role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', odious)
        .maybeSingle();

      let error;
      if (existingRole) {
        const result = await supabase
          .from('user_roles')
          .update({ role: newRole as 'admin' | 'moderator' | 'user' | 'owner' })
          .eq('user_id', odious);
        error = result.error;
      } else {
        const result = await supabase
          .from('user_roles')
          .insert({ user_id: odious, role: newRole as 'admin' | 'moderator' | 'user' | 'owner' });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `${username}'s role changed to ${newRole}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: "You don't have permission to change this role.",
      });
    }
  };

  const getRoleBadge = () => {
    if (!role) return null;
    switch (role) {
      case 'owner':
        return <Badge className="text-[9px] px-1 py-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0"><Crown className="w-2.5 h-2.5" /></Badge>;
      case 'admin':
        return <Badge className="text-[9px] px-1 py-0 bg-primary text-primary-foreground"><ShieldCheck className="w-2.5 h-2.5" /></Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-[9px] px-1 py-0"><Shield className="w-2.5 h-2.5" /></Badge>;
      default:
        return null;
    }
  };

  const getAvailableRoles = (): string[] => {
    if (viewerIsOwner) {
      return ['admin', 'moderator', 'user'].filter(r => r !== role);
    }
    if (viewerIsAdmin) {
      return ['moderator', 'user'].filter(r => r !== role);
    }
    return [];
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <span className="cursor-pointer">
            {children}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-52 bg-popover border border-border shadow-lg z-[100]"
        >
          {/* User Header */}
          <DropdownMenuLabel className="flex items-center gap-2 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/20">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{username}</p>
              <div className="flex items-center gap-1">
                {getRoleBadge()}
                {role && <span className="text-[10px] text-muted-foreground capitalize">{role}</span>}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Edit Profile (self) */}
          {isCurrentUser && (
            <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
              <Pencil className="w-4 h-4 mr-2 text-muted-foreground" />
              Edit Profile
            </DropdownMenuItem>
          )}

          {/* View Profile */}
          <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer">
            <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
            View Profile
          </DropdownMenuItem>

          {/* Private Message */}
          {!isCurrentUser && onPmClick && (
            <DropdownMenuItem onClick={onPmClick} className="cursor-pointer">
              <MessageSquareLock className="w-4 h-4 mr-2 text-primary" />
              Private Message
            </DropdownMenuItem>
          )}

          {/* Admin Tools (self) */}
          {isCurrentUser && (
            <VideoUserMenuAdminTools currentUserRole={currentUserRole ?? null} />
          )}

          {/* Moderation Actions */}
          {canModerate() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Moderation</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={handleKick} className="cursor-pointer text-yellow-500">
                <LogOut className="w-4 h-4 mr-2" />
                Kick
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <VolumeX className="w-4 h-4 mr-2 text-orange-500" />
                  Mute
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-popover border border-border">
                  <DropdownMenuItem onClick={() => handleMute(5)} className="cursor-pointer">5 minutes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMute(15)} className="cursor-pointer">15 minutes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMute(60)} className="cursor-pointer">1 hour</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMute()} className="cursor-pointer">Indefinite</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={handleBan} className="cursor-pointer text-destructive">
                <Ban className="w-4 h-4 mr-2" />
                Ban
              </DropdownMenuItem>

              {/* K-Line (Network ban) */}
              {canKline() && (
                <DropdownMenuItem onClick={handleKline} className="cursor-pointer text-destructive">
                  <ServerCrash className="w-4 h-4 mr-2" />
                  K-Line
                </DropdownMenuItem>
              )}
            </>
          )}

          {/* Role Management */}
          {canManageRole() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Change Role
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-popover border border-border">
                  {getAvailableRoles().map((r) => (
                    <DropdownMenuItem 
                      key={r} 
                      onClick={() => handleRoleChange(r)}
                      className="cursor-pointer capitalize"
                    >
                      {r === 'admin' && <ShieldCheck className="w-4 h-4 mr-2 text-red-400" />}
                      {r === 'moderator' && <Shield className="w-4 h-4 mr-2 text-primary" />}
                      {r === 'user' && <User className="w-4 h-4 mr-2" />}
                      {r}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileViewModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        username={username}
        avatarUrl={avatarUrl || null}
        bio={bio}
        role={role}
        onPmClick={!isCurrentUser && onPmClick ? () => { setProfileModalOpen(false); onPmClick(); } : undefined}
      />

      {editProfile && (
        <ProfileEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          username={editProfile.username}
          avatarUrl={editProfile.avatarUrl}
          bio={editProfile.bio}
          age={editProfile.age}
          onProfileUpdated={() => {
            onSelfProfileUpdated?.();
          }}
        />
      )}
    </>
  );
};

export default VideoUserMenu;
