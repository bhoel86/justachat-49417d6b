import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CallType = 'voice' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface UsePrivateCallOptions {
  currentUserId: string;
  currentUsername: string;
  targetUserId: string;
  targetUsername: string;
  onIncomingCall?: (callType: CallType) => void;
}

export const usePrivateCall = ({
  currentUserId,
  currentUsername,
  targetUserId,
  targetUsername,
  onIncomingCall
}: UsePrivateCallOptions) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCallType, setIncomingCallType] = useState<CallType | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ICE servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Create channel name (sorted for consistency)
  const channelName = [currentUserId, targetUserId].sort().join('-call-');

  // Cleanup resources
  const cleanup = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setCallDuration(0);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: currentUserId,
            to: targetUserId,
            candidate: event.candidate.toJSON()
          }
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [currentUserId, targetUserId]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Get media stream
  const getMediaStream = useCallback(async (type: CallType) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to get media stream:', error);
      toast.error('Could not access camera/microphone');
      return null;
    }
  }, []);

  // Initiate a call
  const startCall = useCallback(async (type: CallType) => {
    if (callState !== 'idle') return;

    setCallType(type);
    setCallState('calling');

    const stream = await getMediaStream(type);
    if (!stream) {
      setCallState('idle');
      setCallType(null);
      return;
    }

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Send call request
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-request',
      payload: {
        from: currentUserId,
        fromUsername: currentUsername,
        to: targetUserId,
        callType: type,
      }
    });

    // Timeout after 30 seconds - use a ref check since state may be stale in timeout
    ringTimeoutRef.current = setTimeout(() => {
      toast.error(`${targetUsername} didn't answer`);
      setCallState('idle');
      setCallType(null);
      cleanup();
    }, 30000);

    toast.info(`Calling ${targetUsername}...`);
  }, [callState, currentUserId, currentUsername, targetUserId, targetUsername, getMediaStream, createPeerConnection, cleanup]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (callState !== 'ringing' || !incomingCallType) return;

    const stream = await getMediaStream(incomingCallType);
    if (!stream) {
      rejectCall();
      return;
    }

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    setCallType(incomingCallType);
    setCallState('connected');
    setIncomingCallType(null);
    startCallTimer();

    // Send answer signal
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-answer',
      payload: {
        from: currentUserId,
        to: targetUserId,
        accepted: true,
      }
    });

    toast.success('Call connected');
  }, [callState, incomingCallType, currentUserId, targetUserId, getMediaStream, createPeerConnection, startCallTimer]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-answer',
      payload: {
        from: currentUserId,
        to: targetUserId,
        accepted: false,
      }
    });

    setCallState('idle');
    setIncomingCallType(null);
    cleanup();
    toast.info('Call declined');
  }, [currentUserId, targetUserId, cleanup]);

  // End active call
  const endCall = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-end',
      payload: {
        from: currentUserId,
        to: targetUserId,
      }
    });

    setCallState('ended');
    cleanup();
    
    setTimeout(() => {
      setCallState('idle');
      setCallType(null);
    }, 1000);
  }, [currentUserId, targetUserId, cleanup]);

  // Toggle audio mute
  const toggleAudioMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(prev => !prev);
    }
  }, []);

  // Toggle video mute
  const toggleVideoMute = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(prev => !prev);
    }
  }, []);

  // Handle signaling
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    const channel = supabase.channel(`call-${channelName}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'call-request' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        // Incoming call
        setIncomingCallType(payload.callType);
        setCallState('ringing');
        onIncomingCall?.(payload.callType);
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        if (ringTimeoutRef.current) {
          clearTimeout(ringTimeoutRef.current);
          ringTimeoutRef.current = null;
        }

        if (payload.accepted) {
          // Call was accepted, create offer
          const pc = peerConnectionRef.current;
          if (pc) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            channel.send({
              type: 'broadcast',
              event: 'webrtc-offer',
              payload: {
                from: currentUserId,
                to: targetUserId,
                offer,
              }
            });
          }
          setCallState('connected');
          startCallTimer();
          toast.success('Call connected');
        } else {
          // Call was rejected
          toast.info(`${targetUsername} declined the call`);
          setCallState('idle');
          setCallType(null);
          cleanup();
        }
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }) => {
        if (payload.to !== currentUserId && payload.from !== targetUserId) return;
        
        toast.info('Call ended');
        setCallState('ended');
        cleanup();
        
        setTimeout(() => {
          setCallState('idle');
          setCallType(null);
          setIncomingCallType(null);
        }, 1000);
      })
      .on('broadcast', { event: 'webrtc-offer' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          channel.send({
            type: 'broadcast',
            event: 'webrtc-answer',
            payload: {
              from: currentUserId,
              to: targetUserId,
              answer,
            }
          });
        }
      })
      .on('broadcast', { event: 'webrtc-answer' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (pc && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      cleanup();
    };
  }, [currentUserId, targetUserId, channelName, onIncomingCall, targetUsername, cleanup, startCallTimer]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    callState,
    callType,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    incomingCallType,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudioMute,
    toggleVideoMute,
  };
};
