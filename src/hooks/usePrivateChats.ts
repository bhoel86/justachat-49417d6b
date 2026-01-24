import { useState, useCallback } from 'react';

interface PrivateChat {
  id: string;
  targetUserId: string;
  targetUsername: string;
  position: { x: number; y: number };
  zIndex: number;
}

export const usePrivateChats = (currentUserId: string, currentUsername: string) => {
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [topZIndex, setTopZIndex] = useState(1000);

  const openChat = useCallback((targetUserId: string, targetUsername: string) => {
    // Check if chat already exists
    const existingChat = chats.find(c => c.targetUserId === targetUserId);
    if (existingChat) {
      // Bring to front
      bringToFront(existingChat.id);
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
      zIndex: topZIndex + 1
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

  return {
    chats,
    openChat,
    closeChat,
    bringToFront,
    currentUserId,
    currentUsername
  };
};
