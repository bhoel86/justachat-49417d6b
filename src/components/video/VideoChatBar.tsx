import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

interface VideoChatBarProps {
  roomId: string;
  userId: string;
  username: string;
}

const VideoChatBar = ({ roomId, userId, username }: VideoChatBarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase.channel(`video-chat:${roomId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setMessages(prev => [...prev, payload as ChatMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim() || !channelRef.current) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      username,
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message
    });

    // Also add to local state immediately
    setMessages(prev => [...prev, message]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-64">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Chat</span>
        <span className="text-xs text-muted-foreground">({messages.length})</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No messages yet. Say hi! 👋
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className={`font-medium ${msg.userId === userId ? 'text-primary' : 'text-foreground'}`}>
                  {msg.username}:
                </span>{' '}
                <span className="text-foreground/90">{msg.content}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 p-2 border-t border-border bg-muted/20">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="h-8 text-sm"
        />
        <Button 
          size="sm" 
          onClick={sendMessage}
          disabled={!inputValue.trim()}
          className="h-8 px-3"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default VideoChatBar;
