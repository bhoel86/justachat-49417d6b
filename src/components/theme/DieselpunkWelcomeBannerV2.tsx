import React from 'react';
import dieselpunkBg from '@/assets/themes/dieselpunk-bg.jpg';

interface DieselpunkWelcomeBannerV2Props {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

/**
 * Dieselpunk Welcome Banner V2 - Uses actual generated background matching the reference design
 * Features: Brass gears, parchment panels, oil lanterns, gothic arches, steampunk aesthetic
 */
export const DieselpunkWelcomeBannerV2: React.FC<DieselpunkWelcomeBannerV2Props> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:brightness-110 transition-all duration-300' : ''}`}
      style={{
        backgroundImage: `url(${dieselpunkBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: isMobile ? '120px' : '180px',
      }}
    >
      {/* Warm lantern glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 15% 50%, rgba(255, 170, 80, 0.1) 0%, transparent 40%), radial-gradient(ellipse at 85% 50%, rgba(255, 170, 80, 0.1) 0%, transparent 40%)',
        }}
      />
      
      {/* Parchment texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content area */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full ${isMobile ? 'py-4 px-3' : 'py-8 px-6'}`}>
        {/* The background already has the JustAChat logo, so we just add interactive elements */}
        {onJoinClick && (
          <div 
            className={`mt-auto ${isMobile ? 'text-xs' : 'text-sm'} font-serif tracking-wide`}
            style={{
              color: '#d4a574',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            ⚙ Enter the Guild ⚙
          </div>
        )}
      </div>
    </div>
  );
};
