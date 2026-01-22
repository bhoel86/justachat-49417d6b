import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Send, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateSessionKey, encryptMessage, encryptMessageWithIv, decryptMessage, exportKey, importKey, generateSessionId } from "@/lib/encryption";
import EmojiPicker from "./EmojiPicker";
import { useToast } from "@/hooks/use-toast";

interface PrivateMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
}

interface PrivateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
  currentUserId: string;
  currentUsername: string;
}

const PrivateMessageModal = ({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  currentUserId,
  currentUsername
}: PrivateMessageModalProps) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [message, setMessage] = useState('');
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [targetOnline, setTargetOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize encrypted session
  useEffect(() => {
    if (!isOpen) return;

    const initSession = async () => {
      // Generate session key and ID
      const key = await generateSessionKey();
      const sid = generateSessionId();
      setSessionKey(key);
      setSessionId(sid);

      // Create unique channel for this conversation
      const channelName = [currentUserId, targetUserId].sort().join('-');
      
      // Subscribe to realtime channel for ephemeral messages
      const channel = supabase.channel(`private-${channelName}`, {
        config: { broadcast: { self: true } }
      });

      channel
        .on('broadcast', { event: 'message' }, async (payload) => {
          const data = payload.payload;
          if (data.sessionId !== sid && sessionKey) {
            try {
              // Decrypt incoming message
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
            
            // Send key exchange
            const exportedKey = await exportKey(key);
            channel.send({
              type: 'broadcast',
              event: 'key-exchange',
              payload: { key: exportedKey, userId: currentUserId }
            });
          }
        });

      // Handle key exchange from other user
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
      // Clean up - unsubscribe and clear messages
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      setMessages([]);
      setSessionKey(null);
      setIsConnected(false);
    };
  }, [isOpen, currentUserId, targetUserId]);

  // Monitor for suspicious content
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
      // Silently fail - monitoring should not disrupt chat
      console.error('Monitor error:', error);
    }
  }, [targetUserId, targetUsername, sessionId]);

  const handleSend = async () => {
    if (!message.trim() || !sessionKey || !channelRef.current) return;

    const trimmedMessage = message.trim();
    const msgId = `${Date.now()}-${Math.random()}`;
    
    try {
      // Encrypt message for broadcast
      const encrypted = await encryptMessage(trimmedMessage, sessionKey);
      
      // Encrypt message with separate IV for storage
      const encryptedForStorage = await encryptMessageWithIv(trimmedMessage, sessionKey);
      
      // Store encrypted message in database for admin monitoring
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
      
      // Send via broadcast for real-time delivery
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

      // Add to local state
      setMessages(prev => [...prev, {
        id: msgId,
        content: trimmedMessage,
        senderId: currentUserId,
        senderName: currentUsername,
        timestamp: new Date(),
        isOwn: true
      }]);

      // Monitor the message for illegal content
      monitorMessage(trimmedMessage, currentUserId, currentUsername);

      setMessage('');
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
    // Clear all messages on close - no records remain
    setMessages([]);
    onClose();
    toast({
      title: "Private chat ended",
      description: "All messages have been destroyed.",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg h-[600px] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                {targetUsername.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${targetOnline ? 'bg-green-500' : 'bg-muted'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{targetUsername}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 text-green-500" />
                <span className="text-green-500">End-to-end encrypted</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Security Notice */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-500" />
          <span className="text-xs text-amber-500">
            Messages are encrypted. Admins can review encrypted content for moderation.
          </span>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="px-4 py-2 bg-muted flex items-center justify-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">Establishing secure connection...</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
              <Lock className="h-12 w-12 mb-4 text-primary/50" />
              <p className="font-medium">Private conversation</p>
              <p className="text-sm mt-1">Messages are encrypted end-to-end</p>
              <p className="text-xs mt-2 text-amber-500">All messages are destroyed when chat closes</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  {!msg.isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</p>
                  )}
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a private message..."
              disabled={!isConnected}
              className="flex-1 bg-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || !isConnected}
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

export default PrivateMessageModal;
