import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Cog } from 'lucide-react';

/**
 * Dieselpunk watermark - Steampunk gears and brass
 */
export const DieselpunkWatermark: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme !== 'dieselpunk') return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <div 
        className="text-center select-none relative"
        style={{ opacity: 0.08 }}
      >
        {/* Gear cluster */}
        <div className="flex justify-center items-center gap-[-20px] mb-4">
          <Cog 
            className="w-20 h-20 sm:w-24 sm:h-24"
            style={{
              color: 'hsl(45 80% 50%)',
              animation: 'spin 20s linear infinite',
            }}
          />
          <Cog 
            className="w-28 h-28 sm:w-36 sm:h-36 -ml-6"
            style={{
              color: 'hsl(45 80% 50%)',
              animation: 'spin 25s linear infinite reverse',
            }}
          />
          <Cog 
            className="w-20 h-20 sm:w-24 sm:h-24 -ml-6"
            style={{
              color: 'hsl(45 80% 50%)',
              animation: 'spin 20s linear infinite',
            }}
          />
        </div>
        
        {/* Brand name */}
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-wide"
          style={{
            color: 'hsl(45 80% 50%)',
            textShadow: '3px 3px 6px hsl(30 40% 10%)',
            fontFamily: 'serif',
          }}
        >
          JustAChat
        </div>
        
        {/* Steampunk tagline */}
        <div 
          className="text-xl sm:text-2xl font-bold mt-2 italic"
          style={{ 
            color: 'hsl(25 90% 45%)',
            fontFamily: 'serif',
          }}
        >
          ⚙ Est. MMXXVI ⚙
        </div>
      </div>
    </div>
  );
};
