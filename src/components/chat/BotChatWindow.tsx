/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Minus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type ModeratorInfo } from "@/lib/roomConfig";
import EmojiPicker from "./EmojiPicker";

function formatModeratorError(err: unknown): string {
  const raw =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err
        ? String((err as any).message)
        : err instanceof Error
          ? err.message
          : 'Unknown error';

  const redacted = raw
    .replace(/sk-[A-Za-z0-9_-]{10,}/g, 'sk-***')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ***');

  return redacted.length > 220 ? `${redacted.slice(0, 220)}…` : redacted;
}

interface BotMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface UserMemory {
  topics: string[];
  mood: string | null;
  isReturning: boolean;
}

interface BotChatWindowProps {
  moderator: ModeratorInfo;
  channelName: string;
  currentUsername: string;
  onClose: () => void;
  onMinimize: () => void;
  initialPosition?: { x: number; y: number };
  zIndex: number;
  onFocus: () => void;
}

const MIN_WIDTH = 280;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 450;
const MAX_HEIGHT = 550;

const BotChatWindow = ({
  moderator,
  channelName,
  currentUsername,
  onClose,
  onMinimize,
  initialPosition = { x: 100, y: 100 },
  zIndex,
  onFocus
}: BotChatWindowProps) => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userMemory, setUserMemory] = useState<UserMemory>({ topics: [], mood: null, isReturning: false });
  const [position, setPosition] = useState(() => ({
    x: Math.max(0, Math.min(window.innerWidth - 340, initialPosition.x)),
    y: Math.max(0, Math.min(window.innerHeight - 440, initialPosition.y))
  }));
  const [size, setSize] = useState({ width: 320, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedMemory = useRef(false);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user's conversation history when opening
  useEffect(() => {
    const loadUserMemory = async () => {
      if (hasLoadedMemory.current) return;
      hasLoadedMemory.current = true;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: topicsData } = await supabase
          .from('user_conversation_topics')
          .select('topics, mood')
          .eq('user_id', user.id)
          .eq('channel_name', channelName)
          .single();

        if (topicsData) {
          setUserMemory({
            topics: topicsData.topics || [],
            mood: topicsData.mood,
            isReturning: true
          });

          const topicMention = topicsData.topics?.length > 0 
            ? ` Last time we talked about ${topicsData.topics[0]}. How's that going?`
            : '';
          
          setMessages([{
            id: 'welcome',
            content: `Hey, welcome back! Good to see you again.${topicMention} What's on your mind?`,
            isBot: true,
            timestamp: new Date()
          }]);
        } else {
          setMessages([{
            id: 'welcome',
            content: `Hey! I'm ${moderator.name}. What's on your mind?`,
            isBot: true,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Error loading user memory:', error);
        setMessages([{
          id: 'welcome',
          content: `Hey! I'm ${moderator.name}. What's on your mind?`,
          isBot: true,
          timestamp: new Date()
        }]);
      }
    };

    loadUserMemory();
  }, [channelName, moderator.name]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    e.preventDefault();
    onFocus();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Touch dragging for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    onFocus();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  // Resize logic
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + deltaX));
        const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, touch.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 50, touch.clientY - dragOffset.y));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, size.width]);

  const getBotResponse = useCallback(async (userMessage: string) => {
    setIsTyping(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const recentMsgs = messages.slice(-5).map(m => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await supabase.functions.invoke('ai-moderator', {
        body: {
          channelName,
          userMessage,
          recentMessages: recentMsgs,
          userId: user?.id,
          isReturningUser: userMemory.isReturning,
          userTopics: userMemory.topics,
          lastMood: userMemory.mood
        }
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data?.response) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          content: response.data.response,
          isBot: true,
          timestamp: new Date()
        }]);

        if (response.data.extractedTopics?.length > 0) {
          setUserMemory(prev => ({
            ...prev,
            topics: [...new Set([...prev.topics, ...response.data.extractedTopics])].slice(0, 10),
            mood: response.data.detectedMood || prev.mood,
            isReturning: true
          }));
        }
      }
    } catch (error) {
      console.error('Bot response error:', error);
      toast({
        variant: "destructive",
        title: "Connection error",
        description: `Couldn't reach the moderator. ${formatModeratorError(error)}`
      });
    } finally {
      setIsTyping(false);
    }
  }, [channelName, messages, toast, userMemory]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage('');

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      content: userMsg,
      isBot: false,
      timestamp: new Date()
    }]);

    getBotResponse(userMsg);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <div
      className="fixed bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      onClick={onFocus}
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-primary/20 border-b border-border cursor-move select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-sm">
              {moderator.avatar}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyan-400 border-2 border-card flex items-center justify-center">
              <Bot className="h-1.5 w-1.5 text-card" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-foreground truncate">{moderator.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium shrink-0">
                BOT
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{moderator.displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-destructive/20 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.isBot
                  ? 'bg-gradient-to-br from-cyan-500/20 to-primary/10 border border-cyan-500/20 text-foreground rounded-bl-sm'
                  : 'bg-primary text-primary-foreground rounded-br-sm'
              }`}
            >
              {msg.isBot && (
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs">{moderator.avatar}</span>
                  <span className="text-[10px] font-medium text-cyan-400">{moderator.name}</span>
                </div>
              )}
              <p className="text-sm break-words">{msg.content}</p>
              <p className="text-[9px] opacity-50 mt-0.5 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-br from-cyan-500/20 to-primary/10 border border-cyan-500/20 rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs">{moderator.avatar}</span>
                <span className="text-[10px] font-medium text-cyan-400">{moderator.name}</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1.5">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
            placeholder={`Message ${moderator.name}...`}
            disabled={isTyping}
            className="flex-1 bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isTyping}
            variant="jac"
            size="icon"
            className="h-9 w-9 rounded-lg shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/30" />
      </div>
    </div>
  );
};

export default BotChatWindow;
