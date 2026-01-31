import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import retroHeader from '@/assets/retro-header.png';

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

  return (
    <div className="w-full flex justify-center">
      <img 
        src={retroHeader} 
        alt="Justachat - Connect Instantly, Chat Freely" 
        className="h-10 sm:h-12 md:h-14 w-auto"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};
