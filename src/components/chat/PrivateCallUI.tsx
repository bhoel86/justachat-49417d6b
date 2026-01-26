import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallState, CallType } from '@/hooks/usePrivateCall';

interface PrivateCallUIProps {
  callState: CallState;
  callType: CallType | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  formattedDuration: string;
  targetUsername: string;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
}

const PrivateCallUI = ({
  callState,
  callType,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoMuted,
  formattedDuration,
  targetUsername,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
}: PrivateCallUIProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[PrivateCallUI] Setting local video srcObject');
      localVideoRef.current.srcObject = localStream;
      // Force play for mobile browsers
      localVideoRef.current.play().catch(err => {
        console.warn('[PrivateCallUI] Local video autoplay failed:', err);
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      console.log('[PrivateCallUI] Setting remote stream with', remoteStream.getTracks().length, 'tracks');
      remoteStream.getTracks().forEach(t => {
        console.log('[PrivateCallUI] Remote track:', t.kind, t.label, 'enabled:', t.enabled, 'readyState:', t.readyState);
      });
      
      // Set video element for video calls
      if (remoteVideoRef.current) {
        console.log('[PrivateCallUI] Attaching remote stream to video element');
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => {
          console.warn('[PrivateCallUI] Remote video autoplay failed:', err);
        });
      }
      
      // Also set audio element as fallback for voice calls
      if (remoteAudioRef.current) {
        console.log('[PrivateCallUI] Attaching remote stream to audio element');
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(err => {
          console.warn('[PrivateCallUI] Remote audio autoplay failed:', err);
        });
      }
    }
  }, [remoteStream]);

  if (callState === 'idle' || callState === 'ringing') return null;

  const isVideo = callType === 'video';
  const isConnected = callState === 'connected';
  const isCalling = callState === 'calling';

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col rounded-xl overflow-hidden">
      {/* Hidden audio element to ensure audio always plays (especially for voice calls) */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      
      {/* Video display area */}
      {isVideo ? (
        <div className="flex-1 relative bg-black">
          {/* Remote video (large) - NOT muted so we can hear them */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Local video (small overlay) */}
          <div className="absolute bottom-2 right-2 w-20 h-28 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
            />
            {isVideoMuted && (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* No remote video yet */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">
                {targetUsername.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-muted-foreground">
                {isCalling ? 'Calling...' : 'Connecting...'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Voice call display */
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-accent/10">
          <div className="relative mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
              {targetUsername.charAt(0).toUpperCase()}
            </div>
            {isConnected && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Phone className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <p className="font-medium text-foreground">{targetUsername}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isCalling ? 'Calling...' : isConnected ? formattedDuration : 'Connecting...'}
          </p>
          
          {/* Audio visualization placeholder */}
          {isConnected && (
            <div className="flex items-center gap-0.5 mt-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${12 + Math.random() * 16}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Call controls */}
      <div className="p-3 bg-card/80 backdrop-blur border-t border-border">
        {/* Duration for video calls */}
        {isVideo && isConnected && (
          <p className="text-center text-xs text-muted-foreground mb-2">
            {formattedDuration}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          {/* Mute audio */}
          <Button
            variant={isAudioMuted ? 'destructive' : 'secondary'}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={onToggleAudio}
          >
            {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {/* Toggle video (only for video calls) */}
          {isVideo && (
            <Button
              variant={isVideoMuted ? 'destructive' : 'secondary'}
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={onToggleVideo}
            >
              {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
          )}

          {/* End call */}
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivateCallUI;
