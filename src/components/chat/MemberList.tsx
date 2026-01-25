import { useState, useEffect, useMemo } from "react";
import { Crown, Shield, ShieldCheck, User, Users, MoreVertical, MessageSquareLock, Bot, Info, Ban, Flag, Camera, AtSign, Settings, FileText, VolumeX, LogOut, Music, Globe, Eye, EyeOff, Zap, Lock, ServerCrash } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getBotsForChannel } from "@/lib/chatBots";
import { supabaseUntyped, useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { logModerationAction } from "@/lib/moderationAudit";

import BotChatModal from "./BotChatModal";
import { getModerator, MODERATORS, type ModeratorInfo } from "@/lib/roomConfig";
import UserAvatar from "@/components/avatar/UserAvatar";
import ProfileEditModal from "@/components/profile/ProfileEditModal";
import ProfileViewModal from "@/components/profile/ProfileViewModal";
import { useRadioOptional } from "@/contexts/RadioContext";

interface Member {
  user_id: string;
  username: string;
  role: 'owner' | 'admin' | 'moderator' | 'user' | 'bot';
  isOnline: boolean;
  isBot?: boolean;
  avatar?: string;
  avatar_url?: string | null;
  bio?: string | null;
  ip_address?: string | null;
}

interface MemberListProps {
  onlineUserIds: Set<string>;
  channelName?: string;
  onOpenPm?: (userId: string, username: string) => void;
  onAction?: (targetUsername: string, action: string) => void;
}

// Fun IRC-style user actions
const USER_ACTIONS = {
  funny: [
    { emoji: "🐟", action: "slaps", suffix: "around with a large trout" },
    { emoji: "🍕", action: "throws", suffix: "a slice of pizza at" },
    { emoji: "🎸", action: "serenades", suffix: "with an air guitar solo" },
    { emoji: "💨", action: "blows", suffix: "a raspberry at" },
    { emoji: "🤡", action: "does", suffix: "a silly dance for" },
  ],
  nice: [
    { emoji: "🙌", action: "high-fives", suffix: "" },
    { emoji: "🤗", action: "gives", suffix: "a warm hug" },
    { emoji: "🎉", action: "celebrates", suffix: "with confetti" },
    { emoji: "⭐", action: "awards", suffix: "a gold star" },
    { emoji: "☕", action: "offers", suffix: "a cup of coffee" },
  ],
};

const roleConfig = {
  owner: {
    icon: Crown,
    label: 'Owner',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  admin: {
    icon: ShieldCheck,
    label: 'Admin',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  moderator: {
    icon: Shield,
    label: 'Moderator',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  user: {
    icon: User,
    label: 'User',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  bot: {
    icon: Bot,
    label: 'Mod',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
};

const MemberList = ({ onlineUserIds, channelName = 'general', onOpenPm, onAction }: MemberListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [botChatTarget, setBotChatTarget] = useState<{ moderator: ModeratorInfo; channelName: string } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewProfileTarget, setViewProfileTarget] = useState<Member | null>(null);
  const [showOffline, setShowOffline] = useState(false);
  const { user, role: currentUserRole, isOwner, isAdmin } = useAuth();
  const { toast } = useToast();
  const radio = useRadioOptional();

  // Get current user's username and avatar
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [currentBio, setCurrentBio] = useState<string | null>(null);
  const [currentAge, setCurrentAge] = useState<number | null>(null);
  
  useEffect(() => {
    if (user) {
      supabaseUntyped
        .from('profiles')
        .select('username, avatar_url, bio, age')
        .eq('user_id', user.id)
        .single()
        .then(({ data }: { data: { username: string; avatar_url: string | null; bio: string | null; age: number | null } | null }) => {
          if (data) {
            setCurrentUsername(data.username);
            setCurrentAvatarUrl(data.avatar_url);
            setCurrentBio(data.bio);
            setCurrentAge(data.age);
          }
        });
    }
  }, [user]);

  const fetchMembers = async () => {
    // Fetch all profiles with their roles, avatars, bios, and ghost mode
    const { data: profiles } = await supabaseUntyped
      .from('profiles')
      .select('user_id, username, avatar_url, bio, ghost_mode');

    const { data: roles } = await supabaseUntyped
      .from('user_roles')
      .select('user_id, role');

    // Fetch IP addresses for admins/owners
    let locationMap = new Map<string, string>();
    if (isAdmin || isOwner) {
      const { data: locations } = await supabaseUntyped
        .from('user_locations')
        .select('user_id, ip_address');
      if (locations) {
        locationMap = new Map(locations.map((l: { user_id: string; ip_address: string | null }) => [l.user_id, l.ip_address]));
      }
    }

    if (profiles) {
      const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]) || []);
      
      const memberList: Member[] = profiles
        // Filter out ghost mode users unless they are the current user or viewer is admin/owner
        .filter((p: { user_id: string; ghost_mode?: boolean }) => {
          // Always show current user
          if (p.user_id === user?.id) return true;
          // Admins and owners can see ghost users
          if (isAdmin || isOwner) return true;
          // Hide ghost mode users from regular users
          return !p.ghost_mode;
        })
        .map((p: { user_id: string; username: string; avatar_url: string | null; bio: string | null; ghost_mode?: boolean }) => {
          const memberRole = (roleMap.get(p.user_id) || 'user') as Member['role'];
          // Only include IP for non-admin/owner users
          const showIp = (isAdmin || isOwner) && memberRole !== 'admin' && memberRole !== 'owner';
          return {
            user_id: p.user_id,
            username: p.username,
            role: memberRole,
            // Ghost mode users appear offline to non-admin viewers (even if online)
            isOnline: p.ghost_mode && p.user_id !== user?.id && !isAdmin && !isOwner 
              ? false 
              : onlineUserIds.has(p.user_id),
            avatar_url: p.avatar_url,
            bio: p.bio,
            ip_address: showIp ? locationMap.get(p.user_id) || null : null,
          };
        });

      // Sort by role priority and online status
      const rolePriority = { owner: 0, admin: 1, moderator: 2, user: 3 };
      memberList.sort((a, b) => {
        // Online first
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        // Then by role
        return rolePriority[a.role] - rolePriority[b.role];
      });

      setMembers(memberList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [onlineUserIds]);

  // Subscribe to profile and role changes
  useEffect(() => {
    const channel = supabase
      .channel('member-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchMembers()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => fetchMembers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onlineUserIds]);

  const handleRoleChange = async (memberId: string, newRole: Member['role']) => {
    try {
      // Use upsert to handle users who may not have a role row yet
      const { error } = await supabaseUntyped
        .from('user_roles')
        .upsert({ user_id: memberId, role: newRole }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `User role changed to ${roleConfig[newRole].label}`,
      });

      fetchMembers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: "You don't have permission to change this role.",
      });
    }
  };

  const canManageRole = (targetMember: Member): boolean => {
    if (!isAdmin && !isOwner) return false;
    if (targetMember.user_id === user?.id) return false; // Can't change own role
    if (targetMember.role === 'owner') return false; // Can't change owner
    if (!isOwner && targetMember.role === 'admin') return false; // Only owner can change admins
    return true;
  };

  const canModerate = (targetMember: Member): boolean => {
    if (!user) return false;
    if (targetMember.user_id === user.id) return false; // Can't moderate self
    if (targetMember.role === 'owner') return false; // Can't moderate owner
    if (!isOwner && !isAdmin && currentUserRole !== 'moderator') return false; // Must be mod+
    if (currentUserRole === 'moderator' && (targetMember.role === 'admin' || targetMember.role === 'moderator')) return false; // Mods can't moderate admins/mods
    if (!isOwner && targetMember.role === 'admin') return false; // Only owner can moderate admins
    return true;
  };

  const handleBan = async (targetMember: Member, reason?: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('bans')
        .insert({
          user_id: targetMember.user_id,
          banned_by: user.id,
          reason: reason || 'Banned by moderator'
        });

      if (error) throw error;

      await logModerationAction({
        action: 'ban_user',
        moderatorId: user.id,
        targetUserId: targetMember.user_id,
        targetUsername: targetMember.username,
        details: { reason: reason || 'Banned by moderator' }
      });

      toast({
        title: "User banned",
        description: `${targetMember.username} has been banned.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to ban user",
        description: "You don't have permission to ban this user.",
      });
    }
  };

  const handleKick = async (targetMember: Member) => {
    if (!user) return;
    try {
      // For a kick, we log the action - the user would need to rejoin
      await logModerationAction({
        action: 'kick_user',
        moderatorId: user.id,
        targetUserId: targetMember.user_id,
        targetUsername: targetMember.username,
        details: { channel: channelName }
      });

      toast({
        title: "User kicked",
        description: `${targetMember.username} has been kicked from the channel.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to kick user",
        description: "An error occurred while kicking the user.",
      });
    }
  };

  const handleMute = async (targetMember: Member, duration?: number) => {
    if (!user) return;
    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null;
      
      const { error } = await supabase
        .from('mutes')
        .insert({
          user_id: targetMember.user_id,
          muted_by: user.id,
          expires_at: expiresAt,
          reason: `Muted for ${duration || 'indefinite'} minutes`
        });

      if (error) throw error;

      await logModerationAction({
        action: 'mute_user',
        moderatorId: user.id,
        targetUserId: targetMember.user_id,
        targetUsername: targetMember.username,
        details: { duration: duration || 'indefinite', expires_at: expiresAt }
      });

      toast({
        title: "User muted",
        description: `${targetMember.username} has been muted${duration ? ` for ${duration} minutes` : ''}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to mute user",
        description: "You don't have permission to mute this user.",
      });
    }
  };

  const handleKline = async (targetMember: Member) => {
    if (!user || !targetMember.ip_address) return;
    try {
      const { error } = await supabase
        .from('klines')
        .insert({
          ip_pattern: targetMember.ip_address,
          set_by: user.id,
          reason: `K-Lined by ${currentUsername || 'admin'}`
        });

      if (error) throw error;

      await logModerationAction({
        action: 'add_kline',
        moderatorId: user.id,
        targetUserId: targetMember.user_id,
        targetUsername: targetMember.username,
        details: { ip_pattern: targetMember.ip_address, reason: `K-Lined by ${currentUsername || 'admin'}` }
      });

      toast({
        title: "K-Line added",
        description: `${targetMember.username} (${targetMember.ip_address}) has been K-Lined from the network.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add K-Line",
        description: "You don't have permission to K-Line this user.",
      });
    }
  };

  const canKline = (targetMember: Member): boolean => {
    if (!isAdmin && !isOwner) return false;
    if (targetMember.user_id === user?.id) return false;
    if (targetMember.role === 'owner') return false;
    if (!isOwner && targetMember.role === 'admin') return false;
    if (!targetMember.ip_address) return false;
    return true;
  };

  const getAvailableRoles = (targetMember: Member): Member['role'][] => {
    if (isOwner) {
      // Owner can assign any role except owner (there's only one owner)
      return ['admin', 'moderator', 'user'].filter(r => r !== targetMember.role) as Member['role'][];
    }
    if (isAdmin) {
      // Admins can only assign moderator or user
      return ['moderator', 'user'].filter(r => r !== targetMember.role) as Member['role'][];
    }
    return [];
  };

  // Get the bot moderator for this channel
  const moderator = getModerator(channelName);
  const botMember: Member = {
    user_id: `bot-${channelName}`,
    username: `${moderator.avatar} ${moderator.name}`,
    role: 'bot',
    isOnline: true,
    isBot: true,
    avatar: moderator.avatar
  };

  // Add simulated users to online members for allowed channels
  const simulatedUsers: Member[] = useMemo(() => {
    const botsForChannel = getBotsForChannel(channelName);
    return botsForChannel.map(bot => ({
      user_id: `sim-${bot.id}`,
      username: bot.username,
      role: 'user' as const,
      isOnline: true,
      avatar_url: bot.avatarUrl,
      bio: null,
      ip_address: null,
    }));
  }, [channelName]);

  const onlineMembers = [...members.filter(m => m.isOnline), ...simulatedUsers];
  const offlineMembers = members.filter(m => !m.isOnline);

  if (loading) {
    return (
      <div className="w-60 bg-card border-l border-border p-4 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="w-64 sm:w-60 bg-card border-l border-border flex flex-col h-full max-h-screen">
        <div className="p-3 sm:p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="font-semibold text-sm sm:text-base text-foreground">Members</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Channel Moderator - Always on top */}
          <div className="mb-4 p-2 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase px-1 mb-2">
              Moderator
            </p>
            <div className="space-y-1">
              <BotMemberItem 
                member={botMember} 
                moderator={moderator}
                channelName={channelName}
                onPmClick={() => setBotChatTarget({ moderator, channelName })}
                onBlockClick={() => {
                  toast({
                    variant: "destructive",
                    title: "Cannot block moderators",
                    description: "Moderators are essential for room management and cannot be blocked."
                  });
                }}
                onInfoClick={() => {
                  toast({
                    title: `${moderator.avatar} ${moderator.name}`,
                    description: `${moderator.displayName} - Moderator for #${channelName}. Personality based on famous hackers.`
                  });
                }}
              />
            </div>
          </div>

          {/* Online Members */}
          {onlineMembers.length > 0 && (
            <div className="mb-4 p-2 rounded-lg bg-muted/40 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase px-1 mb-2">
                Online — {onlineMembers.length}
              </p>
              <div className="space-y-1">
                {onlineMembers.map((member) => (
                  <MemberItem 
                    key={member.user_id} 
                    member={member} 
                    canManage={canManageRole(member)}
                    canModerate={canModerate(member)}
                    canKline={canKline(member)}
                    availableRoles={getAvailableRoles(member)}
                    onRoleChange={handleRoleChange}
                    onBan={() => handleBan(member)}
                    onKick={() => handleKick(member)}
                    onMute={(duration) => handleMute(member, duration)}
                    onKline={() => handleKline(member)}
                    onPmClick={member.user_id !== user?.id && onOpenPm ? () => onOpenPm(member.user_id, member.username) : undefined}
                    onAction={member.user_id !== user?.id && onAction ? (msg) => onAction(member.username, msg) : undefined}
                    isCurrentUser={member.user_id === user?.id}
                    onProfileClick={member.user_id === user?.id 
                      ? () => setProfileModalOpen(true) 
                      : () => setViewProfileTarget(member)}
                    currentlyPlaying={member.user_id === user?.id && radio?.isPlaying ? radio.currentSong : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Offline Members Toggle */}
          {offlineMembers.length > 0 && (
            <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
              <button
                onClick={() => setShowOffline(!showOffline)}
                className="flex items-center gap-2 w-full px-1 mb-2 text-xs font-medium text-muted-foreground uppercase hover:text-foreground transition-colors"
              >
                {showOffline ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>Offline — {offlineMembers.length}</span>
              </button>
              {showOffline && (
                <div className="space-y-1">
                  {offlineMembers.map((member) => (
                    <MemberItem 
                      key={member.user_id} 
                      member={member}
                      canManage={canManageRole(member)}
                      canModerate={canModerate(member)}
                      canKline={canKline(member)}
                      availableRoles={getAvailableRoles(member)}
                      onRoleChange={handleRoleChange}
                      onBan={() => handleBan(member)}
                      onKick={() => handleKick(member)}
                      onMute={(duration) => handleMute(member, duration)}
                      onKline={() => handleKline(member)}
                      onPmClick={member.user_id !== user?.id && onOpenPm ? () => onOpenPm(member.user_id, member.username) : undefined}
                      onAction={member.user_id !== user?.id && onAction ? (msg) => onAction(member.username, msg) : undefined}
                      isCurrentUser={member.user_id === user?.id}
                      onProfileClick={member.user_id === user?.id 
                        ? () => setProfileModalOpen(true) 
                        : () => setViewProfileTarget(member)}
                      currentlyPlaying={member.user_id === user?.id && radio?.isPlaying ? radio.currentSong : null}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bot Chat Modal */}
      {botChatTarget && (
        <BotChatModal
          isOpen={!!botChatTarget}
          onClose={() => setBotChatTarget(null)}
          moderator={botChatTarget.moderator}
          channelName={botChatTarget.channelName}
          currentUsername={currentUsername}
        />
      )}

      {/* Profile Edit Modal */}
      {user && (
        <ProfileEditModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          username={currentUsername}
          avatarUrl={currentAvatarUrl}
          bio={currentBio}
          age={currentAge}
          onProfileUpdated={() => {
            // Refresh current user data
            supabaseUntyped
              .from('profiles')
              .select('username, avatar_url, bio, age')
              .eq('user_id', user.id)
              .single()
              .then(({ data }: { data: { username: string; avatar_url: string | null; bio: string | null; age: number | null } | null }) => {
                if (data) {
                  setCurrentUsername(data.username);
                  setCurrentAvatarUrl(data.avatar_url);
                  setCurrentBio(data.bio);
                  setCurrentAge(data.age);
                }
              });
            fetchMembers();
          }}
        />
      )}

      {/* Profile View Modal for other users */}
      <ProfileViewModal
        open={!!viewProfileTarget}
        onOpenChange={(open) => !open && setViewProfileTarget(null)}
        username={viewProfileTarget?.username || ''}
        avatarUrl={viewProfileTarget?.avatar_url || null}
        bio={viewProfileTarget?.bio || null}
        role={viewProfileTarget?.role}
        onPmClick={viewProfileTarget && onOpenPm 
          ? () => onOpenPm(viewProfileTarget.user_id, viewProfileTarget.username) 
          : undefined}
      />
    </>
  );
};

// Bot member item component with dropdown
interface BotMemberItemProps {
  member: Member;
  moderator: ModeratorInfo;
  channelName: string;
  onPmClick: () => void;
  onBlockClick: () => void;
  onInfoClick: () => void;
}

const BotMemberItem = ({ member, moderator, channelName, onPmClick, onBlockClick, onInfoClick }: BotMemberItemProps) => {
  const config = roleConfig.bot;
  const Icon = config.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer group",
            "bg-gradient-to-r from-cyan-500/10 to-primary/10 border border-cyan-500/20 hover:from-cyan-500/20 hover:to-primary/20"
          )}
        >
          {/* Avatar with bot indicator */}
          <div className="relative">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm",
              "bg-gradient-to-br from-cyan-500/20 to-primary/20"
            )}>
              {member.avatar || '🤖'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyan-400 border-2 border-card flex items-center justify-center">
              <span className="text-[6px]">✓</span>
            </div>
          </div>

          {/* Name and role */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {member.username.split(' ').slice(1).join(' ') || member.username}
            </p>
            <div className="flex items-center gap-1">
              <Icon className={cn("h-3 w-3", config.color)} />
              <span className={cn("text-xs", config.color)}>{config.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium ml-1">
                BOT
              </span>
            </div>
          </div>

          <MoreVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="right"
        sideOffset={4}
        className="w-48 bg-popover border border-border shadow-lg z-[100] max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-sm">
            {moderator.avatar}
          </div>
          <div>
            <p className="font-medium text-sm">{moderator.name}</p>
            <p className="text-xs text-muted-foreground">Moderator</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onPmClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageSquareLock className="h-4 w-4 text-primary" />
          <span>Private Message</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onInfoClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Info className="h-4 w-4 text-muted-foreground" />
          <span>View Info</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onBlockClick}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <Ban className="h-4 w-4" />
          <span>Block Bot</span>
          <span className="text-[10px] ml-auto opacity-50">N/A</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
          disabled
        >
          <Flag className="h-4 w-4" />
          <span>Report</span>
          <span className="text-[10px] ml-auto opacity-50">N/A</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface MemberItemProps {
  member: Member;
  canManage: boolean;
  canModerate: boolean;
  canKline: boolean;
  availableRoles: Member['role'][];
  onRoleChange: (memberId: string, newRole: Member['role']) => void;
  onBan: () => void;
  onKick: () => void;
  onMute: (duration?: number) => void;
  onKline: () => void;
  onPmClick?: () => void;
  onAction?: (actionMessage: string) => void;
  isCurrentUser: boolean;
  onProfileClick?: () => void;
  currentlyPlaying?: { title: string; artist: string } | null;
}

const MemberItem = ({ member, canManage, canModerate, canKline, availableRoles, onRoleChange, onBan, onKick, onMute, onKline, onPmClick, onAction, isCurrentUser, onProfileClick, currentlyPlaying }: MemberItemProps) => {
  const config = roleConfig[member.role] || roleConfig.user;
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group",
        "hover:bg-secondary/50"
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative">
        <button
          onClick={onProfileClick}
          disabled={!onProfileClick}
          className={cn(
            "relative",
            onProfileClick && "cursor-pointer group/avatar"
          )}
        >
          <UserAvatar
            avatarUrl={member.avatar_url}
            username={member.username}
            size="sm"
            showOnlineIndicator={true}
            isOnline={member.isOnline}
          />
          {onProfileClick && (
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-3 w-3 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Name and role */}
      <div className="flex-1 min-w-0">
        {isCurrentUser ? (
          <button 
            onClick={onProfileClick}
            className={cn(
              "text-sm font-medium truncate text-left hover:text-primary transition-colors cursor-pointer block",
              member.isOnline ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {member.username}
            <span className="text-xs text-muted-foreground ml-1">(you)</span>
          </button>
        ) : (
          <button 
            onClick={onProfileClick}
            className={cn(
              "text-sm font-medium truncate text-left hover:text-primary transition-colors cursor-pointer block",
              member.isOnline ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {member.username}
          </button>
        )}
        <div className="flex items-center gap-1">
          <Icon className={cn("h-3 w-3", config.color)} />
          <span className={cn("text-xs", config.color)}>{config.label}</span>
        </div>
        {/* Show IP address for admins/owners viewing non-admin/owner users */}
        {member.ip_address && (
          <div className="flex items-center gap-1 mt-0.5">
            <Globe className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-mono">
              {member.ip_address}
            </span>
          </div>
        )}
        {/* Show currently playing music for current user */}
        {isCurrentUser && currentlyPlaying && (
          <div className="flex items-center gap-1 mt-0.5">
            <Music className="h-2.5 w-2.5 text-primary animate-pulse" />
            <span className="text-[10px] text-primary truncate max-w-[120px]">
              {currentlyPlaying.title}
            </span>
          </div>
        )}
      </div>

      {/* Action & PM buttons */}
      {!isCurrentUser && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Fun Actions Menu */}
          {onAction && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-all"
                  title="Fun actions"
                >
                  <Zap className="h-4 w-4 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                side="left"
                className="w-52 bg-popover border border-border shadow-xl z-[9999]"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  🤪 Funny
                </DropdownMenuLabel>
                {USER_ACTIONS.funny.map((action, idx) => (
                  <DropdownMenuItem
                    key={`funny-${idx}`}
                    onClick={() => {
                      const msg = action.suffix 
                        ? `/me ${action.emoji} ${action.action} ${member.username} ${action.suffix}`
                        : `/me ${action.emoji} ${action.action} ${member.username}`;
                      onAction(msg);
                    }}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.action} {action.suffix ? `...` : ''}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  💖 Nice
                </DropdownMenuLabel>
                {USER_ACTIONS.nice.map((action, idx) => (
                  <DropdownMenuItem
                    key={`nice-${idx}`}
                    onClick={() => {
                      const msg = action.suffix 
                        ? `/me ${action.emoji} ${action.action} ${member.username} ${action.suffix}`
                        : `/me ${action.emoji} ${action.action} ${member.username}`;
                      onAction(msg);
                    }}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.action} {action.suffix ? `...` : ''}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* PM button */}
          {onPmClick && (
            <button 
              onClick={onPmClick}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-all"
              title="Send private message"
            >
              <MessageSquareLock className="h-4 w-4 text-primary" />
            </button>
          )}
        </div>
      )}

      {/* Moderation & Role management dropdown */}
      {!isCurrentUser && (canManage || canModerate || canKline) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-opacity"
              title="Manage user"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="left"
            alignOffset={-10}
            sideOffset={8}
            className="w-56 bg-popover border border-border shadow-xl z-[9999] max-h-[70vh] overflow-y-auto">
            {/* Moderation Actions */}
            {canModerate && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Moderation
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={onBan}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Ban className="h-4 w-4" />
                  <div>
                    <span>Ban User</span>
                    <p className="text-xs text-muted-foreground">Remove from server</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onKick}
                  className="flex items-center gap-2 cursor-pointer text-orange-500 focus:text-orange-500"
                >
                  <LogOut className="h-4 w-4" />
                  <div>
                    <span>Kick User</span>
                    <p className="text-xs text-muted-foreground">Remove from channel</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuLabel className="flex items-center gap-2 text-amber-500">
                  <VolumeX className="h-4 w-4" />
                  <div className="flex-1">
                    <span className="font-medium">Mute User</span>
                    <p className="text-xs text-muted-foreground font-normal">Silence in chat</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onMute(5)}
                  className="flex items-center gap-2 cursor-pointer pl-8 text-amber-500/80"
                >
                  <span className="text-xs">Mute 5 min</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onMute(30)}
                  className="flex items-center gap-2 cursor-pointer pl-8 text-amber-500/80"
                >
                  <span className="text-xs">Mute 30 min</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onMute(60)}
                  className="flex items-center gap-2 cursor-pointer pl-8 text-amber-500/80"
                >
                  <span className="text-xs">Mute 1 hour</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onMute()}
                  className="flex items-center gap-2 cursor-pointer pl-8 text-amber-500/80"
                >
                  <span className="text-xs">Mute indefinitely</span>
                </DropdownMenuItem>
              </>
            )}
            
            {/* K-Line (Network Ban) - Admin/Owner only */}
            {canKline && (
              <>
                {canModerate && <DropdownMenuSeparator />}
                <DropdownMenuItem 
                  onClick={onKline}
                  className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                >
                  <ServerCrash className="h-4 w-4" />
                  <div>
                    <span>K-Line User</span>
                    <p className="text-xs text-muted-foreground">Ban IP from network</p>
                  </div>
                </DropdownMenuItem>
              </>
            )}
            
            {/* Role Management */}
            {canManage && availableRoles.length > 0 && (
              <>
                {canModerate && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Change Role
                </DropdownMenuLabel>
                {availableRoles.map((role) => {
                  if (role === 'bot') return null;
                  const roleConf = roleConfig[role];
                  const RoleIcon = roleConf.icon;
                  return (
                    <DropdownMenuItem 
                      key={role}
                      onClick={() => onRoleChange(member.user_id, role)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <RoleIcon className={cn("h-4 w-4", roleConf.color)} />
                      <span>Make {roleConf.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default MemberList;
