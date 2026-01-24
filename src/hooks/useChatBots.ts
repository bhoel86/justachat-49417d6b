import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CHAT_BOTS, ChatBot, getBotResponseDelay, getRandomTopic } from '@/lib/chatBots';

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

export const useChatBots = ({
  channelId,
  channelName,
  messages,
  addBotMessage,
  enabled = true,
}: UseChatBotsProps) => {
  const [activeBots, setActiveBots] = useState<Set<string>>(new Set());
  const lastBotActivityRef = useRef<number>(Date.now());
  const pendingResponseRef = useRef<boolean>(false);
  const conversationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Only enable bots in general channel
  const isGeneralChannel = channelName === 'general';
  const botsEnabled = enabled && isGeneralChannel;

  // Get recent messages for context
  const getRecentMessages = useCallback(() => {
    return messages.slice(-15).map(m => ({
      username: m.profile?.username || 'Unknown',
      content: m.content,
    }));
  }, [messages]);

  // Generate a bot response
  const generateBotResponse = useCallback(async (
    bot: ChatBot,
    respondTo?: string,
    isConversationStarter: boolean = false
  ) => {
    if (pendingResponseRef.current) return;
    pendingResponseRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke('chat-bot', {
        body: {
          botId: bot.id,
          context: channelName,
          recentMessages: getRecentMessages(),
          respondTo,
          isConversationStarter,
        },
      });

      if (error) {
        console.error('Bot response error:', error);
        return;
      }

      if (data?.message) {
        addBotMessage(data.message, bot.username, bot.avatar);
        lastBotActivityRef.current = Date.now();
      }
    } catch (err) {
      console.error('Failed to generate bot response:', err);
    } finally {
      pendingResponseRef.current = false;
    }
  }, [channelName, getRecentMessages, addBotMessage]);

  // Pick a random bot that hasn't spoken recently
  const pickRandomBot = useCallback((): ChatBot => {
    const availableBots = CHAT_BOTS.filter(bot => !activeBots.has(bot.id));
    if (availableBots.length === 0) {
      setActiveBots(new Set());
      return CHAT_BOTS[Math.floor(Math.random() * CHAT_BOTS.length)];
    }
    return availableBots[Math.floor(Math.random() * availableBots.length)];
  }, [activeBots]);

  // Start a bot conversation
  const startBotConversation = useCallback(async () => {
    if (!botsEnabled || pendingResponseRef.current) return;

    const bot = pickRandomBot();
    setActiveBots(prev => new Set(prev).add(bot.id));
    
    await generateBotResponse(bot, undefined, true);

    // Sometimes have another bot respond
    if (Math.random() < 0.4) {
      const delay = getBotResponseDelay();
      responseTimeoutRef.current = setTimeout(async () => {
        const respondingBot = pickRandomBot();
        if (respondingBot.id !== bot.id) {
          setActiveBots(prev => new Set(prev).add(respondingBot.id));
          const lastMessage = messages[messages.length - 1];
          await generateBotResponse(respondingBot, lastMessage?.content);
        }
      }, delay);
    }
  }, [botsEnabled, pickRandomBot, generateBotResponse, messages]);

  // Respond to user messages
  const handleUserMessage = useCallback(async (message: Message) => {
    if (!botsEnabled) return;

    // Check if any bot should respond
    const shouldRespond = Math.random() < 0.3; // 30% chance a bot responds to any message
    
    if (!shouldRespond) return;

    const delay = getBotResponseDelay();
    responseTimeoutRef.current = setTimeout(async () => {
      const bot = pickRandomBot();
      setActiveBots(prev => new Set(prev).add(bot.id));
      await generateBotResponse(bot, message.content);
    }, delay);
  }, [botsEnabled, pickRandomBot, generateBotResponse]);

  // Check for mentions of bot names
  const checkForMentions = useCallback((message: Message) => {
    if (!botsEnabled) return;

    const content = message.content.toLowerCase();
    
    for (const bot of CHAT_BOTS) {
      const botName = bot.username.toLowerCase().replace(/[^a-z]/g, '');
      if (content.includes(botName) || content.includes(`@${botName}`)) {
        const delay = 2000 + Math.random() * 3000;
        responseTimeoutRef.current = setTimeout(async () => {
          setActiveBots(prev => new Set(prev).add(bot.id));
          await generateBotResponse(bot, message.content);
        }, delay);
        return;
      }
    }
  }, [botsEnabled, generateBotResponse]);

  // Monitor new messages and potentially respond
  useEffect(() => {
    if (!botsEnabled || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Don't respond to bot messages
    if (lastMessage?.user_id?.startsWith('bot-')) return;
    
    // Check if a bot was mentioned
    if (lastMessage) {
      checkForMentions(lastMessage);
      handleUserMessage(lastMessage);
    }
  }, [messages.length, botsEnabled, checkForMentions, handleUserMessage]);

  // Periodic bot conversations
  useEffect(() => {
    if (!botsEnabled) return;

    // Start initial conversation after a delay
    const initialDelay = setTimeout(() => {
      startBotConversation();
    }, 10000); // 10 seconds after joining

    // Periodic conversations every 30-90 seconds
    conversationIntervalRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastBotActivityRef.current;
      
      // Only start new conversation if there's been a gap
      if (timeSinceLastActivity > 20000) {
        startBotConversation();
      }
    }, 30000 + Math.random() * 60000);

    return () => {
      clearTimeout(initialDelay);
      if (conversationIntervalRef.current) {
        clearInterval(conversationIntervalRef.current);
      }
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, [botsEnabled, startBotConversation]);

  return {
    activeBots: Array.from(activeBots),
    triggerBotConversation: startBotConversation,
  };
};
