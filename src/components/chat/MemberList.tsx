/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useMemo, useRef } from "react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { getSimulationPill, getPillEmoji, getBotPill, PillChoice } from "@/hooks/useSimulationPill";
import matrixMembersBg from "@/assets/matrix/matrix-members-bg.webp";
import matrixPillsImg from "@/assets/matrix/matrix-pills.jpg";

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
  listeningUsers?: Map<string, { title: string; artist: string }>;
  channelName?: string;
  onOpenPm?: (userId: string, username: string) => void;
  onOpenBotPm?: (moderator: ModeratorInfo, channelName: string) => void;
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

interface BotSettings {
  enabled: boolean;
  allowed_channels: string[];
  moderator_bots_enabled: boolean;
}

const MemberList = ({ onlineUserIds, listeningUsers, channelName = 'general', onOpenPm, onOpenBotPm, onAction }: MemberListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [botChatTarget, setBotChatTarget] = useState<{ moderator: ModeratorInfo; channelName: string } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewProfileTarget, setViewProfileTarget] = useState<Member | null>(null);
  const [showOffline, setShowOffline] = useState(false);
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null);
  const { user, role: currentUserRole, isOwner, isAdmin } = useAuth();
  const { toast } = useToast();
  const radio = useRadioOptional();
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';
  const isSimulation = theme === 'matrix';

  // Get current user's username and avatar
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [currentBio, setCurrentBio] = useState<string | null>(null);
  const [currentAge, setCurrentAge] = useState<number | null>(null);

  // Fetch bot settings and subscribe to changes
  useEffect(() => {
    const fetchBotSettings = async () => {
      const { data, error } = await supabaseUntyped
        .from('bot_settings')
        .select('enabled, allowed_channels, moderator_bots_enabled')
        .limit(1)
        .single();

      if (!error && data) {
        setBotSettings(data);
      }
    };

    fetchBotSettings();

    // Subscribe to bot settings changes
    const channel = supabase
      .channel('bot-settings-member-list')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bot_settings' },
        (payload) => {
          setBotSettings(payload.new as BotSettings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
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
    // ONLY fetch profiles for users who are currently online in this room
    // This prevents users from appearing in every room's member list
    const onlineIds = Array.from(onlineUserIds);
    
    if (onlineIds.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Fetch profiles ONLY for online users in this room
    const { data: profiles } = await supabaseUntyped
      .from('profiles_public')
      .select('user_id, username, avatar_url, bio, ghost_mode')
      .in('user_id', onlineIds);

    const { data: roles } = await supabaseUntyped
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', onlineIds);

    // Fetch IP addresses for admins/owners (only for online users)
    let locationMap = new Map<string, string>();
    if ((isAdmin || isOwner) && onlineIds.length > 0) {
      const { data: locations } = await supabaseUntyped
        .from('user_locations')
        .select('user_id, ip_address')
        .in('user_id', onlineIds);
      if (locations) {
        locationMap = new Map(locations.map((l: { user_id: string; ip_address: string | null }) => [l.user_id, l.ip_address]));
      }
    }

    if (profiles) {
      const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]) || []);
      
      const memberList: Member[] = profiles
        // Filter out ghost mode users unless they are the current user, viewer is admin/owner, OR the user is an owner/admin (always visible)
        .filter((p: { user_id: string; ghost_mode?: boolean }) => {
          // Always show current user
          if (p.user_id === user?.id) return true;
          // Admins and owners viewing can see all ghost users
          if (isAdmin || isOwner) return true;
          // Get the target user's role - owners/admins are ALWAYS visible even with ghost mode
          const targetRole = roleMap.get(p.user_id);
          if (targetRole === 'owner' || targetRole === 'admin') return true;
          // Hide ghost mode users from regular users (only non-staff)
          return !p.ghost_mode;
        })
        .map((p: { user_id: string; username: string; avatar_url: string | null; bio: string | null; ghost_mode?: boolean }) => {
          const memberRole = (roleMap.get(p.user_id) || 'user') as Member['role'];
          // Only include IP for non-admin/owner users
          const showIp = (isAdmin || isOwner) && memberRole !== 'admin' && memberRole !== 'owner';
          // Ghost mode: regular users see ghost users as offline, EXCEPT owners/admins are always shown as-is
          const targetIsStaff = memberRole === 'owner' || memberRole === 'admin';
          const shouldAppearOffline = p.ghost_mode && p.user_id !== user?.id && !isAdmin && !isOwner && !targetIsStaff;
          return {
            user_id: p.user_id,
            username: p.username,
            role: memberRole,
            isOnline: shouldAppearOffline ? false : true, // All fetched users are online in this room
            avatar_url: p.avatar_url,
            bio: p.bio,
            ip_address: showIp ? locationMap.get(p.user_id) || null : null,
          };
        });

      // Sort by role priority
      const rolePriority = { owner: 0, admin: 1, moderator: 2, user: 3 };
      memberList.sort((a, b) => {
        return rolePriority[a.role] - rolePriority[b.role];
      });

      setMembers(memberList);
    }
    setLoading(false);
  };

  // Debounce fetchMembers to prevent rapid re-fetches when onlineUserIds changes frequently
  const fetchMembersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Debounce: only fetch after 300ms of no changes
    if (fetchMembersTimeoutRef.current) {
      clearTimeout(fetchMembersTimeoutRef.current);
    }
    fetchMembersTimeoutRef.current = setTimeout(() => {
      fetchMembers();
    }, 300);
    
    return () => {
      if (fetchMembersTimeoutRef.current) {
        clearTimeout(fetchMembersTimeoutRef.current);
      }
    };
  }, [onlineUserIds]);

  // Subscribe to profile and role changes - NO dependency on onlineUserIds to prevent resubscription loops
  useEffect(() => {
    const channel = supabase
      .channel('member-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          // Debounce profile changes too
          if (fetchMembersTimeoutRef.current) {
            clearTimeout(fetchMembersTimeoutRef.current);
          }
          fetchMembersTimeoutRef.current = setTimeout(() => {
            fetchMembers();
          }, 300);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          if (fetchMembersTimeoutRef.current) {
            clearTimeout(fetchMembersTimeoutRef.current);
          }
          fetchMembersTimeoutRef.current = setTimeout(() => {
            fetchMembers();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency - only subscribe once

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

  // Check if bots should be shown for this channel
  const botsEnabledForChannel = botSettings?.enabled && 
    botSettings?.allowed_channels?.includes(channelName);
  const moderatorBotsEnabled = botSettings?.moderator_bots_enabled ?? true;

  // Get the bot moderator for this channel (only if moderator bots enabled)
  const moderator = getModerator(channelName);
  const botMember: Member | null = moderatorBotsEnabled ? {
    user_id: `bot-${channelName}`,
    username: `${moderator.avatar} ${moderator.name}`,
    role: 'bot',
    isOnline: true,
    isBot: true,
    avatar: moderator.avatar
  } : null;

  // Add simulated users to online members for allowed channels (only if bots enabled)
  const simulatedUsers: Member[] = useMemo(() => {
    if (!botsEnabledForChannel) return [];
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
  }, [channelName, botsEnabledForChannel]);

  // Staff should always be visible (even if they appear offline due to Ghost Mode / presence filtering)
  const visibleOwners = members.filter(m => m.role === 'owner');
  const visibleAdmins = members.filter(m => m.role === 'admin');

  // Group online members by role
  const allOnlineMembers = [...members.filter(m => m.isOnline), ...simulatedUsers];
  const onlineModerators = allOnlineMembers.filter(m => m.role === 'moderator');
  const onlineUsers = allOnlineMembers.filter(m => m.role === 'user');
  
  // Avoid duplicating staff in the offline toggle since they already render in the staff section
  const offlineMembers = members.filter(m => !m.isOnline && m.role !== 'owner' && m.role !== 'admin');

  if (loading) {
    return (
      <div className={cn(
        "w-48 min-w-[180px] flex-shrink-0 bg-card border-l border-border p-4 flex items-center justify-center",
        isRetro && "retro-member-list"
      )}>
        <div className="h-6 w-6 rounded-full jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {/* Members Panel - fixed width with proper constraints */}
      <div className={cn(
        "w-48 min-w-[180px] flex-shrink-0 bg-card border-l border-border flex flex-col h-full max-h-screen overflow-hidden relative isolate",
        isRetro && "retro-member-list"
      )}>
        {/* Simulation theme background */}
        {isSimulation && (
          <div 
            className="absolute inset-0 pointer-events-none -z-10"
            style={{
              backgroundImage: `url(${matrixMembersBg})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              opacity: 0.15,
            }}
          />
        )}
        
        {/* Header - solid background to prevent bleed-through */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-2.5 border-b border-border bg-card relative z-10",
          isRetro && "retro-member-header"
        )}>
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Members</span>
        </div>

        {/* Members Content */}
        <div className="flex-1 overflow-y-auto p-2">
            {/* STAFF SECTION - Compact */}
            <div className="mb-2">
              {/* Owner Section */}
              {visibleOwners.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-medium text-amber-400 uppercase px-1 mb-0.5 flex items-center gap-1">
                    <Crown className="h-2.5 w-2.5" />
                    Owner
                  </p>
                  <div className="space-y-0.5 pl-2 border-l border-amber-500/40">
                    {visibleOwners.map((member) => (
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
                        currentlyPlaying={listeningUsers?.get(member.user_id) || null}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Section */}
              {visibleAdmins.length > 0 && (
                <div className="mb-1">
                  <p className="text-[10px] font-medium text-red-400 uppercase px-1 mb-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Admins — {visibleAdmins.length}
                  </p>
                  <div className="space-y-0.5 pl-2 border-l border-red-500/40">
                    {visibleAdmins.map((member) => (
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
                        currentlyPlaying={listeningUsers?.get(member.user_id) || null}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Moderators Section (includes bot + human mods) */}
              {(botMember || onlineModerators.length > 0) && (
              <div className="mb-1">
                <p className="text-[10px] font-medium text-primary uppercase px-1 mb-0.5 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  Mods — {onlineModerators.length + (botMember ? 1 : 0)}
                </p>
                <div className="space-y-0.5 pl-2 border-l border-primary/40">
                  {/* Bot Moderator first (only if enabled) */}
                  {botMember && (
                    <BotMemberItem 
                      member={botMember} 
                      moderator={moderator}
                      channelName={channelName}
                      onPmClick={() => onOpenBotPm ? onOpenBotPm(moderator, channelName) : setBotChatTarget({ moderator, channelName })}
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
                  )}
                  {/* Human Moderators */}
                  {onlineModerators.map((member) => (
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
                      currentlyPlaying={listeningUsers?.get(member.user_id) || null}
                    />
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* VOICED USERS SECTION */}
            {onlineUsers.length > 0 && (
              <div className="mb-4 p-2 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs font-medium text-muted-foreground uppercase px-1 mb-2 flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Voiced — {onlineUsers.length}
                </p>
                <div className="space-y-1">
                  {onlineUsers.map((member) => (
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
                      currentlyPlaying={listeningUsers?.get(member.user_id) || null}
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
                        currentlyPlaying={listeningUsers?.get(member.user_id) || null}
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
        targetUserId={viewProfileTarget?.user_id}
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
            "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer group w-full overflow-hidden",
            "bg-gradient-to-r from-cyan-500/10 to-primary/10 border border-cyan-500/20 hover:from-cyan-500/20 hover:to-primary/20"
          )}
        >
          {/* Avatar with bot indicator */}
          <div className="relative flex-shrink-0">
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
            <p className="text-sm font-medium text-foreground whitespace-nowrap">
              {member.username.split(' ').slice(1).join(' ') || member.username}
            </p>
            <div className="flex items-center gap-1 overflow-hidden flex-wrap">
              <Icon className={cn("h-3 w-3 flex-shrink-0", config.color)} />
              <span className={cn("text-xs truncate", config.color)}>{config.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium flex-shrink-0">
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
        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors group w-full overflow-hidden",
        "hover:bg-secondary/50"
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
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
              "text-sm font-medium text-left hover:text-primary transition-colors cursor-pointer whitespace-nowrap",
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
              "text-sm font-medium text-left hover:text-primary transition-colors cursor-pointer whitespace-nowrap",
              member.isOnline ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {member.username}
          </button>
        )}
        <div className="flex items-center gap-1 overflow-hidden">
          <Icon className={cn("h-3 w-3 flex-shrink-0", config.color)} />
          <span className={cn("text-xs truncate", config.color)}>{config.label}</span>
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
        {/* Show currently playing music for any user listening */}
        {currentlyPlaying && (
          <div className="flex items-center gap-1 mt-0.5">
            <Music className="h-2.5 w-2.5 text-primary animate-pulse" />
            <span className="text-[10px] text-primary truncate max-w-[120px]">
              {currentlyPlaying.title}
            </span>
          </div>
        )}
      </div>

      {/* Action & PM buttons */}
      {/* User actions dropdown - always show for other users */}
      {!isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-opacity"
              title="User options"
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
            
            {/* Private Message */}
            {onPmClick && (
              <>
                <DropdownMenuItem 
                  onClick={onPmClick}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquareLock className="h-4 w-4 text-primary" />
                  <span>Private Message</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Fun Actions */}
            {onAction && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Fun Actions
                </DropdownMenuLabel>
                <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 py-0">
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
                    className="cursor-pointer text-sm"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.action} {action.suffix ? `...` : ''}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 py-0">
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
                    className="cursor-pointer text-sm"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.action} {action.suffix ? `...` : ''}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            {/* Moderation Actions */}
            {canModerate && (
              <>
                <DropdownMenuSeparator />
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
                <DropdownMenuSeparator />
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
                <DropdownMenuSeparator />
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
