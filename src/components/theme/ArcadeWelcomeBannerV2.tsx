import React from 'react';
import arcadeBg from '@/assets/themes/arcade-bg.jpg';

interface ArcadeWelcomeBannerV2Props {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

/**
 * Arcade Welcome Banner V2 - Uses actual generated background matching the reference design
 * Features: Neon arcade cabinets, pink/purple glow, grid floor, popcorn decorations
 */
export const ArcadeWelcomeBannerV2: React.FC<ArcadeWelcomeBannerV2Props> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:brightness-110 transition-all duration-300' : ''}`}
      style={{
        backgroundImage: `url(${arcadeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: isMobile ? '120px' : '180px',
      }}
    >
      {/* Scan line overlay for CRT effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
      
      {/* Neon glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(255, 0, 200, 0.15) 0%, transparent 60%)',
        }}
      />
      
      {/* Content area - positioned in the center where the UI would go */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full ${isMobile ? 'py-4 px-3' : 'py-8 px-6'}`}>
        {/* The background already has the JustAChat logo, so we just add interactive elements */}
        {onJoinClick && (
          <div 
            className={`mt-auto ${isMobile ? 'text-xs' : 'text-sm'} font-bold tracking-wider animate-pulse`}
            style={{
              color: '#ff00ff',
              textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff',
            }}
          >
            ▶ PRESS START ◀
          </div>
        )}
      </div>
    </div>
  );
};
