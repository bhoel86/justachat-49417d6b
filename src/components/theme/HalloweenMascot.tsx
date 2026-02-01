import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Halloween footer mascots - Pumpkins and spooky elements
 */
export const HalloweenMascot: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const { theme } = useTheme();
  
  if (theme !== 'halloween') return null;
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center gap-2"
      style={{
        animation: 'halloweenFloat 4s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      {side === 'left' ? (
        <>
          <span 
            className="text-2xl sm:text-3xl"
            style={{ 
              filter: 'drop-shadow(0 0 10px hsl(25 90% 50% / 0.5))',
              animation: 'halloweenFlicker 3s ease-in-out infinite',
            }}
          >
            🎃
          </span>
          <div 
            className="p-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, hsl(25 95% 55%) 0%, hsl(350 50% 30%) 100%)',
              border: '2px solid hsl(25 80% 45%)',
              boxShadow: '0 0 15px hsl(25 90% 50% / 0.4)',
            }}
          >
            <span className="text-lg sm:text-xl">🦇</span>
          </div>
        </>
      ) : (
        <>
          <div 
            className="p-1.5 rounded"
            style={{
              background: 'linear-gradient(135deg, hsl(280 40% 25%) 0%, hsl(350 35% 15%) 100%)',
              border: '2px solid hsl(25 80% 45%)',
              boxShadow: '0 0 15px hsl(25 90% 50% / 0.4)',
            }}
          >
            <span className="text-lg sm:text-xl">🕸️</span>
          </div>
          <span 
            className="text-2xl sm:text-3xl"
            style={{ 
              filter: 'drop-shadow(0 0 10px hsl(25 90% 50% / 0.5))',
              animation: 'halloweenFlicker 3s ease-in-out infinite 0.3s',
            }}
          >
            👻
          </span>
        </>
      )}
    </div>
  );
};
