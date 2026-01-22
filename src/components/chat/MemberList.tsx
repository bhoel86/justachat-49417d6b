import { useState, useEffect } from "react";
import { Crown, Shield, ShieldCheck, User, Users, MoreVertical, MessageSquareLock, Bot, Info, Ban, Flag, Camera, AtSign, Settings, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import PrivateMessageModal from "./PrivateMessageModal";
import BotChatModal from "./BotChatModal";
import { getModerator, MODERATORS, type ModeratorInfo } from "@/lib/roomConfig";
import UserAvatar from "@/components/avatar/UserAvatar";
import AvatarUploadModal from "@/components/avatar/AvatarUploadModal";
import UsernameChangeModal from "@/components/profile/UsernameChangeModal";
import { BioEditModal } from "@/components/profile/BioEditModal";

interface Member {
  user_id: string;
  username: string;
  role: 'owner' | 'admin' | 'moderator' | 'user' | 'bot';
  isOnline: boolean;
  isBot?: boolean;
  avatar?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

interface MemberListProps {
  onlineUserIds: Set<string>;
  channelName?: string;
}

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
    label: 'AI Mod',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
};

const MemberList = ({ onlineUserIds, channelName = 'general' }: MemberListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [pmTarget, setPmTarget] = useState<{ userId: string; username: string } | null>(null);
  const [botChatTarget, setBotChatTarget] = useState<{ moderator: ModeratorInfo; channelName: string } | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const { user, role: currentUserRole, isOwner, isAdmin } = useAuth();
  const { toast } = useToast();

  // Get current user's username and avatar
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [currentBio, setCurrentBio] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      supabaseUntyped
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('user_id', user.id)
        .single()
        .then(({ data }: { data: { username: string; avatar_url: string | null; bio: string | null } | null }) => {
          if (data) {
            setCurrentUsername(data.username);
            setCurrentAvatarUrl(data.avatar_url);
            setCurrentBio(data.bio);
          }
        });
    }
  }, [user]);

  const fetchMembers = async () => {
    // Fetch all profiles with their roles, avatars, and bios
    const { data: profiles } = await supabaseUntyped
      .from('profiles')
      .select('user_id, username, avatar_url, bio');

    const { data: roles } = await supabaseUntyped
      .from('user_roles')
      .select('user_id, role');

    if (profiles) {
      const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]) || []);
      
      const memberList: Member[] = profiles.map((p: { user_id: string; username: string; avatar_url: string | null; bio: string | null }) => ({
        user_id: p.user_id,
        username: p.username,
        role: (roleMap.get(p.user_id) || 'user') as Member['role'],
        isOnline: onlineUserIds.has(p.user_id),
        avatar_url: p.avatar_url,
        bio: p.bio,
      }));

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
      const { error } = await supabaseUntyped
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', memberId);

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
    if (!isAdmin) return false;
    if (targetMember.user_id === user?.id) return false; // Can't change own role
    if (targetMember.role === 'owner') return false; // Can't change owner
    if (!isOwner && targetMember.role === 'admin') return false; // Only owner can change admins
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

  const onlineMembers = members.filter(m => m.isOnline);
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
      <div className="w-60 bg-card border-l border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Members</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Admin Panel Link - Owner Only */}
          {isOwner && (
            <div className="mb-4">
              <Link 
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors group"
              >
                <Settings className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Admin Panel</span>
              </Link>
            </div>
          )}
          {/* AI Moderator Bot - Always on top */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-2">
              AI Moderator
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
                    title: "Cannot block AI moderators",
                    description: "AI moderators are essential for room management and cannot be blocked."
                  });
                }}
                onInfoClick={() => {
                  toast({
                    title: `${moderator.avatar} ${moderator.name}`,
                    description: `${moderator.displayName} - AI Moderator for #${channelName}. Personality based on famous hackers.`
                  });
                }}
              />
            </div>
          </div>

          {/* Online Members */}
          {onlineMembers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-2">
                Online — {onlineMembers.length}
              </p>
              <div className="space-y-1">
                {onlineMembers.map((member) => (
                  <MemberItem 
                    key={member.user_id} 
                    member={member} 
                    canManage={canManageRole(member)}
                    availableRoles={getAvailableRoles(member)}
                    onRoleChange={handleRoleChange}
                    onPmClick={member.user_id !== user?.id ? () => setPmTarget({ userId: member.user_id, username: member.username }) : undefined}
                    isCurrentUser={member.user_id === user?.id}
                    onAvatarClick={member.user_id === user?.id ? () => setAvatarModalOpen(true) : undefined}
                    onUsernameClick={member.user_id === user?.id ? () => setUsernameModalOpen(true) : undefined}
                    onBioClick={member.user_id === user?.id ? () => setBioModalOpen(true) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Offline Members */}
          {offlineMembers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-2">
                Offline — {offlineMembers.length}
              </p>
              <div className="space-y-1">
                {offlineMembers.map((member) => (
                  <MemberItem 
                    key={member.user_id} 
                    member={member}
                    canManage={canManageRole(member)}
                    availableRoles={getAvailableRoles(member)}
                    onRoleChange={handleRoleChange}
                    onPmClick={member.user_id !== user?.id ? () => setPmTarget({ userId: member.user_id, username: member.username }) : undefined}
                    isCurrentUser={member.user_id === user?.id}
                    onAvatarClick={member.user_id === user?.id ? () => setAvatarModalOpen(true) : undefined}
                    onUsernameClick={member.user_id === user?.id ? () => setUsernameModalOpen(true) : undefined}
                    onBioClick={member.user_id === user?.id ? () => setBioModalOpen(true) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Private Message Modal */}
      {pmTarget && user && (
        <PrivateMessageModal
          isOpen={!!pmTarget}
          onClose={() => setPmTarget(null)}
          targetUserId={pmTarget.userId}
          targetUsername={pmTarget.username}
          currentUserId={user.id}
          currentUsername={currentUsername}
        />
      )}

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

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        open={avatarModalOpen}
        onOpenChange={setAvatarModalOpen}
        currentAvatarUrl={currentAvatarUrl}
        onAvatarChange={(url) => {
          setCurrentAvatarUrl(url);
          fetchMembers();
        }}
      />

      {/* Username Change Modal */}
      <UsernameChangeModal
        open={usernameModalOpen}
        onOpenChange={setUsernameModalOpen}
        currentUsername={currentUsername}
        onUsernameChange={(newUsername) => {
          setCurrentUsername(newUsername);
          fetchMembers();
        }}
      />

      {/* Bio Edit Modal */}
      {user && (
        <BioEditModal
          open={bioModalOpen}
          onOpenChange={setBioModalOpen}
          userId={user.id}
          currentBio={currentBio}
          onBioUpdated={(newBio) => {
            setCurrentBio(newBio);
            fetchMembers();
          }}
        />
      )}
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
        className="w-48 bg-popover border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-sm">
            {moderator.avatar}
          </div>
          <div>
            <p className="font-medium text-sm">{moderator.name}</p>
            <p className="text-xs text-muted-foreground">AI Moderator</p>
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
  availableRoles: Member['role'][];
  onRoleChange: (memberId: string, newRole: Member['role']) => void;
  onPmClick?: () => void;
  isCurrentUser: boolean;
  onAvatarClick?: () => void;
  onUsernameClick?: () => void;
  onBioClick?: () => void;
}

const MemberItem = ({ member, canManage, availableRoles, onRoleChange, onPmClick, isCurrentUser, onAvatarClick, onUsernameClick, onBioClick }: MemberItemProps) => {
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
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
          className={cn(
            "relative",
            onAvatarClick && "cursor-pointer group/avatar"
          )}
        >
          <UserAvatar
            avatarUrl={member.avatar_url}
            username={member.username}
            size="sm"
            showOnlineIndicator={true}
            isOnline={member.isOnline}
          />
          {onAvatarClick && (
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-3 w-3 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Name and role */}
      <div className="flex-1 min-w-0">
        {isCurrentUser ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "text-sm font-medium truncate text-left hover:text-primary transition-colors cursor-pointer",
                member.isOnline ? "text-foreground" : "text-muted-foreground"
              )}>
                {member.username}
                <span className="text-xs text-muted-foreground ml-1">(you)</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-48 bg-popover border border-border shadow-lg z-50"
            >
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserAvatar
                  avatarUrl={member.avatar_url}
                  username={member.username}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-sm">{member.username}</p>
                  <p className="text-xs text-muted-foreground">Your Profile</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={onAvatarClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Camera className="h-4 w-4 text-primary" />
                <span>Change Avatar</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onUsernameClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <AtSign className="h-4 w-4 text-primary" />
                <span>Change Username</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onBioClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-primary" />
                <span>Edit Bio</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer"
                disabled
              >
                <Icon className={cn("h-4 w-4", config.color)} />
                <span>Role: {config.label}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <p className={cn(
            "text-sm font-medium truncate",
            member.isOnline ? "text-foreground" : "text-muted-foreground"
          )}>
            {member.username}
          </p>
        )}
        <div className="flex items-center gap-1">
          <Icon className={cn("h-3 w-3", config.color)} />
          <span className={cn("text-xs", config.color)}>{config.label}</span>
        </div>
      </div>

      {/* PM button */}
      {!isCurrentUser && onPmClick && (
        <button 
          onClick={onPmClick}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 transition-all"
          title="Send private message"
        >
          <MessageSquareLock className="h-4 w-4 text-primary" />
        </button>
      )}

      {/* Role management dropdown */}
      {canManage && availableRoles.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary transition-opacity"
              title="Manage role"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-popover border border-border shadow-lg z-50"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Change Role
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableRoles.map((role) => {
              if (role === 'bot') return null; // Can't assign bot role
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default MemberList;
