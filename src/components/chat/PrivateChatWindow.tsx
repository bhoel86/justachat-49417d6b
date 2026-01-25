import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Send, Minus, Shield, Check, CheckCheck, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateSessionKey, encryptMessage, encryptWithMasterKey, decryptMessage, exportKey, importKey, generateSessionId } from "@/lib/encryption";
import EmojiPicker from "./EmojiPicker";
import { useToast } from "@/hooks/use-toast";
import { CHAT_BOTS, ROOM_BOTS } from "@/lib/chatBots";

// Get bot ID from user ID if it's a simulated user
const getBotIdFromUserId = (userId: string): string | null => {
  // Check if this is a simulated user ID format (e.g., "sim-user-nova", "sim-gen-1")
  if (!userId.startsWith('sim-')) return null;
  
  const botId = userId.replace('sim-', '');
  const allBots = [...CHAT_BOTS, ...ROOM_BOTS];
  const bot = allBots.find(b => b.id === botId);
  return bot ? botId : null;
};

interface PrivateMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
  seenByBot?: boolean;
  imageUrl?: string;
}

interface PrivateChatWindowProps {
  targetUserId: string;
  targetUsername: string;
  currentUserId: string;
  currentUsername: string;
  onClose: () => void;
  onMinimize: () => void;
  onNewMessage?: () => void;
  initialPosition?: { x: number; y: number };
  zIndex: number;
  onFocus: () => void;
}

const MIN_WIDTH = 280;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 500;
const MAX_HEIGHT = 600;

const PrivateChatWindow = ({
  targetUserId,
  targetUsername,
  currentUserId,
  currentUsername,
  onClose,
  onMinimize,
  onNewMessage,
  initialPosition = { x: 100, y: 100 },
  zIndex,
  onFocus
}: PrivateChatWindowProps) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [targetOnline, setTargetOnline] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState({ width: 320, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const botResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check if target user is a bot
  const targetBotId = getBotIdFromUserId(targetUserId);
  const isTargetBot = !!targetBotId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    onFocus();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
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

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, size.width]);

  // Initialize encrypted session
  useEffect(() => {
    const initSession = async () => {
      const key = await generateSessionKey();
      const sid = generateSessionId();
      setSessionKey(key);
      setSessionId(sid);

      const channelName = [currentUserId, targetUserId].sort().join('-');
      
      const channel = supabase.channel(`private-${channelName}`, {
        config: { broadcast: { self: true } }
      });

      channel
        .on('broadcast', { event: 'message' }, async (payload) => {
          const data = payload.payload;
          if (data.sessionId !== sid && sessionKey) {
            try {
              const decrypted = await decryptMessage(data.encrypted, sessionKey);
              
              setMessages(prev => [...prev, {
                id: data.id,
                content: decrypted,
                senderId: data.senderId,
                senderName: data.senderName,
                timestamp: new Date(data.timestamp),
                isOwn: data.senderId === currentUserId
              }]);
            } catch (error) {
              console.error('Failed to decrypt message:', error);
            }
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const onlineIds = new Set<string>();
          Object.values(state).forEach((presences: any[]) => {
            presences.forEach((p: { userId?: string }) => {
              if (p.userId) onlineIds.add(p.userId);
            });
          });
          setTargetOnline(onlineIds.has(targetUserId));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            await channel.track({ userId: currentUserId });
            
            const exportedKey = await exportKey(key);
            channel.send({
              type: 'broadcast',
              event: 'key-exchange',
              payload: { key: exportedKey, userId: currentUserId }
            });
          }
        });

      channel.on('broadcast', { event: 'key-exchange' }, async (payload) => {
        const data = payload.payload;
        if (data.userId !== currentUserId && data.key) {
          try {
            const importedKey = await importKey(data.key);
            setSessionKey(importedKey);
          } catch (error) {
            console.error('Key exchange failed:', error);
          }
        }
      });

      channelRef.current = channel;
    };

    initSession();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      setMessages([]);
      setSessionKey(null);
      setIsConnected(false);
    };
  }, [currentUserId, targetUserId]);

  const monitorMessage = useCallback(async (content: string, senderId: string, senderName: string) => {
    try {
      await supabase.functions.invoke('pm-monitor', {
        body: {
          content,
          senderId,
          senderName,
          targetUserId,
          targetUsername,
          sessionId
        }
      });
    } catch (error) {
      console.error('Monitor error:', error);
    }
  }, [targetUserId, targetUsername, sessionId]);

  // Generate bot response for PM
  const generateBotResponse = useCallback(async (userMessage: string) => {
    if (!targetBotId) return;

    // Random delay between 3-12 seconds for realistic typing
    const delay = 3000 + Math.random() * 9000;
    
    setIsBotTyping(true);
    
    botResponseTimeoutRef.current = setTimeout(async () => {
      try {
        const recentMsgs = messages.slice(-15).map(m => ({
          username: m.isOwn ? currentUsername : targetUsername,
          content: m.content,
        }));

        const { data, error } = await supabase.functions.invoke('chat-bot', {
          body: {
            botId: targetBotId,
            context: 'private-message',
            recentMessages: recentMsgs,
            respondTo: userMessage,
            isPM: true,
            pmPartnerName: currentUsername,
          },
        });

        if (error) {
          console.error('Bot PM response error:', error);
          setIsBotTyping(false);
          return;
        }

        if (data?.message) {
          const botMsgId = `bot-${Date.now()}-${Math.random()}`;
          setMessages(prev => [...prev, {
            id: botMsgId,
            content: data.message,
            senderId: targetUserId,
            senderName: targetUsername,
            timestamp: new Date(),
            isOwn: false,
            imageUrl: data.imageUrl || undefined,
          }]);
          onNewMessage?.();
        }
      } catch (err) {
        console.error('Failed to get bot response:', err);
      } finally {
        setIsBotTyping(false);
      }
    }, delay);
  }, [targetBotId, messages, currentUsername, targetUsername, targetUserId, onNewMessage]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (botResponseTimeoutRef.current) {
        clearTimeout(botResponseTimeoutRef.current);
      }
      if (seenTimeoutRef.current) {
        clearTimeout(seenTimeoutRef.current);
      }
    };
  }, []);

  // Simulate bot "seeing" messages after a short delay
  const markMessageAsSeen = useCallback((msgId: string) => {
    if (!isTargetBot) return;
    
    // Random delay between 1-3 seconds before marking as "seen"
    const seenDelay = 1000 + Math.random() * 2000;
    
    seenTimeoutRef.current = setTimeout(() => {
      setSeenMessageIds(prev => new Set(prev).add(msgId));
    }, seenDelay);
  }, [isTargetBot]);

  const handleSend = async () => {
    if (!message.trim() || !sessionKey || !channelRef.current) return;

    const trimmedMessage = message.trim();
    const msgId = `${Date.now()}-${Math.random()}`;
    
    try {
      const encrypted = await encryptMessage(trimmedMessage, sessionKey);
      const masterKeyForStorage = 'JAC_PM_MASTER_2024';
      const encryptedForStorage = await encryptWithMasterKey(trimmedMessage, masterKeyForStorage);
      
      const { error: dbError } = await supabase
        .from('private_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: targetUserId,
          encrypted_content: encryptedForStorage.ciphertext,
          iv: encryptedForStorage.iv
        });

      if (dbError) {
        console.error('Failed to store message:', dbError);
      }
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: msgId,
          encrypted,
          senderId: currentUserId,
          senderName: currentUsername,
          timestamp: new Date().toISOString(),
          sessionId
        }
      });

      setMessages(prev => [...prev, {
        id: msgId,
        content: trimmedMessage,
        senderId: currentUserId,
        senderName: currentUsername,
        timestamp: new Date(),
        isOwn: true
      }]);

      monitorMessage(trimmedMessage, currentUserId, currentUsername);
      setMessage('');

      // Trigger bot "seen" and response if chatting with a simulated user
      if (isTargetBot) {
        markMessageAsSeen(msgId);
        generateBotResponse(trimmedMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Could not encrypt and send message."
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleClose = () => {
    setMessages([]);
    onClose();
    toast({
      title: "Private chat ended",
      description: "All messages have been destroyed.",
    });
  };

  const messageAreaHeight = size.height - 140; // Header + input + notices

  return (
    <div
      ref={windowRef}
      onMouseDown={onFocus}
      className="fixed shadow-2xl rounded-xl overflow-hidden border-2 border-primary/30 bg-card animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Header - Draggable */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary/30 to-accent/30 cursor-move select-none border-b border-border"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
              {targetUsername.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${targetOnline ? 'bg-green-500' : 'bg-muted'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{targetUsername}</p>
            <div className="flex items-center gap-1 text-[10px] text-green-500">
              <Lock className="h-2.5 w-2.5" />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Voice/Video Call buttons - only for real users, not bots */}
          {!isTargetBot && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  // TODO: Trigger voice call
                  window.dispatchEvent(new CustomEvent('start-private-call', { 
                    detail: { targetUserId, targetUsername, callType: 'voice' } 
                  }));
                }} 
                className="h-6 w-6 rounded hover:bg-primary/20 hover:text-primary"
                title="Voice call"
              >
                <Phone className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { 
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('start-private-call', { 
                    detail: { targetUserId, targetUsername, callType: 'video' } 
                  }));
                }} 
                className="h-6 w-6 rounded hover:bg-primary/20 hover:text-primary"
                title="Video call"
              >
                <Video className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
            className="h-6 w-6 rounded hover:bg-background/50"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); handleClose(); }} 
            className="h-6 w-6 rounded hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="px-2 py-1 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-1.5">
        <Shield className="h-3 w-3 text-amber-500 shrink-0" />
        <span className="text-[10px] text-amber-500 truncate">
          Admins can review for moderation
        </span>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="px-2 py-1.5 bg-muted flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-[10px] text-muted-foreground">Connecting...</span>
        </div>
      )}

      {/* Messages */}
      <div 
        className="overflow-y-auto p-2 space-y-2 bg-background/50"
        style={{ height: messageAreaHeight }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Lock className="h-8 w-8 mb-2 text-primary/30" />
            <p className="text-xs font-medium">Encrypted chat</p>
            <p className="text-[10px] mt-1 text-amber-500">Messages destroyed on close</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${
                  msg.isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {!msg.isOwn && (
                  <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.senderName}</p>
                )}
                <p className="text-xs break-words">{msg.content}</p>
                {/* Display image if present */}
                {msg.imageUrl && (
                  <div className="mt-1.5">
                    <img 
                      src={msg.imageUrl} 
                      alt="Shared photo" 
                      className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    />
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[9px] opacity-50">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {/* Read receipts for own messages to bots */}
                  {msg.isOwn && isTargetBot && (
                    <span className="flex items-center">
                      {seenMessageIds.has(msg.id) ? (
                        <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                      ) : (
                        <Check className="h-3 w-3 text-primary-foreground/50" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {/* Typing indicator for bot */}
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium opacity-70">{targetUsername}</span>
                <span className="text-[10px] opacity-50 ml-1">typing</span>
                <span className="flex gap-0.5 ml-1">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border bg-card">
        <div className="flex gap-1.5">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message..."
            disabled={!isConnected}
            className="flex-1 bg-input rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || !isConnected}
            variant="jac"
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/40 group-hover:border-primary transition-colors" />
      </div>
    </div>
  );
};

export default PrivateChatWindow;
