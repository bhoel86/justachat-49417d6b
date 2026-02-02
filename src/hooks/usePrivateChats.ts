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

  // Single listener for incoming PMs - subscribe once
  useEffect(() => {
    if (!currentUserId) return;
    
    // Only setup once
    if (channelRef.current) return;

    const channel = supabase.channel(`pm-inbox-${currentUserId}`);
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
          
          // Check if chat exists
          setChats(prev => {
            const existing = prev.find(c => c.targetUserId === msg.sender_id);
            if (existing) {
              if (existing.isMinimized) {
                playPMNotificationSound();
                return prev.map(c => 
                  c.id === existing.id ? { ...c, hasUnread: true } : c
                );
              }
              return prev;
            }
            
            // Fetch sender info and open chat
            (async () => {
              const { data: profile } = await supabase
                .from('profiles_public')
                .select('username')
                .eq('user_id', msg.sender_id)
                .maybeSingle();
              
              const senderUsername = profile?.username || 'Unknown';
              playPMNotificationSound();
              
              const offset = (chats.length % 5) * 30;
              const isDND = dndRef.current;
              
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
                if (cur.find(c => c.targetUserId === msg.sender_id)) return cur;
                return [...cur, newChat];
              });
            })();
            
            return prev;
          });
        }
      )
      .subscribe();

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
