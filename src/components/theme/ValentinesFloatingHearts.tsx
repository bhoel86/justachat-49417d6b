import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Sparkles } from 'lucide-react';

// Floating hearts positioned with safe margins from edges
const floatingHearts = [
  // Top section
  { top: '12%', left: '5%', size: 20, rotate: -15, delay: 0, filled: true },
  { top: '8%', right: '8%', size: 16, rotate: 20, delay: 0.5, filled: false },
  { top: '18%', left: '12%', size: 14, rotate: 10, delay: 1, filled: true },
  { top: '15%', right: '15%', size: 18, rotate: -10, delay: 1.5, filled: false },
  
  // Upper-middle section
  { top: '28%', left: '6%', size: 12, rotate: 25, delay: 2, filled: true },
  { top: '32%', right: '10%', size: 22, rotate: -20, delay: 0.8, filled: true },
  { top: '38%', left: '15%', size: 10, rotate: 5, delay: 1.3, filled: false },
  
  // Middle section
  { top: '48%', left: '4%', size: 18, rotate: -12, delay: 0.3, filled: true },
  { top: '52%', right: '7%', size: 14, rotate: 15, delay: 1.8, filled: false },
  { top: '58%', left: '10%', size: 16, rotate: 8, delay: 2.2, filled: true },
  
  // Lower-middle section
  { bottom: '38%', right: '12%', size: 20, rotate: -8, delay: 0.6, filled: true },
  { bottom: '32%', left: '8%', size: 12, rotate: 22, delay: 1.1, filled: false },
  
  // Bottom section
  { bottom: '22%', right: '6%', size: 16, rotate: -18, delay: 1.6, filled: true },
  { bottom: '18%', left: '14%', size: 14, rotate: 12, delay: 2.0, filled: false },
  { bottom: '12%', right: '15%', size: 18, rotate: -5, delay: 0.9, filled: true },
  { bottom: '8%', left: '6%', size: 10, rotate: 28, delay: 1.4, filled: true },
];

// Sparkle positions
const sparkles = [
  { top: '20%', left: '20%', size: 10, delay: 0.2 },
  { top: '35%', right: '18%', size: 8, delay: 0.7 },
  { top: '55%', left: '18%', size: 12, delay: 1.2 },
  { bottom: '30%', right: '20%', size: 10, delay: 1.7 },
  { bottom: '15%', left: '22%', size: 8, delay: 2.3 },
];

export const ValentinesFloatingHearts: React.FC = () => {
  const { theme } = useTheme();

  // Only show for valentines theme
  if (theme !== 'valentines') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating hearts */}
      {floatingHearts.map((heart, index) => {
        const { size, rotate, delay, filled, ...position } = heart;
        return (
          <div
            key={`heart-${index}`}
            className="absolute text-pink-400/60"
            style={{ 
              ...position,
              transform: `rotate(${rotate}deg)`,
              animation: `valentinesFloat ${3 + (index % 2)}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <Heart 
              size={size} 
              strokeWidth={2}
              fill={filled ? 'currentColor' : 'none'}
              className={filled ? 'text-pink-500/50' : 'text-pink-400/40'}
            />
          </div>
        );
      })}
      
      {/* Sparkles */}
      {sparkles.map((sparkle, index) => {
        const { size, delay, ...position } = sparkle;
        return (
          <div
            key={`sparkle-${index}`}
            className="absolute text-pink-300/50"
            style={{ 
              ...position,
              animation: `valentinesPulse 2s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <Sparkles size={size} strokeWidth={2} />
          </div>
        );
      })}
    </div>
  );
};
