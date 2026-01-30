import { useState, useCallback } from 'react';
import { type ModeratorInfo } from '@/lib/roomConfig';

interface BotChat {
  id: string;
  moderator: ModeratorInfo;
  channelName: string;
  position: { x: number; y: number };
  zIndex: number;
  isMinimized: boolean;
}

export const useBotChats = () => {
  const [chats, setChats] = useState<BotChat[]>([]);
  const [topZIndex, setTopZIndex] = useState(2000); // Start higher than regular PMs

  const openChat = useCallback((moderator: ModeratorInfo, channelName: string) => {
    const chatId = `bot-${channelName}-${moderator.name}`;
    
    // Check if chat already exists
    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      // Restore if minimized and bring to front
      setChats(prev => prev.map(c => 
        c.id === chatId 
          ? { ...c, isMinimized: false, zIndex: topZIndex + 1 } 
          : c
      ));
      setTopZIndex(prev => prev + 1);
      return;
    }

    // Calculate position - cascade new windows
    const offset = (chats.length % 5) * 30;
    const baseX = Math.min(window.innerWidth - 340, 150 + offset);
    const baseY = Math.min(window.innerHeight - 440, 80 + offset);

    const newChat: BotChat = {
      id: chatId,
      moderator,
      channelName,
      position: { x: baseX, y: baseY },
      zIndex: topZIndex + 1,
      isMinimized: false
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
      c.id === chatId ? { ...c, zIndex: topZIndex + 1 } : c
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
      c.id === chatId ? { ...c, isMinimized: false, zIndex: topZIndex + 1 } : c
    ));
  }, [topZIndex]);

  const activeChats = chats.filter(c => !c.isMinimized);
  const minimizedChats = chats.filter(c => c.isMinimized);

  return {
    chats,
    activeChats,
    minimizedChats,
    openChat,
    closeChat,
    bringToFront,
    minimizeChat,
    restoreChat
  };
};
