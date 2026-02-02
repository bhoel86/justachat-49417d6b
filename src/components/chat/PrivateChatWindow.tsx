import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Send, Minus, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const [position, setPosition] = useState(initialPosition);
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

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load history + subscribe to new messages
  useEffect(() => {
    if (hasLoadedRef.current || isBot) {
      setIsConnected(true);
      return;
    }
    hasLoadedRef.current = true;

    const loadAndSubscribe = async () => {
      // Load history
      try {
        const { data } = await supabase
          .from('private_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true })
          .limit(100);

        if (data && data.length > 0) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          
          const decrypted: PrivateMessage[] = [];
          for (const msg of data) {
            try {
              const resp = await supabase.functions.invoke('decrypt-pm', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: { messageId: msg.id, encrypted_content: msg.encrypted_content, iv: msg.iv }
              });
              if (resp.data?.success) {
                decrypted.push({
                  id: msg.id,
                  content: resp.data.decrypted_content,
                  senderId: msg.sender_id,
                  senderName: msg.sender_id === currentUserId ? currentUsername : targetUsername,
                  timestamp: new Date(msg.created_at),
                  isOwn: msg.sender_id === currentUserId
                });
              }
            } catch (e) {
              console.error('Decrypt error:', e);
            }
          }
          setMessages(decrypted);
        }
      } catch (e) {
        console.error('Load history error:', e);
      }

      // Subscribe to new messages via DB changes only (no realtime broadcast complexity)
      const channelName = `pm-window-${[currentUserId, targetUserId].sort().join('-')}`;
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId}))`
          },
          async (payload) => {
            const msg = payload.new as any;
            
            // Skip if we already have this message
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              
              // Decrypt and add
              (async () => {
                try {
                  const { data: sessionData } = await supabase.auth.getSession();
                  const token = sessionData.session?.access_token;
                  
                  const resp = await supabase.functions.invoke('decrypt-pm', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: { messageId: msg.id, encrypted_content: msg.encrypted_content, iv: msg.iv }
                  });
                  
                  if (resp.data?.success) {
                    setMessages(cur => {
                      if (cur.some(m => m.id === msg.id)) return cur;
                      return [...cur, {
                        id: msg.id,
                        content: resp.data.decrypted_content,
                        senderId: msg.sender_id,
                        senderName: msg.sender_id === currentUserId ? currentUsername : targetUsername,
                        timestamp: new Date(msg.created_at),
                        isOwn: msg.sender_id === currentUserId
                      }];
                    });
                    if (msg.sender_id !== currentUserId) {
                      onNewMessage?.();
                    }
                  }
                } catch (e) {
                  console.error('Decrypt new msg error:', e);
                }
              })();
              
              return prev;
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          }
        });
    };

    loadAndSubscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId, targetUserId, currentUsername, targetUsername, isBot, onNewMessage]);

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
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.y))
        });
      }
      if (isResizing) {
        setSize({
          width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + e.clientX - resizeStart.x)),
          height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.height + e.clientY - resizeStart.y))
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
  }, [isDragging, isResizing, dragOffset, resizeStart, size.width]);

  // Image handling
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

      const formData = new FormData();
      formData.append("file", attachedImage);
      formData.append("bucket", "avatars");
      formData.append("path", `chat-images/${Date.now()}-${attachedImage.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await resp.json();
      return data?.url || null;
    } catch (e) {
      toast({ variant: "destructive", title: "Upload failed" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    const text = message.trim();
    if (!text && !attachedImage) return;

    let imageUrl: string | null = null;
    if (attachedImage) {
      imageUrl = await uploadImage();
      clearImage();
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
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await supabase.functions.invoke('encrypt-pm', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
         // Keep payload aligned with backend expectations (and VPS router)
         body: { message: content, recipient_id: targetUserId }
      });

       if (resp.error) {
         throw new Error(resp.error.message || 'Encryption failed');
       }

       if (!resp.data?.success) {
         throw new Error(resp.data?.error || 'Encryption failed');
      }

      // Message will appear via postgres_changes subscription
      setMessage('');
    } catch (e) {
      console.error('Send error:', e);
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
        className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-border cursor-move select-none"
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

      {/* Input */}
      <div className="flex items-center gap-2 p-2 border-t border-border bg-muted/20">
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
          className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={!isConnected && !isBot}
        />
        
        <Button size="sm" onClick={sendMessage} disabled={(!message.trim() && !attachedImage) || isUploading}>
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
