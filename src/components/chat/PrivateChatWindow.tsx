import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Send, Minus, Shield, Check, CheckCheck, Phone, Video, ImagePlus, Zap, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateSessionKey, encryptMessage, encryptWithMasterKey, decryptMessage, exportKey, importKey, generateSessionId } from "@/lib/encryption";
import EmojiPicker from "./EmojiPicker";
import TextFormatMenu, { TextFormat, encodeFormat } from "./TextFormatMenu";
import FormattedText from "./FormattedText";
import GifPicker from "./GifPicker";
import { useToast } from "@/hooks/use-toast";
import { CHAT_BOTS, ROOM_BOTS } from "@/lib/chatBots";
import { usePrivateCall } from "@/hooks/usePrivateCall";
import PrivateCallUI from "./PrivateCallUI";
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
    if (messages.length > lastMessageCountRef.current) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
    lastMessageCountRef.current = messages.length;
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
    let isMounted = true;
    hasLoadedRef.current = false;

    const loadPreviousMessages = async () => {
      if (hasLoadedRef.current || isTargetBot) return;
      hasLoadedRef.current = true;
      
      try {
        const { data, error } = await supabase
          .from('private_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error || !isMounted) {
          console.error('Failed to load messages:', error);
          return;
        }

        if (data && data.length > 0) {
          const masterKey = 'JAC_PM_MASTER_2024';
          const decryptedMessages: PrivateMessage[] = [];
          
          for (const msg of data) {
            try {
              const encoder = new TextEncoder();
              const keyData = encoder.encode(masterKey);
              const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
              
              const cryptoKey = await crypto.subtle.importKey(
                'raw',
                hashBuffer,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
              );
              
              const ciphertextBytes = Uint8Array.from(atob(msg.encrypted_content), c => c.charCodeAt(0));
              const ivBytes = Uint8Array.from(atob(msg.iv), c => c.charCodeAt(0));
              
              const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: ivBytes },
                cryptoKey,
                ciphertextBytes
              );
              
              const decoder = new TextDecoder();
              const content = decoder.decode(decrypted);
              
              decryptedMessages.push({
                id: msg.id,
                content,
                senderId: msg.sender_id,
                senderName: msg.sender_id === currentUserId ? currentUsername : targetUsername,
                timestamp: new Date(msg.created_at),
                isOwn: msg.sender_id === currentUserId
              });
            } catch (decryptError) {
              console.error('Failed to decrypt message:', decryptError);
            }
          }
          
          if (isMounted) {
            setMessages(decryptedMessages);
            lastMessageCountRef.current = decryptedMessages.length;
            // Scroll to bottom after loading messages
            requestAnimationFrame(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              }
            });
          }
        }
      } catch (err) {
        console.error('Error loading messages:', err);
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
          const currentKey = sessionKeyRef.current;
          if (currentKey) {
            try {
              const decrypted = await decryptMessage(data.encrypted, currentKey);
              
              setMessages(prev => [...prev, {
                id: data.id,
                content: decrypted,
                senderId: data.senderId,
                senderName: data.senderName,
                timestamp: new Date(data.timestamp),
                isOwn: false,
                imageUrl: data.imageUrl
              }]);
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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      setMessages([]);
      setSessionKey(null);
      sessionKeyRef.current = null;
      setIsConnected(false);
    };
  }, [currentUserId, targetUserId, isTargetBot]);

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
    
    const seenDelay = 1000 + Math.random() * 2000;
    
    seenTimeoutRef.current = setTimeout(() => {
      setSeenMessageIds(prev => new Set(prev).add(msgId));
    }, seenDelay);
  }, [isTargetBot]);

  const handleSend = async () => {
    const currentKey = sessionKeyRef.current || sessionKey;
    
    // Handle image upload first if attached
    let imageUrl: string | null = null;
    if (attachedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl && !message.trim()) return;
      clearImage();
    }
    
    if (!message.trim() && !imageUrl) return;
    if (!currentKey || !channelRef.current) return;

    // Apply text formatting if set
    let finalMessage = message.trim();
    if (textFormat.textStyle !== 'none' || textFormat.bgColor) {
      finalMessage = encodeFormat(textFormat, finalMessage);
    }
    
    // Add image URL to message if uploaded
    if (imageUrl) {
      finalMessage = finalMessage ? `${finalMessage} [img:${imageUrl}]` : `[img:${imageUrl}]`;
    }
    
    const msgId = `${Date.now()}-${Math.random()}`;
    
    try {
      const encrypted = await encryptMessage(finalMessage, currentKey);
      const masterKeyForStorage = 'JAC_PM_MASTER_2024';
      const encryptedForStorage = await encryptWithMasterKey(finalMessage, masterKeyForStorage);
      
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
          sessionId,
          imageUrl
        }
      });

      setMessages(prev => [...prev, {
        id: msgId,
        content: finalMessage,
        senderId: currentUserId,
        senderName: currentUsername,
        timestamp: new Date(),
        isOwn: true,
        imageUrl: imageUrl || undefined
      }]);

      monitorMessage(finalMessage, currentUserId, currentUsername);
      setMessage('');
      setTextFormat({ textStyle: 'none' });

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
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  // Handle GIF selection - sends immediately as a message
  const handleSendGif = async (gifUrl: string) => {
    const currentKey = sessionKeyRef.current || sessionKey;
    if (!currentKey || !channelRef.current) return;

    const finalMessage = `[img:${gifUrl}]`;
    const msgId = `${Date.now()}-${Math.random()}`;
    
    try {
      const encrypted = await encryptMessage(finalMessage, currentKey);
      const masterKeyForStorage = 'JAC_PM_MASTER_2024';
      const encryptedForStorage = await encryptWithMasterKey(finalMessage, masterKeyForStorage);
      
      const { error: dbError } = await supabase
        .from('private_messages')
        .insert({
          sender_id: currentUserId,
          recipient_id: targetUserId,
          encrypted_content: encryptedForStorage.ciphertext,
          iv: encryptedForStorage.iv
        });

      if (dbError) {
        console.error('Failed to store GIF message:', dbError);
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
          sessionId,
          imageUrl: gifUrl
        }
      });

      setMessages(prev => [...prev, {
        id: msgId,
        content: finalMessage,
        senderId: currentUserId,
        senderName: currentUsername,
        timestamp: new Date(),
        isOwn: true,
        imageUrl: gifUrl
      }]);

      monitorMessage(finalMessage, currentUserId, currentUsername);
      
      if (isTargetBot) {
        markMessageAsSeen(msgId);
        generateBotResponse(finalMessage);
      }
    } catch (error) {
      console.error('Failed to send GIF:', error);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Could not send GIF."
      });
    }
  };

  // Image upload handlers
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image too large", description: "Please select an image under 25MB" });
      return;
    }

    try {
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85, outputType: "image/jpeg" });
      if (compressed.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image still too large", description: "After compression, the image is still over 10MB." });
        return;
      }
      setAttachedImage(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(compressed);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to process image", description: err instanceof Error ? err.message : "Could not compress image" });
    }
  };

  const clearImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!attachedImage) return null;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const safeName = attachedImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const suggestedPath = `chat-images/${currentUserId}/${Date.now()}-${safeName}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("You must be signed in to upload images.");

      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const formData = new FormData();
      formData.append("file", attachedImage);
      formData.append("bucket", "avatars");
      formData.append("path", suggestedPath);

      const data = await new Promise<any>((resolve, reject) => {
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
      if (data?.error) {
        toast({ variant: "destructive", title: "Upload failed", description: data.message || data.error });
        return null;
      }
      return data?.url || null;
    } catch (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error instanceof Error ? error.message : "Failed to upload" });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

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
          {/* Call buttons - only show for real users, not bots */}
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
        className="overflow-y-auto p-2 space-y-2 bg-background/50 relative"
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
          ))
        )}
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

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-2 py-1 border-t border-border bg-muted/20">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-12 rounded border border-border" />
            <button onClick={clearImage} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
          {isUploading && (
            <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-2 border-t border-border bg-card">
        <div className="flex items-center gap-1">
          {/* Emoji Picker */}
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          
          {/* Text Format Menu */}
          <div className="shrink-0 [&_button]:h-7 [&_button]:w-7 [&_button]:rounded-lg">
            <TextFormatMenu currentFormat={textFormat} onFormatChange={setTextFormat} />
          </div>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-popover border border-border z-50">
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
          
          {/* Image Upload */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 shrink-0" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          </Button>
          
          {/* GIF Picker */}
          <GifPicker onSelect={(gifUrl) => handleSendGif(gifUrl)}>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <span className="text-[10px] font-bold">GIF</span>
            </Button>
          </GifPicker>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Message..."
            disabled={!isConnected || isUploading}
            className="flex-1 bg-input rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 min-w-0"
          />
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !attachedImage) || !isConnected || isUploading}
            variant="jac"
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
          >
            <Send className="h-3 w-3" />
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
    </div>
  );
};

export default PrivateChatWindow;