/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Send, Minus, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { restSelect } from "@/lib/supabaseRest";
import EmojiPicker from "./EmojiPicker";
import FormattedText from "./FormattedText";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageCompression";
import { CHAT_BOTS, ROOM_BOTS } from "@/lib/chatBots";
import { getChatBotFunctionName } from "@/lib/environment";

interface PrivateMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
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

// Check if target is a bot
const getBotId = (userId: string): string | null => {
  if (!userId.startsWith('sim-')) return null;
  const botId = userId.replace('sim-', '');
  return [...CHAT_BOTS, ...ROOM_BOTS].find(b => b.id === botId) ? botId : null;
};

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
  const [isConnected, setIsConnected] = useState(false);
  // Clamp initial position to ensure window is fully visible
  const [position, setPosition] = useState(() => ({
    x: Math.max(0, Math.min(initialPosition.x, window.innerWidth - 320)),
    y: Math.max(0, Math.min(initialPosition.y, window.innerHeight - 420))
  }));
  const [size, setSize] = useState({ width: 320, height: 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasLoadedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isBot = !!getBotId(targetUserId);
  const botId = getBotId(targetUserId);

  // Debug: track mount/unmount
  useEffect(() => {
    console.log('[PM Mount]', targetUserId);
    return () => console.log('[PM Unmount]', targetUserId);
  }, [targetUserId]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track message processing state
  const processedIdsRef = useRef<Set<string>>(new Set()); // Successfully decrypted
  const failedIdsRef = useRef<Map<string, number>>(new Map()); // msg.id → attempt count
  const pendingDecryptsRef = useRef<Set<string>>(new Set());
  const MAX_DECRYPT_RETRIES = 3;

  // Decrypt a single message - memoized helper
  const decryptMessage = useCallback(async (
    msg: { id: string; encrypted_content: string; iv: string; sender_id: string; created_at: string },
    token: string | undefined
  ): Promise<PrivateMessage | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      console.log('[PM Decrypt] Attempting msg', msg.id.slice(0, 8), 'via', supabaseUrl?.slice(0, 30));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const resp = await fetch(`${supabaseUrl}/functions/v1/decrypt-pm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || apikey}`,
          ...(apikey ? { 'apikey': apikey } : {}),
        },
        body: JSON.stringify({ messageId: msg.id, encrypted_content: msg.encrypted_content, iv: msg.iv }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        console.warn('[PM Decrypt] HTTP', resp.status, 'for msg', msg.id.slice(0, 8));
        return null;
      }
      const data = await resp.json().catch(() => ({}));
      if (data?.success) {
        console.log('[PM Decrypt] ✓ msg', msg.id.slice(0, 8));
        return {
          id: msg.id,
          content: data.decrypted_content,
          senderId: msg.sender_id,
          senderName: msg.sender_id === currentUserId ? currentUsername : targetUsername,
          timestamp: new Date(msg.created_at),
          isOwn: msg.sender_id === currentUserId
        };
      }
      console.warn('[PM Decrypt] Failed for msg', msg.id.slice(0, 8), 'response:', JSON.stringify(data).slice(0, 200));
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.error('[PM Decrypt] Timeout for msg', msg.id.slice(0, 8));
      } else {
        console.error('[PM Decrypt] Exception:', e?.message || e);
      }
    }
    return null;
  }, [currentUserId, currentUsername, targetUsername]);

  // Helper: try to decrypt a message, track success/failure
  const tryDecrypt = useCallback(async (
    msg: any,
    token: string | undefined
  ): Promise<PrivateMessage | null> => {
    // Already succeeded
    if (processedIdsRef.current.has(msg.id)) return null;
    // Currently in progress
    if (pendingDecryptsRef.current.has(msg.id)) return null;
    // Failed too many times
    const attempts = failedIdsRef.current.get(msg.id) || 0;
    if (attempts >= MAX_DECRYPT_RETRIES) return null;

    pendingDecryptsRef.current.add(msg.id);
    try {
      const decrypted = await decryptMessage(msg, token);
      if (decrypted) {
        processedIdsRef.current.add(msg.id);
        failedIdsRef.current.delete(msg.id);
        return decrypted;
      } else {
        failedIdsRef.current.set(msg.id, attempts + 1);
        console.warn('[PM] Decrypt attempt', attempts + 1, '/', MAX_DECRYPT_RETRIES, 'failed for', msg.id.slice(0, 8));
        return null;
      }
    } finally {
      pendingDecryptsRef.current.delete(msg.id);
    }
  }, [decryptMessage]);

  // Load history + subscribe to new messages (runs once)
  useEffect(() => {
    console.log('[PM Effect] Running for', targetUserId, 'isBot:', isBot, 'hasLoaded:', hasLoadedRef.current);
    if (hasLoadedRef.current || isBot) {
      setIsConnected(true);
      return;
    }
    hasLoadedRef.current = true;
    console.log('[PM Effect] Setting up history + subscription for', targetUserId);

    const loadHistory = async () => {
      try {
        // Use restSelect to avoid supabase JS client hangs on VPS
        const filter = `or=(and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId}))&order=created_at.asc&limit=100&select=*`;
        console.log('[PM History] Loading...');
        const data = await restSelect<any>('private_messages', filter, null, 10000);
        console.log('[PM History] Fetched', data?.length ?? 0, 'messages');

        if (data && data.length > 0) {
          const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          let token: string | undefined;
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            token = sessionData.session?.access_token;
          } catch {
            console.warn('[PM History] getSession failed, using apikey');
          }
          console.log('[PM History] Token available:', !!token, 'Decrypting', data.length, 'messages...');
          
          const decryptPromises = data.map(msg => tryDecrypt(msg, token || apikey));
          const results = await Promise.all(decryptPromises);
          const decrypted = results.filter((m): m is PrivateMessage => m !== null);
          console.log('[PM History] Successfully decrypted:', decrypted.length, '/', data.length);
          setMessages(decrypted);
        }
      } catch (e) {
        console.error('[PM History] Load error:', e);
      }
    };

    const setupSubscription = () => {
      const channelName = `pm-conv-${[currentUserId, targetUserId].sort().join('-')}-${Date.now()}`;
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `recipient_id=eq.${currentUserId}`
          },
          async (payload) => {
            const msg = payload.new as any;
            if (msg.sender_id !== targetUserId) return;
            
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            const decrypted = await tryDecrypt(msg, token);
            
            if (decrypted) {
              setMessages(cur => {
                if (cur.some(m => m.id === msg.id)) return cur;
                return [...cur, decrypted].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              });
              onNewMessage?.();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `sender_id=eq.${currentUserId}`
          },
          async (payload) => {
            const msg = payload.new as any;
            if (msg.recipient_id !== targetUserId) return;
            
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            const decrypted = await tryDecrypt(msg, token);
            
            if (decrypted) {
              setMessages(cur => {
                if (cur.some(m => m.id === msg.id)) return cur;
                return [...cur, decrypted].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`PM subscription ${channelName}: ${status}`);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          }
        });
    };

    loadHistory().then(() => {
      setIsConnected(true);
      setupSubscription();
    });

    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
    }, 5000);

    return () => {
      clearTimeout(connectTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, targetUserId, isBot]);

  // Separate polling effect - uses window.setInterval for maximum reliability
  useEffect(() => {
    if (isBot) return;
    
    console.log('[PM Poll] Starting polling for', targetUserId);
    let pollActive = true;
    
    // Cache the token once at setup
    let cachedToken: string | undefined;
    const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    supabase.auth.getSession().then(({ data }) => {
      cachedToken = data.session?.access_token;
      console.log('[PM Poll] Token cached:', !!cachedToken);
    }).catch(() => {
      console.warn('[PM Poll] Failed to cache token, will use apikey');
    });
    
    const { data: { subscription: tokenSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) cachedToken = session.access_token;
    });
    
    const intervalId = window.setInterval(() => {
      if (!pollActive) return;
      
      (async () => {
        try {
          const filter = `or=(and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId}))&order=created_at.desc&limit=10&select=*`;
          const data = await restSelect<any>('private_messages', filter, null, 8000);

          if (!data || data.length === 0) return;

          // Filter to messages that need processing (not yet decrypted, not maxed out retries, not pending)
          const newMsgs = data.filter(m => 
            !processedIdsRef.current.has(m.id) && 
            !pendingDecryptsRef.current.has(m.id) &&
            (failedIdsRef.current.get(m.id) || 0) < MAX_DECRYPT_RETRIES
          );
          if (newMsgs.length === 0) return;
          
          console.log('[PM Poll] New messages to decrypt:', newMsgs.length);
          const token = cachedToken || apikey;

          for (const msg of newMsgs) {
            const decrypted = await tryDecrypt(msg, token);
            if (decrypted) {
              setMessages(cur => {
                if (cur.some(m => m.id === msg.id)) return cur;
                return [...cur, decrypted].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              });
              if (msg.sender_id !== currentUserId) onNewMessage?.();
            }
          }
        } catch (e) {
          console.error('[PM Poll] Error:', e);
        }
      })();
    }, 4000);

    return () => {
      console.log('[PM Poll] Cleaning up polling for', targetUserId);
      pollActive = false;
      window.clearInterval(intervalId);
      tokenSub.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, targetUserId, isBot]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    onFocus();
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const maxX = Math.max(0, window.innerWidth - size.width);
        const maxY = Math.max(0, window.innerHeight - size.height);
        setPosition({
          x: Math.max(0, Math.min(maxX, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(maxY, e.clientY - dragOffset.y))
        });
      }
      if (isResizing) {
        // Prevent resizing beyond viewport so the input (Send) area can't be pushed off-screen.
        const maxWidthInViewport = Math.max(MIN_WIDTH, window.innerWidth - position.x);
        const maxHeightInViewport = Math.max(MIN_HEIGHT, window.innerHeight - position.y);

        setSize({
          width: Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, maxWidthInViewport, resizeStart.width + e.clientX - resizeStart.x)
          ),
          height: Math.max(
            MIN_HEIGHT,
            Math.min(MAX_HEIGHT, maxHeightInViewport, resizeStart.height + e.clientY - resizeStart.y)
          )
        });
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
  }, [isDragging, isResizing, dragOffset, resizeStart, position.x, position.y, size.width, size.height]);

  // Ensure window stays within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - size.width)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - size.height))
      }));
    };
    
    window.addEventListener('resize', handleResize);
    // Also run on mount to correct any invalid initial position
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [size.width, size.height]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 });
      setAttachedImage(compressed);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(compressed);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to process image" });
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
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      // Required for VPS gateway routing (matches ChatInput upload behavior)
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const formData = new FormData();
      formData.append("file", attachedImage);
      formData.append("bucket", "chat-images");
      formData.append("path", `${Date.now()}-${attachedImage.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(apikey ? { apikey } : {}),
        },
        body: formData
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.error('Upload failed:', resp.status, errorData);
        throw new Error(errorData?.error || errorData?.message || `Upload failed (${resp.status})`);
      }
      
      const data = await resp.json();
      console.log('Upload response:', data);
      
      if (!data?.url) {
        throw new Error('No URL returned from upload');
      }
      
      return data.url;
    } catch (e) {
      console.error('Image upload error:', e);
      toast({ variant: "destructive", title: "Upload failed", description: e instanceof Error ? e.message : "Could not upload image" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    const text = message.trim();
    console.log('[PM] sendMessage called, text:', JSON.stringify(text), 'attachedImage:', !!attachedImage, 'isBot:', isBot, 'botId:', botId, 'targetUserId:', targetUserId, 'isConnected:', isConnected);
    if (!text && !attachedImage) {
      console.log('[PM] Early exit: no text and no image');
      return;
    }

    let imageUrl: string | null = null;
    if (attachedImage) {
      imageUrl = await uploadImage();
      // Only clear image if upload succeeded
      if (imageUrl) {
        clearImage();
      } else if (!text) {
        // If upload failed and there's no text, don't send empty message
        toast({ variant: "destructive", title: "Image upload failed", description: "Please try again" });
        return;
      }
      // If upload failed but there's text, continue sending just the text
    }

    const content = imageUrl ? (text ? `${text} [img:${imageUrl}]` : `[img:${imageUrl}]`) : text;
    if (!content) return;

    // For bots, handle differently
    if (isBot && botId) {
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempId,
        content,
        senderId: currentUserId,
        senderName: currentUsername,
        timestamp: new Date(),
        isOwn: true
      }]);
      setMessage('');
      setIsBotTyping(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const resp = await supabase.functions.invoke(getChatBotFunctionName(), {
          headers: sessionData.session?.access_token 
            ? { Authorization: `Bearer ${sessionData.session.access_token}` } 
            : {},
          body: { message: content, botId, isPM: true, username: currentUsername }
        });

        setIsBotTyping(false);
        if (resp.data?.response) {
          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            content: resp.data.response,
            senderId: targetUserId,
            senderName: targetUsername,
            timestamp: new Date(),
            isOwn: false
          }]);
        }
      } catch (e) {
        setIsBotTyping(false);
        toast({ variant: "destructive", title: "Bot error" });
      }
      return;
    }

    // For real users - encrypt and save via backend function
    // Add optimistic UI update immediately so user sees their message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: PrivateMessage = {
      id: tempId,
      content,
      senderId: currentUserId,
      senderName: currentUsername,
      timestamp: new Date(),
      isOwn: true
    };
    
    // Add message immediately for instant feedback
    processedIdsRef.current.add(tempId);
    setMessages(cur => [...cur, optimisticMessage]);
    setMessage('');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      console.log('[PM] Sending PM to:', targetUserId, 'url:', supabaseUrl, 'hasToken:', !!token, 'hasApikey:', !!apikey);

      if (!token) {
        throw new Error('No auth token - please log in again');
      }

      // Use direct fetch instead of supabase.functions.invoke for VPS compatibility
      const resp = await fetch(`${supabaseUrl}/functions/v1/encrypt-pm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(apikey ? { 'apikey': apikey } : {}),
        },
        body: JSON.stringify({ message: content, recipient_id: targetUserId }),
      });

      console.log('[PM] Response status:', resp.status);
      const data = await resp.json().catch(() => ({}));
      console.log('[PM] Response data:', data);

      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'Encryption failed');
      }

      // Update the temp message ID with the real one from the server
      const realId = data.message_id;
      if (realId) {
        processedIdsRef.current.add(realId);
        setMessages(cur => cur.map(m => 
          m.id === tempId ? { ...m, id: realId } : m
        ));
      }
    } catch (e) {
      console.error('Send error:', e);
      // Remove optimistic message on failure
      setMessages(cur => cur.filter(m => m.id !== tempId));
      processedIdsRef.current.delete(tempId);
      setMessage(content); // Restore the message so user can retry
      toast({ variant: "destructive", title: "Failed to send message" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="fixed bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex }}
      onClick={onFocus}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-border cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-3 h-3 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{targetUsername}</span>
          {isBot && <span className="text-xs text-muted-foreground">(Bot)</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
            <Minus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {!isConnected && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <FormattedText text={msg.content} />
              <div className={`text-[10px] mt-1 ${msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm">
              <span className="animate-pulse">typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-3 py-2 border-t border-border bg-muted/20">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-16 rounded border" />
            <button onClick={clearImage} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input - always visible at bottom */}
      <div className="flex items-center gap-2 p-3 border-t-2 border-primary/30 bg-card shrink-0">
        <EmojiPicker 
          onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
          onGifSelect={(url) => {
            const msg = `[img:${url}]`;
            setMessage(msg);
            setTimeout(sendMessage, 100);
          }}
        />
        
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        </Button>
        
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={!isConnected && !isBot}
        />
        
        <Button 
          size="sm" 
          onClick={sendMessage} 
          disabled={(!message.trim() && !attachedImage) || isUploading}
          className="shrink-0 px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};

export default PrivateChatWindow;
