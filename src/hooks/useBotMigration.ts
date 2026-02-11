/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Bot migration hook — disabled. All migrating bots have been removed.
// Only moderator bots (super users) remain on the platform.

import { ChatBot } from '@/lib/chatBots';

interface UseBotMigrationProps {
  channelName: string;
  addBotMessage: (content: string, username: string, avatarUrl?: string) => void;
  enabled?: boolean;
}

export const useBotMigration = (_props: UseBotMigrationProps) => {
  return {
    currentRoomBots: [] as ChatBot[],
    migratingBotCount: 0,
  };
};
