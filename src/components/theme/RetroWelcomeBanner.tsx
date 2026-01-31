import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Bird } from 'lucide-react';

interface RetroWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const RetroWelcomeBanner: React.FC<RetroWelcomeBannerProps> = ({ 
  onJoinClick,
  variant = 'desktop'
}) => {
  const { theme } = useTheme();

  // Only show for retro80s theme
  if (theme !== 'retro80s') {
    return null;
  }

  return (
    <div className="w-full flex justify-center mt-4">
      <div 
        className="flex items-center gap-3 px-6 py-3 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #FFB347 0%, #FF8C42 50%, #E85D04 100%)',
          border: '3px solid #000',
          boxShadow: '4px 4px 0 #000',
        }}
      >
        {/* Mascot bird */}
        <div 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white"
          style={{ border: '2px solid #000' }}
        >
          <Bird className="w-6 h-6 text-orange-500" style={{ transform: 'scaleX(-1)' }} />
        </div>
        
        {/* Text */}
        <div className="text-center">
          <h1 
            className="font-display font-black text-2xl sm:text-3xl tracking-wide"
            style={{
              color: '#8B0000',
              textShadow: '2px 2px 0 #FFD700, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              fontFamily: "'VT323', monospace",
            }}
          >
            JUSTACHAT™
          </h1>
          <p 
            className="text-xs font-bold"
            style={{
              color: '#8B0000',
              textShadow: '1px 1px 0 #FFD700',
              fontFamily: "'VT323', monospace",
            }}
          >
            Connect Instantly - Chat Freely!
          </p>
        </div>
      </div>
    </div>
  );
};
