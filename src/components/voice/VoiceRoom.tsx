import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebRTC } from '@/hooks/useWebRTC';
import { supabase } from '@/integrations/supabase/client';
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
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, 'owner' | 'admin' | 'moderator' | null>>({});
  
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

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  // Fetch roles for participants (Owner/Admin/Mod badges)
  useEffect(() => {
    const localId = user?.id;
    const peerIds = peers.map((p) => p.id);
    const ids = [localId, ...peerIds].filter((v): v is string => !!v && isUuid(v));
    if (ids.length === 0) return;

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const [{ data: isOwner }, { data: isAdmin }, { data: isMod }] = await Promise.all([
            supabase.rpc('is_owner', { _user_id: id }),
            supabase.rpc('has_role', { _user_id: id, _role: 'admin' }),
            supabase.rpc('has_role', { _user_id: id, _role: 'moderator' }),
          ]);

          const role: 'owner' | 'admin' | 'moderator' | null =
            isOwner ? 'owner' : isAdmin ? 'admin' : isMod ? 'moderator' : null;
          return [id, role] as const;
        })
      );

      if (cancelled) return;
      setRolesByUserId((prev) => {
        const next = { ...prev };
        for (const [id, role] of results) next[id] = role;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, peers.map((p) => p.id).join('|')]);

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

  // Build participants list for member sidebar
  const localId = user?.id || 'local';
  const allParticipants = [
    { id: localId, username: user?.user_metadata?.username || 'You', isMuted, isSpeaking: isTalking, isLocal: true },
    ...peers.map(p => ({ id: p.id, username: p.username, isMuted: p.isMuted, isSpeaking: p.isSpeaking, isLocal: false }))
  ];

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
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
                {allParticipants.length} in room
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
        <div className="flex-1 p-4 overflow-auto flex flex-col">
          {(() => {
            const videoParticipants = [
              { id: localId, stream: localStream, username: 'You', isMuted, isSpeaking: isTalking, isLocal: true },
              ...peers.map(p => ({ id: p.id, stream: p.stream, username: p.username, isMuted: p.isMuted, isSpeaking: p.isSpeaking, isLocal: false }))
            ];
            const visible = videoParticipants.slice(0, 6);
            const waiting = videoParticipants.slice(6);
            const count = visible.length;
            
            return (
              <>
                {/* Centered grid - max 6 */}
                <div className="flex-1 flex items-center justify-center">
                  <div className={cn(
                    "grid gap-3 w-full max-w-4xl",
                    count <= 1 ? "grid-cols-1 max-w-md" :
                    count === 2 ? "grid-cols-2 max-w-2xl" :
                    count <= 4 ? "grid-cols-2" :
                    "grid-cols-3"
                  )}>
                    {visible.map(participant => (
                      <VideoTile
                        key={participant.id}
                        stream={participant.stream}
                        username={participant.username}
                        isMuted={participant.isMuted}
                        isSpeaking={participant.isSpeaking}
                        isLocal={participant.isLocal}
                        backgroundEffect={participant.isLocal ? backgroundEffect : 'none'}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Waiting list */}
                {waiting.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Waiting ({waiting.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {waiting.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/50 text-xs">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            p.isSpeaking ? "bg-green-500" : "bg-muted-foreground/50"
                          )} />
                          <span>{p.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
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

      {/* Members Sidebar */}
      <div className="w-48 border-l border-border bg-card/30 flex flex-col">
        <div className="p-3 border-b border-border/50">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            In Room ({allParticipants.length})
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {allParticipants.map(p => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                p.isSpeaking && "bg-green-500/10"
              )}
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-md jac-gradient-bg flex items-center justify-center">
                  <Volume2 className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                {p.isSpeaking && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-xs">
                  {p.isLocal ? 'You' : p.username}
                </p>
                {rolesByUserId[p.id] && (
                  <span
                    className={cn(
                      'mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold',
                      rolesByUserId[p.id] === 'owner'
                        ? 'jac-gradient-bg text-primary-foreground'
                        : rolesByUserId[p.id] === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {rolesByUserId[p.id] === 'owner'
                      ? 'Owner'
                      : rolesByUserId[p.id] === 'admin'
                        ? 'Admin'
                        : 'Mod'}
                  </span>
                )}
              </div>
              <div className={cn(
                "p-0.5 rounded",
                p.isMuted ? "text-destructive" : "text-green-500"
              )}>
                {p.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
