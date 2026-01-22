import { useState, useEffect } from "react";
import { Crown, Shield, ShieldCheck, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Member {
  user_id: string;
  username: string;
  role: 'owner' | 'admin' | 'moderator' | 'user';
  isOnline: boolean;
}

interface MemberListProps {
  onlineUserIds: Set<string>;
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
};

const MemberList = ({ onlineUserIds }: MemberListProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      // Fetch all profiles with their roles
      const { data: profiles } = await supabaseUntyped
        .from('profiles')
        .select('user_id, username');

      const { data: roles } = await supabaseUntyped
        .from('user_roles')
        .select('user_id, role');

      if (profiles) {
        const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]) || []);
        
        const memberList: Member[] = profiles.map((p: { user_id: string; username: string }) => ({
          user_id: p.user_id,
          username: p.username,
          role: (roleMap.get(p.user_id) || 'user') as Member['role'],
          isOnline: onlineUserIds.has(p.user_id),
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

    fetchMembers();
  }, [onlineUserIds]);

  // Subscribe to profile changes
  useEffect(() => {
    const channel = supabase
      .channel('member-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          // Refetch on any profile change
          const fetchMembers = async () => {
            const { data: profiles } = await supabaseUntyped
              .from('profiles')
              .select('user_id, username');

            const { data: roles } = await supabaseUntyped
              .from('user_roles')
              .select('user_id, role');

            if (profiles) {
              const roleMap = new Map(roles?.map((r: { user_id: string; role: string }) => [r.user_id, r.role]) || []);
              
              const memberList: Member[] = profiles.map((p: { user_id: string; username: string }) => ({
                user_id: p.user_id,
                username: p.username,
                role: (roleMap.get(p.user_id) || 'user') as Member['role'],
                isOnline: onlineUserIds.has(p.user_id),
              }));

              const rolePriority = { owner: 0, admin: 1, moderator: 2, user: 3 };
              memberList.sort((a, b) => {
                if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
                return rolePriority[a.role] - rolePriority[b.role];
              });

              setMembers(memberList);
            }
          };
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onlineUserIds]);

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
    <div className="w-60 bg-card border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Members</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* Online Members */}
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-2">
              Online — {onlineMembers.length}
            </p>
            <div className="space-y-1">
              {onlineMembers.map((member) => (
                <MemberItem key={member.user_id} member={member} />
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
                <MemberItem key={member.user_id} member={member} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MemberItem = ({ member }: { member: Member }) => {
  const config = roleConfig[member.role];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
        "hover:bg-secondary/50"
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
          config.bgColor,
          config.color
        )}>
          {member.username.charAt(0).toUpperCase()}
        </div>
        {member.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
        )}
      </div>

      {/* Name and role */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          member.isOnline ? "text-foreground" : "text-muted-foreground"
        )}>
          {member.username}
        </p>
        <div className="flex items-center gap-1">
          <Icon className={cn("h-3 w-3", config.color)} />
          <span className={cn("text-xs", config.color)}>{config.label}</span>
        </div>
      </div>
    </div>
  );
};

export default MemberList;
