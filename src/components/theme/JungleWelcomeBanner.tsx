import React from 'react';
import { TreePine, Compass, Flame } from 'lucide-react';

interface JungleWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const JungleWelcomeBanner: React.FC<JungleWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-4 px-3' : 'py-6 px-4'}`}
      style={{
        background: 'linear-gradient(180deg, hsl(120 25% 8%) 0%, hsl(120 30% 12%) 50%, hsl(100 25% 10%) 100%)',
      }}
    >
      {/* Foliage overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 100%, hsl(100 60% 40% / 0.3) 0%, transparent 70%), radial-gradient(ellipse 80% 50% at 80% 100%, hsl(100 60% 40% / 0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Lantern glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48"
        style={{
          background: 'radial-gradient(circle, hsl(35 90% 50% / 0.2) 0%, transparent 70%)',
        }}
      />
      
      {/* Vine decorations */}
      <div className="absolute top-0 left-4 w-8 h-16 opacity-30">
        <TreePine className="w-full h-full text-[hsl(100_60%_40%)]" />
      </div>
      <div className="absolute top-0 right-4 w-8 h-16 opacity-30">
        <TreePine className="w-full h-full text-[hsl(100_60%_40%)] scale-x-[-1]" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Explorer icons */}
        <div className="flex items-center gap-3">
          <Flame 
            className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(35_90%_50%)]`}
            style={{ animation: 'jungleFlicker 2s ease-in-out infinite' }}
          />
          <div 
            className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full flex items-center justify-center`}
            style={{
              background: 'linear-gradient(135deg, hsl(100 60% 40%) 0%, hsl(80 50% 30%) 100%)',
              boxShadow: '0 0 20px hsl(35 90% 50% / 0.3), 0 4px 20px hsl(35 60% 20% / 0.4)',
              border: '2px solid hsl(45 80% 50%)',
            }}
          >
            <Compass className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(45_80%_50%)]`} />
          </div>
          <Flame 
            className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-[hsl(35_90%_50%)]`}
            style={{ animation: 'jungleFlicker 2s ease-in-out infinite 0.5s' }}
          />
        </div>
        
        {/* Title with adventure styling */}
        <h1 
          className={`font-display font-bold tracking-wide ${isMobile ? 'text-lg' : 'text-2xl sm:text-3xl'}`}
          style={{
            color: 'hsl(35 90% 50%)',
            textShadow: '2px 2px 4px hsl(120 30% 8%), 0 0 15px hsl(35 90% 50% / 0.4)',
          }}
        >
          JUSTACHAT
        </h1>
        
        {/* Tagline */}
        <p 
          className={`text-center ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}
          style={{ color: 'hsl(100 40% 60%)' }}
        >
          🌿 Expedition into the Unknown 🌿
        </p>
        
        {/* Party level status */}
        <div 
          className={`flex items-center gap-2 ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
          style={{ color: 'hsl(45 60% 70%)' }}
        >
          <span>♡ Party Level: 3</span>
        </div>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p 
            className={`${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
            style={{ color: 'hsl(35 90% 50%)' }}
          >
            Begin Adventure →
          </p>
        )}
      </div>
    </div>
  );
};
