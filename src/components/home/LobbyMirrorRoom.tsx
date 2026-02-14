/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatHeader from "@/components/chat/ChatHeader";
import MemberList from "@/components/chat/MemberList";
import MessageBubble from "@/components/chat/MessageBubble";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { RetroWatermark } from "@/components/theme/RetroWatermark";
import { ValentinesWatermark } from "@/components/theme/ValentinesWatermark";
import { StPatricksWatermark } from "@/components/theme/StPatricksWatermark";
import { MatrixWatermark } from "@/components/theme/MatrixWatermark";
import { JungleWatermark } from "@/components/theme/JungleWatermark";
import { OGWatermark } from "@/components/theme/OGWatermark";

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
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only real users appear — no simulated bots
  const onlineUserIds = useMemo(() => new Set<string>(), []);

  // Subscribe to mirrored messages from #general (real activity only)
  useEffect(() => {
    const channel = supabase.channel('general-lobby-mirror', {
      config: { broadcast: { self: true } }
    });

    channel
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      className={cn(
        "flex h-full relative overflow-hidden",
        isRetro ? "retro-lobby-mirror" : "bg-background rounded-xl border border-border"
      )}
      onClick={handleJoinChat}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleJoinChat()}
    >
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden pointer-events-none">
        {/* Mobile Header Bar */}
        <div className={`flex items-center gap-2 px-2 py-2 bg-card lg:hidden ${isRetro ? 'border-b-4 border-pink-500' : 'border-b border-border'}`}>
          <div className="flex-1 min-w-0">
            <p className={`text-base font-semibold truncate ${isRetro ? 'text-cyan-400' : ''}`}>#general</p>
            <p className={`text-xs ${isRetro ? 'text-yellow-400' : 'text-muted-foreground'}`}>Live preview — Tap to join</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className={`hidden lg:block ${isRetro ? 'border-b-4 border-pink-500' : ''}`}>
          <ChatHeader 
            onlineCount={0}
            topic="Live preview of #general — Click anywhere to join the conversation!"
            channelName="general"
          />
        </div>
        
        {/* Messages Area */}
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
          ) : theme === 'jungle' ? (
            <JungleWatermark />
          ) : theme === 'vapor' || theme === 'arcade' || theme === 'dieselpunk' || theme === 'cyberpunk' ? (
            null
          ) : (
             <OGWatermark />
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
        <div className="p-2 border-t border-border">
          <div className="flex gap-2">
            <div className="flex-1 bg-input rounded-lg px-3 py-2.5 text-base text-muted-foreground flex items-center justify-between">
              <span>Click to join and start chatting...</span>
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Member Sidebar - also non-interactive */}
      <div 
        className="hidden lg:block shrink-0 pointer-events-none [&>div]:!w-44 [&>div]:sm:!w-40"
      >
        <MemberList 
          onlineUserIds={onlineUserIds}
          channelName="general"
          onOpenPm={() => {}}
          onAction={() => {}}
        />
      </div>
    </div>
  );
};

export default LobbyMirrorRoom;
