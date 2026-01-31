import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart } from 'lucide-react';

export const ValentinesWatermark: React.FC = () => {
  const { theme } = useTheme();

  if (theme !== 'valentines') {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* Romantic styled watermark */}
      <div 
        className="text-center select-none"
        style={{ opacity: 0.08 }}
      >
        {/* Glowing heart cluster */}
        <div className="flex justify-center items-center gap-2 mb-3">
          <Heart 
            className="w-16 h-16 sm:w-20 sm:h-20"
            fill="#ff1493"
            stroke="none"
            style={{ 
              filter: 'drop-shadow(0 0 20px #ff1493)',
              transform: 'rotate(-15deg)',
            }}
          />
          <Heart 
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
            fill="#ff69b4"
            stroke="none"
            style={{ 
              filter: 'drop-shadow(0 0 30px #ff69b4)',
            }}
          />
          <Heart 
            className="w-16 h-16 sm:w-20 sm:h-20"
            fill="#dc143c"
            stroke="none"
            style={{ 
              filter: 'drop-shadow(0 0 20px #dc143c)',
              transform: 'rotate(15deg)',
            }}
          />
        </div>
        
        {/* Brand name */}
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
          style={{
            color: '#ff1493',
            textShadow: '0 0 30px rgba(255, 20, 147, 0.5)',
          }}
        >
          JUSTACHAT
        </div>
        
        {/* Valentine's tagline */}
        <div 
          className="font-display text-xl sm:text-2xl font-bold mt-2 tracking-widest flex items-center justify-center gap-3"
          style={{
            color: '#ff69b4',
          }}
        >
          <Heart className="w-4 h-4" fill="currentColor" />
          <span>SPREAD THE LOVE</span>
          <Heart className="w-4 h-4" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};
