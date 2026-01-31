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
    <div className="w-full flex justify-center mt-4">
      <img 
        src={retroHeader} 
        alt="Justachat - Connect Instantly, Chat Freely" 
        className="h-20 sm:h-24 md:h-28 w-auto"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};
