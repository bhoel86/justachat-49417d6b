/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
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

export const usePrivateChats = (currentUserId: string, currentUsername: string) => {
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [topZIndex, setTopZIndex] = useState(1000);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const dndRef = useRef(doNotDisturb);

  useEffect(() => {
    dndRef.current = doNotDisturb;
  }, [doNotDisturb]);

  const toggleDoNotDisturb = useCallback(() => {
    setDoNotDisturb(prev => {
      const newValue = !prev;
      toast.info(newValue ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled');
      return newValue;
    });
  }, []);

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
          
          // Check if we already have a chat open with this sender
          const hasExistingChat = openChatSendersRef.current.has(msg.sender_id);
          
          if (hasExistingChat) {
            // Just mark as unread if minimized
            setChats(prev => prev.map(c => {
              if (c.targetUserId === msg.sender_id && c.isMinimized) {
                playPMNotificationSound();
                return { ...c, hasUnread: true };
              }
              return c;
            }));
          } else {
            // New conversation - fetch sender info and open chat
            try {
              const { data: profile } = await supabase
                .from('profiles_public')
                .select('username')
                .eq('user_id', msg.sender_id)
                .maybeSingle();
              
              const senderUsername = profile?.username || 'Unknown';
              const isDND = dndRef.current;
              
              playPMNotificationSound();
              
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
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId]);

  const openChat = useCallback((targetUserId: string, targetUsername: string) => {
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
  }, [topZIndex]);

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
    currentUserId,
    currentUsername
  };
};
