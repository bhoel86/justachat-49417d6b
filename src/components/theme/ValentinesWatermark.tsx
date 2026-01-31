import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Sparkles } from 'lucide-react';

export const ValentinesWatermark: React.FC = () => {
  const { theme } = useTheme();

  // Only show valentines watermark for valentines theme
  if (theme !== 'valentines') {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* Romantic styled watermark */}
      <div 
        className="text-center select-none"
        style={{ opacity: 0.10 }}
      >
        {/* Large decorative heart */}
        <div className="flex justify-center mb-2">
          <Heart 
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
            style={{ 
              color: 'hsl(340 82% 52%)',
              filter: 'drop-shadow(0 0 20px hsl(340 82% 52% / 0.5))',
            }}
            fill="currentColor"
            strokeWidth={1}
          />
        </div>
        
        {/* Brand name with romantic styling */}
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
          style={{
            color: 'transparent',
            WebkitTextStroke: '2px hsl(340 82% 52%)',
            textShadow: '4px 4px 0 hsl(340 90% 65% / 0.3)',
          }}
        >
          JUSTACHAT
        </div>
        
        {/* Valentine's tagline */}
        <div 
          className="font-display text-xl sm:text-2xl font-bold mt-2 tracking-widest flex items-center justify-center gap-2"
          style={{
            color: 'hsl(340 90% 65%)',
          }}
        >
          <Heart className="w-4 h-4" fill="currentColor" />
          <span>SPREAD THE LOVE</span>
          <Heart className="w-4 h-4" fill="currentColor" />
        </div>
        
        {/* Decorative sparkles */}
        <div className="flex justify-center gap-4 mt-3">
          <Sparkles className="w-5 h-5" style={{ color: 'hsl(340 70% 70%)' }} />
          <Heart className="w-4 h-4" style={{ color: 'hsl(350 80% 60%)' }} fill="currentColor" />
          <Sparkles className="w-5 h-5" style={{ color: 'hsl(340 70% 70%)' }} />
        </div>
      </div>
    </div>
  );
};
