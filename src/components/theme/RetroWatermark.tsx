import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import retroHeader from '@/assets/justachat-header-80s.png';
import { usePngCutout } from '@/hooks/usePngCutout';

export const RetroWatermark: React.FC = () => {
  const { theme } = useTheme();
  const cutoutSrc = usePngCutout(retroHeader);

  // Only show retro watermark for retro80s theme
  if (theme !== 'retro80s') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* Memphis-style Justachat logo watermark */}
      <div 
        className="select-none"
        style={{ opacity: 0.15 }}
      >
        <img 
          src={cutoutSrc ?? retroHeader} 
          alt="" 
          className="w-[300px] sm:w-[400px] md:w-[500px] h-auto"
          style={{
            filter: 'grayscale(30%) contrast(1.1)',
          }}
        />
      </div>
      
      {/* Decorative Memphis shapes */}
      <div className="absolute top-8 left-8 w-12 h-12 border-4 border-[hsl(330_90%_55%_/_0.3)] rotate-45" />
      <div className="absolute bottom-12 right-12 w-8 h-8 bg-[hsl(185_90%_50%_/_0.2)]" />
      <div className="absolute top-1/4 right-16 w-6 h-6 rounded-full bg-[hsl(50_100%_60%_/_0.25)]" />
      <div className="absolute bottom-1/4 left-16 w-10 h-10 border-4 border-[hsl(270_50%_55%_/_0.25)]" />
      
      {/* Small scattered dots */}
      <div className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-[hsl(330_90%_55%_/_0.2)]" />
      <div className="absolute top-2/3 right-1/4 w-4 h-4 rounded-full bg-[hsl(185_90%_50%_/_0.2)]" />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-[hsl(50_100%_60%_/_0.3)]" />
    </div>
  );
};
