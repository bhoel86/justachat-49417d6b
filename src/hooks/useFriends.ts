/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { restSelect } from '@/lib/supabaseRest';
import { toast } from 'sonner';
import { playPMNotificationSound } from '@/lib/notificationSound';

// Callback type for friend request popup
export type FriendRequestCallback = (request: {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
}) => void;

export interface Friend {
  id: string;
  friendId: string;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  recipientId: string;
  recipientUsername: string;
  recipientAvatarUrl: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  isIncoming: boolean;
}

export interface BlockedUser {
  id: string;
  blockedId: string;
  username: string;
  avatarUrl: string | null;
  reason: string | null;
  createdAt: Date;
}

/** Helper to get current access token without blocking */
const getAccessToken = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
};

export const useFriends = (currentUserId: string, onFriendRequestReceived?: FriendRequestCallback) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());
  const onFriendRequestReceivedRef = useRef(onFriendRequestReceived);
  
  // Keep ref in sync
  useEffect(() => {
    onFriendRequestReceivedRef.current = onFriendRequestReceived;
  }, [onFriendRequestReceived]);

  // Fetch friends list via REST
  const fetchFriends = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const token = await getAccessToken();
      
      // Fetch friendships where user is either user_id or friend_id
      const friendships = await restSelect<{ id: string; user_id: string; friend_id: string; created_at: string }>(
        'friends',
        `select=id,user_id,friend_id,created_at&or=(user_id.eq.${currentUserId},friend_id.eq.${currentUserId})`,
        token
      );

      // Get the other user's ID for each friendship
      const friendUserIds = friendships?.map(f => 
        f.user_id === currentUserId ? f.friend_id : f.user_id
      ) || [];

      if (friendUserIds.length === 0) {
        setFriends([]);
        return;
      }

      // Fetch profiles for all friends
      const profiles = await restSelect<{ user_id: string; username: string; avatar_url: string | null }>(
        'profiles_public',
        `select=user_id,username,avatar_url&user_id=in.(${friendUserIds.join(',')})`,
        token
      );

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const friendsList: Friend[] = friendships?.map(f => {
        const friendId = f.user_id === currentUserId ? f.friend_id : f.user_id;
        const profile = profileMap.get(friendId);
        return {
          id: f.id,
          friendId,
          username: profile?.username || 'Unknown',
          avatarUrl: profile?.avatar_url || null,
          createdAt: new Date(f.created_at),
        };
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, [currentUserId]);

  // Fetch pending friend requests via REST
  const fetchPendingRequests = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const token = await getAccessToken();
      
      const requests = await restSelect<{ id: string; sender_id: string; recipient_id: string; status: string; created_at: string }>(
        'friend_requests',
        `select=id,sender_id,recipient_id,status,created_at&status=eq.pending&or=(sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId})`,
        token
      );

      if (!requests || requests.length === 0) {
        setPendingRequests([]);
        return;
      }

      // Get all user IDs involved
      const userIds = [...new Set([
        ...requests.map(r => r.sender_id),
        ...requests.map(r => r.recipient_id)
      ])];

      const profiles = await restSelect<{ user_id: string; username: string; avatar_url: string | null }>(
        'profiles_public',
        `select=user_id,username,avatar_url&user_id=in.(${userIds.join(',')})`,
        token
      );

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const requestsList: FriendRequest[] = requests.map(r => {
        const senderProfile = profileMap.get(r.sender_id);
        const recipientProfile = profileMap.get(r.recipient_id);
        return {
          id: r.id,
          senderId: r.sender_id,
          senderUsername: senderProfile?.username || 'Unknown',
          senderAvatarUrl: senderProfile?.avatar_url || null,
          recipientId: r.recipient_id,
          recipientUsername: recipientProfile?.username || 'Unknown',
          recipientAvatarUrl: recipientProfile?.avatar_url || null,
          status: r.status as 'pending' | 'accepted' | 'declined',
          createdAt: new Date(r.created_at),
          isIncoming: r.recipient_id === currentUserId,
        };
      });

      setPendingRequests(requestsList);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }, [currentUserId]);

  // Fetch blocked users via REST
  const fetchBlockedUsers = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const token = await getAccessToken();
      
      const blocks = await restSelect<{ id: string; blocked_id: string; reason: string | null; created_at: string }>(
        'blocked_users',
        `select=id,blocked_id,reason,created_at&blocker_id=eq.${currentUserId}`,
        token
      );

      if (!blocks || blocks.length === 0) {
        setBlockedUsers([]);
        return;
      }

      const blockedIds = blocks.map(b => b.blocked_id);

      const profiles = await restSelect<{ user_id: string; username: string; avatar_url: string | null }>(
        'profiles_public',
        `select=user_id,username,avatar_url&user_id=in.(${blockedIds.join(',')})`,
        token
      );

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const blockedList: BlockedUser[] = blocks.map(b => {
        const profile = profileMap.get(b.blocked_id);
        return {
          id: b.id,
          blockedId: b.blocked_id,
          username: profile?.username || 'Unknown',
          avatarUrl: profile?.avatar_url || null,
          reason: b.reason,
          createdAt: new Date(b.created_at),
        };
      });

      setBlockedUsers(blockedList);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  }, [currentUserId]);

  // Send friend request (write operations still use supabase client for simplicity)
  const sendFriendRequest = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return false;

    try {
      // Check if already friends
      const { data: existing } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`)
        .maybeSingle();

      if (existing) {
        toast.error('You are already friends with this user');
        return false;
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast.error('A friend request already exists');
        return false;
      }

      // Check if blocked
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`)
        .maybeSingle();

      if (blocked) {
        toast.error('Cannot send friend request to this user');
        return false;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUserId,
          recipient_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      await fetchPendingRequests();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
      return false;
    }
  }, [currentUserId, fetchPendingRequests]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    if (!currentUserId) return false;

    try {
      const { data: request, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { error: friendError1 } = await supabase
        .from('friends')
        .insert({
          user_id: currentUserId,
          friend_id: request.sender_id
        });

      if (friendError1) throw friendError1;

      const { error: friendError2 } = await supabase
        .from('friends')
        .insert({
          user_id: request.sender_id,
          friend_id: currentUserId
        });

      // Ignore error if second insert fails due to unique constraint

      toast.success('Friend request accepted!');
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
      return false;
    }
  }, [currentUserId, fetchFriends, fetchPendingRequests]);

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast.info('Friend request declined');
      await fetchPendingRequests();
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Failed to decline friend request');
      return false;
    }
  }, [fetchPendingRequests]);

  // Cancel outgoing friend request
  const cancelFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.info('Friend request cancelled');
      await fetchPendingRequests();
      return true;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel friend request');
      return false;
    }
  }, [fetchPendingRequests]);

  // Remove friend
  const removeFriend = useCallback(async (friendshipId: string, friendId: string) => {
    try {
      await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      toast.info('Friend removed');
      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
      return false;
    }
  }, [currentUserId, fetchFriends]);

  // Block user
  const blockUser = useCallback(async (targetUserId: string, reason?: string) => {
    if (!currentUserId) return false;

    try {
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);

      await supabase
        .from('friend_requests')
        .delete()
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`);

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: currentUserId,
          blocked_id: targetUserId,
          reason
        });

      if (error) throw error;

      toast.success('User blocked');
      await Promise.all([fetchFriends(), fetchPendingRequests(), fetchBlockedUsers()]);
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
      return false;
    }
  }, [currentUserId, fetchFriends, fetchPendingRequests, fetchBlockedUsers]);

  // Unblock user
  const unblockUser = useCallback(async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast.success('User unblocked');
      await fetchBlockedUsers();
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
      return false;
    }
  }, [fetchBlockedUsers]);

  // Check if user is blocked
  const isUserBlocked = useCallback((userId: string): boolean => {
    return blockedUsers.some(b => b.blockedId === userId);
  }, [blockedUsers]);

  // Check if user is a friend
  const isFriend = useCallback((userId: string): boolean => {
    return friends.some(f => f.friendId === userId);
  }, [friends]);

  // Initial fetch
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchBlockedUsers()
      ]);
      setLoading(false);
    };

    fetchAll();
  }, [currentUserId, fetchFriends, fetchPendingRequests, fetchBlockedUsers]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!currentUserId) return;

    const friendsChannel = supabase
      .channel('friends-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends',
      }, () => {
        fetchFriends();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_requests',
      }, async (payload) => {
        fetchPendingRequests();
        
        // Handle new incoming friend requests with popup and sound
        const newRequest = payload.new as { id: string; sender_id: string; recipient_id: string; status: string };
        if (newRequest.recipient_id === currentUserId && newRequest.status === 'pending') {
          // Fetch sender's profile via REST
          try {
            const token = await getAccessToken();
            const profiles = await restSelect<{ username: string; avatar_url: string | null }>(
              'profiles_public',
              `select=username,avatar_url&user_id=eq.${newRequest.sender_id}&limit=1`,
              token
            );
            const senderProfile = profiles?.[0];
          
            const senderName = senderProfile?.username || 'Someone';
            const senderAvatar = senderProfile?.avatar_url || null;
          
            // Play notification sound
            playPMNotificationSound();
          
            // If callback is provided, trigger popup
            if (onFriendRequestReceivedRef.current) {
              onFriendRequestReceivedRef.current({
                id: newRequest.id,
                senderId: newRequest.sender_id,
                senderUsername: senderName,
                senderAvatarUrl: senderAvatar,
              });
            } else {
              toast.info(`${senderName} sent you a friend request!`, {
                description: 'Check your Friends tab to respond',
                duration: 5000,
              });
            }
          } catch {
            playPMNotificationSound();
            toast.info('Someone sent you a friend request!', {
              description: 'Check your Friends tab to respond',
              duration: 5000,
            });
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'friend_requests',
      }, () => {
        fetchPendingRequests();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'friend_requests',
      }, () => {
        fetchPendingRequests();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocked_users',
      }, () => {
        fetchBlockedUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [currentUserId, fetchFriends, fetchPendingRequests, fetchBlockedUsers]);

  // Track online status of friends via global presence channel
  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel('global-online-users', {
      config: { presence: { key: currentUserId } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p: { user_id?: string }) => {
            if (p.user_id) onlineIds.add(p.user_id);
          });
        });
        
        // Filter to only friends who are online
        const onlineFriends = new Set(
          friends.map(f => f.friendId).filter(id => onlineIds.has(id))
        );
        setOnlineFriendIds(onlineFriends);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUserId });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId, friends]);

  const incomingRequests = pendingRequests.filter(r => r.isIncoming);
  const outgoingRequests = pendingRequests.filter(r => !r.isIncoming);

  return {
    friends,
    pendingRequests,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    loading,
    onlineFriendIds,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    isUserBlocked,
    isFriend,
    refetch: useCallback(() => {
      fetchFriends();
      fetchPendingRequests();
      fetchBlockedUsers();
    }, [fetchFriends, fetchPendingRequests, fetchBlockedUsers]),
  };
};
