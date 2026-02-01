import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Compass, TreePine } from 'lucide-react';

/**
 * Jungle watermark - Explorer and nature elements
 */
export const JungleWatermark: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme !== 'jungle') return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <div 
        className="text-center select-none"
        style={{ opacity: 0.08 }}
      >
        {/* Explorer icons */}
        <div className="flex justify-center items-center gap-4 mb-4">
          <TreePine 
            className="w-16 h-16 sm:w-20 sm:h-20"
            style={{ color: 'hsl(100 60% 40%)' }}
          />
          <Compass 
            className="w-24 h-24 sm:w-32 sm:h-32"
            style={{
              color: 'hsl(35 90% 50%)',
              filter: 'drop-shadow(0 0 20px hsl(35 90% 50% / 0.4))',
            }}
          />
          <TreePine 
            className="w-16 h-16 sm:w-20 sm:h-20 scale-x-[-1]"
            style={{ color: 'hsl(100 60% 40%)' }}
          />
        </div>
        
        {/* Brand name */}
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-wide"
          style={{
            color: 'hsl(35 90% 50%)',
            textShadow: '3px 3px 6px hsl(120 30% 8%)',
          }}
        >
          JUSTACHAT
        </div>
        
        {/* Adventure tagline */}
        <div 
          className="text-xl sm:text-2xl font-bold mt-2 tracking-widest"
          style={{ color: 'hsl(100 60% 40%)' }}
        >
          🌿 EXPLORE THE UNKNOWN 🌿
        </div>
      </div>
    </div>
  );
};
