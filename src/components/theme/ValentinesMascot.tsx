/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Gift } from 'lucide-react';
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";

interface ValentinesMascotProps {
  side: 'left' | 'right';
  className?: string;
}

export const ValentinesMascot: React.FC<ValentinesMascotProps> = ({ side, className = '' }) => {
  const { theme } = useTheme();
  
  // For non-valentines themes, don't render (let ThemedMascot handle it)
  if (theme !== 'valentines') {
    return null;
  }

  return (
    <div className={`h-14 sm:h-16 flex items-center justify-center ${className}`}>
      <div className="relative">
        {side === 'left' ? (
          // Left side: Heart with arrow (Cupid's heart)
          <div className="flex flex-col items-center">
            <div 
              className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-rose-600 border-2 border-pink-300 flex items-center justify-center relative"
              style={{ 
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.5)',
                transform: 'rotate(-5deg)',
              }}
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" />
              {/* Cupid's arrow */}
              <div 
                className="absolute w-14 h-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200"
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
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-3 bg-pink-300"
                  style={{ borderRadius: '0 50% 50% 0' }}
                />
              </div>
            </div>
          </div>
        ) : (
          // Right side: Gift box with heart
          <div 
            className="w-12 h-14 sm:w-14 sm:h-16 bg-gradient-to-b from-rose-400 to-rose-600 border-2 border-pink-300 relative"
            style={{ 
              boxShadow: '0 4px 20px rgba(244, 63, 94, 0.4)',
              borderRadius: '4px',
            }}
          >
            {/* Gift ribbon vertical */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 bg-amber-400" />
            {/* Gift ribbon horizontal */}
            <div className="absolute inset-x-0 top-1/3 h-2 bg-amber-400" />
            {/* Bow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="relative">
                <div 
                  className="absolute w-4 h-3 bg-amber-400 border border-amber-500"
                  style={{ 
                    borderRadius: '50% 0 50% 50%',
                    transform: 'rotate(-30deg) translateX(-6px)',
                  }}
                />
                <div 
                  className="absolute w-4 h-3 bg-amber-400 border border-amber-500"
                  style={{ 
                    borderRadius: '0 50% 50% 50%',
                    transform: 'rotate(30deg) translateX(2px)',
                  }}
                />
                <div className="relative w-2 h-2 bg-amber-500 rounded-full" />
              </div>
            </div>
            {/* Heart decoration on box */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <Heart className="w-4 h-4 text-pink-200" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
