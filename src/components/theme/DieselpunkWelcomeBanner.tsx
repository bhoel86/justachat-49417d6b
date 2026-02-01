import React from 'react';
import { Cog, ScrollText } from 'lucide-react';

interface DieselpunkWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const DieselpunkWelcomeBanner: React.FC<DieselpunkWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-4 px-3' : 'py-6 px-4'}`}
      style={{
        background: 'linear-gradient(180deg, hsl(35 40% 15%) 0%, hsl(30 30% 12%) 50%, hsl(35 40% 15%) 100%)',
        borderTop: '3px solid hsl(45 80% 50%)',
        borderBottom: '3px solid hsl(45 80% 50%)',
      }}
    >
      {/* Parchment texture overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Brass corner decorations */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-[hsl(45_80%_50%)]" />
      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-[hsl(45_80%_50%)]" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-[hsl(45_80%_50%)]" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-[hsl(45_80%_50%)]" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Gear and scroll icons */}
        <div className="flex items-center gap-2">
          <Cog 
            className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(45_80%_50%)] animate-spin`}
            style={{ animationDuration: '10s' }}
          />
          <ScrollText className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-[hsl(45_80%_50%)]`} />
          <Cog 
            className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(45_80%_50%)] animate-spin`}
            style={{ animationDuration: '10s', animationDirection: 'reverse' }}
          />
        </div>
        
        {/* Title with medieval styling */}
        <h1 
          className={`font-display font-bold tracking-wide ${isMobile ? 'text-lg' : 'text-2xl sm:text-3xl'}`}
          style={{
            color: 'hsl(45 80% 50%)',
            textShadow: '2px 2px 4px hsl(30 40% 10%), 0 0 10px hsl(45 80% 50% / 0.3)',
          }}
        >
          JustAChat
        </h1>
        
        {/* Tagline */}
        <p 
          className={`text-center italic ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}
          style={{
            color: 'hsl(40 30% 80%)',
            fontFamily: 'serif',
          }}
        >
          ⚙ Communiqués in Cyberization ⚙
        </p>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p 
            className={`font-serif ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
            style={{ color: 'hsl(25 90% 45%)' }}
          >
            Enter the Guild →
          </p>
        )}
      </div>
    </div>
  );
};
