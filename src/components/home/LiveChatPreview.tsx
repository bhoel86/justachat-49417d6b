import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserAvatar from "@/components/avatar/UserAvatar";
import { Shield, Crown, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LiveMessage {
  id: string;
  username: string;
  content: string;
  avatarUrl?: string;
  timestamp: Date;
  isBot?: boolean;
}

const LiveChatPreview = () => {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Subscribe to bot messages being broadcast on general channel
  useEffect(() => {
    const channel = supabase.channel('general-lobby-mirror', {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'bot-message' }, (payload) => {
        const { username, content, avatarUrl } = payload.payload;
        setMessages(prev => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          username,
          content,
          avatarUrl,
          timestamp: new Date(),
          isBot: true,
        }].slice(-25));
      })
      .on('broadcast', { event: 'user-message' }, (payload) => {
        const { username, content, avatarUrl } = payload.payload;
        setMessages(prev => [...prev, {
          id: `${Date.now()}-${Math.random()}`,
          username,
          content,
          avatarUrl,
          timestamp: new Date(),
          isBot: false,
        }].slice(-25));
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

  const handleClick = () => {
    navigate('/chat/general');
  };

  return (
    <div 
      className="flex flex-1 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-2 py-1.5 bg-primary/10 border-b border-border flex items-center gap-2">
          <MessageCircle className="w-3 h-3 text-primary" />
          <p className="text-[10px] text-primary font-medium">Live from #general — Click to join!</p>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 relative">
          {/* Transparent logo watermark */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            style={{
              backgroundImage: 'url(/justachat-logo-google-ads.png)',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '200px',
              opacity: 0.15
            }}
          />
          
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
              Waiting for messages...
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex gap-1.5 animate-fade-in relative z-10"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <UserAvatar
                  avatarUrl={msg.avatarUrl}
                  username={msg.username}
                  size="xs"
                />
              </div>
              
              {/* Message bubble */}
              <div className="bg-secondary/50 rounded-lg rounded-bl-sm px-2 py-1 max-w-[85%]">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-medium text-primary">
                    {msg.username}
                  </p>
                  <span className="text-[9px] text-muted-foreground ml-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-tight">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Click to join prompt */}
        <div className="p-2 border-t border-border">
          <div className="bg-primary/10 rounded-lg px-3 py-2 text-xs text-primary font-medium text-center">
            Click anywhere to join #general →
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChatPreview;
