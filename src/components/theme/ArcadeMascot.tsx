import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Gamepad2, Joystick, Zap } from 'lucide-react';

/**
 * Arcade footer mascots - Joystick and arcade cabinet
 */
export const ArcadeMascot: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const { theme } = useTheme();
  
  if (theme !== 'arcade') return null;
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center gap-2"
      style={{
        animation: 'arcadeFloat 3s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      {side === 'left' ? (
        <>
          <div 
            className="p-2 rounded"
            style={{
              background: 'linear-gradient(135deg, hsl(320 100% 60%) 0%, hsl(280 80% 50%) 100%)',
              boxShadow: '0 0 20px hsl(320 100% 60% / 0.5)',
            }}
          >
            <Joystick className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <Zap className="w-4 h-4 text-[hsl(180_100%_50%)] animate-pulse" />
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 text-[hsl(180_100%_50%)] animate-pulse" />
          <div 
            className="p-2 rounded"
            style={{
              background: 'linear-gradient(135deg, hsl(180 100% 50%) 0%, hsl(200 80% 45%) 100%)',
              boxShadow: '0 0 20px hsl(180 100% 50% / 0.5)',
            }}
          >
            <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </>
      )}
    </div>
  );
};
