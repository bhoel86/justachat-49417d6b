import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Floating Halloween elements - bats, spiders, ghosts for ambient decoration
 */
export const HalloweenFloatingElements: React.FC = () => {
  const { theme } = useTheme();
  
  if (theme !== 'halloween') return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating bats */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`bat-${i}`}
          className="absolute text-xl sm:text-2xl"
          style={{
            left: `${10 + i * 20}%`,
            top: `${5 + (i % 3) * 10}%`,
            animation: `halloweenBatFly ${6 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
            opacity: 0.15,
            filter: 'drop-shadow(0 0 5px hsl(280 40% 20%))',
          }}
        >
          🦇
        </div>
      ))}
      
      {/* Floating ghosts */}
      {[...Array(3)].map((_, i) => (
        <div
          key={`ghost-${i}`}
          className="absolute text-2xl sm:text-3xl"
          style={{
            right: `${5 + i * 30}%`,
            bottom: `${20 + i * 15}%`,
            animation: `halloweenGhostFloat ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
            opacity: 0.1,
          }}
        >
          👻
        </div>
      ))}
      
      {/* Corner cobwebs */}
      <div
        className="absolute top-0 left-0 text-4xl sm:text-5xl"
        style={{
          opacity: 0.08,
          transform: 'rotate(0deg)',
        }}
      >
        🕸️
      </div>
      <div
        className="absolute top-0 right-0 text-4xl sm:text-5xl"
        style={{
          opacity: 0.08,
          transform: 'scaleX(-1)',
        }}
      >
        🕸️
      </div>
    </div>
  );
};
