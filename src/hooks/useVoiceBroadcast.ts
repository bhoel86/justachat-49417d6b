import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceParticipant {
  odious: string;
  username: string;
  avatarUrl?: string | null;
  isBroadcasting: boolean;
}

interface UseVoiceBroadcastOptions {
  roomId: string;
  odious: string;
  username: string;
  avatarUrl?: string | null;
}

export const useVoiceBroadcast = ({ roomId, odious, username, avatarUrl }: UseVoiceBroadcastOptions) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

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
  }, []);

  // Create peer connection for a participant
  const createPeerConnection = useCallback((remoteUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: odious,
            to: remoteUserId,
            candidate: event.candidate.toJSON()
          }
        });
      }
    };

    pc.ontrack = (event) => {
      // Play incoming audio
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.play().catch(console.error);
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

  // Start broadcasting
  const startBroadcast = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Add tracks to existing peer connections
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });

      setIsBroadcasting(true);
      
      // Update presence to show broadcasting
      if (channelRef.current) {
        channelRef.current.track({ odious, username, avatarUrl, isBroadcasting: true });
      }
      
      toast.success('🎤 Broadcasting live!');
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      toast.error('Could not access microphone');
    }
  }, [odious, username, avatarUrl]);

  // Stop broadcasting
  const stopBroadcast = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    setIsBroadcasting(false);
    
    // Update presence
    if (channelRef.current) {
      channelRef.current.track({ odious, username, avatarUrl, isBroadcasting: false });
    }
    
    toast.info('Broadcast stopped');
  }, [odious, username, avatarUrl]);

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
        event: 'answer',
        payload: { from: odious, to: from, answer: answerDesc }
      });
    } else if (type === 'answer' && pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } else if (type === 'ice-candidate' && pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, [odious, createPeerConnection]);

  // Connect to the voice room
  useEffect(() => {
    if (!roomId || !odious) return;

    const channel = supabase.channel(`voice:${roomId}`, {
      config: { presence: { key: odious } }
    });
    
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const participantList: VoiceParticipant[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0] as any;
          if (presence) {
            participantList.push({
              odious: key,
              username: presence.username || 'Anonymous',
              avatarUrl: presence.avatarUrl,
              isBroadcasting: presence.isBroadcasting || false
            });
          }
        });
        
        setParticipants(participantList);
      })
      .on('presence', { event: 'join' }, async ({ key }) => {
        if (key === odious) return;
        
        // Create offer for new participant if we're broadcasting
        if (isBroadcasting) {
          const pc = createPeerConnection(key);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: { from: odious, to: key, offer }
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        cleanupPeer(key);
      })
      .on('broadcast', { event: 'offer' }, ({ payload }) => handleSignaling({ type: 'offer', ...payload }))
      .on('broadcast', { event: 'answer' }, ({ payload }) => handleSignaling({ type: 'answer', ...payload }))
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => handleSignaling({ type: 'ice-candidate', ...payload }))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({ odious, username, avatarUrl, isBroadcasting: false });
        }
      });

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      supabase.removeChannel(channel);
    };
  }, [roomId, odious, username, avatarUrl]);

  return {
    isBroadcasting,
    isConnected,
    participants,
    toggleBroadcast,
    startBroadcast,
    stopBroadcast
  };
};
