import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import retroHeader80s from '@/assets/retro-header-80s-cutout.png';

interface RetroWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const RetroWelcomeBanner: React.FC<RetroWelcomeBannerProps> = ({ 
  onJoinClick,
  variant = 'desktop'
}) => {
  const { theme } = useTheme();

  // Only show for retro80s theme
  if (theme !== 'retro80s') {
    return null;
  }

  const isMobile = variant === 'mobile';

  return (
    <div className="w-full flex justify-center mt-4 px-4">
      <img 
        src={retroHeader80s} 
        alt="Justachat - Connect Instantly, Chat Freely" 
        className={`${isMobile ? 'h-20 sm:h-24' : 'h-24 sm:h-32 md:h-40 lg:h-48'} w-auto max-w-full`}
        style={{ 
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
