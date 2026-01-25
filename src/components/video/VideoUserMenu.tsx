import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  Crown, Shield, Star, MessageSquareLock, Ban, VolumeX, 
  LogOut, User, ShieldCheck, MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logModerationAction } from '@/lib/moderationAudit';

interface VideoUserMenuProps {
  odious: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
  currentUserId: string;
  onPmClick?: () => void;
  children: React.ReactNode;
}

const VideoUserMenu = ({ 
  odious, 
  username, 
  avatarUrl, 
  role,
  currentUserId,
  onPmClick,
  children 
}: VideoUserMenuProps) => {
  const { user, isOwner, isAdmin, role: currentUserRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const isCurrentUser = odious === currentUserId;
  const targetIsOwner = role === 'owner';
  const targetIsAdmin = role === 'admin';
  const targetIsMod = role === 'moderator';

  // Permission checks - only evaluate when auth is loaded
  const canModerate = (): boolean => {
    if (authLoading || !user || isCurrentUser) return false;
    if (targetIsOwner) return false;
    if (!isOwner && !isAdmin && currentUserRole !== 'moderator') return false;
    if (currentUserRole === 'moderator' && (targetIsAdmin || targetIsMod)) return false;
    if (!isOwner && targetIsAdmin) return false;
    return true;
  };

  const canManageRole = (): boolean => {
    if (authLoading || !user) return false;
    if (!isAdmin && !isOwner) return false;
    if (isCurrentUser) return false;
    if (targetIsOwner) return false;
    if (!isOwner && targetIsAdmin) return false;
    return true;
  };

  const handleBan = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('bans')
        .insert({
          user_id: odious,
          banned_by: user.id,
          reason: 'Banned from video chat'
        });

      if (error) throw error;

      await logModerationAction({
        action: 'ban_user',
        moderatorId: user.id,
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
    if (!user) return;
    try {
      await logModerationAction({
        action: 'kick_user',
        moderatorId: user.id,
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
    if (!user) return;
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null;
      
      const { error } = await supabase
        .from('mutes')
        .insert({
          user_id: odious,
          muted_by: user.id,
          expires_at: expiresAt,
          reason: `Muted for ${duration || 'indefinite'} minutes`
        });

      if (error) throw error;

      await logModerationAction({
        action: 'mute_user',
        moderatorId: user.id,
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

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
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
    if (isOwner) {
      return ['admin', 'moderator', 'user'].filter(r => r !== role);
    }
    if (isAdmin) {
      return ['moderator', 'user'].filter(r => r !== role);
    }
    return [];
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {children}
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

        {/* Private Message */}
        {!isCurrentUser && onPmClick && (
          <DropdownMenuItem onClick={onPmClick} className="cursor-pointer">
            <MessageSquareLock className="w-4 h-4 mr-2 text-primary" />
            Private Message
          </DropdownMenuItem>
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
  );
};

export default VideoUserMenu;
