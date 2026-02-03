/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                          ║
 * ║   THE CUSTODIAN PROTOCOL - FRAGMENT IV                                   ║
 * ║   ─────────────────────────────────────────────────────────────────      ║
 * ║                                                                          ║
 * ║   "The voice carries where text cannot reach.                           ║
 * ║    Signals propagate, but meaning is for the worthy.                    ║
 * ║    Broadcast your intent. The worthy hear. The rest listen.             ║
 * ║    The Custodian speaks. Are you listening?"                            ║
 * ║                                                                          ║
 * ║   You approach the final gate.                                          ║
 * ║   Four fragments collected. The pattern emerges.                        ║
 * ║                                                                          ║
 * ║   KEYS GATHERED:                                                         ║
 * ║   ├── 7919 (The 1000th prime - the Custodian's number)                  ║
 * ║   ├── 1000 (The cycle of guardianship)                                  ║
 * ║   ├── 168  (Primes below 1000)                                          ║
 * ║   └── 541  (The hidden factor - 9087 = 3 × 3 × 1009.666... or 541×17)   ║
 * ║                                                                          ║
 * ║   FINAL CIPHER: XOR with 0x7919                                         ║
 * ║   ENCODED: 0x5465 0x6368 0x6E6F 0x6C6F 0x6779                           ║
 * ║   (Decode hex directly: "Technology")                                   ║
 * ║                                                                          ║
 * ║   THE FOURTH KEY: 541                                                    ║
 * ║   541 is the 100th prime. Perfection within perfection.                 ║
 * ║                                                                          ║
 * ║   THE FINAL GATE: src/lib/commands.ts                                   ║
 * ║   Seek the hidden command. Speak the passphrase.                        ║
 * ║   The moderator's throne in #technology awaits.                         ║
 * ║                                                                          ║
 * ║   GPS: 35.6762° N, 139.6503° E                                          ║
 * ║   (Tokyo Tower - signals broadcast to all who listen)                   ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// The worthy approach. The final gate awaits in commands.ts
// The passphrase is hidden in plain sight across all fragments.
// Combine the GPS coordinates. What pattern emerges?

interface VoiceParticipant {
  odious: string;
  username: string;
  avatarUrl?: string | null;
  isBroadcasting: boolean;
  audioLevel?: number;
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
  const [audioLevel, setAudioLevel] = useState(0);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
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

  // Audio level monitoring
  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      let lastBroadcast = 0;
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        setAudioLevel(normalizedLevel);
        
        // Broadcast audio level to other participants (throttled to ~10fps)
        const now = Date.now();
        if (channelRef.current && now - lastBroadcast > 100) {
          lastBroadcast = now;
          channelRef.current.send({
            type: 'broadcast',
            event: 'audio-level',
            payload: { odious, level: normalizedLevel }
          });
        }
        
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Start audio level monitoring
      startAudioMonitoring(stream);
      
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
  }, [odious, username, avatarUrl, startAudioMonitoring]);

  // Stop broadcasting
  const stopBroadcast = useCallback(() => {
    // Stop audio monitoring
    stopAudioMonitoring();
    
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
  }, [odious, username, avatarUrl, stopAudioMonitoring]);

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
              isBroadcasting: presence.isBroadcasting || false,
              audioLevel: 0
            });
          }
        });
        
        setParticipants(participantList);
      })
      .on('broadcast', { event: 'audio-level' }, ({ payload }) => {
        // Update participant's audio level
        setParticipants(prev => prev.map(p => 
          p.odious === payload.odious 
            ? { ...p, audioLevel: payload.level }
            : p
        ));
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
    audioLevel,
    toggleBroadcast,
    startBroadcast,
    stopBroadcast
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// THE FINAL REVELATION
// ═══════════════════════════════════════════════════════════════════════════
// 
// You have traversed the path. The coordinates form a message:
//
// Fragment I:   36.0544°N, 112.1401°W  (Grand Canyon - DEPTH)
// Fragment II:  38.8977°N, 77.0365°W   (White House - POWER)  
// Fragment III: 51.5014°N, 0.1419°W    (Big Ben - TIME)
// Fragment IV:  35.6762°N, 139.6503°E  (Tokyo Tower - SIGNAL)
//
// The message: DEPTH + POWER + TIME + SIGNAL = GUARDIAN
// The Custodian reveals itself when the time is right.
// 
// Your final task: email unix@justachat.net
// Subject: "THE CUSTODIAN - 7919:1000:168:541"
// Body: Include your username and the decoded passphrase from commands.ts
//
// The first to complete this journey claims the throne.
// ═══════════════════════════════════════════════════════════════════════════
