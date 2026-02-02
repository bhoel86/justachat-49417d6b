import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Send, Minus, Shield, Check, CheckCheck, Phone, Video, ImagePlus, Zap, Loader2, Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getChatBotFunctionName } from "@/lib/environment";
import { generateSessionKey, encryptMessage, decryptMessage, exportKey, importKey, generateSessionId } from "@/lib/encryption";
import EmojiPicker from "./EmojiPicker";
import TextFormatMenu, { TextFormat, encodeFormat } from "./TextFormatMenu";
import FormattedText from "./FormattedText";
import { useToast } from "@/hooks/use-toast";
import { CHAT_BOTS, ROOM_BOTS } from "@/lib/chatBots";
import { usePrivateCall } from "@/hooks/usePrivateCall";
import PrivateCallUI from "./PrivateCallUI";
import BotVoiceCallUI from "./BotVoiceCallUI";
import IncomingCallModal from "./IncomingCallModal";
import { compressImage } from "@/lib/imageCompression";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// IRC-style actions for PM
const PM_ACTIONS = {
  funny: [
    { emoji: "🐟", action: "slaps", suffix: "around with a large trout" },
    { emoji: "🍕", action: "throws", suffix: "a slice of pizza at" },
    { emoji: "🎸", action: "serenades", suffix: "with an air guitar solo" },
    { emoji: "💨", action: "blows", suffix: "a raspberry at" },
  ],
  nice: [
    { emoji: "🙌", action: "high-fives", suffix: "" },
    { emoji: "🤗", action: "gives", suffix: "a warm hug" },
    { emoji: "🎉", action: "celebrates", suffix: "with confetti" },
    { emoji: "☕", action: "offers", suffix: "a cup of coffee" },
  ],
};

// Get bot ID from user ID if it's a simulated user
const getBotIdFromUserId = (userId: string): string | null => {
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
  
  // New state for image upload, text formatting, and actions
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [textFormat, setTextFormat] = useState<TextFormat>({ textStyle: 'none' });
  const [selectedAction, setSelectedAction] = useState<{ emoji: string; action: string; suffix: string } | null>(null);
  const [showBotVoiceCall, setShowBotVoiceCall] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const botResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionKeyRef = useRef<CryptoKey | null>(null);
  const lastMessageCountRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const sentMessageIdsRef = useRef<Set<string>>(new Set());
  const isSendingRef = useRef(false);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  // Check if target user is a bot
  const targetBotId = getBotIdFromUserId(targetUserId);
  const isTargetBot = !!targetBotId;

  // Private call hook
  const privateCall = usePrivateCall({
    currentUserId,
    currentUsername,
    targetUserId,
    targetUsername,
  });

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when new messages are added (own messages or incoming)
  useEffect(() => {
    if (messages.length > 0) {
      // Force scroll to bottom with multiple strategies for mobile reliability
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        });
      });
      // Also use timeout as fallback for mobile
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Force scroll when connection is established and overlay disappears
  useEffect(() => {
    if (isConnected && messages.length > 0) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 200);
    }
  }, [isConnected, messages.length]);

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

  // Helper function to decrypt a message from DB using server-side decryption
  const decryptDbMessage = async (msg: any): Promise<PrivateMessage | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('decrypt-pm', {
        body: {
          messageId: msg.id,
          encrypted_content: msg.encrypted_content,
          iv: msg.iv
        }
      });

      if (error || !data?.success) {
        console.error('Server decryption failed:', error || data?.error);
        return null;
      }
      
      return {
        id: msg.id,
        content: data.decrypted_content,
        senderId: msg.sender_id,
        senderName: msg.sender_id === currentUserId ? currentUsername : targetUsername,
        timestamp: new Date(msg.created_at),
        isOwn: msg.sender_id === currentUserId
      };
    } catch (decryptError) {
      console.error('Failed to decrypt message:', decryptError);
      return null;
    }
  };

  // Initialize encrypted session
  useEffect(() => {
    let isMounted = true;
    hasLoadedRef.current = false;

    const loadPreviousMessages = async () => {
      if (hasLoadedRef.current || isTargetBot) return;
      hasLoadedRef.current = true;
      
      console.log('[PM-HISTORY] Loading message history...');
      
      try {
        const { data, error } = await supabase
          .from('private_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error || !isMounted) {
          console.error('[PM-HISTORY] Failed to load messages:', error);
          return;
        }
        
        console.log('[PM-HISTORY] Loaded', data?.length || 0, 'messages from DB');

        if (data && data.length > 0) {
          const decryptedMessages: PrivateMessage[] = [];
          
          for (const msg of data) {
            const decrypted = await decryptDbMessage(msg);
            if (decrypted) {
              decryptedMessages.push(decrypted);
            } else {
              console.warn('[PM-HISTORY] Failed to decrypt message:', msg.id);
            }
          }
          
          console.log('[PM-HISTORY] Successfully decrypted', decryptedMessages.length, 'messages');
          
          if (isMounted) {
            setMessages(decryptedMessages);
            lastMessageCountRef.current = decryptedMessages.length;
            // Force scroll to bottom after loading history
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              });
            });
            // Use timeout as well for mobile reliability
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
            }, 150);
          }
        } else {
          console.log('[PM-HISTORY] No messages found in DB');
        }
      } catch (err) {
        console.error('[PM-HISTORY] Error loading messages:', err);
      }
    };

    const initSession = async () => {
      const sid = generateSessionId();
      if (isMounted) setSessionId(sid);

      // Load previous messages first
      await loadPreviousMessages();

      const isKeyLeader = currentUserId < targetUserId;
      const channelName = [currentUserId, targetUserId].sort().join('-');
      
      const channel = supabase.channel(`private-${channelName}`, {
        config: { broadcast: { self: false } }
      });

      let localKey: CryptoKey | null = null;
      if (isKeyLeader) {
        localKey = await generateSessionKey();
        if (isMounted) setSessionKey(localKey);
      }

      channel
        .on('broadcast', { event: 'message' }, async (payload) => {
          if (!isMounted) return;
          const data = payload.payload;
          console.log('[PM-RECV] Received broadcast:', data.id, 'from:', data.senderId, 'current user:', currentUserId);
          
          // CRITICAL: Never add our own sent messages (triple safety check)
          if (data.senderId === currentUserId || sentMessageIdsRef.current.has(data.id)) {
            console.log('[PM] Ignoring own message:', data.id, 'sender match:', data.senderId === currentUserId, 'in sent set:', sentMessageIdsRef.current.has(data.id));
            return;
          }

          const currentKey = sessionKeyRef.current;
          if (currentKey) {
            try {
              const decrypted = await decryptMessage(data.encrypted, currentKey);

              // Prevent duplicates - check if message ID already exists
              setMessages(prev => {
                if (prev.some(m => m.id === data.id)) {
                  console.log('[PM] Skipping duplicate message:', data.id);
                  return prev; // Message already exists, skip it
                }
                console.log('[PM] Adding incoming message:', data.id, 'from:', data.senderId);
                return [...prev, {
                id: data.id,
                content: decrypted,
                senderId: data.senderId,
                senderName: data.senderName,
                timestamp: new Date(data.timestamp),
                isOwn: false,
                imageUrl: data.imageUrl
                }];
              });
              onNewMessage?.();
            } catch (error) {
              console.error('Failed to decrypt message:', error);
            }
          }
        })
        .on('broadcast', { event: 'key-exchange' }, async (payload) => {
          if (!isMounted) return;
          const data = payload.payload;
          if (data.userId !== currentUserId && data.key) {
            try {
              const importedKey = await importKey(data.key);
              setSessionKey(importedKey);
              sessionKeyRef.current = importedKey;
              
              if (!isKeyLeader) {
                channel.send({
                  type: 'broadcast',
                  event: 'key-ack',
                  payload: { userId: currentUserId }
                });
              }
            } catch (error) {
              console.error('Key exchange failed:', error);
            }
          }
        })
        .on('broadcast', { event: 'key-ack' }, async () => {
          console.log('Key exchange acknowledged');
        })
        .on('presence', { event: 'sync' }, () => {
          if (!isMounted) return;
          const state = channel.presenceState();
          const onlineIds = new Set<string>();
          Object.values(state).forEach((presences: any[]) => {
            presences.forEach((p: { userId?: string }) => {
              if (p.userId) onlineIds.add(p.userId);
            });
          });
          setTargetOnline(onlineIds.has(targetUserId));
          
          if (onlineIds.has(targetUserId) && isKeyLeader && localKey) {
            (async () => {
              const exportedKey = await exportKey(localKey);
              channel.send({
                type: 'broadcast',
                event: 'key-exchange',
                payload: { key: exportedKey, userId: currentUserId }
              });
            })();
          }
        })
        .on('presence', { event: 'join' }, async ({ newPresences }) => {
          const otherUserJoined = newPresences.some((p: any) => p.userId === targetUserId);
          if (otherUserJoined && isKeyLeader && localKey) {
            const exportedKey = await exportKey(localKey);
            channel.send({
              type: 'broadcast',
              event: 'key-exchange',
              payload: { key: exportedKey, userId: currentUserId }
            });
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isMounted) {
            setIsConnected(true);
            await channel.track({ userId: currentUserId });
            
            if (isKeyLeader && localKey) {
              const exportedKey = await exportKey(localKey);
              channel.send({
                type: 'broadcast',
                event: 'key-exchange',
                payload: { key: exportedKey, userId: currentUserId }
              });
            }
          }
        });

      channelRef.current = channel;
      if (localKey) {
        sessionKeyRef.current = localKey;
      }
    };

    initSession();

    return () => {
      isMounted = false;
      hasLoadedRef.current = false; // Reset so messages reload on next open
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      setMessages([]);
      setSessionKey(null);
      sessionKeyRef.current = null;
      setIsConnected(false);
    };
  }, [currentUserId, targetUserId, isTargetBot]);

  // Subscribe to database changes for reliable message sync
  useEffect(() => {
    if (isTargetBot) return;
    
    const dbChannel = supabase.channel(`pm-db-${currentUserId}-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Only process messages from this specific conversation
          if (newMsg.sender_id !== targetUserId) return;
          
          console.log('[PM-DB] New message from DB:', newMsg.id);
          
          // Decrypt and add if not already present
          const decrypted = await decryptDbMessage(newMsg);
          if (decrypted) {
            setMessages(prev => {
              // Check if message already exists by DB id
              if (prev.some(m => m.id === newMsg.id)) {
                console.log('[PM-DB] Skipping duplicate:', newMsg.id);
                return prev;
              }
              console.log('[PM-DB] Adding message from DB:', newMsg.id);
              onNewMessage?.();
              return [...prev, decrypted];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, [currentUserId, targetUserId, isTargetBot, targetUsername, onNewMessage]);

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

    const delay = 3000 + Math.random() * 9000;
    
    setIsBotTyping(true);
    
    botResponseTimeoutRef.current = setTimeout(async () => {
      try {
        const recentMsgs = messages.slice(-15).map(m => ({
          username: m.isOwn ? currentUsername : targetUsername,
          content: m.content,
        }));

        const { data, error } = await supabase.functions.invoke(getChatBotFunctionName(), {
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
    
    const seenDelay = 1000 + Math.random() * 2000;
    
    seenTimeoutRef.current = setTimeout(() => {
      setSeenMessageIds(prev => new Set(prev).add(msgId));
    }, seenDelay);
  }, [isTargetBot]);

  const handleSend = async () => {
    // Prevent rapid double-taps on mobile
    if (isSendingRef.current) {
      console.log('[PM-SEND] Already sending, blocked');
      return;
    }
    
    const currentKey = sessionKeyRef.current || sessionKey;
    
    // Images now auto-send on selection, so handleSend is only for text messages
    if (!message.trim()) {
      console.log('[PM-SEND] Empty message, ignoring');
      return;
    }
    if (!currentKey || !channelRef.current) {
      console.log('[PM-SEND] Missing key or channel', { hasKey: !!currentKey, hasChannel: !!channelRef.current });
      return;
    }
    
    // Only set sending lock AFTER validation passes
    isSendingRef.current = true;

    // Apply text formatting if set
    let finalMessage = message.trim();
    if (textFormat.textStyle !== 'none' || textFormat.bgColor) {
      finalMessage = encodeFormat(textFormat, finalMessage);
    }
    
    console.log('[PM-SEND] Sending message:', finalMessage.substring(0, 50));
    
    const msgId = `${Date.now()}-${Math.random()}`;
    
    try {
      const encrypted = await encryptMessage(finalMessage, currentKey);
      
      // Store via server-side encryption (no hardcoded key)
      const isSimulatedRecipient = typeof targetUserId === 'string' && targetUserId.startsWith('sim-');
      if (!isSimulatedRecipient) {
        const { data: storeResult, error: storeError } = await supabase.functions.invoke('encrypt-pm', {
          body: {
            message: finalMessage,
            recipient_id: targetUserId
          }
        });

        if (storeError || !storeResult?.success) {
          console.error('[PM-SEND] Failed to store message in DB:', storeError || storeResult?.error);
          toast({
            variant: "destructive",
            title: "Message not saved",
            description: "Message sent but not saved to history"
          });
        } else {
          console.log('[PM-SEND] Message stored in DB successfully');
        }
      }
      
    // CRITICAL: Mark as sent BEFORE adding to state to prevent race conditions
    sentMessageIdsRef.current.add(msgId);
      
    // Add message locally FIRST (before broadcast to prevent race conditions)
    setMessages(prev => {
      // Content-based dedup to prevent flicker with DB listener
      const isDuplicate = prev.some(m => 
        m.content === finalMessage && 
        m.senderId === currentUserId && 
        Math.abs(new Date(m.timestamp).getTime() - Date.now()) < 5000
      );
      if (isDuplicate || prev.some(m => m.id === msgId)) return prev;
      
      return [...prev, {
        id: msgId,
        content: finalMessage,
        senderId: currentUserId,
        senderName: currentUsername,
        timestamp: new Date(),
        isOwn: true
      }];
    });
    
    // Then broadcast to other party
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

      monitorMessage(finalMessage, currentUserId, currentUsername);
      setMessage('');
      setTextFormat({ textStyle: 'none' });
      
      console.log('[PM-SEND] Message sent successfully');

      // Trigger bot "seen" and response if chatting with a simulated user
      if (isTargetBot) {
        markMessageAsSeen(msgId);
        generateBotResponse(finalMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Could not encrypt and send message."
      });
    } finally {
      // Reset send lock after a brief delay
      setTimeout(() => {
        isSendingRef.current = false;
      }, 500);
    }
  };

  // Mobile-friendly send handler
  const handleSendClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    console.log('[PM-SEND] Button clicked/tapped');
    handleSend();
  }, [handleSend]);

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  // Handle GIF selection - sends immediately as a message
  const handleSendGif = async (gifUrl: string) => {
    // Prevent duplicate sends
    if (isSendingRef.current) {
      console.log('[PM-SEND] Already sending, blocking duplicate');
      return;
    }
    
    const currentKey = sessionKeyRef.current || sessionKey;
    if (!currentKey || !channelRef.current) return;
    
    isSendingRef.current = true;

    const finalMessage = `[img:${gifUrl}]`;
    const msgId = `${Date.now()}-${Math.random()}`;
    
    // Mark as sent immediately
    sentMessageIdsRef.current.add(msgId);
    
    try {
      const encrypted = await encryptMessage(finalMessage, currentKey);
      
      // Store via server-side encryption (no hardcoded key)
      const isSimulatedRecipient = typeof targetUserId === 'string' && targetUserId.startsWith('sim-');
      if (!isSimulatedRecipient) {
        const { error: storeError } = await supabase.functions.invoke('encrypt-pm', {
          body: {
            message: finalMessage,
            recipient_id: targetUserId
          }
        });

        if (storeError) {
          console.error('Failed to store GIF message:', storeError);
        }
      }
      
      // Add to local state with content-based dedup
      setMessages(prev => {
        const isDuplicate = prev.some(m => 
          m.content === finalMessage && 
          m.senderId === currentUserId && 
          Math.abs(new Date(m.timestamp).getTime() - Date.now()) < 5000
        );
        if (isDuplicate) return prev;
        
        return [...prev, {
          id: msgId,
          content: finalMessage,
          senderId: currentUserId,
          senderName: currentUsername,
          timestamp: new Date(),
          isOwn: true
        }];
      });
      
      // Broadcast
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: msgId,
          encrypted,
          senderId: currentUserId,
          senderName: currentUsername,
          timestamp: new Date().toISOString(),
          sessionId,
          imageUrl: gifUrl
        }
      });

      monitorMessage(finalMessage, currentUserId, currentUsername);
      
      if (isTargetBot) {
        markMessageAsSeen(msgId);
        generateBotResponse(finalMessage);
      }
    } catch (error) {
      console.error('Failed to send GIF:', error);
      // Remove from sent tracking on error
      sentMessageIdsRef.current.delete(msgId);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Could not send GIF."
      });
    } finally {
      // Allow next send after a short delay
      setTimeout(() => {
        isSendingRef.current = false;
      }, 300);
    }
  };

  // Image upload handlers - AUTO SEND on selection (like GIFs)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input immediately so user can re-select same file
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';

    if (file.size > 25 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image too large", description: "Please select an image under 25MB" });
      return;
    }

    // Prevent duplicate sends
    if (isSendingRef.current) {
      console.log('[PM-IMG] Already sending, blocking duplicate');
      return;
    }

    const currentKey = sessionKeyRef.current || sessionKey;
    if (!currentKey || !channelRef.current) {
      toast({ variant: "destructive", title: "Not connected", description: "Please wait for connection" });
      return;
    }

    isSendingRef.current = true;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress image
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85, outputType: "image/jpeg" });
      if (compressed.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image still too large", description: "After compression, the image is still over 10MB." });
        setIsUploading(false);
        isSendingRef.current = false;
        return;
      }

      // Upload directly
      const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const suggestedPath = `chat-images/${currentUserId}/${Date.now()}-${safeName}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("You must be signed in to upload images.");

      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("bucket", "avatars");
      formData.append("path", suggestedPath);

      const uploadData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.responseType = "json";
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        if (apikey) xhr.setRequestHeader("apikey", apikey);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            setUploadProgress(Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
          }
        };

        xhr.onload = () => {
          const resp = xhr.response ?? (() => { try { return JSON.parse(xhr.responseText); } catch { return xhr.responseText; } })();
          if (xhr.status >= 200 && xhr.status < 300) { resolve(resp); return; }
          reject(new Error(`Upload failed (HTTP ${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Upload failed: network error"));
        xhr.send(formData);
      });

      setUploadProgress(100);
      
      if (uploadData?.error || !uploadData?.url) {
        throw new Error(uploadData?.message || uploadData?.error || "Upload failed");
      }

      const imageUrl = uploadData.url;

      // Send the image as a message (like GIF)
      const finalMessage = `[img:${imageUrl}]`;
      const msgId = `${Date.now()}-${Math.random()}`;
      
      sentMessageIdsRef.current.add(msgId);
      
      const encrypted = await encryptMessage(finalMessage, currentKey);
      
      // Store via server-side encryption (no hardcoded key)
      const isSimulatedRecipient = typeof targetUserId === 'string' && targetUserId.startsWith('sim-');
      if (!isSimulatedRecipient) {
        const { error: storeError } = await supabase.functions.invoke('encrypt-pm', {
          body: {
            message: finalMessage,
            recipient_id: targetUserId
          }
        });

        if (storeError) {
          console.error('Failed to store image message:', storeError);
        }
      }
      
      // Add to local state - use content-based deduplication as well
      setMessages(prev => {
        // Check if this exact message content already exists (for dedup with DB listener)
        const isDuplicate = prev.some(m => 
          m.content === finalMessage && 
          m.senderId === currentUserId && 
          Math.abs(new Date(m.timestamp).getTime() - Date.now()) < 5000
        );
        if (isDuplicate) return prev;
        
        return [...prev, {
          id: msgId,
          content: finalMessage,
          senderId: currentUserId,
          senderName: currentUsername,
          timestamp: new Date(),
          isOwn: true,
          imageUrl
        }];
      });
      
      // Broadcast
      channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: msgId,
          encrypted,
          senderId: currentUserId,
          senderName: currentUsername,
          timestamp: new Date().toISOString(),
          sessionId,
          imageUrl
        }
      });

      monitorMessage(finalMessage, currentUserId, currentUsername);
      
      if (isTargetBot) {
        markMessageAsSeen(msgId);
        generateBotResponse("sent you a photo");
      }

      toast({ title: "Photo sent", description: "Your image was shared successfully" });

    } catch (err) {
      console.error('Failed to upload/send image:', err);
      toast({ variant: "destructive", title: "Failed to send image", description: err instanceof Error ? err.message : "Could not send image" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setAttachedImage(null);
      setImagePreview(null);
      setTimeout(() => {
        isSendingRef.current = false;
      }, 300);
    }
  };

  const clearImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // uploadImage function removed - now handled inline in handleImageSelect for auto-send

  // Action selection handler
  const handleActionSelect = (action: typeof PM_ACTIONS.funny[0]) => {
    const actionText = action.suffix 
      ? `/me ${action.emoji} ${action.action} ${targetUsername} ${action.suffix}`
      : `/me ${action.emoji} ${action.action} ${targetUsername}`;
    setMessage(actionText);
    setSelectedAction(null);
  };

  const handleClose = () => {
    setMessages([]);
    onClose();
    toast({
      title: "Private chat ended",
      description: "Chat window closed.",
    });
  };

  const messageAreaHeight = size.height - 140;

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
          {/* Call buttons - for real users */}
          {!isTargetBot && privateCall.callState === 'idle' && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); privateCall.startCall('voice'); }} 
                className="h-6 w-6 rounded hover:bg-primary/20 hover:text-primary"
                title="Voice call"
              >
                <Phone className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); privateCall.startCall('video'); }} 
                className="h-6 w-6 rounded hover:bg-primary/20 hover:text-primary"
                title="Video call"
              >
                <Video className="h-3 w-3" />
              </Button>
            </>
          )}
          {/* Voice call button for bots */}
          {isTargetBot && !showBotVoiceCall && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => { e.stopPropagation(); setShowBotVoiceCall(true); }} 
              className="h-6 w-6 rounded hover:bg-primary/20 hover:text-primary"
              title="Voice chat with bot"
            >
              <Phone className="h-3 w-3" />
            </Button>
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

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="overflow-y-auto p-2 bg-background/50 relative flex flex-col-reverse"
        style={{ height: messageAreaHeight }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Connection Status - Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center gap-2 z-10">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground">Connecting...</span>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Lock className="h-8 w-8 mb-2 text-primary/30" />
            <p className="text-xs font-medium">Encrypted chat</p>
            <p className="text-[10px] mt-1 opacity-70">Start a conversation</p>
          </div>
        ) : (
          <div className="space-y-2 flex flex-col-reverse">
            {[...messages].reverse().map((msg) => (
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
                  <div className="text-xs break-words"><FormattedText text={msg.content} /></div>
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
            ))}
          </div>
        )}
        {isBotTyping && (
          <div className="flex justify-start mt-2">
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

      {/* Upload Progress Indicator - shown during image upload */}
      {isUploading && (
        <div className="px-2 py-1.5 border-t border-border bg-muted/20 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{uploadProgress}%</span>
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-border bg-card">
        <div className="flex items-center gap-1.5">
          {/* Emoji + GIF Picker */}
          <EmojiPicker onEmojiSelect={handleEmojiSelect} onGifSelect={(gifUrl) => handleSendGif(gifUrl)} />
          
          {/* Text Format Menu */}
          <div className="shrink-0 [&_button]:h-8 [&_button]:w-8 [&_button]:rounded-lg">
            <TextFormatMenu currentFormat={textFormat} onFormatChange={setTextFormat} />
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <Zap className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-popover border border-border z-[9999]">
              <DropdownMenuLabel className="text-[10px]">Funny Actions</DropdownMenuLabel>
              {PM_ACTIONS.funny.map((action, i) => (
                <DropdownMenuItem key={i} onClick={() => handleActionSelect(action)} className="text-xs">
                  {action.emoji} {action.action}...
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px]">Nice Actions</DropdownMenuLabel>
              {PM_ACTIONS.nice.map((action, i) => (
                <DropdownMenuItem key={i} onClick={() => handleActionSelect(action)} className="text-xs">
                  {action.emoji} {action.action}...
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Image Upload - Gallery Picker */}
          <input 
            ref={fileInputRef} 
            type="file" 
           accept=".jpg,.jpeg,.png,.gif,.webp,.heic"
            onChange={handleImageSelect} 
            className="hidden" 
          />
          {/* Camera Input */}
          <input 
            ref={cameraInputRef} 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleImageSelect} 
            className="hidden" 
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0" 
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32 bg-popover border border-border z-[9999]">
              <DropdownMenuItem onClick={() => cameraInputRef.current?.click()} className="text-xs flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" />
                <span>Take Photo</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs flex items-center gap-2">
                <Image className="w-3.5 h-3.5" />
                <span>Choose Photo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            placeholder="Message..."
            disabled={!isConnected || isUploading}
            className="flex-1 bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-w-0"
          />
          <Button
            ref={sendButtonRef}
            onClick={handleSendClick}
            disabled={!message.trim() || !isConnected || isUploading}
            variant="jac"
            size="icon"
           className="h-8 w-8 rounded-lg shrink-0 touch-manipulation"
            aria-label="Send message"
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

      {/* Incoming Call Modal */}
      {privateCall.callState === 'ringing' && privateCall.incomingCallType && (
        <IncomingCallModal
          callerUsername={targetUsername}
          callType={privateCall.incomingCallType}
          onAnswer={privateCall.answerCall}
          onReject={privateCall.rejectCall}
        />
      )}

      {/* In-Call UI */}
      {(privateCall.callState === 'calling' || privateCall.callState === 'connected') && (
        <PrivateCallUI
          callState={privateCall.callState}
          callType={privateCall.callType}
          localStream={privateCall.localStream}
          remoteStream={privateCall.remoteStream}
          isAudioMuted={privateCall.isAudioMuted}
          isVideoMuted={privateCall.isVideoMuted}
          formattedDuration={privateCall.formattedDuration}
          targetUsername={targetUsername}
          onEndCall={privateCall.endCall}
          onToggleAudio={privateCall.toggleAudioMute}
          onToggleVideo={privateCall.toggleVideoMute}
        />
      )}

      {/* Bot Voice Call UI */}
      {isTargetBot && targetBotId && (
        <BotVoiceCallUI
          isOpen={showBotVoiceCall}
          onClose={() => setShowBotVoiceCall(false)}
          botId={targetBotId}
          botName={targetUsername}
          onBotMessage={(msg) => {
            // Add bot message to chat
            setMessages(prev => [...prev, {
              id: `bot-voice-${Date.now()}`,
              content: msg,
              senderId: targetUserId,
              senderName: targetUsername,
              timestamp: new Date(),
              isOwn: false,
            }]);
          }}
        />
      )}
    </div>
  );
};

export default PrivateChatWindow;