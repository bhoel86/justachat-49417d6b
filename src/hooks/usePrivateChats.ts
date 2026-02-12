/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { playPMNotificationSound } from '@/lib/notificationSound';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivateChat {
  id: string;
  targetUserId: string;
  targetUsername: string;
  position: { x: number; y: number };
  zIndex: number;
  isMinimized: boolean;
  hasUnread: boolean;
}

 // Tracks unread messages from users who don't have an open chat window
 interface InboxMessage {
   senderId: string;
   senderUsername: string;
   count: number;
   lastMessageAt: Date;
 }
 
export const usePrivateChats = (currentUserId: string, currentUsername: string) => {
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [topZIndex, setTopZIndex] = useState(1000);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
   const [awayMode, setAwayMode] = useState(false);
   const [inbox, setInbox] = useState<Map<string, InboxMessage>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const dndRef = useRef(doNotDisturb);
   const awayRef = useRef(awayMode);

  useEffect(() => {
    dndRef.current = doNotDisturb;
  }, [doNotDisturb]);

   useEffect(() => {
     awayRef.current = awayMode;
   }, [awayMode]);
 
  const toggleDoNotDisturb = useCallback(() => {
    setDoNotDisturb(prev => {
      const newValue = !prev;
      toast.info(newValue ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled');
      return newValue;
    });
  }, []);

   const toggleAwayMode = useCallback(() => {
     setAwayMode(prev => {
       const newValue = !prev;
       toast.info(newValue ? 'Away mode enabled - messages will wait in your inbox' : 'Away mode disabled - back online!');
       return newValue;
     });
   }, []);
 
   // Clear inbox for a specific user when opening their chat
   const clearInboxForUser = useCallback((userId: string) => {
     setInbox(prev => {
       const next = new Map(prev);
       next.delete(userId);
       return next;
     });
   }, []);
 
   // Get unread counts for friends list display
   const getUnreadCount = useCallback((userId: string): number => {
     const inboxEntry = inbox.get(userId);
     if (inboxEntry) return inboxEntry.count;
     
     // Also check minimized chats
     const chat = chats.find(c => c.targetUserId === userId);
     if (chat?.hasUnread) return 1; // At least 1 unread
     
     return 0;
   }, [inbox, chats]);
 
   // Get all users with unread messages
   const getUsersWithUnread = useCallback((): string[] => {
     const users = new Set<string>();
     
     // From inbox
     inbox.forEach((_, key) => users.add(key));
     
     // From minimized chats with unread
     chats.filter(c => c.hasUnread).forEach(c => users.add(c.targetUserId));
     
     return Array.from(users);
   }, [inbox, chats]);
 
  // Track which sender IDs already have open chats
  const openChatSendersRef = useRef<Set<string>>(new Set());

  // Keep openChatSendersRef in sync with chats state
  useEffect(() => {
    openChatSendersRef.current = new Set(chats.map(c => c.targetUserId));
  }, [chats]);

  // Single listener for incoming PMs - subscribe once
  useEffect(() => {
    if (!currentUserId) return;
    
    // Only setup once
    if (channelRef.current) return;

    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const createSubscription = () => {
      // Clean up previous attempt if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channelName = `pm-inbox-${currentUserId}-${Date.now()}`;
      const channel = supabase.channel(channelName);
      channelRef.current = channel;
      
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `recipient_id=eq.${currentUserId}`,
          },
          async (payload) => {
            const msg = payload.new as { sender_id: string };
            if (msg.sender_id === currentUserId) return;
            
             const isAway = awayRef.current;
             const isDND = dndRef.current;
             
            // Check if we already have a chat open with this sender
            const hasExistingChat = openChatSendersRef.current.has(msg.sender_id);
            
            if (hasExistingChat) {
              // Just mark as unread if minimized
              setChats(prev => prev.map(c => {
                if (c.targetUserId === msg.sender_id && c.isMinimized) {
                   if (!isDND) playPMNotificationSound();
                  return { ...c, hasUnread: true };
                }
                return c;
              }));
            } else {
               // New conversation - fetch sender info
              try {
                const { data: profile } = await supabase
                  .from('profiles_public')
                  .select('username')
                  .eq('user_id', msg.sender_id)
                  .maybeSingle();
                
                const senderUsername = profile?.username || 'Unknown';
                
                 // Play sound unless DND
                 if (!isDND) playPMNotificationSound();
                 
                 // If away mode, add to inbox instead of opening chat
                 if (isAway) {
                   setInbox(prev => {
                     const next = new Map(prev);
                     const existing = next.get(msg.sender_id);
                     next.set(msg.sender_id, {
                       senderId: msg.sender_id,
                       senderUsername,
                       count: (existing?.count || 0) + 1,
                       lastMessageAt: new Date(),
                     });
                     return next;
                   });
                   
                   // Show toast notification
                   toast.info(`New message from ${senderUsername}`, {
                     description: 'Message saved to inbox',
                     action: {
                       label: 'Open',
                       onClick: () => {
                         // This will be handled by opening the chat
                       },
                     },
                   });
                   return;
                 }
                
                 // Not away - open the chat window
                const offset = (openChatSendersRef.current.size % 5) * 30;
                
                const newChat: PrivateChat = {
                  id: `${msg.sender_id}-${Date.now()}`,
                  targetUserId: msg.sender_id,
                  targetUsername: senderUsername,
                  position: { 
                    x: Math.min(window.innerWidth - 340, 100 + offset),
                    y: Math.min(window.innerHeight - 440, 100 + offset)
                  },
                  zIndex: 1001,
                  isMinimized: isDND,
                  hasUnread: isDND
                };
                
                setChats(cur => {
                  // Final check to prevent duplicates
                  if (cur.find(c => c.targetUserId === msg.sender_id)) return cur;
                  return [...cur, newChat];
                });
              } catch (e) {
                console.error('Failed to open PM from new sender:', e);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log(`PM inbox subscription: ${status}`);
          if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
            retryCount++;
            console.log(`PM inbox retrying (${retryCount}/${maxRetries})...`);
            // Clean up failed channel and retry after delay
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            retryTimeout = setTimeout(createSubscription, 2000 * retryCount);
          }
        });
    };

    // Wait for auth session to be available before subscribing
    supabase.auth.getSession().then(() => {
      createSubscription();
    });

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId]);

  const openChat = useCallback((targetUserId: string, targetUsername: string) => {
     // Clear inbox for this user when opening chat
     clearInboxForUser(targetUserId);
     
    setChats(prev => {
      const existing = prev.find(c => c.targetUserId === targetUserId);
      if (existing) {
        return prev.map(c => 
          c.id === existing.id 
            ? { ...c, isMinimized: false, hasUnread: false, zIndex: topZIndex + 1 } 
            : c
        );
      }
      
      const offset = (prev.length % 5) * 30;
      return [...prev, {
        id: `${targetUserId}-${Date.now()}`,
        targetUserId,
        targetUsername,
        position: { 
          x: Math.min(window.innerWidth - 340, 100 + offset),
          y: Math.min(window.innerHeight - 440, 100 + offset)
        },
        zIndex: topZIndex + 1,
        isMinimized: false,
        hasUnread: false
      }];
    });
    setTopZIndex(prev => prev + 1);
   }, [topZIndex, clearInboxForUser]);

  const closeChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
  }, []);

  const bringToFront = useCallback((chatId: string) => {
    setTopZIndex(prev => prev + 1);
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, zIndex: topZIndex + 1, hasUnread: false } : c
    ));
  }, [topZIndex]);

  const minimizeChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, isMinimized: true } : c
    ));
  }, []);

  const restoreChat = useCallback((chatId: string) => {
    setTopZIndex(prev => prev + 1);
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, isMinimized: false, hasUnread: false, zIndex: topZIndex + 1 } : c
    ));
  }, [topZIndex]);

  const setUnread = useCallback((chatId: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId && c.isMinimized ? { ...c, hasUnread: true } : c
    ));
  }, []);

  const reorderChats = useCallback((fromIndex: number, toIndex: number) => {
    setChats(prev => {
      const minimized = prev.filter(c => c.isMinimized);
      const active = prev.filter(c => !c.isMinimized);
      const reordered = [...minimized];
      const [removed] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, removed);
      return [...active, ...reordered];
    });
  }, []);

  const minimizedChats = chats.filter(c => c.isMinimized);
  const activeChats = chats.filter(c => !c.isMinimized);
   const inboxMessages = Array.from(inbox.values()).sort(
     (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
   );
   const totalUnreadCount = inboxMessages.reduce((acc, m) => acc + m.count, 0) + 
     minimizedChats.filter(c => c.hasUnread).length;

  return {
    chats,
    activeChats,
    minimizedChats,
    openChat,
    closeChat,
    bringToFront,
    minimizeChat,
    restoreChat,
    setUnread,
    reorderChats,
    doNotDisturb,
    toggleDoNotDisturb,
     awayMode,
     toggleAwayMode,
     inbox: inboxMessages,
     totalUnreadCount,
     getUnreadCount,
     getUsersWithUnread,
     clearInboxForUser,
    currentUserId,
    currentUsername
  };
};
