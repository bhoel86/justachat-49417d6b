import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Gift, Sparkles } from 'lucide-react';
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";
import { StPatricksMascot } from './StPatricksMascot';
import { MatrixMascot } from './MatrixMascot';

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

  // For 80s Retro theme, show retro computer icons
  if (theme === 'retro80s') {
    return (
      <div className={`h-14 sm:h-16 flex items-center justify-center ${className}`}>
        <div className="relative">
          {side === 'left' ? (
            // Left side: Old CRT Monitor
            <div className="flex flex-col items-center">
              <div className="w-12 h-10 sm:w-14 sm:h-12 bg-[hsl(50,80%,70%)] border-[3px] border-black flex items-center justify-center relative"
                style={{ boxShadow: '3px 3px 0px black' }}>
                {/* Screen */}
                <div className="w-8 h-6 sm:w-10 sm:h-8 bg-[hsl(175,70%,50%)] border-2 border-black flex items-center justify-center">
                  <span className="text-[8px] sm:text-[10px] font-bold text-black font-mono">JAC</span>
                </div>
              </div>
              {/* Monitor stand */}
              <div className="w-6 h-2 bg-[hsl(50,80%,70%)] border-2 border-t-0 border-black" />
              <div className="w-8 h-1 bg-[hsl(50,80%,70%)] border-2 border-t-0 border-black" />
            </div>
          ) : (
            // Right side: Floppy disk
            <div className="w-12 h-14 sm:w-14 sm:h-16 bg-[hsl(270,50%,65%)] border-[3px] border-black relative"
              style={{ boxShadow: '3px 3px 0px black' }}>
              {/* Metal slider */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-7 h-3 sm:h-4 bg-gray-400 border-2 border-black" />
              {/* Label area */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-5 sm:h-6 bg-white border-2 border-black flex items-center justify-center">
                <span className="text-[6px] sm:text-[8px] font-bold text-black font-mono">3.5"</span>
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
