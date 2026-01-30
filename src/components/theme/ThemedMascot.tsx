import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Monitor, Save } from 'lucide-react';
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";

interface ThemedMascotProps {
  side: 'left' | 'right';
  className?: string;
}

export const ThemedMascot: React.FC<ThemedMascotProps> = ({ side, className = '' }) => {
  const { theme } = useTheme();

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

  // Default fallback
  return (
    <img 
      src={side === 'left' ? mascotLeft : mascotRight} 
      alt="Mascot" 
      className={`h-14 sm:h-16 w-auto object-contain ${className}`}
    />
  );
};
