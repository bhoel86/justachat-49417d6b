import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Phone,
  Volume2, VolumeX, Settings, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VideoTile from './VideoTile';
import VoiceSettings from './VoiceSettings';

interface VoiceRoomProps {
  roomId: string;
  roomName: string;
  onLeave?: () => void;
}

export default function VoiceRoom({ roomId, roomName, onLeave }: VoiceRoomProps) {
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

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-500/20">
            <Volume2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="font-semibold">{roomName}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {peers.length + 1} in room
            </p>
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
          peers.length === 0 ? "grid-cols-1" :
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
  );
}
