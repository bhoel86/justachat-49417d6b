import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatHeader from "@/components/chat/ChatHeader";
import MemberList from "@/components/chat/MemberList";
import MessageBubble from "@/components/chat/MessageBubble";
import { Button } from "@/components/ui/button";
import { Users, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { getBotsForChannel, CHAT_BOTS, getBotResponseDelay } from "@/lib/chatBots";
import { useTheme } from "@/contexts/ThemeContext";
import { RetroWatermark } from "@/components/theme/RetroWatermark";
import { ValentinesWatermark } from "@/components/theme/ValentinesWatermark";
import { StPatricksWatermark } from "@/components/theme/StPatricksWatermark";
import { MatrixWatermark } from "@/components/theme/MatrixWatermark";

interface MirrorMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  channel_id: string;
  profile?: {
    username: string;
    avatar_url?: string | null;
  };
}

const LobbyMirrorRoom = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';
  const isStPatricks = theme === 'stpatricks';
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pendingRef = useRef<boolean>(false);

  // Get simulated bot users for member list
  const simulatedBots = useMemo(() => getBotsForChannel('general'), []);
  const onlineUserIds = useMemo(() => new Set(simulatedBots.map(b => `bot-${b.id}`)), [simulatedBots]);

  // Add a message to the mirror
  const addMirrorMessage = useCallback((username: string, content: string, avatarUrl?: string | null) => {
    const newMsg: MirrorMessage = {
      id: `mirror-${Date.now()}-${Math.random()}`,
      content,
      user_id: `bot-${username}`,
      channel_id: 'general-mirror',
      created_at: new Date().toISOString(),
      profile: {
        username,
        avatar_url: avatarUrl || null,
      }
    };
    setMessages(prev => [...prev, newMsg].slice(-50));
    lastActivityRef.current = Date.now();
  }, []);

  // Generate bot conversation for the lobby
  const generateBotMessage = useCallback(async (isStarter: boolean = false) => {
    if (pendingRef.current) return;
    pendingRef.current = true;

    try {
      const bot = CHAT_BOTS[Math.floor(Math.random() * CHAT_BOTS.length)];
      const recentMsgs = messages.slice(-10).map(m => ({
        username: m.profile?.username || 'Unknown',
        content: m.content,
        timestamp: m.created_at,
      }));

      const { data, error } = await supabase.functions.invoke('chat-bot', {
        body: {
          botId: bot.id,
          context: 'general',
          recentMessages: recentMsgs,
          isConversationStarter: isStarter,
        },
      });

      if (!error && data?.message) {
        addMirrorMessage(bot.username, data.message, bot.avatarUrl);
      }
    } catch (err) {
      console.error('Lobby bot error:', err);
    } finally {
      pendingRef.current = false;
    }
  }, [messages, addMirrorMessage]);

  // Periodic bot conversations for the lobby
  useEffect(() => {
    // Start initial conversation quickly
    const initialTimeout = setTimeout(() => {
      generateBotMessage(true);
    }, 2000);

    // Continue conversations every 10-25 seconds
    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > 8000) {
        generateBotMessage(Math.random() < 0.3);
      }
    }, 10000 + Math.random() * 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [generateBotMessage]);

  // Subscribe to mirrored messages from #general (real activity)
  useEffect(() => {
    const channel = supabase.channel('general-lobby-mirror', {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'bot-message' }, (payload) => {
        const { username, content, avatarUrl } = payload.payload;
        addMirrorMessage(username, content, avatarUrl);
      })
      .on('broadcast', { event: 'user-message' }, (payload) => {
        const { username, content, avatarUrl } = payload.payload;
        const newMsg: MirrorMessage = {
          id: `mirror-${Date.now()}-${Math.random()}`,
          content,
          user_id: `user-${username}`,
          channel_id: 'general-mirror',
          created_at: new Date().toISOString(),
          profile: {
            username,
            avatar_url: avatarUrl || null,
          }
        };
        setMessages(prev => [...prev, newMsg].slice(-50));
        lastActivityRef.current = Date.now();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addMirrorMessage]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const handleJoinChat = () => {
    navigate('/chat/general');
  };

  const handleChannelSelect = (channel: { name: string }) => {
    navigate(`/chat/${channel.name}`);
  };

  return (
    <div 
      className="flex h-full bg-background relative overflow-hidden rounded-xl border border-border"
      onClick={handleJoinChat}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleJoinChat()}
    >
      {/* Mobile overlay when member sidebar is open */}
      {showMemberSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setShowMemberSidebar(false);
          }}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-border bg-card lg:hidden">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold truncate">#general</p>
            <p className="text-xs text-muted-foreground">Live preview — Tap to join</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowMemberSidebar(true);
            }}
            className="h-9 w-9"
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block" onClick={(e) => e.stopPropagation()}>
          <ChatHeader 
            onlineCount={onlineUserIds.size || 200}
            topic="Live preview of #general — Click anywhere to join the conversation!"
            channelName="general"
          />
        </div>
        
        {/* Messages Area - No scrolling, shows latest messages only */}
        <div className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col relative isolate">
          {/* Transparent logo watermark - theme aware */}
          {theme === 'retro80s' ? (
            <RetroWatermark />
          ) : theme === 'valentines' ? (
            <ValentinesWatermark />
          ) : theme === 'stpatricks' ? (
            <StPatricksWatermark />
          ) : theme === 'matrix' ? (
            <MatrixWatermark />
          ) : (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{
                backgroundImage: 'url(/justachat-logo-google-ads.png)',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '300px',
                opacity: 0.15
              }}
            />
          )}
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <p>Waiting for chat activity...</p>
              <p className="text-sm mt-2">Click to join #general and start chatting!</p>
            </div>
          ) : (
            <div className="mt-auto space-y-2 sm:space-y-3">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  id={msg.id}
                  message={msg.content}
                  sender={msg.profile?.username || 'Unknown'}
                  senderId={msg.user_id}
                  senderAvatarUrl={msg.profile?.avatar_url}
                  timestamp={new Date(msg.created_at)}
                  isOwn={false}
                  isSystem={false}
                  isModerator={false}
                  canDelete={false}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        
        {/* Fake Input - Shows join prompt */}
        <div className="p-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            <div className="flex-1 bg-input rounded-lg px-3 py-2.5 text-base text-muted-foreground flex items-center justify-between">
              <span>Click to join and start chatting...</span>
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Member Sidebar - Hidden on mobile unless toggled, narrower for lobby */}
      <div 
        className={cn(
          "fixed lg:relative inset-y-0 right-0 z-40 transition-transform duration-300 lg:transition-none shrink-0",
          showMemberSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          "[&>div]:!w-44 [&>div]:sm:!w-40"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setShowMemberSidebar(false);
          }}
          className="absolute top-2 right-2 h-8 w-8 lg:hidden z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        <MemberList 
          onlineUserIds={onlineUserIds}
          channelName="general"
          onOpenPm={() => handleJoinChat()}
          onAction={() => handleJoinChat()}
        />
      </div>
    </div>
  );
};

export default LobbyMirrorRoom;
