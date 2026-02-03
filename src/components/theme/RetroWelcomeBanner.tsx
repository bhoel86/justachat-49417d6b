/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import React from 'react';
import retroHeader from '@/assets/justachat-header-80s.png';

interface RetroWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const RetroWelcomeBanner: React.FC<RetroWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  const isMobile = variant === 'mobile';
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden flex justify-center ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}`}
    >
      <img 
        src={retroHeader} 
        alt="Justachat - Connect Instantly, Chat Freely" 
        className={`w-full h-auto object-contain ${isMobile ? 'max-w-xs' : 'max-w-sm'}`}
      />
    </div>
  );
};
