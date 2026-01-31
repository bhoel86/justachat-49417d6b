import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

// Baby angel cherub SVG - cute chubby baby with feathered wings
const BabyAngel: React.FC<{ size?: number }> = ({ size = 80 }) => {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 100 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(255,105,180,0.4))' }}
    >
      {/* Left wing - large feathered */}
      <g style={{ animation: 'cupidWingFlap 0.6s ease-in-out infinite alternate' }}>
        <ellipse cx="18" cy="40" rx="16" ry="28" fill="#fff0f5" stroke="#ffb6c1" strokeWidth="1" />
        <ellipse cx="14" cy="38" rx="10" ry="20" fill="#ffe4ec" />
        <ellipse cx="10" cy="36" rx="6" ry="14" fill="#ffd1dc" />
        {/* Feather lines */}
        <path d="M8 28c4 2 8 4 12 3" stroke="#ffb6c1" strokeWidth="0.5" />
        <path d="M6 36c5 1 10 2 14 1" stroke="#ffb6c1" strokeWidth="0.5" />
        <path d="M8 44c4 0 9 0 12-1" stroke="#ffb6c1" strokeWidth="0.5" />
        <path d="M10 52c3-1 7-2 10-3" stroke="#ffb6c1" strokeWidth="0.5" />
      </g>
      
      {/* Right wing - large feathered */}
      <g style={{ animation: 'cupidWingFlap 0.6s ease-in-out infinite alternate-reverse' }}>
        <ellipse cx="82" cy="40" rx="16" ry="28" fill="#fff0f5" stroke="#ffb6c1" strokeWidth="1" />
        <ellipse cx="86" cy="38" rx="10" ry="20" fill="#ffe4ec" />
        <ellipse cx="90" cy="36" rx="6" ry="14" fill="#ffd1dc" />
        {/* Feather lines */}
        <path d="M92 28c-4 2-8 4-12 3" stroke="#ffb6c1" strokeWidth="0.5" />
        <path d="M94 36c-5 1-10 2-14 1" stroke="#ffb6c1" strokeWidth="0.5" />
        <path d="M92 44c-4 0-9 0-12-1" stroke="#ffb6c1" strokeWidth="0.5" />
        <path d="M90 52c-3-1-7-2-10-3" stroke="#ffb6c1" strokeWidth="0.5" />
      </g>

      {/* Halo */}
      <ellipse
        cx="50"
        cy="12"
        rx="14"
        ry="4"
        stroke="#ffd700"
        strokeWidth="2"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }}
      />

      {/* Baby body - chubby */}
      <ellipse cx="50" cy="62" rx="14" ry="18" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="1" />
      
      {/* Diaper/cloth */}
      <ellipse cx="50" cy="72" rx="12" ry="8" fill="#fff" stroke="#e0e0e0" strokeWidth="0.5" />

      {/* Baby head - round chubby */}
      <circle cx="50" cy="36" r="18" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="1" />
      
      {/* Rosy cheeks */}
      <circle cx="38" cy="40" r="4" fill="#ffb6c1" opacity="0.5" />
      <circle cx="62" cy="40" r="4" fill="#ffb6c1" opacity="0.5" />
      
      {/* Eyes - cute big */}
      <ellipse cx="44" cy="34" rx="3" ry="4" fill="#4a3728" />
      <ellipse cx="56" cy="34" rx="3" ry="4" fill="#4a3728" />
      <circle cx="45" cy="33" r="1" fill="#fff" />
      <circle cx="57" cy="33" r="1" fill="#fff" />
      
      {/* Eyebrows */}
      <path d="M40 28c2-1 4-1 6 0" stroke="#8b7355" strokeWidth="1" strokeLinecap="round" />
      <path d="M54 28c2-1 4-1 6 0" stroke="#8b7355" strokeWidth="1" strokeLinecap="round" />
      
      {/* Cute smile */}
      <path d="M45 44c3 3 7 3 10 0" stroke="#c9a077" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      
      {/* Little nose */}
      <ellipse cx="50" cy="39" rx="2" ry="1.5" fill="#f5cba7" />
      
      {/* Curly hair tufts */}
      <circle cx="38" cy="22" r="4" fill="#f4d03f" />
      <circle cx="50" cy="18" r="5" fill="#f4d03f" />
      <circle cx="62" cy="22" r="4" fill="#f4d03f" />
      <circle cx="44" cy="20" r="3" fill="#f7dc6f" />
      <circle cx="56" cy="20" r="3" fill="#f7dc6f" />

      {/* Arms - chubby baby arms */}
      <ellipse cx="34" cy="58" rx="6" ry="4" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="0.5" transform="rotate(-20 34 58)" />
      <ellipse cx="66" cy="58" rx="6" ry="4" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="0.5" transform="rotate(20 66 58)" />
      
      {/* Little hands */}
      <circle cx="28" cy="56" r="3" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="0.5" />
      <circle cx="72" cy="56" r="3" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="0.5" />

      {/* Feet */}
      <ellipse cx="42" cy="82" rx="5" ry="3" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="0.5" />
      <ellipse cx="58" cy="82" rx="5" ry="3" fill="#ffe4c9" stroke="#f5cba7" strokeWidth="0.5" />
    </svg>
  );
};

interface Arrow {
  id: number;
  x: number;
  angle: number;
}

export const ValentinesCupid: React.FC = () => {
  const { theme } = useTheme();
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [arrowId, setArrowId] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const isValentines = theme === 'valentines';

  // Ensure portal target exists
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animate cupid flying back and forth - SLOWER
  useEffect(() => {
    if (!isValentines) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = prev + (direction * 0.4); // Much slower movement
        if (newPos >= 85) {
          setDirection(-1);
          return 85;
        }
        if (newPos <= 0) {
          setDirection(1);
          return 0;
        }
        return newPos;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction, isValentines]);

  // Periodically shoot arrows - less frequent
  useEffect(() => {
    if (!isValentines) return;

    const shootInterval = setInterval(() => {
      const newArrow: Arrow = {
        id: arrowId,
        x: position + 4,
        angle: direction === 1 ? -25 : -155,
      };
      setArrows(prev => [...prev, newArrow]);
      setArrowId(prev => prev + 1);

      setTimeout(() => {
        setArrows(prev => prev.filter(a => a.id !== newArrow.id));
      }, 2000);
    }, 4000); // Shoot every 4 seconds

    return () => clearInterval(shootInterval);
  }, [position, direction, arrowId, isValentines]);

  // Don't render for non-valentines themes
  if (!isValentines || !isMounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed left-0 right-0 bottom-4 h-28 pointer-events-none overflow-visible z-50">
      {/* Flying Baby Angel */}
      <div
        className="absolute"
        style={{
          left: `${position}%`,
          transform: `scaleX(${direction})`,
          transition: 'left 0.05s linear',
          animation: 'cupidBob 2s ease-in-out infinite',
        }}
      >
        <BabyAngel size={90} />
        
        {/* Bow held by baby */}
        <div
          className="absolute top-1/2"
          style={{
            right: direction === 1 ? '-8px' : 'auto',
            left: direction === -1 ? '-8px' : 'auto',
            transform: 'translateY(-50%)',
          }}
        >
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none" aria-hidden="true">
            <path
              d="M4 4c8 0 12 5 12 10s-4 10-12 10"
              stroke="#daa520"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M4 4v20"
              stroke="#8b4513"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Flying arrows with heart tips */}
      {arrows.map((arrow) => (
        <div
          key={arrow.id}
          className="absolute"
          style={{
            left: `${arrow.x}%`,
            bottom: '50px',
            animation: 'arrowFly 2s ease-out forwards',
            transform: `rotate(${arrow.angle}deg)`,
          }}
        >
          <div className="relative flex items-center">
            {/* Feathers */}
            <div className="flex flex-col gap-1">
              <div className="w-4 h-1.5 bg-pink-300 rounded-full -rotate-15" />
              <div className="w-4 h-1.5 bg-pink-200 rounded-full" />
              <div className="w-4 h-1.5 bg-pink-300 rounded-full rotate-15" />
            </div>
            {/* Shaft */}
            <div 
              className="w-16 h-1 bg-gradient-to-r from-amber-600 to-amber-400 rounded"
              style={{ boxShadow: '0 0 8px rgba(255,215,0,0.5)' }}
            />
            {/* Heart tip */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="-ml-1"
              style={{ filter: 'drop-shadow(0 0 6px #ff1493)' }}
            >
              <path
                d="M12 21s-8-5.5-10-9.5C0 7 3 4 6.5 4c2 0 3.8 1 5.5 3 1.7-2 3.5-3 5.5-3C21 4 24 7 22 11.5 20 15.5 12 21 12 21z"
                fill="#ff1493"
              />
            </svg>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes cupidWingFlap {
          from { transform: rotate(-8deg) translateY(0); }
          to { transform: rotate(8deg) translateY(-4px); }
        }
        @keyframes cupidBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes arrowFly {
          0% { opacity: 1; transform: translateX(0) translateY(0); }
          100% { opacity: 0; transform: translateX(180px) translateY(-120px); }
        }
      `}</style>
    </div>,
    document.body
  );
};