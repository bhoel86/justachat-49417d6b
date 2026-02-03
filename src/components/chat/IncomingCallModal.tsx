/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallType } from '@/hooks/usePrivateCall';
import { useEffect, useRef } from 'react';

interface IncomingCallModalProps {
  callerUsername: string;
  callType: CallType;
  onAnswer: () => void;
  onReject: () => void;
}

const IncomingCallModal = ({
  callerUsername,
  callType,
  onAnswer,
  onReject,
}: IncomingCallModalProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone
  useEffect(() => {
    // Create ringtone using Web Audio API
    const audioContext = new AudioContext();
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let isPlaying = true;

    const playRing = () => {
      if (!isPlaying) return;

      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      
      // Ring pattern: 400ms on, 200ms off, 400ms on, 1000ms off
      setTimeout(() => {
        oscillator?.stop();
        setTimeout(() => {
          if (isPlaying) {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 440;
            osc2.type = 'sine';
            gain2.gain.value = 0.1;
            osc2.start();
            setTimeout(() => {
              osc2.stop();
              setTimeout(playRing, 1000);
            }, 400);
          }
        }, 200);
      }, 400);
    };

    playRing();

    return () => {
      isPlaying = false;
      oscillator?.stop();
      audioContext.close();
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl overflow-hidden">
      {/* Pulsing avatar */}
      <div className="relative mb-4">
        <div className="absolute inset-0 h-20 w-20 rounded-full bg-primary/30 animate-ping" />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
          {callerUsername.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Caller info */}
      <p className="font-semibold text-foreground text-lg">{callerUsername}</p>
      <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
        {callType === 'video' ? (
          <Video className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
        <span className="text-sm">
          Incoming {callType} call...
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-6 mt-8">
        {/* Reject */}
        <Button
          variant="destructive"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={onReject}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>

        {/* Accept */}
        <Button
          variant="jac"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={onAnswer}
        >
          {callType === 'video' ? (
            <Video className="h-6 w-6" />
          ) : (
            <Phone className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default IncomingCallModal;
