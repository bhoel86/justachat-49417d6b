import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { cn } from '@/lib/utils';
import VideoTile from './VideoTile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PrivateCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientUsername: string;
  isIncoming?: boolean;
  callType?: 'voice' | 'video';
}

export default function PrivateCallModal({
  isOpen,
  onClose,
  recipientId,
  recipientUsername,
  isIncoming = false,
  callType = 'voice',
}: PrivateCallModalProps) {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const roomId = [user?.id, recipientId].sort().join('-');
  
  const {
    isConnected,
    localStream,
    peers,
    isMuted,
    isVideoEnabled,
    isTalking,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleVideo,
    startTalking,
    stopTalking,
  } = useWebRTC({
    roomId,
    userId: user?.id || '',
    username: user?.user_metadata?.username || 'Anonymous',
  });

  // Handle incoming/outgoing call signaling
  useEffect(() => {
    if (!isOpen || !user) return;

    const channel = supabase.channel(`call:${roomId}`);
    
    channel.on('broadcast', { event: 'call-accepted' }, () => {
      setCallStatus('connected');
      joinRoom(callType === 'video');
    });
    
    channel.on('broadcast', { event: 'call-declined' }, () => {
      toast.error(`${recipientUsername} declined the call`);
      setCallStatus('ended');
      onClose();
    });
    
    channel.on('broadcast', { event: 'call-ended' }, () => {
      toast.info('Call ended');
      setCallStatus('ended');
      leaveRoom();
      onClose();
    });
    
    channel.subscribe();

    // If outgoing, send call request
    if (!isIncoming) {
      channel.send({
        type: 'broadcast',
        event: 'incoming-call',
        payload: {
          callerId: user.id,
          callerUsername: user.user_metadata?.username,
          callType,
        },
      });
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user, roomId, isIncoming, callType, recipientUsername, joinRoom, leaveRoom, onClose]);

  const handleAccept = async () => {
    setCallStatus('connected');
    await joinRoom(callType === 'video');
    
    const channel = supabase.channel(`call:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'call-accepted',
      payload: {},
    });
  };

  const handleDecline = () => {
    const channel = supabase.channel(`call:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'call-declined',
      payload: {},
    });
    onClose();
  };

  const handleEndCall = () => {
    const channel = supabase.channel(`call:${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'call-ended',
      payload: {},
    });
    leaveRoom();
    onClose();
  };

  const peer = peers[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {callStatus === 'ringing' ? (
          <div className="p-8 text-center space-y-6">
            <div className={cn(
              "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
              isIncoming ? "bg-green-500/20" : "bg-primary/20"
            )}>
              {isIncoming ? (
                <PhoneIncoming className="w-12 h-12 text-green-500 animate-pulse" />
              ) : (
                <PhoneOutgoing className="w-12 h-12 text-primary animate-pulse" />
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold">{recipientUsername}</h2>
              <p className="text-muted-foreground">
                {isIncoming ? 'Incoming call...' : 'Calling...'}
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              {isIncoming ? (
                <>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-14 h-14"
                    onClick={handleDecline}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    className="rounded-full w-14 h-14 bg-green-600 hover:bg-green-700"
                    onClick={handleAccept}
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-14 h-14"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Video area */}
            <div className="relative aspect-video bg-muted">
              {peer?.stream ? (
                <VideoTile
                  stream={peer.stream}
                  username={recipientUsername}
                  isMuted={peer.isMuted}
                  isSpeaking={peer.isSpeaking}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary/70">
                      {recipientUsername[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Local video PiP */}
              {localStream && (
                <div className="absolute bottom-4 right-4 w-32 aspect-video rounded-lg overflow-hidden shadow-lg">
                  <VideoTile
                    stream={localStream}
                    username="You"
                    isMuted={isMuted}
                    isSpeaking={isTalking}
                    isLocal
                  />
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="p-4 flex items-center justify-center gap-3 bg-card">
              <Button
                variant={isMuted ? "outline" : "default"}
                size="icon"
                onClick={toggleMute}
                className="rounded-full"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isVideoEnabled ? "default" : "outline"}
                size="icon"
                onClick={toggleVideo}
                className="rounded-full"
              >
                {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
                className="rounded-full"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
