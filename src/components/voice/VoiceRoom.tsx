import { useState, useEffect, forwardRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Volume2, Settings, Users, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VideoTile from './VideoTile';
import VoiceSettings from './VoiceSettings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VoiceRoomProps {
  roomId: string;
  roomName: string;
  onLeave?: () => void;
}

const VoiceRoom = forwardRef<HTMLDivElement, VoiceRoomProps>(
  ({ roomId, roomName, onLeave }, ref) => {
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'green'>('none');
  
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
    roomId,
    userId: user?.id || '',
    username: user?.user_metadata?.username || 'Anonymous',
  });

  // Handle keyboard for push-to-talk
  useEffect(() => {
    if (!isPushToTalk || !isConnected) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startTalking();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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

  const handleJoin = async (withVideo: boolean = false) => {
    try {
      await joinRoom(withVideo);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleLeave = () => {
    leaveRoom();
    onLeave?.();
  };

  // Build member list: self + peers
  const currentUsername = user?.user_metadata?.username || 'You';
  const members = [
    { 
      id: user?.id || 'local', 
      username: currentUsername, 
      isMuted, 
      isSpeaking: isTalking,
      avatarUrl: user?.user_metadata?.avatar_url 
    },
    ...peers.map(peer => ({
      id: peer.id,
      username: peer.username,
      isMuted: peer.isMuted,
      isSpeaking: peer.isSpeaking,
      avatarUrl: undefined // Could be expanded to include peer avatars
    }))
  ];

  if (!isConnected) {
    return (
      <Card ref={ref} className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Join {roomName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Join the voice channel to chat with others. You can enable your camera after joining.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => handleJoin(false)} className="flex-1 gap-2">
              <Mic className="h-4 w-4" />
              Join Voice
            </Button>
            <Button onClick={() => handleJoin(true)} variant="secondary" className="flex-1 gap-2">
              <Video className="h-4 w-4" />
              Join with Video
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={ref} className="flex h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Volume2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{roomName}</h2>
              </div>
              <p className="text-xs text-green-500">Connected</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

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

        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className={cn(
            "grid gap-4",
            peers.length === 0 ? "grid-cols-1 max-w-lg mx-auto" :
            peers.length <= 1 ? "grid-cols-1 md:grid-cols-2" :
            peers.length <= 3 ? "grid-cols-2" :
            "grid-cols-2 md:grid-cols-3"
          )}>
            {/* Local video */}
            <VideoTile
              stream={localStream}
              username="You"
              isMuted={isMuted}
              isSpeaking={isTalking}
              isLocal
              backgroundEffect={backgroundEffect}
            />
            
            {/* Peer videos */}
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

        {/* Controls */}
        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex items-center justify-center gap-3">
            {/* Push to Talk indicator */}
            {isPushToTalk && (
              <Button
                variant={isTalking ? "default" : "outline"}
                className={cn(
                  "gap-2 min-w-[140px]",
                  isTalking && "bg-green-600 hover:bg-green-700"
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
            )}
            
            {/* Regular mute toggle for VAD mode */}
            {!isPushToTalk && (
              <Button
                variant={isMuted ? "outline" : "default"}
                size="icon"
                onClick={toggleMute}
                className={cn(
                  !isMuted && isTalking && "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                )}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              variant={isVideoEnabled ? "default" : "outline"}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={handleLeave}
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
          
          {isPushToTalk && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Hold <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Space</kbd> to talk
            </p>
          )}
        </div>
      </div>

      {/* Member List Sidebar */}
      <div className="w-48 border-l border-border bg-card/30 hidden md:flex flex-col">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            In Room — {members.length}
          </h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {members.map(member => (
              <div 
                key={member.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                  member.isSpeaking && "bg-green-500/10"
                )}
              >
                <div className="relative">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback className={cn(
                      "text-[10px] font-bold",
                      member.isSpeaking 
                        ? "bg-green-500/20 text-green-500" 
                        : "bg-primary/20 text-primary"
                    )}>
                      {member.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Speaking indicator ring */}
                  {member.isSpeaking && (
                    <div className="absolute inset-0 rounded-full ring-2 ring-green-500 animate-pulse" />
                  )}
                  {/* Muted indicator */}
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
                    {member.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {member.isSpeaking ? 'Speaking' : member.isMuted ? 'Muted' : 'Listening'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

VoiceRoom.displayName = 'VoiceRoom';

export default VoiceRoom;
