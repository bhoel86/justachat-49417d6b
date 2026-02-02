import { useEffect, useState, useRef } from 'react';
import { PillChoice } from '@/hooks/useSimulationPill';
import redPillChoiceImg from '@/assets/matrix/red-pill-choice.png';
import bluePillChoiceImg from '@/assets/matrix/blue-pill-choice.png';

interface PillTransitionOverlayProps {
  pill: PillChoice;
  show: boolean;
  onComplete?: () => void;
}

/**
 * Atmospheric pill transition overlay shown when login is initiated
 * Shows at reduced opacity for lore/mystery effect
 */
export const PillTransitionOverlay = ({ pill, show, onComplete }: PillTransitionOverlayProps) => {
  const [fading, setFading] = useState(false);
  const hasStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  
  // Keep onComplete ref updated
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (show && pill && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setFading(false);
      
      // Start fading after 2 seconds
      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 2000);
      
      // Complete after fade animation (2.5s total)
      const completeTimer = setTimeout(() => {
        onCompleteRef.current?.();
      }, 2500);
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(completeTimer);
      };
    }
    
    // Reset when show becomes false
    if (!show) {
      hasStartedRef.current = false;
      setFading(false);
    }
  }, [show, pill]);

  // Render immediately when show is true - no internal state delay
  if (!show || !pill) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{
        animation: fading ? 'pillOverlayFadeOut 0.5s ease-out forwards' : 'pillOverlayFadeIn 0.3s ease-out forwards',
      }}
    >
      {/* Dark vignette background */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Pill choice image at reduced opacity */}
      <img
        src={pill === 'red' ? redPillChoiceImg : bluePillChoiceImg}
        alt={pill === 'red' ? 'Red pill chosen' : 'Blue pill chosen'}
        className="w-full h-full object-cover"
        style={{
          opacity: 0.4,
          filter: 'saturate(1.2) contrast(1.1)',
        }}
      />
      
      {/* CRT scanline effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)'
        }}
      />
      
      {/* Subtle text hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <p 
          className={`font-mono text-sm tracking-widest animate-pulse ${
            pill === 'red' ? 'text-red-400/60' : 'text-blue-400/60'
          }`}
        >
          {pill === 'red' ? 'THE REAL WORLD AWAITS...' : 'RETURNING TO THE SIMULATION...'}
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes pillOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pillOverlayFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
