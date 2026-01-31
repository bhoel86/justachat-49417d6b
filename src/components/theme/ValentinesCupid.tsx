import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';
import cupidImage from '@/assets/cupid-angel.png';

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

  // Animate cupid flying back and forth - gentle pace
  useEffect(() => {
    if (!isValentines) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        const newPos = prev + (direction * 0.3);
        if (newPos >= 82) {
          setDirection(-1);
          return 82;
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
        x: position + 6,
        angle: direction === 1 ? -20 : -160,
      };
      setArrows(prev => [...prev, newArrow]);
      setArrowId(prev => prev + 1);

      setTimeout(() => {
        setArrows(prev => prev.filter(a => a.id !== newArrow.id));
      }, 2500);
    }, 5000);

    return () => clearInterval(shootInterval);
  }, [position, direction, arrowId, isValentines]);

  if (!isValentines || !isMounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed left-0 right-0 bottom-2 sm:bottom-4 h-36 pointer-events-none overflow-visible z-50">
      {/* Flying Cupid */}
      <div
        className="absolute"
        style={{
          left: `${position}%`,
          transform: `scaleX(${direction})`,
          transition: 'left 0.05s linear',
        }}
      >
        <div
          style={{
            animation: 'cupidBob 2.5s ease-in-out infinite',
          }}
        >
          <img 
            src={cupidImage} 
            alt="" 
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(255,105,180,0.5))',
            }}
          />
        </div>
      </div>

      {/* Flying arrows with heart tips */}
      {arrows.map((arrow) => (
        <div
          key={arrow.id}
          className="absolute"
          style={{
            left: `${arrow.x}%`,
            bottom: '70px',
            animation: 'arrowFly 2.5s ease-out forwards',
            transform: `rotate(${arrow.angle}deg)`,
          }}
        >
          <div className="relative flex items-center">
            {/* Feathers */}
            <div className="flex flex-col gap-0.5">
              <div className="w-3 h-1 bg-primary/40 rounded-full -rotate-12" />
              <div className="w-3 h-1 bg-primary/30 rounded-full" />
              <div className="w-3 h-1 bg-primary/40 rounded-full rotate-12" />
            </div>
            {/* Shaft */}
            <div 
              className="w-14 h-1 rounded bg-gradient-to-r from-amber-600 to-amber-300"
              style={{ boxShadow: '0 0 8px rgba(255,215,0,0.5)' }}
            />
            {/* Heart tip */}
            <svg
              width="16"
              height="16"
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
        @keyframes cupidBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes arrowFly {
          0% { opacity: 1; transform: translateX(0) translateY(0); }
          100% { opacity: 0; transform: translateX(200px) translateY(-140px); }
        }
      `}</style>
    </div>,
    document.body
  );
};