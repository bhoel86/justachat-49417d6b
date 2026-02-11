/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Chat bot types — only moderator bots remain as super users.
// All fake/simulated user bots have been removed.

export interface ChatBot {
  id: string;
  username: string;
  avatarUrl: string | null;
  personality: string;
  interests: string[];
  style: 'casual' | 'formal' | 'playful' | 'nerdy' | 'chill';
  responseRate: number;
  gender: 'male' | 'female';
  room?: string;
}

// No simulated bots — only real users and moderator bots exist on the platform.
export const CHAT_BOTS: ChatBot[] = [];
export const MIGRATING_BOTS: ChatBot[] = [];
export const ROOM_BOTS: ChatBot[] = [];
export const ALL_BOTS: ChatBot[] = [];

export const getRandomBot = (): ChatBot | undefined => undefined;
export const getBotById = (id: string): ChatBot | undefined => undefined;
export const getBotsForChannel = (_channelName: string): ChatBot[] => [];
export const getRoomBots = (_roomName: string): ChatBot[] => [];
export const getUniqueRoomNames = (): string[] => [];
export const shouldBotRespond = (_bot: ChatBot, _messageCount: number): boolean => false;
export const getBotResponseDelay = (): number => 0;
export const getRandomTopic = (): string => '';
export const getRandomMigratingBot = (): ChatBot | undefined => undefined;
export const getRoomBotCount = (_roomName: string): number => 0;
