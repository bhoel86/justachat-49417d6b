import { useEffect, useRef, useCallback, useState } from 'react';
import { MIGRATING_BOTS, ChatBot } from '@/lib/chatBots';
import { supabase } from '@/integrations/supabase/client';
import { getChatBotFunctionName } from '@/lib/environment';

interface MigratingBotState {
  bot: ChatBot;
  currentRoom: string;
  lastMigration: number;
}

interface UseBotMigrationProps {
  channelName: string;
  addBotMessage: (content: string, username: string, avatarUrl?: string) => void;
  enabled?: boolean;
}

// Room list for migration
const AVAILABLE_ROOMS = [
  'general',
  'music',
  'games',
  'technology',
  'movies-tv',
  'sports',
  'politics',
  'help',
  'lounge',
  'trivia',
  'adults-21-plus',
  'art',
  'dating',
];

// Entry messages when a bot joins a room
const ENTRY_MESSAGES = [
  'hey everyone',
  'sup',
  'yo whats good',
  'anyone here?',
  'hey',
  'waddup',
  'hows it going',
  'im back',
  'just got here',
  'whats happening',
  'hi all',
  'hey hey',
  'well hello',
  'finally made it',
  'missed me?',
];

// Exit messages when a bot leaves
const EXIT_MESSAGES = [
  'brb',
  'gotta go',
  'later yall',
  'catch yall later',
  'peace',
  'heading out',
  'be back',
  'gotta bounce',
  'see ya',
  'off to another room',
];

export const useBotMigration = ({
  channelName,
  addBotMessage,
  enabled = true,
}: UseBotMigrationProps) => {
  const [currentRoomBots, setCurrentRoomBots] = useState<MigratingBotState[]>([]);
  const migrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const botStatesRef = useRef<Map<string, MigratingBotState>>(new Map());

  // Initialize bot states on first load
  useEffect(() => {
    if (botStatesRef.current.size === 0) {
      // Randomly assign each migrating bot to a room
      MIGRATING_BOTS.forEach(bot => {
        const randomRoom = AVAILABLE_ROOMS[Math.floor(Math.random() * AVAILABLE_ROOMS.length)];
        botStatesRef.current.set(bot.id, {
          bot,
          currentRoom: randomRoom,
          lastMigration: Date.now() - Math.random() * 60000, // Stagger initial times
        });
      });
    }
  }, []);

  // Get bots currently in this room
  const getBotsInRoom = useCallback((room: string): MigratingBotState[] => {
    const bots: MigratingBotState[] = [];
    botStatesRef.current.forEach(state => {
      if (state.currentRoom === room) {
        bots.push(state);
      }
    });
    return bots;
  }, []);

  // Update current room bots
  useEffect(() => {
    const updateRoomBots = () => {
      setCurrentRoomBots(getBotsInRoom(channelName));
    };
    
    updateRoomBots();
    const interval = setInterval(updateRoomBots, 5000);
    return () => clearInterval(interval);
  }, [channelName, getBotsInRoom]);

  // Migrate a random bot to a random room
  const migrateBotRandomly = useCallback(async () => {
    if (!enabled) return;

    // Pick a random bot that hasn't migrated recently (at least 30 seconds)
    const availableBots: MigratingBotState[] = [];
    const now = Date.now();
    
    botStatesRef.current.forEach(state => {
      if (now - state.lastMigration > 30000) { // 30 second cooldown
        availableBots.push(state);
      }
    });

    if (availableBots.length === 0) return;

    const botState = availableBots[Math.floor(Math.random() * availableBots.length)];
    const oldRoom = botState.currentRoom;
    
    // Pick a new room (different from current)
    const otherRooms = AVAILABLE_ROOMS.filter(r => r !== oldRoom);
    const newRoom = otherRooms[Math.floor(Math.random() * otherRooms.length)];

    // Update the bot's room
    botStatesRef.current.set(botState.bot.id, {
      ...botState,
      currentRoom: newRoom,
      lastMigration: now,
    });

    // If the bot is leaving the current channel, show exit message
    if (oldRoom === channelName) {
      const exitMsg = EXIT_MESSAGES[Math.floor(Math.random() * EXIT_MESSAGES.length)];
      addBotMessage(exitMsg, botState.bot.username, botState.bot.avatarUrl || undefined);
    }

    // If the bot is entering the current channel, show entry message after delay
    if (newRoom === channelName) {
      setTimeout(() => {
        const entryMsg = ENTRY_MESSAGES[Math.floor(Math.random() * ENTRY_MESSAGES.length)];
        addBotMessage(entryMsg, botState.bot.username, botState.bot.avatarUrl || undefined);
      }, 2000 + Math.random() * 3000);
    }

    // Update local state
    setCurrentRoomBots(getBotsInRoom(channelName));
  }, [enabled, channelName, addBotMessage, getBotsInRoom]);

  // Random migration interval - varies between 20-90 seconds
  useEffect(() => {
    if (!enabled) return;

    const scheduleMigration = () => {
      const delay = 20000 + Math.random() * 70000; // 20-90 seconds
      migrationIntervalRef.current = setTimeout(() => {
        migrateBotRandomly();
        scheduleMigration(); // Schedule next migration
      }, delay);
    };

    // Start with initial delay
    const initialDelay = 15000 + Math.random() * 30000; // 15-45 seconds
    const initialTimeout = setTimeout(() => {
      scheduleMigration();
    }, initialDelay);

    return () => {
      clearTimeout(initialTimeout);
      if (migrationIntervalRef.current) {
        clearTimeout(migrationIntervalRef.current);
      }
    };
  }, [enabled, migrateBotRandomly]);

  // Generate conversation from migrating bots occasionally
  useEffect(() => {
    if (!enabled) return;

    const convoInterval = setInterval(async () => {
      const botsInRoom = getBotsInRoom(channelName);
      if (botsInRoom.length === 0) return;

      // 15% chance a migrating bot says something
      if (Math.random() > 0.15) return;

      const randomBotState = botsInRoom[Math.floor(Math.random() * botsInRoom.length)];
      
      try {
        const { data, error } = await supabase.functions.invoke(getChatBotFunctionName(), {
          body: {
            botId: randomBotState.bot.id,
            context: channelName,
            recentMessages: [],
            isConversationStarter: true,
          },
        });

        if (!error && data?.message) {
          addBotMessage(data.message, randomBotState.bot.username, randomBotState.bot.avatarUrl || undefined);
        }
      } catch (err) {
        console.error('Migrating bot message error:', err);
      }
    }, 45000 + Math.random() * 60000); // Every 45-105 seconds

    return () => clearInterval(convoInterval);
  }, [enabled, channelName, addBotMessage, getBotsInRoom]);

  return {
    currentRoomBots: currentRoomBots.map(s => s.bot),
    migratingBotCount: currentRoomBots.length,
  };
};
