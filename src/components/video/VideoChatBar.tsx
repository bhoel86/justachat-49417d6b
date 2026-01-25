import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import FormattedText from '@/components/chat/FormattedText';
import VideoUserMenu from '@/components/video/VideoUserMenu';
import { 
  Send, MessageSquare, Smile, Zap, ImagePlus, X, Loader2,
  Crown, Shield, Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/imageCompression';

// IRC-style actions
const USER_ACTIONS = {
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

interface ChatMessage {
  id: string;
  odious: string;
  username: string;
  avatarUrl?: string | null;
  content: string;
  timestamp: number;
  isAction?: boolean;
  role?: string;
}

interface VideoChatBarProps {
  roomId: string;
  odious: string;
  username: string;
  avatarUrl?: string | null;
  currentUserRole?: 'owner' | 'admin' | 'moderator' | 'user' | null;
  onPmClick?: (odious: string, username: string) => void;
}

const VideoChatBar = ({ roomId, odious, username, avatarUrl, currentUserRole, onPmClick }: VideoChatBarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string>>({});
  const [selectedAction, setSelectedAction] = useState<{ emoji: string; action: string; suffix: string } | null>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch roles for message senders
  useEffect(() => {
    const uniqueUserIds = [...new Set(messages.map(m => m.odious))];
    if (!uniqueUserIds.length) return;

    const fetchRoles = async () => {
      const roles: Record<string, string> = { ...rolesByUserId };
      
      for (const odId of uniqueUserIds) {
        if (roles[odId]) continue;
        
        try {
          const { data: isOwner } = await supabase.rpc('is_owner', { _user_id: odId });
          if (isOwner) { roles[odId] = 'owner'; continue; }
          
          const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: odId, _role: 'admin' });
          if (isAdmin) { roles[odId] = 'admin'; continue; }
          
          const { data: isMod } = await supabase.rpc('has_role', { _user_id: odId, _role: 'moderator' });
          if (isMod) { roles[odId] = 'moderator'; }
        } catch (e) {
          console.error('Error fetching role:', e);
        }
      }
      
      setRolesByUserId(roles);
    };
    
    fetchRoles();
  }, [messages]);

  useEffect(() => {
    if (!roomId || !odious) return;

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
  }, [roomId, odious]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      const suggestedPath = `chat-images/${Date.now()}-${safeName}`;

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

  const sendMessage = async () => {
    let imageUrl: string | null = null;
    if (attachedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl && !inputValue.trim()) return;
    }

    if (!inputValue.trim() && !imageUrl) return;
    if (!channelRef.current) return;

    // Check for /me action
    const isAction = inputValue.trim().startsWith('/me ');
    let content = inputValue.trim();
    if (isAction) {
      content = content.slice(4); // Remove "/me "
    }

    if (imageUrl) {
      content = content ? `${content} [img:${imageUrl}]` : `[img:${imageUrl}]`;
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      odious,
      username,
      avatarUrl,
      content,
      timestamp: Date.now(),
      isAction,
      role: rolesByUserId[odious]
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: message
    });

    setMessages(prev => [...prev, message]);
    setInputValue('');
    clearImage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  const handleActionSelect = (action: typeof USER_ACTIONS.funny[0]) => {
    setSelectedAction(action);
  };

  const handleActionWithUser = (targetUsername: string) => {
    if (selectedAction) {
      const actionMessage = selectedAction.suffix 
        ? `/me ${selectedAction.emoji} ${selectedAction.action} ${targetUsername} ${selectedAction.suffix}`
        : `/me ${selectedAction.emoji} ${selectedAction.action} ${targetUsername}`;
      setInputValue(actionMessage);
      setSelectedAction(null);
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    switch (role) {
      case 'owner':
        return <Badge className="text-[8px] px-0.5 py-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0"><Crown className="w-2 h-2" /></Badge>;
      case 'admin':
        return <Badge className="text-[8px] px-0.5 py-0 bg-primary text-primary-foreground"><Shield className="w-2 h-2" /></Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="text-[8px] px-0.5 py-0"><Star className="w-2 h-2" /></Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-72">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30">
        <MessageSquare className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium">Chat</span>
        <span className="text-[10px] text-muted-foreground">({messages.length})</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-2" ref={scrollRef}>
        <div className="space-y-1.5">
          {messages.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">No messages yet. Say hi! 👋</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.odious === odious;
              const role = rolesByUserId[msg.odious] || msg.role;
              
              if (msg.isAction) {
                return (
                  <div key={msg.id} className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                    <span className="text-primary font-medium">{msg.username}</span>
                    <FormattedText text={msg.content} />
                  </div>
                );
              }
              
              return (
                <div key={msg.id} className="flex items-start gap-1.5 group">
                  <Avatar className="w-5 h-5 shrink-0">
                    <AvatarImage src={msg.avatarUrl || undefined} />
                    <AvatarFallback className="text-[8px] bg-primary/20">
                      {msg.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <VideoUserMenu
                        odious={msg.odious}
                        username={msg.username}
                        avatarUrl={msg.avatarUrl}
                        role={role}
                        currentUserId={odious}
                        currentUserRole={currentUserRole}
                        onPmClick={!isOwn && onPmClick ? () => onPmClick(msg.odious, msg.username) : undefined}
                      >
                        <button className={`text-[10px] font-medium hover:underline cursor-pointer ${isOwn ? 'text-primary' : 'text-foreground'}`}>
                          {msg.username}
                        </button>
                      </VideoUserMenu>
                      {getRoleBadge(role)}
                    </div>
                    <div className="text-[11px] text-foreground/90 break-words">
                      <FormattedText text={msg.content} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

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
      <div className="flex items-center gap-1 p-1.5 border-t border-border bg-muted/20">
        {/* Emoji Picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <Smile className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-2 bg-popover border border-border z-50">
            <div className="grid grid-cols-8 gap-1">
              {['😀', '😂', '❤️', '👍', '🔥', '😮', '😢', '😡', '🎉', '💯', '🤣', '😍', '🙌', '👏', '💪', '🤔'].map(emoji => (
                <button key={emoji} onClick={() => handleEmojiSelect(emoji)} className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded text-sm">
                  {emoji}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-7 w-7 shrink-0 ${selectedAction ? 'bg-yellow-500/20 text-yellow-500' : ''}`}>
              <Zap className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover border border-border z-50">
            <DropdownMenuLabel className="text-[10px]">Funny Actions</DropdownMenuLabel>
            {USER_ACTIONS.funny.map((action, i) => (
              <DropdownMenuItem key={i} onClick={() => handleActionSelect(action)} className="text-xs">
                {action.emoji} {action.action}...
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px]">Nice Actions</DropdownMenuLabel>
            {USER_ACTIONS.nice.map((action, i) => (
              <DropdownMenuItem key={i} onClick={() => handleActionSelect(action)} className="text-xs">
                {action.emoji} {action.action}...
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Image Upload */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
        </Button>

        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedAction ? `Click a username to ${selectedAction.action}...` : "Type a message..."}
          className="h-7 text-xs flex-1"
        />
        <Button size="sm" onClick={sendMessage} disabled={(!inputValue.trim() && !attachedImage) || isUploading} className="h-7 px-2">
          <Send className="w-3 h-3" />
        </Button>
      </div>

      {/* Selected Action Indicator */}
      {selectedAction && (
        <div className="flex items-center justify-between px-2 py-1 bg-yellow-500/10 border-t border-yellow-500/20 text-[10px]">
          <span className="text-yellow-600">
            {selectedAction.emoji} Ready to {selectedAction.action}... Click a username above!
          </span>
          <button onClick={() => setSelectedAction(null)} className="text-yellow-600 hover:text-yellow-800">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoChatBar;
