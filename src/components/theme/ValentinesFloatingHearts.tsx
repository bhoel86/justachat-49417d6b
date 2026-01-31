import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, Sparkles } from 'lucide-react';

// More dynamic heart positions with varied sizes and animations
const floatingHearts = [
  // Large prominent hearts
  { top: '8%', left: '3%', size: 28, delay: 0, duration: 4, glow: true },
  { top: '15%', right: '5%', size: 32, delay: 0.5, duration: 4.5, glow: true },
  { bottom: '12%', left: '6%', size: 26, delay: 1, duration: 3.8, glow: true },
  { bottom: '18%', right: '4%', size: 30, delay: 1.5, duration: 4.2, glow: true },
  
  // Medium hearts
  { top: '25%', left: '8%', size: 18, delay: 0.3, duration: 3.5, glow: false },
  { top: '35%', right: '10%', size: 20, delay: 0.8, duration: 3.8, glow: false },
  { top: '50%', left: '5%', size: 16, delay: 1.2, duration: 3.2, glow: true },
  { top: '45%', right: '7%', size: 22, delay: 0.6, duration: 4, glow: true },
  { bottom: '35%', left: '10%', size: 18, delay: 1.8, duration: 3.6, glow: false },
  { bottom: '40%', right: '8%', size: 16, delay: 2, duration: 3.4, glow: false },
  
  // Small accent hearts
  { top: '20%', left: '15%', size: 12, delay: 0.4, duration: 3, glow: false },
  { top: '30%', right: '18%', size: 10, delay: 0.9, duration: 2.8, glow: false },
  { top: '60%', left: '12%', size: 14, delay: 1.4, duration: 3.2, glow: false },
  { top: '55%', right: '15%', size: 12, delay: 1.7, duration: 3, glow: false },
  { bottom: '25%', left: '18%', size: 10, delay: 2.2, duration: 2.9, glow: false },
  { bottom: '30%', right: '14%', size: 14, delay: 2.4, duration: 3.1, glow: false },
  
  // Tiny scattered hearts
  { top: '40%', left: '20%', size: 8, delay: 0.7, duration: 2.5, glow: false },
  { top: '70%', right: '20%', size: 8, delay: 1.1, duration: 2.6, glow: false },
  { bottom: '50%', left: '22%', size: 8, delay: 1.6, duration: 2.4, glow: false },
  { bottom: '60%', right: '22%', size: 8, delay: 2.1, duration: 2.7, glow: false },
];

// Sparkle/star positions
const sparkles = [
  { top: '15%', left: '25%', size: 10, delay: 0.2 },
  { top: '25%', right: '22%', size: 12, delay: 0.7 },
  { top: '45%', left: '18%', size: 8, delay: 1.1 },
  { top: '55%', right: '25%', size: 10, delay: 1.5 },
  { bottom: '35%', left: '20%', size: 12, delay: 1.9 },
  { bottom: '25%', right: '18%', size: 8, delay: 2.3 },
  { top: '70%', left: '8%', size: 10, delay: 0.5 },
  { bottom: '45%', right: '10%', size: 8, delay: 1.3 },
];

const heartColors = ['#ff1493', '#ff69b4', '#dc143c', '#e91e63', '#ff6b9d', '#f48fb1'];

export const ValentinesFloatingHearts: React.FC = () => {
  const { theme } = useTheme();

  if (theme !== 'valentines') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle ambient glow in corners */}
      <div 
        className="absolute top-0 left-0 w-64 h-64 opacity-20"
        style={{
          background: 'radial-gradient(circle, #ff1493 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 opacity-20"
        style={{
          background: 'radial-gradient(circle, #ff69b4 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating hearts */}
      {floatingHearts.map((heart, index) => {
        const color = heartColors[index % heartColors.length];
        const { size, delay, duration, glow, ...position } = heart;
        
        return (
          <div
            key={`heart-${index}`}
            className="absolute"
            style={{ 
              ...position,
              animation: `valentinesFloatRotate ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
            }}
          >
            <Heart 
              size={size} 
              fill={color}
              stroke={glow ? '#ffb6c1' : 'none'}
              strokeWidth={glow ? 0.5 : 0}
              style={{ 
                opacity: glow ? 0.7 : 0.4,
                filter: glow ? `drop-shadow(0 0 ${size/2}px ${color})` : 'none',
              }}
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
            className="absolute text-pink-300"
            style={{ 
              ...position,
              animation: `valentinesSparkle 2s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              opacity: 0.5,
            }}
          >
            <Sparkles size={size} />
          </div>
        );
      })}
    </div>
  );
};
