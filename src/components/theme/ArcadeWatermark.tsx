import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Gamepad2 } from 'lucide-react';

/**
 * Arcade watermark - Neon arcade elements
 */
export const ArcadeWatermark: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme !== 'arcade') return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <div 
        className="text-center select-none"
        style={{ opacity: 0.08 }}
      >
        {/* Arcade cabinet silhouette */}
        <div className="flex justify-center mb-4">
          <Gamepad2 
            className="w-32 h-32 sm:w-40 sm:h-40"
            style={{
              color: 'hsl(320 100% 60%)',
              filter: 'drop-shadow(0 0 30px hsl(320 100% 60% / 0.5))',
            }}
          />
        </div>
        
        {/* Brand name */}
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-wider"
          style={{
            color: 'hsl(320 100% 60%)',
            textShadow: '0 0 30px hsl(180 100% 50% / 0.5)',
          }}
        >
          JUSTACHAT
        </div>
        
        {/* Arcade tagline */}
        <div 
          className="font-mono text-xl sm:text-2xl font-bold mt-2 tracking-widest"
          style={{ color: 'hsl(180 100% 50%)' }}
        >
          ★ HIGH SCORE ★
        </div>
      </div>
    </div>
  );
};
