/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useMemo } from 'react';

interface AudioVisualizerRingProps {
  audioLevel: number;
  size?: number;
  className?: string;
  children: React.ReactNode;
}

const AudioVisualizerRing = ({ 
  audioLevel, 
  size = 64, 
  className = '',
  children 
}: AudioVisualizerRingProps) => {
  // Normalize audio level to a scale factor (1.0 to 1.3)
  const scale = useMemo(() => {
    const normalizedLevel = Math.min(100, Math.max(0, audioLevel));
    return 1 + (normalizedLevel / 100) * 0.3;
  }, [audioLevel]);

  // Ring opacity based on audio level
  const ringOpacity = useMemo(() => {
    return Math.min(1, 0.3 + (audioLevel / 100) * 0.7);
  }, [audioLevel]);

  // Color intensity based on audio level
  const ringColor = useMemo(() => {
    if (audioLevel > 80) return 'from-red-500 via-orange-500 to-yellow-500';
    if (audioLevel > 50) return 'from-orange-500 via-yellow-500 to-green-500';
    return 'from-green-500 via-emerald-400 to-cyan-500';
  }, [audioLevel]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer pulsing ring */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-r ${ringColor} blur-sm transition-transform duration-75`}
        style={{ 
          transform: `scale(${scale})`,
          opacity: ringOpacity * 0.6,
        }}
      />
      
      {/* Inner glow ring */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-r ${ringColor} transition-transform duration-75`}
        style={{ 
          transform: `scale(${1 + (audioLevel / 100) * 0.15})`,
          opacity: ringOpacity * 0.4,
        }}
      />
      
      {/* Animated ring segments */}
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ transform: `scale(${scale})` }}
      >
        <defs>
          <linearGradient id="audioGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="url(#audioGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${audioLevel * 2.8} 1000`}
          style={{
            opacity: ringOpacity,
            transition: 'stroke-dasharray 75ms ease-out',
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>
      
      {/* Content (avatar) */}
      <div className="absolute inset-1 rounded-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AudioVisualizerRing;
