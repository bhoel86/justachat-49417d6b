import { useState, useCallback, useEffect, useRef } from 'react';
import { playPMNotificationSound } from '@/lib/notificationSound';
import { supabase } from '@/integrations/supabase/client';

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
  const listenerSetupRef = useRef(false);

  // Listen for incoming private messages and auto-open chat windows
  useEffect(() => {
    if (!currentUserId || listenerSetupRef.current) return;
    listenerSetupRef.current = true;

    const channel = supabase.channel(`pm-listener-${currentUserId}`);
    
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
          const newMessage = payload.new as { sender_id: string; recipient_id: string };
          
          if (newMessage.sender_id === currentUserId) return; // Ignore own messages
          
          // Check if we already have a chat open with this sender
          setChats(prev => {
            const existingChat = prev.find(c => c.targetUserId === newMessage.sender_id);
            
            if (existingChat) {
              // Chat exists - if minimized, mark as unread and play sound
              if (existingChat.isMinimized) {
                playPMNotificationSound();
                return prev.map(c => 
                  c.id === existingChat.id ? { ...c, hasUnread: true } : c
                );
              }
              return prev; // Chat is already open and active
            }
            
            // No existing chat - fetch sender profile and auto-open
            (async () => {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('user_id', newMessage.sender_id)
                .maybeSingle();
              
              const senderUsername = senderProfile?.username || 'Unknown';
              
              // Play notification sound
              playPMNotificationSound();
              
              // Auto-open the chat window
              const offset = (prev.length % 5) * 30;
              const baseX = Math.min(window.innerWidth - 340, 100 + offset);
              const baseY = Math.min(window.innerHeight - 440, 100 + offset);
              
              const newChat: PrivateChat = {
                id: `${newMessage.sender_id}-${Date.now()}`,
                targetUserId: newMessage.sender_id,
                targetUsername: senderUsername,
                position: { x: baseX, y: baseY },
                zIndex: 1001 + prev.length,
                isMinimized: false,
                hasUnread: false
              };
              
              setChats(current => {
                // Double-check we haven't added it already
                if (current.find(c => c.targetUserId === newMessage.sender_id)) {
                  return current;
                }
                return [...current, newChat];
              });
              setTopZIndex(z => z + 1);
            })();
            
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      listenerSetupRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const openChat = useCallback((targetUserId: string, targetUsername: string) => {
    // Check if chat already exists
    const existingChat = chats.find(c => c.targetUserId === targetUserId);
    if (existingChat) {
      // Restore if minimized and bring to front
      setChats(prev => prev.map(c => 
        c.id === existingChat.id 
          ? { ...c, isMinimized: false, hasUnread: false, zIndex: topZIndex + 1 } 
          : c
      ));
      setTopZIndex(prev => prev + 1);
      return;
    }

    // Calculate position - cascade new windows
    const offset = (chats.length % 5) * 30;
    const baseX = Math.min(window.innerWidth - 340, 100 + offset);
    const baseY = Math.min(window.innerHeight - 440, 100 + offset);

    const newChat: PrivateChat = {
      id: `${targetUserId}-${Date.now()}`,
      targetUserId,
      targetUsername,
      position: { x: baseX, y: baseY },
      zIndex: topZIndex + 1,
      isMinimized: false,
      hasUnread: false
    };

    setTopZIndex(prev => prev + 1);
    setChats(prev => [...prev, newChat]);
  }, [chats, topZIndex]);

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
    setChats(prev => {
      const chat = prev.find(c => c.id === chatId);
      if (chat?.isMinimized && !chat.hasUnread) {
        // Play sound when marking as unread (new message while minimized)
        playPMNotificationSound();
      }
      return prev.map(c => 
        c.id === chatId && c.isMinimized ? { ...c, hasUnread: true } : c
      );
    });
  }, []);

  const reorderChats = useCallback((fromIndex: number, toIndex: number) => {
    setChats(prev => {
      const minimized = prev.filter(c => c.isMinimized);
      const active = prev.filter(c => !c.isMinimized);
      
      // Reorder minimized chats
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
    currentUserId,
    currentUsername
  };
};
