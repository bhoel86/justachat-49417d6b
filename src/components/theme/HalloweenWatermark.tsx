import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Halloween watermark - Spooky pumpkin and lantern elements
 */
export const HalloweenWatermark: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme !== 'halloween') return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <div 
        className="text-center select-none"
        style={{ opacity: 0.08 }}
      >
        {/* Spooky icons */}
        <div className="flex justify-center items-center gap-4 mb-4">
          <span 
            className="text-5xl sm:text-6xl"
            style={{ filter: 'drop-shadow(0 0 20px hsl(25 90% 50% / 0.3))' }}
          >
            🎃
          </span>
          <span 
            className="text-7xl sm:text-8xl"
            style={{
              filter: 'drop-shadow(0 0 30px hsl(25 90% 50% / 0.4))',
            }}
          >
            🦇
          </span>
          <span 
            className="text-5xl sm:text-6xl"
            style={{ filter: 'drop-shadow(0 0 20px hsl(25 90% 50% / 0.3))' }}
          >
            🎃
          </span>
        </div>
        
        {/* Brand name */}
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-wide"
          style={{
            color: 'hsl(25 95% 55%)',
            textShadow: '3px 3px 6px hsl(350 40% 6%)',
          }}
        >
          JUSTACHAT
        </div>
        
        {/* Halloween tagline */}
        <div 
          className="text-xl sm:text-2xl font-bold mt-2 tracking-widest"
          style={{ color: 'hsl(35 100% 60%)' }}
        >
          👻 SPOOKY SEASON 👻
        </div>
      </div>
    </div>
  );
};
