import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Memphis-style 80s geometric pieces - circles, triangles, zigzags
const memphisShapes = [
  // Large circles - pink and blue
  { type: 'circle', top: '8%', left: '3%', color: '#FF69B4', size: 45, delay: 0 },
  { type: 'circle', top: '15%', right: '5%', color: '#00BFFF', size: 35, delay: 0.5 },
  { type: 'circle', top: '45%', left: '2%', color: '#FF69B4', size: 30, delay: 1.2 },
  { type: 'circle', top: '70%', right: '3%', color: '#00BFFF', size: 40, delay: 0.8 },
  { type: 'circle', top: '85%', left: '8%', color: '#FF69B4', size: 25, delay: 1.5 },
  
  // Triangles - yellow
  { type: 'triangle', top: '12%', left: '15%', color: '#FFD700', size: 25, delay: 0.3, rotate: 0 },
  { type: 'triangle', top: '25%', right: '12%', color: '#FFD700', size: 20, delay: 0.9 , rotate: 45 },
  { type: 'triangle', top: '55%', right: '8%', color: '#FFD700', size: 28, delay: 0.4, rotate: 180 },
  { type: 'triangle', top: '35%', left: '5%', color: '#FFD700', size: 22, delay: 1.1, rotate: 90 },
  { type: 'triangle', top: '75%', left: '18%', color: '#FFD700', size: 18, delay: 0.6, rotate: 135 },
  { type: 'triangle', top: '90%', right: '15%', color: '#FFD700', size: 24, delay: 1.3, rotate: 270 },
  
  // Zigzag lines - pink, blue, and cream
  { type: 'zigzag', top: '5%', left: '35%', color: '#FF69B4', size: 60, delay: 0.2, rotate: 15 },
  { type: 'zigzag', top: '20%', right: '25%', color: '#00BFFF', size: 50, delay: 0.7, rotate: -20 },
  { type: 'zigzag', top: '40%', left: '25%', color: '#FFFACD', size: 55, delay: 1.0, rotate: 30 },
  { type: 'zigzag', top: '60%', right: '20%', color: '#FF69B4', size: 45, delay: 0.5, rotate: -10 },
  { type: 'zigzag', top: '78%', left: '30%', color: '#00BFFF', size: 50, delay: 1.4, rotate: 25 },
  
  // Small accent circles
  { type: 'circle', top: '22%', left: '28%', color: '#00BFFF', size: 15, delay: 0.4 },
  { type: 'circle', top: '38%', right: '28%', color: '#FF69B4', size: 12, delay: 0.9 },
  { type: 'circle', top: '52%', left: '35%', color: '#00BFFF', size: 18, delay: 1.1 },
  { type: 'circle', top: '68%', right: '30%', color: '#FF69B4', size: 14, delay: 0.6 },
  
  // Dots pattern
  { type: 'dot', top: '18%', left: '42%', color: '#FFD700', size: 8, delay: 0.1 },
  { type: 'dot', top: '32%', right: '38%', color: '#FF69B4', size: 6, delay: 0.3 },
  { type: 'dot', top: '48%', left: '40%', color: '#00BFFF', size: 7, delay: 0.6 },
  { type: 'dot', top: '62%', right: '42%', color: '#FFD700', size: 9, delay: 0.8 },
  { type: 'dot', top: '82%', left: '38%', color: '#FF69B4', size: 6, delay: 1.0 },
  
  // Cross/plus shapes
  { type: 'cross', top: '10%', right: '35%', color: '#00BFFF', size: 20, delay: 0.4, rotate: 0 },
  { type: 'cross', top: '30%', left: '12%', color: '#FF69B4', size: 16, delay: 0.7, rotate: 45 },
  { type: 'cross', top: '65%', right: '12%', color: '#FFFACD', size: 18, delay: 1.2, rotate: 0 },
  { type: 'cross', top: '88%', left: '40%', color: '#00BFFF', size: 14, delay: 0.2, rotate: 45 },
];

// Render shape based on type
const MemphisShape = ({ type, size, color, rotate = 0 }: { type: string; size: number; color: string; rotate?: number }) => {
  if (type === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill={color} />
      </svg>
    );
  }
  
  if (type === 'triangle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
        <polygon points="50,5 95,95 5,95" fill={color} />
      </svg>
    );
  }
  
  if (type === 'zigzag') {
    return (
      <svg width={size} height={size * 0.4} viewBox="0 0 100 40" style={{ transform: `rotate(${rotate}deg)` }}>
        <polyline
          points="0,20 15,5 30,35 45,5 60,35 75,5 90,35 100,20"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  
  if (type === 'dot') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill={color} />
      </svg>
    );
  }
  
  if (type === 'cross') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
        <rect x="40" y="10" width="20" height="80" fill={color} />
        <rect x="10" y="40" width="80" height="20" fill={color} />
      </svg>
    );
  }
  
  return null;
};

export const RetroFloatingIcons: React.FC = () => {
  const { theme } = useTheme();

  // Only show for retro80s theme
  if (theme !== 'retro80s') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Memphis-style geometric shapes */}
      {memphisShapes.map((piece, index) => {
        const { type, color, size, delay, rotate, ...position } = piece;
        return (
          <div
            key={`memphis-${index}`}
            className="absolute"
            style={{
              ...position,
              opacity: type === 'zigzag' ? 0.7 : 0.5,
              animation: `
                memphisFloat ${3 + (index % 3)}s ease-in-out infinite,
                memphisSway ${4 + (index % 2)}s ease-in-out infinite,
                memphisGlow 3s ease-in-out infinite
              `,
              animationDelay: `${delay}s, ${delay + 0.5}s, ${delay}s`,
            }}
          >
            <MemphisShape type={type} size={size} color={color} rotate={rotate || 0} />
          </div>
        );
      })}
      
      {/* CSS animations */}
      <style>{`
        @keyframes memphisFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes memphisSway {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(8px) rotate(3deg);
          }
          75% {
            transform: translateX(-8px) rotate(-3deg);
          }
        }
        
        @keyframes memphisGlow {
          0%, 100% {
            filter: drop-shadow(0 0 5px currentColor);
            opacity: 0.45;
          }
          50% {
            filter: drop-shadow(0 0 15px currentColor);
            opacity: 0.65;
          }
        }
        
        @keyframes memphisSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
