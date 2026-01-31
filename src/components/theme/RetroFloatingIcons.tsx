import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Memphis Design confetti & squiggles - hot pink, cyan, yellow, neon green palette
const memphisElements = [
  // CONFETTI SQUARES - scattered small squares with rotation
  { type: 'confetti', top: '5%', left: '8%', color: '#FF1493', size: 12, rotate: 15, delay: 0 },
  { type: 'confetti', top: '12%', right: '12%', color: '#00FFFF', size: 10, rotate: -25, delay: 0.3 },
  { type: 'confetti', top: '20%', left: '15%', color: '#FFD700', size: 14, rotate: 45, delay: 0.6 },
  { type: 'confetti', top: '30%', right: '8%', color: '#39FF14', size: 11, rotate: -10, delay: 0.9 },
  { type: 'confetti', top: '45%', left: '5%', color: '#FF1493', size: 13, rotate: 30, delay: 0.2 },
  { type: 'confetti', top: '55%', right: '15%', color: '#00FFFF', size: 10, rotate: -35, delay: 0.5 },
  { type: 'confetti', top: '65%', left: '12%', color: '#FFD700', size: 12, rotate: 20, delay: 0.8 },
  { type: 'confetti', top: '75%', right: '10%', color: '#39FF14', size: 14, rotate: -45, delay: 1.1 },
  { type: 'confetti', top: '85%', left: '8%', color: '#FF1493', size: 11, rotate: 55, delay: 0.4 },
  { type: 'confetti', top: '92%', right: '20%', color: '#00FFFF', size: 13, rotate: -15, delay: 0.7 },
  
  // SQUIGGLES - wavy lines in various positions
  { type: 'squiggle', top: '8%', left: '25%', color: '#FF1493', size: 60, rotate: 0, delay: 0.1 },
  { type: 'squiggle', top: '22%', right: '22%', color: '#00FFFF', size: 55, rotate: 180, delay: 0.4 },
  { type: 'squiggle', top: '38%', left: '3%', color: '#FFD700', size: 50, rotate: 90, delay: 0.7 },
  { type: 'squiggle', top: '52%', right: '5%', color: '#39FF14', size: 65, rotate: -45, delay: 1.0 },
  { type: 'squiggle', top: '68%', left: '20%', color: '#FF1493', size: 55, rotate: 45, delay: 0.3 },
  { type: 'squiggle', top: '82%', right: '25%', color: '#00FFFF', size: 50, rotate: -90, delay: 0.6 },
  
  // ZIGZAGS - classic Memphis zigzag lines
  { type: 'zigzag', top: '15%', left: '35%', color: '#FF1493', size: 70, rotate: 15, delay: 0.2 },
  { type: 'zigzag', top: '35%', right: '30%', color: '#00FFFF', size: 60, rotate: -20, delay: 0.5 },
  { type: 'zigzag', top: '60%', left: '28%', color: '#FFD700', size: 65, rotate: 30, delay: 0.8 },
  { type: 'zigzag', top: '78%', right: '35%', color: '#39FF14', size: 55, rotate: -10, delay: 1.1 },
  
  // CIRCLES - bold solid circles
  { type: 'circle', top: '10%', left: '5%', color: '#FF1493', size: 35, delay: 0 },
  { type: 'circle', top: '18%', right: '8%', color: '#00FFFF', size: 28, delay: 0.4 },
  { type: 'circle', top: '42%', left: '2%', color: '#FFD700', size: 32, delay: 0.7 },
  { type: 'circle', top: '58%', right: '4%', color: '#39FF14', size: 25, delay: 1.0 },
  { type: 'circle', top: '72%', left: '10%', color: '#FF1493', size: 30, delay: 0.3 },
  { type: 'circle', top: '88%', right: '12%', color: '#00FFFF', size: 22, delay: 0.6 },
  
  // TRIANGLES - pointing various directions
  { type: 'triangle', top: '12%', left: '18%', color: '#FFD700', size: 24, rotate: 0, delay: 0.15 },
  { type: 'triangle', top: '28%', right: '18%', color: '#39FF14', size: 20, rotate: 60, delay: 0.45 },
  { type: 'triangle', top: '48%', left: '8%', color: '#FF1493', size: 26, rotate: 180, delay: 0.75 },
  { type: 'triangle', top: '62%', right: '15%', color: '#00FFFF', size: 22, rotate: 120, delay: 1.05 },
  { type: 'triangle', top: '80%', left: '22%', color: '#FFD700', size: 18, rotate: 240, delay: 0.35 },
  { type: 'triangle', top: '90%', right: '8%', color: '#39FF14', size: 24, rotate: 300, delay: 0.65 },
  
  // DOTS - small polka dots for texture
  { type: 'dot', top: '6%', left: '40%', color: '#FF1493', size: 8, delay: 0.05 },
  { type: 'dot', top: '14%', right: '35%', color: '#00FFFF', size: 6, delay: 0.25 },
  { type: 'dot', top: '24%', left: '30%', color: '#FFD700', size: 7, delay: 0.45 },
  { type: 'dot', top: '36%', right: '40%', color: '#39FF14', size: 9, delay: 0.65 },
  { type: 'dot', top: '50%', left: '38%', color: '#FF1493', size: 6, delay: 0.85 },
  { type: 'dot', top: '64%', right: '32%', color: '#00FFFF', size: 8, delay: 0.15 },
  { type: 'dot', top: '76%', left: '35%', color: '#FFD700', size: 7, delay: 0.35 },
  { type: 'dot', top: '86%', right: '38%', color: '#39FF14', size: 9, delay: 0.55 },
  
  // CROSSES - plus signs scattered
  { type: 'cross', top: '9%', right: '28%', color: '#FF1493', size: 18, rotate: 0, delay: 0.1 },
  { type: 'cross', top: '32%', left: '25%', color: '#00FFFF', size: 16, rotate: 45, delay: 0.5 },
  { type: 'cross', top: '54%', right: '22%', color: '#FFD700', size: 20, rotate: 0, delay: 0.9 },
  { type: 'cross', top: '70%', left: '30%', color: '#39FF14', size: 14, rotate: 45, delay: 0.2 },
  { type: 'cross', top: '88%', right: '30%', color: '#FF1493', size: 18, rotate: 0, delay: 0.6 },
  
  // HALF CIRCLES - Memphis style crescents
  { type: 'halfCircle', top: '16%', left: '42%', color: '#00FFFF', size: 28, rotate: 0, delay: 0.2 },
  { type: 'halfCircle', top: '40%', right: '38%', color: '#FFD700', size: 24, rotate: 90, delay: 0.6 },
  { type: 'halfCircle', top: '66%', left: '40%', color: '#FF1493', size: 26, rotate: 180, delay: 1.0 },
  { type: 'halfCircle', top: '84%', right: '42%', color: '#39FF14', size: 22, rotate: 270, delay: 0.4 },
];

// Render shape based on type
const MemphisShape = ({ type, size, color, rotate = 0 }: { type: string; size: number; color: string; rotate?: number }) => {
  if (type === 'confetti') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
        <rect x="10" y="10" width="80" height="80" fill={color} stroke="#000" strokeWidth="4" />
      </svg>
    );
  }
  
  if (type === 'squiggle') {
    return (
      <svg width={size} height={size * 0.5} viewBox="0 0 100 50" style={{ transform: `rotate(${rotate}deg)` }}>
        <path
          d="M5,25 Q15,5 25,25 Q35,45 45,25 Q55,5 65,25 Q75,45 85,25 Q95,5 95,25"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
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
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  
  if (type === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill={color} stroke="#000" strokeWidth="4" />
      </svg>
    );
  }
  
  if (type === 'triangle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
        <polygon points="50,5 95,95 5,95" fill={color} stroke="#000" strokeWidth="4" />
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
        <rect x="40" y="10" width="20" height="80" fill={color} stroke="#000" strokeWidth="3" />
        <rect x="10" y="40" width="80" height="20" fill={color} stroke="#000" strokeWidth="3" />
      </svg>
    );
  }
  
  if (type === 'halfCircle') {
    return (
      <svg width={size} height={size / 2} viewBox="0 0 100 50" style={{ transform: `rotate(${rotate}deg)` }}>
        <path
          d="M5,50 A45,45 0 0,1 95,50"
          fill={color}
          stroke="#000"
          strokeWidth="4"
        />
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
      {/* Memphis-style confetti and squiggles */}
      {memphisElements.map((element, index) => {
        const { type, color, size, delay, rotate, ...position } = element;
        return (
          <div
            key={`memphis-${index}`}
            className="absolute"
            style={{
              ...position,
              opacity: type === 'dot' ? 0.6 : 0.5,
              animation: `
                memphisBounce ${2.5 + (index % 4) * 0.5}s ease-in-out infinite,
                memphisDrift ${4 + (index % 3)}s ease-in-out infinite
              `,
              animationDelay: `${delay}s, ${delay + 0.3}s`,
            }}
          >
            <MemphisShape type={type} size={size} color={color} rotate={rotate || 0} />
          </div>
        );
      })}
      
      {/* CSS animations - bouncy and playful */}
      <style>{`
        @keyframes memphisBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.05);
          }
        }
        
        @keyframes memphisDrift {
          0%, 100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(6px) rotate(2deg);
          }
          75% {
            transform: translateX(-6px) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  );
};
