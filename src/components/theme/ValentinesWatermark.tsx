import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart } from 'lucide-react';

export const ValentinesWatermark: React.FC = () => {
  const { theme } = useTheme();

  // Only show valentines watermark for valentines theme
  if (theme !== 'valentines') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* Large heart watermark */}
      <div 
        className="text-center select-none"
        style={{ opacity: 0.08 }}
      >
        <Heart 
          className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 text-pink-500 mx-auto"
          fill="currentColor"
          strokeWidth={1}
        />
        <div 
          className="font-bold text-xl sm:text-2xl md:text-3xl tracking-wider text-pink-500 mt-2"
          style={{
            fontFamily: 'var(--theme-font-heading)',
          }}
        >
          JUSTACHAT
        </div>
        <div className="text-pink-400 text-sm sm:text-base tracking-widest">
          ♥ VALENTINE'S ♥
        </div>
      </div>
    </div>
  );
};
