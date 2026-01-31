import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

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
    <div 
      className={`relative overflow-hidden bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 ${
        isMobile ? 'py-3' : 'py-4 sm:py-6'
      }`}
      style={{
        borderTop: '3px solid black',
        borderBottom: '3px solid black',
      }}
    >
      {/* Scanline effect overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center">
        <h1 
          className={`font-display font-black tracking-tight ${
            isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'
          }`}
          style={{
            color: '#00FFFF',
            textShadow: `
              3px 3px 0 #FF00FF,
              6px 6px 0 #000,
              0 0 20px rgba(0, 255, 255, 0.8),
              0 0 40px rgba(255, 0, 255, 0.6)
            `,
            fontFamily: "'VT323', monospace",
            letterSpacing: '0.05em',
          }}
        >
          Justachat™
        </h1>
        
        {/* Join button for desktop */}
        {!isMobile && onJoinClick && (
          <Button 
            onClick={onJoinClick}
            className="absolute right-4 bg-accent text-accent-foreground hover:bg-accent/90 text-sm px-4 py-2 h-auto font-display font-bold border-2 border-foreground"
            style={{ boxShadow: '3px 3px 0 black' }}
          >
            Join Chat
          </Button>
        )}
      </div>
    </div>
  );
};
