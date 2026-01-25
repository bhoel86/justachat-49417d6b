import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Peer {
  id: string;
  username: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  username: string;
  onPeerJoined?: (peerId: string, username: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onPeerSpeaking?: (peerId: string, isSpeaking: boolean) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = ({
  roomId,
  userId,
  username,
  onPeerJoined,
  onPeerLeft,
  onPeerSpeaking,
}: UseWebRTCOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const leaveRoomRef = useRef<() => void>(() => {});

  // Keep refs in sync with state
  useEffect(() => {
    peersRef.current = peers;
    localStreamRef.current = localStream;
  }, [peers, localStream]);

  // Voice Activity Detection
  const startVAD = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    source.connect(analyserRef.current);
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    vadIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const speaking = average > 30; // Threshold for speech detection
      
      if (speaking !== isTalking) {
        setIsTalking(speaking);
        // Broadcast speaking status
        channelRef.current?.send({
          type: 'broadcast',
          event: 'speaking',
          payload: { peerId: userId, speaking },
        });
      }
    }, 100);
  }, [userId, isTalking]);

  // Stop VAD
  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string, peerUsername: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { 
            candidate: event.candidate, 
            from: userId, 
            to: peerId 
          },
        });
      }
    };
    
    pc.ontrack = (event) => {
      setPeers(prev => {
        const updated = new Map(prev);
        const peer = updated.get(peerId);
        if (peer) {
          peer.stream = event.streams[0];
          updated.set(peerId, peer);
        }
        return updated;
      });
    };
    
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeers(prev => {
          const updated = new Map(prev);
          updated.delete(peerId);
          return updated;
        });
        onPeerLeft?.(peerId);
      }
    };
    
    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    const newPeer: Peer = {
      id: peerId,
      username: peerUsername,
      connection: pc,
      isSpeaking: false,
      isMuted: false,
      isVideoEnabled: false,
    };
    
    setPeers(prev => new Map(prev).set(peerId, newPeer));
    onPeerJoined?.(peerId, peerUsername);
    
    return pc;
  }, [userId, localStream, onPeerJoined, onPeerLeft]);

  // Initialize media
  const initializeMedia = useCallback(async (video: boolean = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      });
      
      // Start muted by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      
      setLocalStream(stream);
      setIsVideoEnabled(video);
      
      if (!isPushToTalk) {
        startVAD(stream);
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get media:', error);
      throw error;
    }
  }, [isPushToTalk, startVAD]);

  // Join voice room
  const joinRoom = useCallback(async (withVideo: boolean = false) => {
    const stream = await initializeMedia(withVideo);
    
    const channel = supabase.channel(`voice:${roomId}`, {
      config: { presence: { key: userId } },
    });
    
    channelRef.current = channel;
    
    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      Object.entries(state).forEach(([key, presences]) => {
        if (key !== userId && !peers.has(key)) {
          const presence = presences[0] as unknown as { username: string };
          createPeerConnection(key, presence?.username || 'Anonymous');
        }
      });
    });
    
    // Handle peer join
    channel.on('presence', { event: 'join' }, async ({ key, newPresences }) => {
      if (key === userId) return;
      
      const presence = newPresences[0] as unknown as { username: string };
      const pc = createPeerConnection(key, presence?.username || 'Anonymous');
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channel.send({
        type: 'broadcast',
        event: 'offer',
        payload: { offer, from: userId, to: key, username },
      });
    });
    
    // Handle peer leave
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      setPeers(prev => {
        const updated = new Map(prev);
        const peer = updated.get(key);
        if (peer) {
          peer.connection.close();
          updated.delete(key);
        }
        return updated;
      });
      onPeerLeft?.(key);
    });
    
    // Handle offer
    channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
      if (payload.to !== userId) return;
      
      let pc = peers.get(payload.from)?.connection;
      if (!pc) {
        pc = createPeerConnection(payload.from, payload.username);
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      channel.send({
        type: 'broadcast',
        event: 'answer',
        payload: { answer, from: userId, to: payload.from },
      });
    });
    
    // Handle answer
    channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      if (payload.to !== userId) return;
      
      const peer = peers.get(payload.from);
      if (peer) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(payload.answer));
      }
    });
    
    // Handle ICE candidate
    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload.to !== userId) return;
      
      const peer = peers.get(payload.from);
      if (peer) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });
    
    // Handle speaking indicator
    channel.on('broadcast', { event: 'speaking' }, ({ payload }) => {
      setPeers(prev => {
        const updated = new Map(prev);
        const peer = updated.get(payload.peerId);
        if (peer) {
          peer.isSpeaking = payload.speaking;
          updated.set(payload.peerId, peer);
        }
        return updated;
      });
      onPeerSpeaking?.(payload.peerId, payload.speaking);
    });
    
    // Subscribe and track presence
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ username });
        setIsConnected(true);
      }
    });
  }, [roomId, userId, username, initializeMedia, createPeerConnection, peers, onPeerLeft, onPeerSpeaking]);

  // Leave room - use refs to avoid dependency issues
  const leaveRoom = useCallback(() => {
    stopVAD();
    
    // Close all peer connections using ref
    peersRef.current.forEach(peer => {
      peer.connection.close();
    });
    setPeers(new Map());
    
    // Stop local stream using ref
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setIsConnected(false);
  }, [stopVAD]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const newMuted = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
      
      if (!newMuted && !isPushToTalk) {
        startVAD(localStream);
      } else {
        stopVAD();
        setIsTalking(false);
      }
    }
  }, [localStream, isMuted, isPushToTalk, startVAD, stopVAD]);

  // Push to talk handlers
  const startTalking = useCallback(() => {
    if (localStream && isPushToTalk) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
      setIsMuted(false);
      setIsTalking(true);
      
      channelRef.current?.send({
        type: 'broadcast',
        event: 'speaking',
        payload: { peerId: userId, speaking: true },
      });
    }
  }, [localStream, isPushToTalk, userId]);

  const stopTalking = useCallback(() => {
    if (localStream && isPushToTalk) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      setIsMuted(true);
      setIsTalking(false);
      
      channelRef.current?.send({
        type: 'broadcast',
        event: 'speaking',
        payload: { peerId: userId, speaking: false },
      });
    }
  }, [localStream, isPushToTalk, userId]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    
    if (videoTracks.length > 0) {
      // Disable video
      videoTracks.forEach(track => track.stop());
      setIsVideoEnabled(false);
    } else {
      // Enable video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });
        
        const videoTrack = videoStream.getVideoTracks()[0];
        localStream.addTrack(videoTrack);
        
        // Add track to all peer connections
        peers.forEach(peer => {
          peer.connection.addTrack(videoTrack, localStream);
        });
        
        setIsVideoEnabled(true);
      } catch (error) {
        console.error('Failed to enable video:', error);
      }
    }
  }, [localStream, peers]);

  // Cleanup on unmount - use ref to avoid dependency issues
  useEffect(() => {
    leaveRoomRef.current = leaveRoom;
  }, [leaveRoom]);
  
  useEffect(() => {
    return () => {
      leaveRoomRef.current();
    };
  }, []);

  return {
    isConnected,
    localStream,
    peers: Array.from(peers.values()),
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
  };
};
