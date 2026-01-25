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
import { 
  ArrowLeft, Headphones, Mic, MicOff, Video, VideoOff, 
  PhoneOff, Volume2, Settings, Users, Hash, Menu, 
  MessageSquare, Send, Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceChannelList from '@/components/voice/VoiceChannelList';
import VideoTile from '@/components/voice/VideoTile';
import VoiceSettings from '@/components/voice/VoiceSettings';
import { useIsMobile } from '@/hooks/use-mobile';

interface VoiceMessage {
  id: string;
  content: string;
  username: string;
  avatarUrl?: string;
  timestamp: Date;
  isSystem?: boolean;
}

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
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'green'>('none');
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabaseUntyped
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username);
        setAvatarUrl(data.avatar_url);
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

  const handleJoinChannel = async (id: string, name: string) => {
    // Leave previous channel if connected
    if (isConnected) {
      leaveRoom();
    }
    setCurrentChannel({ id, name });
    setMessages([]); // Clear messages for new channel
    
    // Add system message
    setMessages([{
      id: `system-${Date.now()}`,
      content: `You joined #${name}`,
      username: 'System',
      timestamp: new Date(),
      isSystem: true
    }]);
  };

  const handleJoinVoice = async (withVideo: boolean = false) => {
    try {
      await joinRoom(withVideo);
      // Announce join
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

  const broadcastMessage = async (content: string, isSystem = false) => {
    if (!currentChannel) return;
    
    const msg: VoiceMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      username: isSystem ? 'System' : username,
      avatarUrl: isSystem ? undefined : avatarUrl || undefined,
      timestamp: new Date(),
      isSystem
    };
    
    // Add locally first
    setMessages(prev => [...prev, msg]);
    
    // Broadcast to others
    await supabase.channel(`voice-messages-${currentChannel.id}`).send({
      type: 'broadcast',
      event: 'voice-message',
      payload: msg
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentChannel) return;
    
    await broadcastMessage(inputMessage.trim());
    setInputMessage('');
  };

  // Build member list
  const members = isConnected ? [
    { 
      id: user?.id || 'local', 
      username: username || 'You', 
      isMuted, 
      isSpeaking: isTalking,
      avatarUrl,
      isLocal: true
    },
    ...peers.map(peer => ({
      id: peer.id,
      username: peer.username,
      isMuted: peer.isMuted,
      isSpeaking: peer.isSpeaking,
      avatarUrl: undefined,
      isLocal: false
    }))
  ] : [];

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

  // Channel List Component for sidebar
  const ChannelListContent = (
    <div className="flex flex-col h-full">
      <VoiceChannelList
        onJoinChannel={handleJoinChannel}
        currentChannelId={currentChannel?.id}
      />
      <div className="p-3 mt-auto border-t border-border/50">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <p>• Hold <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Space</kbd> to talk</p>
          <p>• Click settings for video effects</p>
        </div>
      </div>
    </div>
  );

  // Member List Component for sidebar
  const MemberListContent = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/50">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          {isConnected ? `In Voice — ${members.length}` : 'Voice Members'}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Join voice to see members
            </p>
          ) : (
            members.map(member => (
              <div 
                key={member.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                  member.isSpeaking && "bg-green-500/10"
                )}
              >
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className={cn(
                      "text-[10px] font-bold",
                      member.isSpeaking 
                        ? "bg-green-500/20 text-green-500" 
                        : "bg-primary/20 text-primary"
                    )}>
                      {member.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {member.isSpeaking && (
                    <div className="absolute inset-0 rounded-full ring-2 ring-green-500 animate-pulse" />
                  )}
                  {member.isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background flex items-center justify-center">
                      <MicOff className="h-2 w-2 text-destructive" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    member.isSpeaking && "text-green-500"
                  )}>
                    {member.isLocal ? 'You' : member.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {member.isSpeaking ? 'Speaking' : member.isMuted ? 'Muted' : 'Listening'}
                  </p>
                </div>
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
        {/* Mobile menu buttons */}
        {isMobile && (
          <Sheet open={showChannelSheet} onOpenChange={setShowChannelSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {ChannelListContent}
            </SheetContent>
          </Sheet>
        )}
        
        <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => navigate('/')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 rounded-full bg-violet-500/20">
            <Headphones className="h-4 w-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            {currentChannel ? (
              <div className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">{currentChannel.name}</span>
                {isConnected && (
                  <span className="text-[10px] text-green-500 ml-1">● Connected</span>
                )}
              </div>
            ) : (
              <span className="font-semibold text-sm">Voice Chat</span>
            )}
          </div>
        </div>

        {/* Voice Controls in header when connected */}
        {isConnected && (
          <div className="flex items-center gap-1">
            {!isPushToTalk && (
              <Button
                variant={isMuted ? "outline" : "default"}
                size="icon"
                className={cn("h-8 w-8", !isMuted && isTalking && "ring-2 ring-green-500")}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              variant={isVideoEnabled ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={handleLeaveVoice}
            >
              <PhoneOff className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Mobile member button */}
        {isMobile && currentChannel && (
          <Sheet open={showMemberSheet} onOpenChange={setShowMemberSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Users className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-56 p-0">
              {MemberListContent}
            </SheetContent>
          </Sheet>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Channel List (Desktop) */}
        {!isMobile && (
          <div className="w-56 border-r border-border/50 bg-card/30 flex flex-col shrink-0">
            {ChannelListContent}
          </div>
        )}

        {/* Center - Chat + Video */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {currentChannel ? (
            <>
              {/* Settings Panel */}
              {showSettings && (
                <VoiceSettings
                  isPushToTalk={isPushToTalk}
                  setIsPushToTalk={setIsPushToTalk}
                  backgroundEffect={backgroundEffect}
                  setBackgroundEffect={setBackgroundEffect}
                  onClose={() => setShowSettings(false)}
                />
              )}

              {/* Video Grid (when connected with video) */}
              {isConnected && (isVideoEnabled || peers.some(p => p.stream?.getVideoTracks().length)) && (
                <div className="shrink-0 p-2 border-b border-border/50 bg-muted/30">
                  <div className={cn(
                    "grid gap-2",
                    peers.length === 0 ? "grid-cols-1 max-w-xs mx-auto" :
                    peers.length <= 1 ? "grid-cols-2" :
                    "grid-cols-2 md:grid-cols-3"
                  )}>
                    <VideoTile
                      stream={localStream}
                      username="You"
                      isMuted={isMuted}
                      isSpeaking={isTalking}
                      isLocal
                      backgroundEffect={backgroundEffect}
                    />
                    {peers.map(peer => (
                      <VideoTile
                        key={peer.id}
                        stream={peer.stream}
                        username={peer.username}
                        isMuted={peer.isMuted}
                        isSpeaking={peer.isSpeaking}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Join Voice Prompt */}
              {!isConnected && (
                <div className="shrink-0 p-3 border-b border-border/50 bg-card/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Join voice to chat with others</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleJoinVoice(false)}>
                        <Mic className="h-3 w-3" />
                        Voice
                      </Button>
                      <Button size="sm" variant="secondary" className="h-7 text-xs gap-1.5" onClick={() => handleJoinVoice(true)}>
                        <Camera className="h-3 w-3" />
                        Video
                      </Button>
                    </div>
                  </div>
                  
                  {/* Push to talk button when connected */}
                  {isPushToTalk && isConnected && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        variant={isTalking ? "default" : "outline"}
                        className={cn(
                          "gap-2 min-w-[120px]",
                          isTalking && "bg-accent text-accent-foreground"
                        )}
                        onMouseDown={startTalking}
                        onMouseUp={stopTalking}
                        onMouseLeave={stopTalking}
                        onTouchStart={startTalking}
                        onTouchEnd={stopTalking}
                      >
                        <Mic className="h-4 w-4" />
                        {isTalking ? 'Talking...' : 'Hold to Talk'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Messages Area */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {messages.map(msg => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex items-start gap-2",
                        msg.isSystem && "justify-center"
                      )}
                    >
                      {msg.isSystem ? (
                        <span className="text-xs text-muted-foreground italic">
                          {msg.content}
                        </span>
                      ) : (
                        <>
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={msg.avatarUrl} />
                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                              {msg.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-medium text-primary truncate">
                                {msg.username}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm break-words">{msg.content}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="shrink-0 p-2 border-t border-border/50 bg-card/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9" disabled={!inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            // No channel selected
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-4">
                <Headphones className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <h2 className="text-xl font-semibold">Select a Voice Channel</h2>
                <p className="text-muted-foreground max-w-sm">
                  Choose a voice channel from the list to start chatting with others.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Member List (Desktop) */}
        {!isMobile && currentChannel && (
          <div className="w-48 border-l border-border/50 bg-card/30 flex flex-col shrink-0">
            {MemberListContent}
          </div>
        )}
      </div>
    </div>
  );
}
