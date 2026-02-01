import React from 'react';
import jungleBg from '@/assets/themes/jungle-bg.jpg';

interface JungleWelcomeBannerV2Props {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

/**
 * Jungle Welcome Banner V2 - Uses actual generated background matching the reference design
 * Features: Wooden frame, vines and ropes, treasure chest, lanterns, explorer camp setting
 */
export const JungleWelcomeBannerV2: React.FC<JungleWelcomeBannerV2Props> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:brightness-110 transition-all duration-300' : ''}`}
      style={{
        backgroundImage: `url(${jungleBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: isMobile ? '120px' : '180px',
      }}
    >
      {/* Lantern glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 10% 30%, rgba(255, 170, 80, 0.1) 0%, transparent 30%), radial-gradient(ellipse at 90% 30%, rgba(255, 170, 80, 0.1) 0%, transparent 30%)',
        }}
      />
      
      {/* Ambient forest light */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(80, 200, 120, 0.05) 0%, transparent 60%)',
        }}
      />
      
      {/* Content area */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full ${isMobile ? 'py-4 px-3' : 'py-8 px-6'}`}>
        {/* The background already has the JustAChat logo, so we just add interactive elements */}
        {onJoinClick && (
          <div 
            className={`mt-auto ${isMobile ? 'text-xs' : 'text-sm'} font-bold tracking-wide`}
            style={{
              color: '#d4a574',
              textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
            }}
          >
            🗺️ Begin Adventure →
          </div>
        )}
      </div>
    </div>
  );
};
