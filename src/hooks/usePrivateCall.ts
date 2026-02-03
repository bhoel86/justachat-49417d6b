/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getIceServers } from '@/lib/environment';

export type CallType = 'voice' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface UsePrivateCallOptions {
  currentUserId: string;
  currentUsername: string;
  targetUserId: string;
  targetUsername: string;
  onIncomingCall?: (callType: CallType) => void;
  pendingIncomingCall?: { callType: CallType } | null;
  onClearPendingCall?: () => void;
}

export const usePrivateCall = ({
  currentUserId,
  currentUsername,
  targetUserId,
  targetUsername,
  onIncomingCall,
  pendingIncomingCall,
  onClearPendingCall
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
  const channelSubscribedRef = useRef(false);

  // ICE servers for NAT traversal - environment-aware with TURN fallback
  const iceServers: RTCConfiguration = {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
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
    console.log('[usePrivateCall] Creating new peer connection');
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log('[usePrivateCall] Sending ICE candidate');
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
      console.log('[usePrivateCall] Received remote track:', event.track.kind, event.streams.length, 'streams');
      if (event.streams && event.streams[0]) {
        console.log('[usePrivateCall] Setting remote stream with', event.streams[0].getTracks().length, 'tracks');
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[usePrivateCall] Connection state changed:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[usePrivateCall] ICE connection state:', pc.iceConnectionState);
    };

    pc.onnegotiationneeded = () => {
      console.log('[usePrivateCall] Negotiation needed');
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

  // Get media stream with mobile-friendly fallbacks
  const getMediaStream = useCallback(async (type: CallType, allowEmpty: boolean = false): Promise<MediaStream | null> => {
    try {
      // Try with ideal constraints first, then fall back to basic constraints
      const idealConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          width: { ideal: 1280, min: 320 },
          height: { ideal: 720, min: 240 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user',
        } : false,
      };

      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
        console.log('[usePrivateCall] Got media stream with ideal constraints');
      } catch (idealError) {
        console.warn('[usePrivateCall] Ideal constraints failed, trying basic:', idealError);
        // Fallback to basic constraints for mobile
        const basicConstraints: MediaStreamConstraints = {
          audio: true,
          video: type === 'video' ? { facingMode: 'user' } : false,
        };
        try {
          stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          console.log('[usePrivateCall] Got media stream with basic constraints');
        } catch (basicError) {
          console.warn('[usePrivateCall] Basic constraints failed, trying audio only:', basicError);
          // Try audio only as last resort
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            console.log('[usePrivateCall] Got audio-only stream');
            toast.info('Camera unavailable - using audio only');
          } catch (audioOnlyError) {
            console.warn('[usePrivateCall] Audio-only also failed:', audioOnlyError);
            // If allowEmpty is true, create an empty stream so call can proceed
            if (allowEmpty) {
              console.log('[usePrivateCall] Creating empty stream for receive-only mode');
              stream = new MediaStream();
              toast.info('No microphone available - you can still listen');
            } else {
              throw audioOnlyError;
            }
          }
        }
      }

      if (stream) {
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        console.log('[usePrivateCall] Stream tracks - Video:', videoTracks.length, 'Audio:', audioTracks.length);
        videoTracks.forEach(t => console.log('[usePrivateCall] Video track:', t.label, t.readyState));
        audioTracks.forEach(t => console.log('[usePrivateCall] Audio track:', t.label, t.readyState));
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('[usePrivateCall] Failed to get media stream:', error);
      if (!allowEmpty) {
        toast.error('Could not access camera/microphone. Please check permissions.');
      }
      return null;
    }
  }, []);

  // Initiate a call
  const startCall = useCallback(async (type: CallType) => {
    if (callState !== 'idle') return;

    console.log('[usePrivateCall] Starting call, type:', type);
    setCallType(type);
    setCallState('calling');

    const stream = await getMediaStream(type);
    if (!stream) {
      setCallState('idle');
      setCallType(null);
      return;
    }

    const pc = createPeerConnection();
    console.log('[usePrivateCall] Adding', stream.getTracks().length, 'tracks to peer connection');
    stream.getTracks().forEach(track => {
      console.log('[usePrivateCall] Adding track:', track.kind, track.label);
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

    // Timeout after 30 seconds
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

    console.log('[usePrivateCall] Answering call, type:', incomingCallType);

    // Allow empty stream so user can answer even without mic/camera
    const stream = await getMediaStream(incomingCallType, true);
    
    // Stream can be empty but should never be null with allowEmpty=true
    const pc = createPeerConnection();
    
    if (stream && stream.getTracks().length > 0) {
      console.log('[usePrivateCall] Adding', stream.getTracks().length, 'tracks to peer connection for answer');
      stream.getTracks().forEach(track => {
        console.log('[usePrivateCall] Adding track:', track.kind, track.label);
        pc.addTrack(track, stream);
      });
    } else {
      console.log('[usePrivateCall] No local tracks to add - receive-only mode');
    }

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

  // Handle signaling - IMPORTANT: minimal dependencies to avoid recreating channel
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    console.log('[usePrivateCall] Setting up call channel:', `call-${channelName}`);
    const channel = supabase.channel(`call-${channelName}`, {
      config: { broadcast: { self: false } }
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'call-request' }, async ({ payload }) => {
        console.log('[usePrivateCall] Received call-request:', payload);
        if (payload.to !== currentUserId) return;
        
        // Incoming call
        setIncomingCallType(payload.callType);
        setCallState('ringing');
        onIncomingCall?.(payload.callType);
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
        console.log('[usePrivateCall] Received call-answer:', payload);
        if (payload.to !== currentUserId) return;
        
        if (ringTimeoutRef.current) {
          clearTimeout(ringTimeoutRef.current);
          ringTimeoutRef.current = null;
        }

        if (payload.accepted) {
          // Call was accepted, create offer
          const pc = peerConnectionRef.current;
          if (pc) {
            console.log('[usePrivateCall] Creating WebRTC offer');
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              channel.send({
                type: 'broadcast',
                event: 'webrtc-offer',
                payload: {
                  from: currentUserId,
                  to: targetUserId,
                  offer: pc.localDescription,
                }
              });
              console.log('[usePrivateCall] Sent WebRTC offer');
            } catch (err) {
              console.error('[usePrivateCall] Error creating offer:', err);
            }
          } else {
            console.error('[usePrivateCall] No peer connection when call answered');
          }
          setCallState('connected');
          // Start timer for the caller
          if (!callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
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
        console.log('[usePrivateCall] Received call-end:', payload);
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
        console.log('[usePrivateCall] Received webrtc-offer:', payload);
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            console.log('[usePrivateCall] Setting remote description from offer');
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            
            console.log('[usePrivateCall] Creating answer');
            const answer = await pc.createAnswer();
            
            console.log('[usePrivateCall] Setting local description');
            await pc.setLocalDescription(answer);
            
            console.log('[usePrivateCall] Sending webrtc-answer');
            channel.send({
              type: 'broadcast',
              event: 'webrtc-answer',
              payload: {
                from: currentUserId,
                to: targetUserId,
                answer: pc.localDescription,
              }
            });
            
            // Start timer for the answerer
            if (!callTimerRef.current) {
              callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
              }, 1000);
            }
          } catch (err) {
            console.error('[usePrivateCall] Error handling offer:', err);
          }
        } else {
          console.error('[usePrivateCall] No peer connection when offer received');
        }
      })
      .on('broadcast', { event: 'webrtc-answer' }, async ({ payload }) => {
        console.log('[usePrivateCall] Received webrtc-answer:', payload);
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            console.log('[usePrivateCall] Setting remote description from answer');
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            console.log('[usePrivateCall] WebRTC connection established');
          } catch (err) {
            console.error('[usePrivateCall] Error setting remote description:', err);
          }
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (pc && payload.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.warn('[usePrivateCall] Error adding ICE candidate:', err);
          }
        }
      })
      .subscribe((status) => {
        console.log('[usePrivateCall] Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          channelSubscribedRef.current = true;
        }
      });

    return () => {
      channelSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUserId, channelName, targetUsername, cleanup, onIncomingCall]);

  // Handle pending incoming calls separately to avoid recreating channel
  useEffect(() => {
    if (pendingIncomingCall && callState === 'idle' && channelSubscribedRef.current) {
      console.log('[usePrivateCall] Processing pending call:', pendingIncomingCall.callType);
      setIncomingCallType(pendingIncomingCall.callType);
      setCallState('ringing');
      onClearPendingCall?.();
    }
  }, [pendingIncomingCall, callState, onClearPendingCall]);

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
