import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const RetroWatermark: React.FC = () => {
  const { theme } = useTheme();

  // Only show retro watermark for retro80s theme
  if (theme !== 'retro80s') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* 80s styled text watermark */}
      <div 
        className="text-center select-none"
        style={{ opacity: 0.12 }}
      >
        <div 
          className="font-display text-6xl sm:text-7xl md:text-8xl font-black tracking-tight"
          style={{
            color: 'transparent',
            WebkitTextStroke: '2px hsl(185 90% 50%)',
            textShadow: '4px 4px 0 hsl(330 90% 55% / 0.3)',
          }}
        >
          JUSTACHAT
        </div>
        <div 
          className="font-display text-2xl sm:text-3xl font-bold mt-2 tracking-widest"
          style={{
            color: 'hsl(50 100% 60%)',
          }}
        >
          ★ 80s VIBES ★
        </div>
      </div>
    </div>
  );
};
