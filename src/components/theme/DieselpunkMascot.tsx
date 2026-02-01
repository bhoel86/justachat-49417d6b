import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Cog, Scroll, Landmark } from 'lucide-react';

/**
 * Dieselpunk footer mascots - Gears and scrolls
 */
export const DieselpunkMascot: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const { theme } = useTheme();
  
  if (theme !== 'dieselpunk') return null;
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center gap-2"
      style={{
        animation: 'dieselpunkFloat 4s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      {side === 'left' ? (
        <>
          <Cog 
            className="w-6 h-6 sm:w-8 sm:h-8 text-[hsl(45_80%_50%)]"
            style={{ 
              animation: 'spin 8s linear infinite',
              filter: 'drop-shadow(0 0 8px hsl(45 80% 50% / 0.4))',
            }}
          />
          <Scroll className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(40_30%_80%)]" />
        </>
      ) : (
        <>
          <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(25_90%_45%)]" />
          <Cog 
            className="w-6 h-6 sm:w-8 sm:h-8 text-[hsl(45_80%_50%)]"
            style={{ 
              animation: 'spin 8s linear infinite reverse',
              filter: 'drop-shadow(0 0 8px hsl(45 80% 50% / 0.4))',
            }}
          />
        </>
      )}
    </div>
  );
};
