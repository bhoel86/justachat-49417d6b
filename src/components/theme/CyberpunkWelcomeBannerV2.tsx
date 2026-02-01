import React from 'react';
import cyberpunkBg from '@/assets/themes/cyberpunk-bg.jpg';

interface CyberpunkWelcomeBannerV2Props {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

/**
 * Cyberpunk Welcome Banner V2 - Uses actual generated background matching the reference design
 * Features: Cyan neon glow, holographic displays, futuristic cityscape, robot mascot
 */
export const CyberpunkWelcomeBannerV2: React.FC<CyberpunkWelcomeBannerV2Props> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:brightness-110 transition-all duration-300' : ''}`}
      style={{
        backgroundImage: `url(${cyberpunkBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: isMobile ? '120px' : '180px',
      }}
    >
      {/* Scan line overlay for terminal effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)',
        }}
      />
      
      {/* Holographic flicker overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.05) 0%, transparent 70%)',
          animation: 'cyberpunkFlicker 3s ease-in-out infinite',
        }}
      />
      
      {/* Content area */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full ${isMobile ? 'py-4 px-3' : 'py-8 px-6'}`}>
        {/* The background already has the JustAChat logo, so we just add interactive elements */}
        {onJoinClick && (
          <div 
            className={`mt-auto font-mono ${isMobile ? 'text-xs' : 'text-sm'} tracking-widest`}
            style={{
              color: '#00ffff',
              textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
              animation: 'cyberpunkGlitch 4s ease-in-out infinite',
            }}
          >
            [ENTER_SYSTEM] →
          </div>
        )}
      </div>
    </div>
  );
};
