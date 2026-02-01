import React from 'react';
import { Gamepad2 } from 'lucide-react';

interface ArcadeWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const ArcadeWelcomeBanner: React.FC<ArcadeWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-4 px-3' : 'py-6 px-4'}`}
      style={{
        background: 'linear-gradient(135deg, hsl(280 60% 8%) 0%, hsl(320 50% 15%) 50%, hsl(280 60% 8%) 100%)',
      }}
    >
      {/* Neon grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(320 100% 60% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(320 100% 60% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Neon glow orbs */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-[hsl(320_100%_60%/0.3)] rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-[hsl(180_100%_50%/0.2)] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Arcade cabinet icon */}
        <div 
          className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'} rounded-lg flex items-center justify-center`}
          style={{
            background: 'linear-gradient(135deg, hsl(320 100% 60%) 0%, hsl(280 80% 50%) 100%)',
            boxShadow: '0 0 30px hsl(320 100% 60% / 0.5), 0 0 60px hsl(180 100% 50% / 0.3)',
          }}
        >
          <Gamepad2 className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-white`} />
        </div>
        
        {/* Title with arcade styling */}
        <h1 
          className={`font-display font-bold tracking-wider ${isMobile ? 'text-lg' : 'text-2xl sm:text-3xl'}`}
          style={{
            color: '#FF1493',
            textShadow: '0 0 10px #FF1493, 0 0 20px #FF1493, 0 0 30px #00FFFF, 2px 2px 0 #000',
          }}
        >
          JUSTACHAT
        </h1>
        
        {/* Tagline */}
        <p 
          className={`text-center font-mono ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}
          style={{
            color: '#00FFFF',
            textShadow: '0 0 10px #00FFFF',
          }}
        >
          ★ INSERT COIN TO CHAT ★
        </p>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p 
            className={`font-mono animate-pulse ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
            style={{
              color: '#FF69B4',
            }}
          >
            PRESS START →
          </p>
        )}
      </div>
    </div>
  );
};
