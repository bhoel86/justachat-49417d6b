import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/contexts/ThemeContext';

const CherubIcon: React.FC = () => {
  // Simple “baby with wings” cherub using theme tokens
  // Note: using CSS variables keeps this consistent with the design system.
  return (
    <svg
      width="44"
      height="32"
      viewBox="0 0 44 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.35))' }}
    >
      {/* Left wing */}
      <path
        d="M6 18c0-6 6-11 12-9-5 2-7 6-7 10 0 3 1 6 3 8-5 0-8-4-8-9Z"
        fill="hsl(var(--primary) / 0.18)"
        stroke="hsl(var(--primary) / 0.45)"
        strokeWidth="1"
      />
      {/* Right wing */}
      <path
        d="M38 18c0-6-6-11-12-9 5 2 7 6 7 10 0 3-1 6-3 8 5 0 8-4 8-9Z"
        fill="hsl(var(--primary) / 0.18)"
        stroke="hsl(var(--primary) / 0.45)"
        strokeWidth="1"
      />

      {/* Halo */}
      <ellipse
        cx="22"
        cy="6"
        rx="10"
        ry="3"
        stroke="hsl(var(--accent) / 0.85)"
        strokeWidth="1.5"
        fill="hsl(var(--accent) / 0.20)"
      />

      {/* Head */}
      <circle
        cx="22"
        cy="15"
        r="7"
        fill="hsl(var(--foreground) / 0.06)"
        stroke="hsl(var(--foreground) / 0.22)"
        strokeWidth="1"
      />

      {/* Face */}
      <circle cx="19" cy="14.5" r="0.9" fill="hsl(var(--foreground) / 0.7)" />
      <circle cx="25" cy="14.5" r="0.9" fill="hsl(var(--foreground) / 0.7)" />
      <path
        d="M20.5 18.2c1 .9 2.2.9 3.2 0"
        stroke="hsl(var(--foreground) / 0.55)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Body */}
      <path
        d="M17 30c0-6 10-6 10 0"
        stroke="hsl(var(--foreground) / 0.22)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Tiny heart */}
      <path
        d="M22 23.2c-1.6-1.3-3.6.2-2.5 1.9.7 1.1 2.5 2.1 2.5 2.1s1.8-1 2.5-2.1c1.1-1.7-.9-3.2-2.5-1.9Z"
        fill="hsl(var(--primary) / 0.65)"
      />
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
  if (!isValentines || !isMounted || typeof document === 'undefined') {
    return null;
  }

  // NOTE: fixed positioning prevents clipping from any ancestor containers
  // (some pages use overflow/isolation for layered backgrounds).
  return createPortal(
    <div className="fixed left-0 right-0 bottom-6 sm:bottom-8 h-16 pointer-events-none overflow-visible z-50">
      {/* Flying Cupid */}
      <div
        className="absolute top-0"
        style={{
          left: `${position}%`,
          transform: `scaleX(${direction})`,
          transition: 'left 0.05s linear',
        }}
      >
        <div
          className="relative"
          style={{ animation: 'cupidBob 1s ease-in-out infinite' }}
        >
          <CherubIcon />

          {/* Simple bow */}
          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              right: direction === 1 ? '-10px' : 'auto',
              left: direction === -1 ? '-10px' : 'auto',
            }}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true">
              <path
                d="M2 2c5 0 8 3 8 6 0 3-3 6-8 6"
                stroke="hsl(var(--accent) / 0.9)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M2 2v12"
                stroke="hsl(var(--accent) / 0.65)"
                strokeWidth="1"
                strokeLinecap="round"
              />
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
            bottom: '18px',
            animation: 'arrowFly 1.5s ease-out forwards',
            transform: `rotate(${arrow.angle}deg)`,
          }}
        >
          <div className="relative flex items-center">
            {/* Feathers */}
            <div className="flex flex-col gap-0.5">
              <div className="w-2 h-1 bg-primary/30 rounded-full -rotate-12" />
              <div className="w-2 h-1 bg-primary/30 rounded-full rotate-12" />
            </div>
            {/* Shaft */}
            <div 
              className="w-10 h-0.5 bg-gradient-to-r from-accent/80 to-accent/40"
              style={{ boxShadow: '0 0 10px hsl(var(--accent) / 0.35)' }}
            />
            {/* Heart tip */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="-ml-0.5"
              style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.35))' }}
            >
              <path
                d="M12 21s-6.7-4.4-9.2-8.2C.8 9.5 3 6.5 6.2 6.5c1.7 0 3.2.9 3.8 2.1.6-1.2 2.1-2.1 3.8-2.1 3.2 0 5.4 3 3.4 6.3C18.7 16.6 12 21 12 21z"
                fill="hsl(var(--primary) / 0.7)"
              />
            </svg>
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
    </div>,
    document.body
  );
};
