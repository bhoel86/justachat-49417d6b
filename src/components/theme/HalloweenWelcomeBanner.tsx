import React from 'react';
import halloweenBg from '@/assets/themes/halloween/justachat-halloween.png';

interface HalloweenWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const HalloweenWelcomeBanner: React.FC<HalloweenWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-4 px-3' : 'py-6 px-4'}`}
      style={{
        backgroundImage: `url(${halloweenBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(350 40% 6% / 0.7) 0%, hsl(350 40% 6% / 0.4) 50%, hsl(350 40% 6% / 0.8) 100%)',
        }}
      />
      
      {/* Warm orange glow overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, hsl(25 90% 50% / 0.15) 0%, transparent 70%)',
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Pumpkin icons */}
        <div className="flex items-center gap-3">
          <span 
            className={`${isMobile ? 'text-lg' : 'text-2xl'}`}
            style={{ 
              filter: 'drop-shadow(0 0 8px hsl(25 90% 50% / 0.6))',
              animation: 'halloweenFlicker 3s ease-in-out infinite',
            }}
          >
            🎃
          </span>
          <div 
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center`}
            style={{
              background: 'linear-gradient(135deg, hsl(25 95% 55%) 0%, hsl(350 50% 30%) 100%)',
              boxShadow: '0 0 25px hsl(25 90% 50% / 0.5), 0 4px 20px hsl(350 40% 10% / 0.6)',
              border: '2px solid hsl(25 80% 45%)',
            }}
          >
            <span className={`${isMobile ? 'text-lg' : 'text-xl'}`}>🦇</span>
          </div>
          <span 
            className={`${isMobile ? 'text-lg' : 'text-2xl'}`}
            style={{ 
              filter: 'drop-shadow(0 0 8px hsl(25 90% 50% / 0.6))',
              animation: 'halloweenFlicker 3s ease-in-out infinite 0.5s',
            }}
          >
            🎃
          </span>
        </div>
        
        {/* Title with spooky styling */}
        <h1 
          className={`font-display font-bold tracking-wide ${isMobile ? 'text-lg' : 'text-2xl sm:text-3xl'}`}
          style={{
            color: 'hsl(25 95% 55%)',
            textShadow: '2px 2px 4px hsl(350 40% 6%), 0 0 20px hsl(25 90% 50% / 0.5)',
          }}
        >
          JUSTACHAT
        </h1>
        
        {/* Tagline */}
        <p 
          className={`text-center ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}
          style={{ color: 'hsl(35 100% 70%)' }}
        >
          🕷️ Spooky Season Chat 🕷️
        </p>
        
        {/* Online status */}
        <div 
          className={`flex items-center gap-2 ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
          style={{ color: 'hsl(30 60% 75%)' }}
        >
          <span>👻 Spirits Online</span>
        </div>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p 
            className={`${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
            style={{ color: 'hsl(25 95% 55%)' }}
          >
            Enter if you dare... →
          </p>
        )}
      </div>
    </div>
  );
};
