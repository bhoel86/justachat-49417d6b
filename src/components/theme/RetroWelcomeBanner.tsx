import React from 'react';
import retroHeader from '@/assets/justachat-header-80s.png';

interface RetroWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const RetroWelcomeBanner: React.FC<RetroWelcomeBannerProps> = ({ onJoinClick, variant = 'desktop' }) => {
  return (
    <div 
      onClick={onJoinClick}
      className={`relative overflow-hidden flex justify-center ${onJoinClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}`}
    >
      <img 
        src={retroHeader} 
        alt="Justachat - Connect Instantly, Chat Freely" 
        className="w-full max-w-2xl h-auto object-contain rounded-xl border-4 border-primary"
      />
    </div>
  );
};
