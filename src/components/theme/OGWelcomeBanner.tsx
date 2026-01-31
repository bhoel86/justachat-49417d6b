import React from 'react';
import { MessageSquare } from 'lucide-react';

interface OGWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const OGWelcomeBanner: React.FC<OGWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-background ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-4 px-3' : 'py-6 sm:py-8 px-4'}`}
    >
      {/* Subtle animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
        {/* Icon */}
        <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16'} rounded-2xl jac-gradient-bg flex items-center justify-center shadow-lg`}>
          <MessageSquare className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'} text-primary-foreground`} />
        </div>
        
        {/* Title */}
        <h1 className={`font-bold tracking-tight text-foreground ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            Justachat
          </span>
          <sup className="text-[8px] sm:text-xs text-muted-foreground ml-0.5">™</sup>
        </h1>
        
        {/* Tagline */}
        <p className={`text-muted-foreground text-center max-w-md ${isMobile ? 'text-xs' : 'text-sm sm:text-base'}`}>
          Connect Instantly, Chat Freely
        </p>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p className={`text-primary/70 font-medium ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
            Click to join #general →
          </p>
        )}
      </div>
    </div>
  );
};
