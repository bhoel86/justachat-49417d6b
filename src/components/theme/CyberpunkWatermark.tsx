import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Wifi } from 'lucide-react';

/**
 * Cyberpunk watermark - Neon tech elements
 */
export const CyberpunkWatermark: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme !== 'cyberpunk') return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <div 
        className="text-center select-none"
        style={{ opacity: 0.06 }}
      >
        {/* Tech icon */}
        <div className="flex justify-center mb-4">
          <Wifi 
            className="w-28 h-28 sm:w-36 sm:h-36"
            style={{
              color: 'hsl(200 100% 55%)',
              filter: 'drop-shadow(0 0 40px hsl(200 100% 55% / 0.5))',
            }}
          />
        </div>
        
        {/* Brand name with glitch effect */}
        <div 
          className="font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-widest"
          style={{
            color: 'hsl(200 100% 55%)',
            textShadow: '0 0 30px hsl(200 100% 55%), 3px 0 0 hsl(280 100% 65% / 0.3), -3px 0 0 hsl(200 100% 55% / 0.3)',
          }}
        >
          JUSTACHAT
        </div>
        
        {/* Cyber tagline */}
        <div 
          className="font-mono text-lg sm:text-xl font-bold mt-2 tracking-widest"
          style={{ color: 'hsl(280 100% 65%)' }}
        >
          [SYSTEM_ONLINE]
        </div>
      </div>
    </div>
  );
};
