import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, supabaseUntyped } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, Headphones, Mic, MicOff, Video, VideoOff, 
  PhoneOff, Volume2, Settings, Users, Hash, Menu, 
  Send, Camera, Shield, Smile, Zap, ImagePlus, X, Loader2, MoreVertical, Sparkles, Palette,
  MessageSquareLock, Ban, Flag, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceChannelList from '@/components/voice/VoiceChannelList';
import VideoTile from '@/components/voice/VideoTile';
import VoiceSettings from '@/components/voice/VoiceSettings';
import EmojiPicker from '@/components/chat/EmojiPicker';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import ProfileViewModal from '@/components/profile/ProfileViewModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { compressImage } from '@/lib/imageCompression';

interface VoiceMessage {
  id: string;
  content: string;
  username: string;
  avatarUrl?: string;
  timestamp: Date;
  isSystem?: boolean;
  isModerator?: boolean;
  imageUrl?: string;
}

// Fun IRC-style user actions
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
    { emoji: "⭐", action: "awards", suffix: "a gold star" },
  ],
};

// Room moderator personalities - each room has a unique mod
const ROOM_MODERATORS: Record<string, { name: string; emoji: string; personality: string; greeting: string }> = {
  'voice-lounge': {
    name: 'Echo',
    emoji: '🎧',
    personality: 'chill and welcoming host',
    greeting: "hey hey welcome to the lounge! kick back and vibe with us 🎧"
  },
  'voice-gaming': {
    name: 'Pixel',
    emoji: '🎮',
    personality: 'hyped gamer energy',
    greeting: "yo gamer! ready to squad up? lets gooo 🎮🔥"
  },
  'voice-music': {
    name: 'Vinyl',
    emoji: '🎵',
    personality: 'music enthusiast and DJ',
    greeting: "welcome to the music room! what genres u vibin to today? 🎵"
  },
  'voice-chill': {
    name: 'Zen',
    emoji: '🌿',
    personality: 'calm and peaceful vibes',
    greeting: "hey there~ welcome to the chill zone. relax and enjoy 🌿✨"
  },
};

const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '😮', '😢', '😡', '🎉', '💯'];

export default function VoiceChat() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentChannel, setCurrentChannel] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'green'>('none');
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{ id: string; username: string; avatarUrl?: string; bio?: string | null; age?: number | null; role?: string } | null>(null);
  const [selectedAction, setSelectedAction] = useState<{ emoji: string; action: string; suffix: string } | null>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // WebRTC hook
  const {
    isConnected,
    localStream,
    peers,
    isMuted,
    isVideoEnabled,
    isPushToTalk,
    isTalking,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    startTalking,
    stopTalking,
    setIsPushToTalk,
  } = useWebRTC({
    roomId: currentChannel?.id || '',
    userId: user?.id || '',
    username: username || 'Anonymous',
  });

  // Update local video preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoEnabled]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabaseUntyped
        .from('profiles')
        .select('username, avatar_url, bio, age')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username);
        setAvatarUrl(data.avatar_url);
        setBio(data.bio);
        setAge(data.age);
      }
    };
    fetchProfile();
  }, [user]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to voice chat messages
  useEffect(() => {
    if (!currentChannel) return;

    const channel = supabase
      .channel(`voice-messages-${currentChannel.id}`)
      .on('broadcast', { event: 'voice-message' }, (payload) => {
        const msg = payload.payload as VoiceMessage;
        setMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannel?.id]);

  // Handle push-to-talk keyboard
  useEffect(() => {
    if (!isPushToTalk || !isConnected) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        startTalking();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        stopTalking();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk, isConnected, startTalking, stopTalking]);

  // Add moderator message
  const addModeratorMessage = useCallback((channelId: string) => {
    const mod = ROOM_MODERATORS[channelId];
    if (!mod) return;
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `mod-${Date.now()}`,
        content: mod.greeting,
        username: `${mod.emoji} ${mod.name}`,
        timestamp: new Date(),
        isModerator: true
      }]);
    }, 1000);
  }, []);

  const handleJoinChannel = async (id: string, name: string) => {
    if (isConnected) {
      leaveRoom();
    }
    setCurrentChannel({ id, name });
    setMessages([]);
    
    setMessages([{
      id: `system-${Date.now()}`,
      content: `You joined #${name}`,
      username: 'System',
      timestamp: new Date(),
      isSystem: true
    }]);
    
    addModeratorMessage(id);
  };

  const handleJoinVoice = async (withVideo: boolean = false) => {
    try {
      await joinRoom(withVideo);
      broadcastMessage(`${username} joined voice chat`, true);
    } catch (error) {
      console.error('Failed to join voice:', error);
      toast({
        variant: "destructive",
        title: "Failed to join voice",
        description: "Could not access microphone"
      });
    }
  };

  const handleLeaveVoice = () => {
    broadcastMessage(`${username} left voice chat`, true);
    leaveRoom();
  };

  const broadcastMessage = async (content: string, isSystem = false, imageUrl?: string) => {
    if (!currentChannel) return;
    
    const msg: VoiceMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      username: isSystem ? 'System' : username,
      avatarUrl: isSystem ? undefined : avatarUrl || undefined,
      timestamp: new Date(),
      isSystem,
      imageUrl
    };
    
    setMessages(prev => [...prev, msg]);
    
    await supabase.channel(`voice-messages-${currentChannel.id}`).send({
      type: 'broadcast',
      event: 'voice-message',
      payload: msg
    });
  };

  // Image handling
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
        toast({ variant: "destructive", title: "Image still too large", description: "Please select a smaller image." });
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
          const resp = xhr.response ?? (() => { try { return xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { return xhr.responseText; } })();
          if (xhr.status >= 200 && xhr.status < 300) { resolve(resp); return; }
          const detail = (resp && typeof resp === "object" && (resp.message || resp.error)) ? (resp.message || resp.error) : xhr.responseText;
          reject(new Error(`Upload failed: ${detail || "Unknown error"}`));
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
      toast({ variant: "destructive", title: "Upload failed", description: error instanceof Error ? error.message : "Failed to upload image." });
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !attachedImage) return;
    if (!currentChannel) return;

    let imageUrl: string | undefined;
    if (attachedImage) {
      const url = await uploadImage();
      if (url) imageUrl = url;
      clearImage();
    }
    
    if (inputMessage.trim() || imageUrl) {
      await broadcastMessage(inputMessage.trim(), false, imageUrl);
      setInputMessage('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
  };

  const handleActionWithUser = (targetUsername: string) => {
    if (selectedAction) {
      const actionMessage = selectedAction.suffix 
        ? `/me ${selectedAction.emoji} ${selectedAction.action} ${targetUsername} ${selectedAction.suffix}`
        : `/me ${selectedAction.emoji} ${selectedAction.action} ${targetUsername}`;
      broadcastMessage(actionMessage);
      setSelectedAction(null);
    }
  };

  const handleMemberClick = async (memberId: string, memberUsername: string, isLocal: boolean, memberAvatarUrl?: string) => {
    if (isLocal) {
      setShowProfileEdit(true);
    } else {
      // Fetch profile data for viewing (including age)
      const { data: profileData } = await supabaseUntyped
        .from('profiles')
        .select('bio, avatar_url, age')
        .eq('user_id', memberId)
        .maybeSingle();
      
      const { data: roleData } = await supabaseUntyped
        .from('user_roles')
        .select('role')
        .eq('user_id', memberId)
        .maybeSingle();
      
      setViewingProfile({ 
        id: memberId, 
        username: memberUsername,
        avatarUrl: profileData?.avatar_url || memberAvatarUrl,
        bio: profileData?.bio,
        age: profileData?.age,
        role: roleData?.role
      });
    }
  };

  const handleProfileUpdated = async () => {
    if (!user) return;
    const { data } = await supabaseUntyped
      .from('profiles')
      .select('username, avatar_url, bio, age')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
      setBio(data.bio);
      setAge(data.age);
    }
  };

  // Get current room moderator
  const currentMod = currentChannel ? ROOM_MODERATORS[currentChannel.id] : null;

  // Build member list
  const members = [
    ...(currentMod ? [{
      id: 'mod-' + currentChannel?.id,
      username: `${currentMod.emoji} ${currentMod.name}`,
      isMuted: false,
      isSpeaking: false,
      avatarUrl: undefined as string | undefined,
      isLocal: false,
      isModerator: true,
      isInVoice: false
    }] : []),
    ...(currentChannel && user ? [{
      id: user.id,
      username: username || 'You',
      isMuted: isConnected ? isMuted : true,
      isSpeaking: isConnected ? isTalking : false,
      avatarUrl: avatarUrl || undefined,
      isLocal: true,
      isModerator: false,
      isInVoice: isConnected
    }] : []),
    ...peers.map(peer => ({
      id: peer.id,
      username: peer.username,
      isMuted: peer.isMuted,
      isSpeaking: peer.isSpeaking,
      avatarUrl: undefined as string | undefined,
      isLocal: false,
      isModerator: false,
      isInVoice: true
    }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Headphones className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Sign in Required</h1>
          <p className="text-muted-foreground">Please sign in to use voice chat</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Channel List Component
  const ChannelListContent = (
    <div className="flex flex-col h-full">
      <VoiceChannelList onJoinChannel={handleJoinChannel} currentChannelId={currentChannel?.id} />
      <div className="p-3 mt-auto border-t border-border/50">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <p>• Hold <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Space</kbd> to talk</p>
          <p>• Click settings for video effects</p>
        </div>
      </div>
    </div>
  );

  // Member List Component
  const MemberListContent = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/50">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          In Room — {members.length}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Select a room to see members</p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors group",
                  member.isSpeaking && "bg-accent/30",
                  member.isModerator ? "bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                {/* Clickable Avatar */}
                <button
                  onClick={() => !member.isModerator && handleMemberClick(member.id, member.username, member.isLocal, member.avatarUrl)}
                  disabled={member.isModerator}
                  className="relative cursor-pointer group/avatar"
                >
                  <Avatar className={cn("h-7 w-7", member.isSpeaking && "ring-2 ring-accent ring-offset-1 ring-offset-background")}>
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback className={cn(
                      "text-[10px] font-bold",
                      member.isModerator ? "bg-primary/20 text-primary" : member.isSpeaking ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {member.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.isSpeaking && <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />}
                  {member.isMuted && !member.isModerator && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background flex items-center justify-center">
                      <MicOff className="h-2 w-2 text-destructive" />
                    </div>
                  )}
                  {member.isModerator && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
                      <Shield className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                  {!member.isModerator && (
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
                
                {/* Clickable Name */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => !member.isModerator && handleMemberClick(member.id, member.username, member.isLocal, member.avatarUrl)}
                    disabled={member.isModerator}
                    className={cn(
                      "text-xs font-medium truncate text-left block",
                      member.isSpeaking && "text-accent-foreground",
                      member.isModerator && "text-primary cursor-default",
                      !member.isModerator && "hover:text-primary cursor-pointer"
                    )}
                  >
                    {member.isLocal ? 'You' : member.username}
                  </button>
                  <p className="text-[10px] text-muted-foreground">
                    {member.isModerator ? 'Room Mod' : !member.isInVoice && member.isLocal ? 'In Room' : member.isSpeaking ? 'Speaking' : member.isMuted ? 'Muted' : 'Listening'}
                  </p>
                </div>
                
                {/* Action buttons for non-mods, non-local */}
                {!member.isModerator && !member.isLocal && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Zap fun actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 rounded-lg hover:bg-primary/10 transition-all" title="Fun actions">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="left" className="w-52 bg-popover border border-border shadow-xl z-[9999]">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">🤪 Funny</DropdownMenuLabel>
                        {USER_ACTIONS.funny.map((action, idx) => (
                          <DropdownMenuItem 
                            key={`f-${idx}`} 
                            onClick={() => {
                              const msg = action.suffix 
                                ? `/me ${action.emoji} ${action.action} ${member.username} ${action.suffix}`
                                : `/me ${action.emoji} ${action.action} ${member.username}`;
                              broadcastMessage(msg);
                            }} 
                            className="text-xs cursor-pointer"
                          >
                            <span className="mr-2">{action.emoji}</span> {action.action} {action.suffix ? '...' : ''}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">💖 Nice</DropdownMenuLabel>
                        {USER_ACTIONS.nice.map((action, idx) => (
                          <DropdownMenuItem 
                            key={`n-${idx}`} 
                            onClick={() => {
                              const msg = action.suffix 
                                ? `/me ${action.emoji} ${action.action} ${member.username} ${action.suffix}`
                                : `/me ${action.emoji} ${action.action} ${member.username}`;
                              broadcastMessage(msg);
                            }} 
                            className="text-xs cursor-pointer"
                          >
                            <span className="mr-2">{action.emoji}</span> {action.action} {action.suffix ? '...' : ''}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* 3-dot more menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-all" title="More actions">
                          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="left" className="w-48 bg-popover border border-border shadow-xl z-[9999]">
                        <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleMemberClick(member.id, member.username, false, member.avatarUrl)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span>View Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            toast({ title: "Coming soon", description: "PM in voice chat coming soon!" });
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <MessageSquareLock className="h-4 w-4 text-primary" />
                          <span>Send PM</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                          disabled
                        >
                          <Ban className="h-4 w-4" />
                          <span>Block</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                          disabled
                        >
                          <Flag className="h-4 w-4" />
                          <span>Report</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-12 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center px-3 gap-2">
        {isMobile && (
          <Sheet open={showChannelSheet} onOpenChange={setShowChannelSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Menu className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">{ChannelListContent}</SheetContent>
          </Sheet>
        )}
        
        <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => navigate('/')}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back</span>
        </Button>
        
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 rounded-full bg-primary/20"><Headphones className="h-4 w-4 text-primary" /></div>
          <div className="min-w-0">
            {currentChannel ? (
              <div className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">{currentChannel.name}</span>
                {isConnected && <span className="text-[10px] text-accent ml-1">● Voice Active</span>}
                {currentMod && <span className="text-[10px] text-muted-foreground ml-1">• Mod: {currentMod.emoji} {currentMod.name}</span>}
              </div>
            ) : (
              <span className="font-semibold text-sm">Voice Chat</span>
            )}
          </div>
        </div>

        {isConnected && isVideoEnabled && localStream && (
          <div className="relative h-8 w-10 rounded overflow-hidden border border-border">
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            {isTalking && <div className="absolute inset-0 ring-2 ring-accent rounded" />}
          </div>
        )}

        {isConnected && (
          <div className="flex items-center gap-1">
            {!isPushToTalk && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isMuted ? "outline" : "default"} size="icon" className={cn("h-8 w-8", !isMuted && isTalking && "ring-2 ring-accent")} onClick={toggleMute}>
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={isVideoEnabled ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={toggleVideo}>
                  {isVideoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isVideoEnabled ? 'Stop Video' : 'Start Video'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleLeaveVoice}>
                  <PhoneOff className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Leave Voice</TooltipContent>
            </Tooltip>
          </div>
        )}

        {isMobile && currentChannel && (
          <Sheet open={showMemberSheet} onOpenChange={setShowMemberSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Users className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">{MemberListContent}</SheetContent>
          </Sheet>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!isMobile && <div className="w-56 border-r border-border/50 bg-card/30 flex flex-col shrink-0">{ChannelListContent}</div>}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {currentChannel ? (
            <>
              {showSettings && (
                <VoiceSettings
                  isPushToTalk={isPushToTalk}
                  setIsPushToTalk={setIsPushToTalk}
                  backgroundEffect={backgroundEffect}
                  setBackgroundEffect={setBackgroundEffect}
                  onClose={() => setShowSettings(false)}
                />
              )}

              {isConnected && (isVideoEnabled || peers.some(p => p.stream?.getVideoTracks().length)) && (
                <div className="shrink-0 p-2 border-b border-border/50 bg-muted/30">
                  <div className={cn("grid gap-2", peers.length === 0 ? "grid-cols-1 max-w-xs mx-auto" : peers.length <= 1 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3")}>
                    <VideoTile stream={localStream} username="You" isMuted={isMuted} isSpeaking={isTalking} isLocal backgroundEffect={backgroundEffect} />
                    {peers.map(peer => (
                      <VideoTile key={peer.id} stream={peer.stream} username={peer.username} isMuted={peer.isMuted} isSpeaking={peer.isSpeaking} />
                    ))}
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="shrink-0 p-3 border-b border-border/50 bg-card/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Join voice to chat with others</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleJoinVoice(false)}><Mic className="h-3 w-3" />Voice</Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs gap-1.5" onClick={() => handleJoinVoice(true)}><Camera className="h-3 w-3" />Video</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <ScrollArea className="flex-1 voice-bg-pattern">
                <div className="p-3 space-y-2 relative z-10">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn("flex items-start gap-2", msg.isSystem && "justify-center")}>
                      {msg.isSystem ? (
                        <span className="text-xs text-muted-foreground italic">{msg.content}</span>
                      ) : (
                        <>
                          <Avatar className={cn("h-6 w-6 shrink-0", msg.isModerator && "ring-1 ring-primary")}>
                            <AvatarImage src={msg.avatarUrl} />
                            <AvatarFallback className={cn("text-[10px]", msg.isModerator ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                              {msg.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className={cn("text-xs font-medium truncate", msg.isModerator ? "text-primary" : "text-foreground")}>{msg.username}</span>
                              {msg.isModerator && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">MOD</span>}
                              <span className="text-[10px] text-muted-foreground">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm break-words">{msg.content}</p>
                            {msg.imageUrl && (
                              <img src={msg.imageUrl} alt="Shared" className="mt-1 rounded-lg max-w-xs max-h-48 object-cover cursor-pointer hover:opacity-90" onClick={() => window.open(msg.imageUrl, '_blank')} />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input with full features */}
              <form onSubmit={handleSendMessage} className="shrink-0 p-2 border-t border-border/50 bg-card/50">
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant={isMuted ? "ghost" : "secondary"} size="icon" className={cn("h-8 w-8 shrink-0", isTalking && "ring-2 ring-accent")} onClick={toggleMute}>
                            {isMuted ? <MicOff className="h-4 w-4 text-muted-foreground" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant={isVideoEnabled ? "secondary" : "ghost"} size="icon" className="h-8 w-8 shrink-0" onClick={toggleVideo}>
                            {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isVideoEnabled ? 'Stop Video' : 'Start Video'}</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  
                  {isConnected && isTalking && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded text-[10px] text-accent-foreground shrink-0">
                      <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />Speaking
                    </div>
                  )}

                  {/* Emoji Picker */}
                  {!isMobile && <EmojiPicker onEmojiSelect={handleEmojiSelect} />}

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Zap className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Fun Actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="start" className="w-56 bg-popover border border-border z-50">
                      {selectedAction ? (
                        <>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">{selectedAction.emoji} Select target</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {members.filter(m => !m.isLocal && !m.isModerator).map(m => (
                            <DropdownMenuItem key={m.id} onClick={() => handleActionWithUser(m.username)} className="cursor-pointer">@{m.username}</DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedAction(null)} className="text-muted-foreground">← Back</DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuLabel className="text-xs text-muted-foreground">🤪 Funny</DropdownMenuLabel>
                          {USER_ACTIONS.funny.map((action, idx) => (
                            <DropdownMenuItem key={`f-${idx}`} onClick={() => setSelectedAction(action)} className="cursor-pointer">
                              <span className="mr-2">{action.emoji}</span>{action.action}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">💖 Nice</DropdownMenuLabel>
                          {USER_ACTIONS.nice.map((action, idx) => (
                            <DropdownMenuItem key={`n-${idx}`} onClick={() => setSelectedAction(action)} className="cursor-pointer">
                              <span className="mr-2">{action.emoji}</span>{action.action}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Image Upload */}
                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 shrink-0" disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach Image</TooltipContent>
                  </Tooltip>

                  {imagePreview && (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className={`h-8 w-8 rounded object-cover ${isUploading ? 'opacity-50' : ''}`} />
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}
                      {!isUploading && (
                        <button type="button" onClick={clearImage} className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mobile: Condensed menu */}
                  {isMobile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="top" className="w-64 bg-popover border border-border z-50">
                        <DropdownMenuLabel className="text-xs text-muted-foreground"><Smile className="h-3 w-3 inline mr-1" />Emojis</DropdownMenuLabel>
                        <div className="flex flex-wrap gap-1 px-2 pb-2">
                          {QUICK_EMOJIS.map(emoji => (
                            <button key={emoji} type="button" onClick={() => handleEmojiSelect(emoji)} className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg">{emoji}</button>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={(!inputMessage.trim() && !attachedImage) || isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-4">
                <Headphones className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <h2 className="text-xl font-semibold">Select a Voice Channel</h2>
                <p className="text-muted-foreground max-w-sm">Choose a voice channel from the list to start chatting with others.</p>
              </div>
            </div>
          )}
        </div>

        {!isMobile && currentChannel && <div className="w-48 border-l border-border/50 bg-card/30 flex flex-col shrink-0">{MemberListContent}</div>}
      </div>

      {/* Profile Modals */}
      <ProfileEditModal
        open={showProfileEdit}
        onOpenChange={setShowProfileEdit}
        username={username}
        avatarUrl={avatarUrl}
        bio={bio}
        age={age}
        onProfileUpdated={handleProfileUpdated}
      />
      
      {viewingProfile && (
        <ProfileViewModal
          open={!!viewingProfile}
          onOpenChange={(open) => !open && setViewingProfile(null)}
          username={viewingProfile.username}
          avatarUrl={viewingProfile.avatarUrl || null}
          bio={viewingProfile.bio || null}
          age={viewingProfile.age}
          role={viewingProfile.role}
        />
      )}
    </div>
  );
}
