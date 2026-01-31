import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Gift, Sparkles } from 'lucide-react';
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";
import { StPatricksMascot } from './StPatricksMascot';
import { MatrixMascot } from './MatrixMascot';
import { VaporMascot } from './VaporMascot';

interface ThemedMascotProps {
  side: 'left' | 'right';
  className?: string;
}

export const ThemedMascot: React.FC<ThemedMascotProps> = ({ side, className = '' }) => {
  const { theme } = useTheme();
  
  console.log('[ThemedMascot] Current theme:', theme, 'Side:', side);

  // For Matrix theme, show rabbit mascots
  if (theme === 'matrix') {
    return <MatrixMascot side={side} />;
  }

  // For Vaporwave theme, show retro computer mascots
  if (theme === 'vapor') {
    return <VaporMascot side={side} className={className} />;
  }
  
  console.log('[ThemedMascot] Current theme:', theme, 'Side:', side);

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

  // For 80s Retro theme, show neon-styled retro computer icons
  if (theme === 'retro80s') {
    return (
      <div className={`h-14 sm:h-16 flex items-end justify-center ${className}`}>
        <div className="relative">
          {side === 'left' ? (
            // Left side: Neon CRT Monitor - with background
            <div 
              className="flex flex-col items-center mx-3 p-2 rounded-none"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                border: '2px solid #00FFFF',
                boxShadow: '0 0 12px rgba(34,211,238,0.4), 4px 4px 0 #000'
              }}
            >
              <div 
                className="w-10 h-8 sm:w-12 sm:h-10 bg-black/90 border-[2px] flex items-center justify-center relative"
                style={{ 
                  borderColor: '#00FFFF',
                  boxShadow: 'inset 0 0 8px rgba(34,211,238,0.3)'
                }}
              >
                {/* Screen with glow */}
                <div 
                  className="w-7 h-5 sm:w-9 sm:h-7 border flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'rgba(34,211,238,0.15)',
                    borderColor: '#00FFFF',
                    boxShadow: 'inset 0 0 6px rgba(34,211,238,0.4)'
                  }}
                >
                  <span 
                    className="text-[7px] sm:text-[9px] font-bold font-mono"
                    style={{ 
                      color: '#00FFFF',
                      textShadow: '0 0 6px #00FFFF'
                    }}
                  >
                    JAC
                  </span>
                </div>
                {/* Scan line effect */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.1) 2px, rgba(34,211,238,0.1) 4px)'
                  }}
                />
              </div>
              {/* Monitor stand */}
              <div 
                className="w-4 h-1.5 bg-black/90 border border-t-0"
                style={{ borderColor: '#FF00FF' }}
              />
              <div 
                className="w-6 h-1 bg-black/90 border border-t-0"
                style={{ borderColor: '#FF00FF' }}
              />
            </div>
          ) : (
            // Right side: Neon Floppy disk - sized to match PC height
            <div 
              className="p-2 mx-3 rounded-none"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                border: '2px solid #FF00FF',
                boxShadow: '0 0 12px rgba(255,0,255,0.4), 4px 4px 0 #000'
              }}
            >
              <div 
                className="w-9 h-10 sm:w-10 sm:h-11 bg-black/90 border-[2px] relative"
                style={{ 
                  borderColor: '#FF00FF',
                }}
              >
                {/* Metal slider with glow */}
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 sm:w-5 h-2 sm:h-2.5 border"
                  style={{ 
                    backgroundColor: 'rgba(34,211,238,0.3)',
                    borderColor: '#00FFFF',
                  }}
                />
                {/* Label area */}
                <div 
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-7 h-3.5 sm:h-4 border flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'rgba(57,255,20,0.15)',
                    borderColor: '#39FF14',
                  }}
                >
                  <span 
                    className="text-[5px] sm:text-[6px] font-bold font-mono"
                    style={{ 
                      color: '#39FF14',
                      textShadow: '0 0 4px #39FF14'
                    }}
                  >
                    3.5"
                  </span>
                </div>
                {/* Corner notch with glow */}
                <div 
                  className="absolute top-2.5 right-0.5 w-1 h-1 border border-r-0"
                  style={{ 
                    borderColor: '#FFFF00',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
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

  // Default fallback
  return (
    <img 
      src={side === 'left' ? mascotLeft : mascotRight} 
      alt="Mascot" 
      className={`h-14 sm:h-16 w-auto object-contain ${className}`}
    />
  );
};
