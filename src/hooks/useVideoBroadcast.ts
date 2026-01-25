import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoParticipant {
  odious: string;
  username: string;
  avatarUrl?: string | null;
  isBroadcasting: boolean;
  stream?: MediaStream;
}

interface UseVideoBroadcastOptions {
  roomId: string;
  odious: string;
  username: string;
  avatarUrl?: string | null;
}

export const useVideoBroadcast = ({ roomId, odious, username, avatarUrl }: UseVideoBroadcastOptions) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [participants, setParticipants] = useState<VideoParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ICE servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Clean up peer connection
  const cleanupPeer = useCallback((odPeerId: string) => {
    const pc = peerConnectionsRef.current.get(odPeerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(odPeerId);
    }
    remoteStreamsRef.current.delete(odPeerId);
  }, []);

  // Get remote stream for a participant
  const getRemoteStream = useCallback((odPeerId: string): MediaStream | undefined => {
    return remoteStreamsRef.current.get(odPeerId);
  }, []);

  // Create peer connection for a participant
  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'video-ice-candidate',
          payload: {
            from: odious,
            to: remoteUserId,
            candidate: event.candidate.toJSON()
          }
        });
      }
    };

    pc.ontrack = (event) => {
      // Store incoming video stream
      const remoteStream = event.streams[0];
      remoteStreamsRef.current.set(remoteUserId, remoteStream);
      
      // Update participants to trigger re-render
      setParticipants(prev => prev.map(p => 
        p.odious === remoteUserId 
          ? { ...p, stream: remoteStream }
          : p
      ));
    };

    // Add local stream if broadcasting
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }, [odious]);

  // Audio level monitoring
  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        setAudioLevel(normalizedLevel);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (e) {
      console.error('Failed to start audio monitoring:', e);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Start broadcasting
  const startBroadcast = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true 
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Start audio level monitoring
      startAudioMonitoring(stream);
      
      // Add tracks to existing peer connections
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });

      setIsBroadcasting(true);
      
      // Update presence to show broadcasting (use refs for latest values)
      if (channelRef.current) {
        channelRef.current.track({ 
          odious, 
          username: usernameRef.current, 
          avatarUrl: avatarUrlRef.current, 
          isBroadcasting: true 
        });
      }
      
      toast.success('📹 Video broadcasting live!');
    } catch (error) {
      console.error('Failed to start video broadcast:', error);
      toast.error('Could not access camera/microphone');
    }
  }, [odious, startAudioMonitoring]);

  // Stop broadcasting
  const stopBroadcast = useCallback(() => {
    // Stop audio monitoring
    stopAudioMonitoring();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    setIsBroadcasting(false);
    
    // Update presence (use refs for latest values)
    if (channelRef.current) {
      channelRef.current.track({ 
        odious, 
        username: usernameRef.current, 
        avatarUrl: avatarUrlRef.current, 
        isBroadcasting: false 
      });
    }
    
    toast.info('Video broadcast stopped');
  }, [odious, stopAudioMonitoring]);

  // Toggle broadcast
  const toggleBroadcast = useCallback(() => {
    if (isBroadcasting) {
      stopBroadcast();
    } else {
      startBroadcast();
    }
  }, [isBroadcasting, startBroadcast, stopBroadcast]);

  // Handle signaling messages
  const handleSignaling = useCallback(async (payload: any) => {
    const { type, from, to, offer, answer, candidate } = payload;
    
    if (to !== odious) return;
    
    let pc = peerConnectionsRef.current.get(from);
    
    if (type === 'offer') {
      if (!pc) {
        pc = createPeerConnection(from);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answerDesc = await pc.createAnswer();
      await pc.setLocalDescription(answerDesc);
      
      channelRef.current?.send({
        type: 'broadcast',
        event: 'video-answer',
        payload: { from: odious, to: from, answer: answerDesc }
      });
    } else if (type === 'answer' && pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } else if (type === 'ice-candidate' && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, [odious, createPeerConnection]);

  // Store latest values in refs to avoid effect re-runs
  const usernameRef = useRef(username);
  const avatarUrlRef = useRef(avatarUrl);
  const isBroadcastingRef = useRef(isBroadcasting);
  
  useEffect(() => {
    usernameRef.current = username;
    avatarUrlRef.current = avatarUrl;
  }, [username, avatarUrl]);
  
  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);

  // Connect to the video room - only depends on roomId and odious
  useEffect(() => {
    if (!roomId || !odious) return;

    const channel = supabase.channel(`video:${roomId}`, {
      config: { presence: { key: odious } }
    });
    
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const participantList: VideoParticipant[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence) {
            participantList.push({
              odious: key,
              username: presence.username || 'Anonymous',
              avatarUrl: presence.avatarUrl,
              isBroadcasting: presence.isBroadcasting || false,
              stream: remoteStreamsRef.current.get(key)
            });
          }
        });
        
        setParticipants(participantList);
      })
      .on('presence', { event: 'join' }, async ({ key }) => {
        if (key === odious) return;
        
        // Create offer for new participant if we're broadcasting
        if (isBroadcastingRef.current && localStreamRef.current) {
          const pc = createPeerConnection(key);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          channel.send({
            type: 'broadcast',
            event: 'video-offer',
            payload: { from: odious, to: key, offer }
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        cleanupPeer(key);
      })
      .on('broadcast', { event: 'video-offer' }, ({ payload }) => handleSignaling({ type: 'offer', ...payload }))
      .on('broadcast', { event: 'video-answer' }, ({ payload }) => handleSignaling({ type: 'answer', ...payload }))
      .on('broadcast', { event: 'video-ice-candidate' }, ({ payload }) => handleSignaling({ type: 'ice-candidate', ...payload }))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({ 
            odious, 
            username: usernameRef.current, 
            avatarUrl: avatarUrlRef.current, 
            isBroadcasting: false 
          });
        }
      });

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      supabase.removeChannel(channel);
    };
  }, [roomId, odious, createPeerConnection, cleanupPeer, handleSignaling]);

  return {
    isBroadcasting,
    isConnected,
    participants,
    localStream,
    audioLevel,
    toggleBroadcast,
    startBroadcast,
    stopBroadcast,
    getRemoteStream
  };
};
