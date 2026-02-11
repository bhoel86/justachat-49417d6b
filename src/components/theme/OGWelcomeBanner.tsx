/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

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
      className={`relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-background via-card to-background ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${isMobile ? 'py-2 px-3' : 'py-3 sm:py-4 px-4'}`}
    >
      {/* Subtle animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5">
        {/* Icon */}
        <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-xl jac-gradient-bg flex items-center justify-center shadow-lg`}>
          <MessageSquare className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} text-primary-foreground`} />
        </div>
        
        {/* Title */}
        <h1 className={`font-bold tracking-tight text-foreground ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            Justachat
          </span>
          <sup className="text-[6px] sm:text-[8px] text-muted-foreground ml-0.5">™</sup>
        </h1>
        
        {/* Tagline */}
         <p className={`text-muted-foreground text-center max-w-md ${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
           Free Chat Platform — Real Conversation, No Noise
         </p>
        
        {/* CTA hint */}
        {onJoinClick && (
          <p className={`text-primary/70 font-medium ${isMobile ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}>
            Click to join #general →
          </p>
        )}
      </div>
    </div>
  );
};
