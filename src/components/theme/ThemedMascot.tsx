import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Gift, Sparkles } from 'lucide-react';
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";
import retroMascotLeft from "@/assets/themes/retro-mascot-left.png";
import retroMascotRight from "@/assets/themes/retro-mascot-right.png";
import { StPatricksMascot } from './StPatricksMascot';
import { MatrixMascot } from './MatrixMascot';
import { usePngCutout } from "@/hooks/usePngCutout";

interface ThemedMascotProps {
  side: 'left' | 'right';
  className?: string;
}

export const ThemedMascot: React.FC<ThemedMascotProps> = ({ side, className = '' }) => {
  const { theme } = useTheme();
  
  // Cutout processing for retro mascots (strip white background)
  const retroLeftCutout = usePngCutout(theme === 'retro80s' && side === 'left' ? retroMascotLeft : undefined);
  const retroRightCutout = usePngCutout(theme === 'retro80s' && side === 'right' ? retroMascotRight : undefined);

  // For Matrix theme, show rabbit mascots
  if (theme === 'matrix') {
    return <MatrixMascot side={side} />;
  }

  // For JAC Modern theme, show the robot mascots
  if (theme === 'jac') {
    return (
      <img 
        src={side === 'left' ? mascotLeft : mascotRight} 
        alt="Mascot" 
        className={`h-14 sm:h-16 w-auto object-contain ${className}`}
      />
    );
  }

  // For 80s Retro theme, show Memphis-style boombox and VHS
  if (theme === 'retro80s') {
    const leftSrc = retroLeftCutout ?? retroMascotLeft;
    const rightSrc = retroRightCutout ?? retroMascotRight;
    
    return (
      <img 
        src={side === 'left' ? leftSrc : rightSrc} 
        alt={side === 'left' ? 'Retro Boombox' : 'Retro VHS Tape'} 
        className={`h-12 sm:h-14 w-auto object-contain ${className}`}
      />
    );
  }

  // For Valentine's theme, show heart-themed mascots
  if (theme === 'valentines') {
    return (
      <div className={`h-14 sm:h-16 flex items-center justify-center ${className}`}>
        <div className="relative">
          {side === 'left' ? (
            // Left side: Heart with arrow (Cupid's heart)
            <div className="flex flex-col items-center">
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[hsl(340,82%,52%)] to-[hsl(350,70%,45%)] border-2 border-[hsl(340,90%,70%)] flex items-center justify-center relative"
                style={{ 
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  boxShadow: '0 4px 20px hsl(340 82% 52% / 0.5)',
                  transform: 'rotate(-5deg)',
                }}
              >
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-[hsl(340,20%,95%)]" fill="currentColor" />
                {/* Cupid's arrow */}
                <div 
                  className="absolute w-14 h-0.5 bg-gradient-to-r from-[hsl(45,93%,60%)] via-[hsl(45,90%,70%)] to-[hsl(45,85%,80%)]"
                  style={{ 
                    transform: 'rotate(-35deg) translateX(3px)',
                    top: '50%',
                  }}
                >
                  {/* Arrow head */}
                  <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{
                      borderLeft: '6px solid hsl(45 93% 60%)',
                      borderTop: '3px solid transparent',
                      borderBottom: '3px solid transparent',
                    }}
                  />
                  {/* Arrow feathers */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-3 bg-[hsl(340,70%,75%)]"
                    style={{ borderRadius: '0 50% 50% 0' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Right side: Gift box with heart
            <div 
              className="w-12 h-14 sm:w-14 sm:h-16 bg-gradient-to-b from-[hsl(350,70%,55%)] to-[hsl(340,70%,45%)] border-2 border-[hsl(340,80%,70%)] relative"
              style={{ 
                boxShadow: '0 4px 20px hsl(340 70% 50% / 0.4)',
                borderRadius: '4px',
              }}
            >
              {/* Gift ribbon vertical */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 bg-[hsl(45,93%,60%)]" />
              {/* Gift ribbon horizontal */}
              <div className="absolute inset-x-0 top-1/3 h-2 bg-[hsl(45,93%,60%)]" />
              {/* Bow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="relative">
                  <div 
                    className="absolute w-4 h-3 bg-[hsl(45,93%,60%)] border border-[hsl(45,80%,50%)]"
                    style={{ 
                      borderRadius: '50% 0 50% 50%',
                      transform: 'rotate(-30deg) translateX(-6px)',
                    }}
                  />
                  <div 
                    className="absolute w-4 h-3 bg-[hsl(45,93%,60%)] border border-[hsl(45,80%,50%)]"
                    style={{ 
                      borderRadius: '0 50% 50% 50%',
                      transform: 'rotate(30deg) translateX(2px)',
                    }}
                  />
                  <div className="relative w-2 h-2 bg-[hsl(45,80%,50%)] rounded-full" />
                </div>
              </div>
              {/* Heart decoration on box */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <Heart className="w-4 h-4 text-[hsl(340,80%,85%)]" fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For St. Patrick's theme, show Irish-themed mascots
  if (theme === 'stpatricks') {
    return (
      <div className={`h-14 sm:h-16 flex items-center justify-center ${className}`}>
        <div className="relative">
          {side === 'left' ? (
            // Left side: Pot of Gold
            <div className="flex flex-col items-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <ellipse cx="24" cy="38" rx="16" ry="6" fill="hsl(0 0% 20%)" />
                <path d="M8 32c0 8 7 12 16 12s16-4 16-12V28H8v4z" fill="hsl(0 0% 25%)" />
                <ellipse cx="24" cy="28" rx="16" ry="5" fill="hsl(0 0% 30%)" />
                <circle cx="18" cy="26" r="4" fill="hsl(45 93% 50%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
                <circle cx="24" cy="24" r="4" fill="hsl(45 93% 55%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
                <circle cx="30" cy="26" r="4" fill="hsl(45 93% 50%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
                <circle cx="21" cy="22" r="3.5" fill="hsl(45 93% 52%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
                <circle cx="27" cy="22" r="3.5" fill="hsl(45 93% 52%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
              </svg>
            </div>
          ) : (
            // Right side: Leprechaun Hat
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="36" rx="20" ry="4" fill="hsl(142 50% 25%)" />
              <path d="M12 36c0 0 2-20 12-20s12 20 12 20" fill="hsl(142 60% 30%)" />
              <rect x="12" y="32" width="24" height="4" fill="hsl(142 50% 25%)" />
              <rect x="12" y="28" width="24" height="5" fill="hsl(0 0% 15%)" />
              <rect x="20" y="27" width="8" height="7" rx="1" fill="hsl(45 93% 50%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
              <rect x="22" y="29" width="4" height="3" fill="hsl(0 0% 15%)" />
            </svg>
          )}
        </div>
      </div>
    );
  }

  // For Jungle theme, show jungle animal mascots (muted/earthy tones)
  if (theme === 'jungle') {
    return (
      <div className={`h-14 sm:h-16 flex items-center justify-center opacity-70 ${className}`}>
        <div className="relative">
          {side === 'left' ? (
            // Left side: Toucan bird (muted)
            <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
              {/* Body */}
              <ellipse cx="26" cy="32" rx="12" ry="14" fill="hsl(30 15% 20%)" />
              {/* White chest */}
              <ellipse cx="26" cy="36" rx="7" ry="9" fill="hsl(40 20% 80%)" />
              {/* Head */}
              <circle cx="26" cy="18" r="10" fill="hsl(30 15% 20%)" />
              {/* Eye area */}
              <circle cx="30" cy="16" r="4" fill="hsl(45 15% 85%)" />
              {/* Eye */}
              <circle cx="31" cy="16" r="2" fill="hsl(30 30% 25%)" />
              <circle cx="31.5" cy="15.5" r="0.8" fill="hsl(45 15% 85%)" />
              {/* Beak (muted orange/brown) */}
              <path d="M34 18 Q50 15 48 22 Q46 28 34 24 Z" fill="hsl(30 45% 45%)" />
              <path d="M34 18 Q50 15 48 22" stroke="hsl(25 40% 35%)" strokeWidth="2" fill="none" />
              <path d="M36 20 Q44 18 43 22" fill="hsl(35 40% 50%)" />
              {/* Beak tip */}
              <circle cx="47" cy="21" r="2" fill="hsl(30 15% 20%)" />
              {/* Feet */}
              <path d="M22 44 L18 50 M24 44 L22 50 M26 44 L26 50" stroke="hsl(30 30% 35%)" strokeWidth="2" strokeLinecap="round" />
              <path d="M30 44 L30 50 M28 44 L26 50 M32 44 L34 50" stroke="hsl(30 30% 35%)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            // Right side: Monkey (muted)
            <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
              {/* Tail */}
              <path d="M38 35 Q48 30 46 20 Q44 12 38 15" stroke="hsl(25 30% 30%)" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Body */}
              <ellipse cx="26" cy="35" rx="10" ry="12" fill="hsl(25 30% 30%)" />
              {/* Belly */}
              <ellipse cx="26" cy="38" rx="6" ry="7" fill="hsl(30 25% 60%)" />
              {/* Head */}
              <circle cx="26" cy="18" r="11" fill="hsl(25 30% 30%)" />
              {/* Face */}
              <ellipse cx="26" cy="20" rx="8" ry="7" fill="hsl(30 25% 60%)" />
              {/* Ears */}
              <circle cx="14" cy="16" r="5" fill="hsl(25 30% 30%)" />
              <circle cx="14" cy="16" r="3" fill="hsl(30 25% 60%)" />
              <circle cx="38" cy="16" r="5" fill="hsl(25 30% 30%)" />
              <circle cx="38" cy="16" r="3" fill="hsl(30 25% 60%)" />
              {/* Eyes */}
              <circle cx="22" cy="17" r="3" fill="hsl(45 15% 85%)" />
              <circle cx="30" cy="17" r="3" fill="hsl(45 15% 85%)" />
              <circle cx="22" cy="17" r="1.5" fill="hsl(25 30% 15%)" />
              <circle cx="30" cy="17" r="1.5" fill="hsl(25 30% 15%)" />
              {/* Nose */}
              <ellipse cx="26" cy="22" rx="2" ry="1.5" fill="hsl(25 25% 25%)" />
              {/* Smile */}
              <path d="M22 25 Q26 28 30 25" stroke="hsl(25 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Arms */}
              <path d="M16 32 L10 38" stroke="hsl(25 30% 30%)" strokeWidth="4" strokeLinecap="round" />
              <path d="M36 32 L42 38" stroke="hsl(25 30% 30%)" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <img 
      src={side === 'left' ? mascotLeft : mascotRight} 
      alt="Mascot" 
      className={`h-14 sm:h-16 w-auto object-contain ${className}`}
    />
  );
};
