import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart } from 'lucide-react';

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

  const isValentines = theme === 'valentines';

  // Animate cupid flying back and forth
  useEffect(() => {
    if (!isValentines) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = prev + (direction * 1.5);
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

  // Periodically shoot arrows
  useEffect(() => {
    if (!isValentines) return;

    const shootInterval = setInterval(() => {
      const newArrow: Arrow = {
        id: arrowId,
        x: position + 3,
        angle: direction === 1 ? -30 : -150,
      };
      setArrows(prev => [...prev, newArrow]);
      setArrowId(prev => prev + 1);

      setTimeout(() => {
        setArrows(prev => prev.filter(a => a.id !== newArrow.id));
      }, 1500);
    }, 2500);

    return () => clearInterval(shootInterval);
  }, [position, direction, arrowId, isValentines]);

  // Don't render for non-valentines themes
  if (!isValentines) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 -top-16 h-24 pointer-events-none overflow-visible z-50">
      {/* Flying Cupid */}
      <div
        className="absolute top-2"
        style={{
          left: `${position}%`,
          transform: `scaleX(${direction})`,
          transition: 'left 0.05s linear',
        }}
      >
        <div className="relative">
          {/* Left Wing */}
          <div 
            className="absolute -left-4 -top-2"
            style={{ animation: 'cupidWingFlap 0.3s ease-in-out infinite alternate' }}
          >
            <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
              <path 
                d="M16 8C16 4 12 1 8 1C4 1 1 4 1 7C1 10 4 14 8 12" 
                stroke="rgba(255,182,193,0.9)" 
                strokeWidth="1.5"
                fill="rgba(255,192,203,0.5)"
              />
            </svg>
          </div>
          {/* Right Wing */}
          <div 
            className="absolute -right-4 -top-2"
            style={{ 
              animation: 'cupidWingFlap 0.3s ease-in-out infinite alternate-reverse',
              transform: 'scaleX(-1)'
            }}
          >
            <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
              <path 
                d="M16 8C16 4 12 1 8 1C4 1 1 4 1 7C1 10 4 14 8 12" 
                stroke="rgba(255,182,193,0.9)" 
                strokeWidth="1.5"
                fill="rgba(255,192,203,0.5)"
              />
            </svg>
          </div>
          
          {/* Heart Body with face */}
          <div 
            className="w-7 h-7 flex items-center justify-center relative"
            style={{ animation: 'cupidBob 1s ease-in-out infinite' }}
          >
            <Heart 
              className="w-6 h-6 text-pink-400" 
              fill="currentColor"
              style={{ filter: 'drop-shadow(0 0 8px #ff69b4)' }}
            />
            {/* Cute face */}
            <div className="absolute inset-0 flex items-center justify-center text-[7px] text-pink-900 font-bold" style={{ marginTop: '2px' }}>
              ◡‿◡
            </div>
          </div>
          
          {/* Bow & Arrow */}
          <div 
            className="absolute top-1/2 -translate-y-1/2"
            style={{ 
              right: direction === 1 ? '-14px' : 'auto',
              left: direction === -1 ? '-14px' : 'auto',
            }}
          >
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
              <path d="M2 2C8 2 12 6 12 9C12 12 8 16 2 16" stroke="#daa520" strokeWidth="2" fill="none"/>
              <path d="M2 2L2 16" stroke="#daa520" strokeWidth="1"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Flying arrows with heart tips */}
      {arrows.map((arrow) => (
        <div
          key={arrow.id}
          className="absolute"
          style={{
            left: `${arrow.x}%`,
            bottom: '32px',
            animation: 'arrowFly 1.5s ease-out forwards',
            transform: `rotate(${arrow.angle}deg)`,
          }}
        >
          <div className="relative flex items-center">
            {/* Feathers */}
            <div className="flex flex-col gap-0.5">
              <div className="w-2 h-1 bg-pink-300 rounded-full -rotate-12" />
              <div className="w-2 h-1 bg-pink-300 rounded-full rotate-12" />
            </div>
            {/* Shaft */}
            <div 
              className="w-10 h-0.5 bg-gradient-to-r from-amber-500 to-amber-300"
              style={{ boxShadow: '0 0 6px rgba(255,215,0,0.6)' }}
            />
            {/* Heart tip */}
            <Heart 
              className="w-3 h-3 text-rose-500 -ml-0.5" 
              fill="currentColor"
              style={{ filter: 'drop-shadow(0 0 4px #ff1493)' }}
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes cupidWingFlap {
          from { transform: rotate(-20deg) translateY(0); }
          to { transform: rotate(20deg) translateY(-3px); }
        }
        @keyframes cupidBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes arrowFly {
          0% { opacity: 1; transform: translateX(0) translateY(0); }
          100% { opacity: 0; transform: translateX(120px) translateY(-80px); }
        }
      `}</style>
    </div>
  );
};
