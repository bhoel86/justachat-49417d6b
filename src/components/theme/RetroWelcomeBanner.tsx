import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import retroHeader80s from '@/assets/retro-header-80s.png';

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
    <div className="w-full flex justify-center mt-4">
      <img 
        src={retroHeader80s} 
        alt="Justachat - Connect Instantly, Chat Freely" 
        className={`${isMobile ? 'h-12 sm:h-16' : 'h-16 sm:h-20 md:h-24'} w-auto`}
        style={{ 
          imageRendering: 'pixelated',
          filter: 'drop-shadow(4px 4px 0 rgba(0,0,0,0.5))',
        }}
      />
    </div>
  );
};
