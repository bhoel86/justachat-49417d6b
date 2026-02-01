import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { TreePine, Compass, Flame, Map } from 'lucide-react';

/**
 * Jungle footer mascots - Explorer and nature elements
 */
export const JungleMascot: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const { theme } = useTheme();
  
  if (theme !== 'jungle') return null;
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center gap-2"
      style={{
        animation: 'jungleFloat 4s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      {side === 'left' ? (
        <>
          <Flame 
            className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(35_90%_50%)]"
            style={{ animation: 'jungleFlicker 2s ease-in-out infinite' }}
          />
          <div 
            className="p-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, hsl(100 60% 40%) 0%, hsl(80 50% 30%) 100%)',
              border: '2px solid hsl(45 80% 50%)',
              boxShadow: '0 0 15px hsl(35 90% 50% / 0.3)',
            }}
          >
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(45_80%_50%)]" />
          </div>
        </>
      ) : (
        <>
          <div 
            className="p-1.5 rounded"
            style={{
              background: 'linear-gradient(135deg, hsl(35 70% 35%) 0%, hsl(30 60% 25%) 100%)',
              border: '2px solid hsl(45 80% 50%)',
              boxShadow: '0 0 15px hsl(35 90% 50% / 0.3)',
            }}
          >
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(45_80%_50%)]" />
          </div>
          <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(100_60%_40%)]" />
        </>
      )}
    </div>
  );
};
