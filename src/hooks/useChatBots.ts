/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Chat bots hook — disabled. All fake chat bots have been removed.
// Only moderator bots (super users) remain on the platform.

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url?: string | null;
  };
}

interface UseChatBotsProps {
  channelId: string | null;
  channelName: string;
  messages: Message[];
  addBotMessage: (content: string, username: string, avatarUrl?: string) => void;
  enabled?: boolean;
}

export const useChatBots = (_props: UseChatBotsProps) => {
  return {
    activeBots: [] as string[],
    triggerBotConversation: () => {},
  };
};
