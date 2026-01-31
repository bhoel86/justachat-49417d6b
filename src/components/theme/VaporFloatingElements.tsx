import React, { useMemo } from 'react';

// Vaporwave 90s OS floating decorations - Windows 95 style mixed with neon
const VaporFloatingElements: React.FC = () => {
  // Generate random positions for floating elements
  const elements = useMemo(() => {
    const items = [];
    
    // Windows/panels - small retro windows
    for (let i = 0; i < 6; i++) {
      items.push({
        type: 'window',
        left: Math.random() * 90 + 5,
        top: Math.random() * 80 + 10,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        size: 24 + Math.random() * 16,
      });
    }
    
    // Stars / sparkles
    for (let i = 0; i < 12; i++) {
      items.push({
        type: 'star',
        left: Math.random() * 95,
        top: Math.random() * 90,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
        size: 8 + Math.random() * 12,
      });
    }
    
    // Geometric shapes (triangles, circles, squares)
    for (let i = 0; i < 8; i++) {
      const shapes = ['triangle', 'circle', 'square'];
      items.push({
        type: shapes[Math.floor(Math.random() * shapes.length)],
        left: Math.random() * 90,
        top: Math.random() * 85,
        delay: Math.random() * 6,
        duration: 20 + Math.random() * 15,
        size: 16 + Math.random() * 24,
        color: ['#2EF2C2', '#FFE066', '#FF5C8A', '#8F7AC8'][Math.floor(Math.random() * 4)],
      });
    }
    
    // Cursor arrows
    for (let i = 0; i < 4; i++) {
      items.push({
        type: 'cursor',
        left: Math.random() * 85,
        top: Math.random() * 80,
        delay: Math.random() * 8,
        duration: 25 + Math.random() * 10,
        size: 18 + Math.random() * 10,
      });
    }
    
    return items;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {elements.map((el, idx) => (
        <div
          key={idx}
          className="absolute"
          style={{
            left: `${el.left}%`,
            top: `${el.top}%`,
            animation: el.type === 'star' 
              ? `vaporTwinkle ${el.duration}s ease-in-out infinite`
              : `vaporFloat ${el.duration}s ease-in-out infinite`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {el.type === 'window' && (
            <svg
              width={el.size}
              height={el.size * 0.8}
              viewBox="0 0 40 32"
              fill="none"
              style={{ opacity: 0.3 }}
            >
              {/* Window frame */}
              <rect x="0" y="0" width="40" height="32" fill="#8F7AC8" stroke="#1A1A1A" strokeWidth="2" />
              {/* Title bar */}
              <rect x="2" y="2" width="36" height="6" fill="#2EF2C2" />
              {/* Close button */}
              <rect x="32" y="3" width="4" height="4" fill="#FF5C8A" stroke="#1A1A1A" strokeWidth="0.5" />
              {/* Content area */}
              <rect x="2" y="10" width="36" height="20" fill="#F5F1E8" stroke="#1A1A1A" strokeWidth="0.5" />
              {/* Content lines */}
              <line x1="5" y1="14" x2="30" y2="14" stroke="#DADADA" strokeWidth="1" />
              <line x1="5" y1="18" x2="25" y2="18" stroke="#DADADA" strokeWidth="1" />
              <line x1="5" y1="22" x2="28" y2="22" stroke="#DADADA" strokeWidth="1" />
            </svg>
          )}
          
          {el.type === 'star' && (
            <svg
              width={el.size}
              height={el.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.6 }}
            >
              <path
                d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
                fill="#2EF2C2"
              />
            </svg>
          )}
          
          {el.type === 'triangle' && (
            <svg
              width={el.size}
              height={el.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.25 }}
            >
              <polygon
                points="12,2 22,22 2,22"
                fill="none"
                stroke={el.color}
                strokeWidth="2"
              />
            </svg>
          )}
          
          {el.type === 'circle' && (
            <svg
              width={el.size}
              height={el.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.25 }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke={el.color}
                strokeWidth="2"
              />
            </svg>
          )}
          
          {el.type === 'square' && (
            <svg
              width={el.size}
              height={el.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.25 }}
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                fill="none"
                stroke={el.color}
                strokeWidth="2"
              />
            </svg>
          )}
          
          {el.type === 'cursor' && (
            <svg
              width={el.size}
              height={el.size * 1.3}
              viewBox="0 0 24 32"
              fill="none"
              style={{ opacity: 0.35 }}
            >
              {/* Classic pointer cursor */}
              <path
                d="M4 2L4 24L10 18L14 28L18 26L14 16L22 16L4 2Z"
                fill="#F5F1E8"
                stroke="#1A1A1A"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

export default VaporFloatingElements;
