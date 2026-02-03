/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useRef, useState } from 'react';
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
  const analyserRef = useRef<AnalyserNode | null>(null);
 const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  // Set up audio analyzer for mic level
  useEffect(() => {
    if (!localStream || isAudioMuted) {
      setMicLevel(0);
     if (animationRef.current) {
       cancelAnimationFrame(animationRef.current);
       animationRef.current = null;
     }
      return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) {
      setMicLevel(0);
      return;
    }

    try {
     // Reuse or create audio context
     if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
       audioContextRef.current = new AudioContext();
     }
     const audioContext = audioContextRef.current;
     
     // Resume if suspended (common on mobile)
     if (audioContext.state === 'suspended') {
       audioContext.resume();
     }
     
      const source = audioContext.createMediaStreamSource(localStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
     analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
         // Normalize to 0-100 range for better visualization
         const normalizedLevel = Math.min((average / 255) * 100, 100);
          setMicLevel(normalizedLevel);
        }
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
         animationRef.current = null;
        }
       // Disconnect but keep context for reuse
       source.disconnect();
       analyser.disconnect();
      };
    } catch (err) {
      console.warn('[PrivateCallUI] Failed to set up audio analyzer:', err);
    }
  }, [localStream, isAudioMuted]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[PrivateCallUI] Setting local video srcObject');
      localVideoRef.current.srcObject = localStream;
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
      
      if (remoteVideoRef.current) {
        console.log('[PrivateCallUI] Attaching remote stream to video element');
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(err => {
          console.warn('[PrivateCallUI] Remote video autoplay failed:', err);
        });
      }
      
      if (remoteAudioRef.current) {
        console.log('[PrivateCallUI] Attaching remote stream to audio element');
        remoteAudioRef.current.srcObject = remoteStream;
       remoteAudioRef.current.volume = 1.0;
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

  // Calculate mic level indicator color and height
  const getMicLevelColor = (level: number) => {
   if (level < 30) return 'bg-green-500';
   if (level < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col rounded-xl overflow-hidden">
      {/* Hidden audio element to ensure audio always plays */}
     <audio 
       ref={remoteAudioRef} 
       autoPlay 
       playsInline
       controls={false}
       className="hidden"
     />
      
      {/* Video display area */}
      {isVideo ? (
        <div className="flex-1 relative bg-black">
          {/* Remote video (large) */}
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

          {/* Mic level indicator for video calls */}
          {isConnected && !isAudioMuted && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1">
              <Mic className="h-3.5 w-3.5 text-white" />
              <div className="flex items-end gap-0.5 h-4">
                {[0.2, 0.4, 0.6, 0.8, 1].map((threshold, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                     micLevel >= threshold * 100 ? getMicLevelColor(micLevel) : 'bg-white/30'
                    }`}
                    style={{ height: `${(i + 1) * 3 + 4}px` }}
                  />
                ))}
              </div>
            </div>
          )}

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
          
          {/* Mic level indicator for voice calls */}
          {isConnected && (
            <div className="flex items-center gap-2 mt-4 bg-card/50 rounded-full px-4 py-2">
              {isAudioMuted ? (
                <MicOff className="h-4 w-4 text-destructive" />
              ) : (
                <Mic className="h-4 w-4 text-foreground" />
              )}
              <div className="flex items-end gap-0.5 h-5">
               {[15, 30, 45, 60, 75, 90].map((threshold, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                     !isAudioMuted && micLevel >= threshold
                        ? getMicLevelColor(micLevel) 
                        : 'bg-muted-foreground/30'
                    }`}
                    style={{ height: `${(i + 1) * 2.5 + 5}px` }}
                  />
                ))}
              </div>
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
