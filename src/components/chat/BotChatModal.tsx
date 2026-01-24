import { useState, useEffect, useRef, useCallback } from "react";
import { X, Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type ModeratorInfo } from "@/lib/roomConfig";
import EmojiPicker from "./EmojiPicker";

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

interface BotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  moderator: ModeratorInfo;
  channelName: string;
  currentUsername: string;
}

const BotChatModal = ({
  isOpen,
  onClose,
  moderator,
  channelName,
  currentUsername
}: BotChatModalProps) => {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userMemory, setUserMemory] = useState<UserMemory>({ topics: [], mood: null, isReturning: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedMemory = useRef(false);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user's conversation history when opening
  useEffect(() => {
    const loadUserMemory = async () => {
      if (!isOpen || hasLoadedMemory.current) return;
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

          // Personalized welcome for returning users
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
          // First time user
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
  }, [isOpen, channelName, moderator.name]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasLoadedMemory.current = false;
      setMessages([]);
      setUserMemory({ topics: [], mood: null, isReturning: false });
    }
  }, [isOpen]);

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
        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          content: response.data.response,
          isBot: true,
          timestamp: new Date()
        }]);

        // Update local memory with extracted topics
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
        description: "Couldn't reach the moderator. Try again."
      });
    } finally {
      setIsTyping(false);
    }
  }, [channelName, messages, toast, userMemory]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage('');

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      content: userMsg,
      isBot: false,
      timestamp: new Date()
    }]);

    // Get bot response
    getBotResponse(userMsg);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleClose = () => {
    hasLoadedMemory.current = false;
    setMessages([]);
    setUserMemory({ topics: [], mood: null, isReturning: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-cyan-500/10 to-primary/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-lg">
                {moderator.avatar}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-cyan-400 border-2 border-card flex items-center justify-center">
                <span className="text-[6px] text-card">✓</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{moderator.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">
                  BOT
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{moderator.displayName} • Moderator</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.isBot
                    ? 'bg-gradient-to-br from-cyan-500/20 to-primary/10 border border-cyan-500/20 text-foreground rounded-bl-sm'
                    : 'bg-primary text-primary-foreground rounded-br-sm'
                }`}
              >
                {msg.isBot && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{moderator.avatar}</span>
                    <span className="text-xs font-medium text-cyan-400">{moderator.name}</span>
                  </div>
                )}
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-[10px] opacity-50 mt-1 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-cyan-500/20 to-primary/10 border border-cyan-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{moderator.avatar}</span>
                  <span className="text-xs font-medium text-cyan-400">{moderator.name}</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
              placeholder={`Message ${moderator.name}...`}
              disabled={isTyping}
              className="flex-1 bg-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isTyping}
              variant="jac"
              size="icon"
              className="h-12 w-12 rounded-xl shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotChatModal;
