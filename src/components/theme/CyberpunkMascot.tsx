import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Cpu, Wifi, Zap, Binary } from 'lucide-react';

/**
 * Cyberpunk footer mascots - Tech and circuit elements
 */
export const CyberpunkMascot: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const { theme } = useTheme();
  
  if (theme !== 'cyberpunk') return null;
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center gap-2"
      style={{
        animation: 'cyberpunkGlitch 5s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      {side === 'left' ? (
        <>
          <div 
            className="p-1.5 rounded"
            style={{
              background: 'hsl(220 45% 12%)',
              border: '1px solid hsl(200 100% 55%)',
              boxShadow: '0 0 15px hsl(200 100% 55% / 0.4), inset 0 0 10px hsl(200 100% 55% / 0.1)',
            }}
          >
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(200_100%_55%)]" />
          </div>
          <Binary className="w-4 h-4 text-[hsl(280_100%_65%)] opacity-60" />
        </>
      ) : (
        <>
          <Zap className="w-4 h-4 text-[hsl(200_100%_55%)] opacity-60 animate-pulse" />
          <div 
            className="p-1.5 rounded"
            style={{
              background: 'hsl(220 45% 12%)',
              border: '1px solid hsl(280 100% 65%)',
              boxShadow: '0 0 15px hsl(280 100% 65% / 0.4), inset 0 0 10px hsl(280 100% 65% / 0.1)',
            }}
          >
            <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(280_100%_65%)]" />
          </div>
        </>
      )}
    </div>
  );
};
