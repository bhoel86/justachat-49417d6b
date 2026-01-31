import React from 'react';

interface VaporMascotProps {
  side: 'left' | 'right';
  className?: string;
}

export const VaporMascot: React.FC<VaporMascotProps> = ({ side, className = '' }) => {
  if (side === 'left') {
    // Left side: Retro computer with CRT monitor - vaporwave style
    return (
      <div className={`h-14 sm:h-16 flex items-end justify-center ${className}`}>
        <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
          {/* Monitor body */}
          <rect x="8" y="4" width="48" height="38" rx="2" fill="#8F7AC8" stroke="#1A1A1A" strokeWidth="3" />
          {/* Screen bezel */}
          <rect x="12" y="8" width="40" height="28" fill="#1A1A1A" />
          {/* Screen */}
          <rect x="14" y="10" width="36" height="24" fill="#2EF2C2" opacity="0.3" />
          {/* Scanlines effect */}
          <g opacity="0.4">
            <line x1="14" y1="14" x2="50" y2="14" stroke="#2EF2C2" strokeWidth="0.5" />
            <line x1="14" y1="18" x2="50" y2="18" stroke="#2EF2C2" strokeWidth="0.5" />
            <line x1="14" y1="22" x2="50" y2="22" stroke="#2EF2C2" strokeWidth="0.5" />
            <line x1="14" y1="26" x2="50" y2="26" stroke="#2EF2C2" strokeWidth="0.5" />
            <line x1="14" y1="30" x2="50" y2="30" stroke="#2EF2C2" strokeWidth="0.5" />
          </g>
          {/* Text on screen */}
          <text x="20" y="23" fill="#2EF2C2" fontSize="8" fontFamily="monospace" fontWeight="bold">JAC</text>
          {/* Monitor stand */}
          <rect x="26" y="42" width="12" height="6" fill="#8F7AC8" stroke="#1A1A1A" strokeWidth="2" />
          {/* Monitor base */}
          <rect x="18" y="48" width="28" height="6" rx="1" fill="#8F7AC8" stroke="#1A1A1A" strokeWidth="2" />
          {/* Power LED */}
          <circle cx="50" cy="38" r="2" fill="#2EF2C2" />
          {/* Neon glow effect */}
          <rect x="14" y="10" width="36" height="24" fill="none" stroke="#2EF2C2" strokeWidth="0.5" opacity="0.6" />
        </svg>
      </div>
    );
  }
  
  // Right side: Floppy disk - vaporwave style
  return (
    <div className={`h-14 sm:h-16 flex items-end justify-center ${className}`}>
      <svg width="48" height="56" viewBox="0 0 52 60" fill="none">
        {/* Disk body */}
        <rect x="4" y="4" width="44" height="52" rx="2" fill="#FFE066" stroke="#1A1A1A" strokeWidth="3" />
        {/* Metal slider area */}
        <rect x="14" y="4" width="24" height="16" fill="#DADADA" stroke="#1A1A1A" strokeWidth="1" />
        {/* Slider opening */}
        <rect x="20" y="6" width="12" height="12" fill="#1A1A1A" />
        {/* Slider */}
        <rect x="16" y="8" width="8" height="10" fill="#F5F1E8" stroke="#1A1A1A" strokeWidth="0.5" />
        {/* Label area */}
        <rect x="8" y="26" width="36" height="24" fill="#F5F1E8" stroke="#1A1A1A" strokeWidth="1" />
        {/* Label text */}
        <text x="14" y="40" fill="#8F7AC8" fontSize="7" fontFamily="monospace" fontWeight="bold">JUSTACHAT</text>
        <text x="20" y="48" fill="#1A1A1A" fontSize="5" fontFamily="monospace">1.44 MB</text>
        {/* Corner notch */}
        <path d="M4 4L4 12L12 4Z" fill="#FFB6D5" stroke="#1A1A1A" strokeWidth="1" />
        {/* Write protect hole */}
        <rect x="38" y="48" width="6" height="6" fill="none" stroke="#1A1A1A" strokeWidth="1" />
      </svg>
    </div>
  );
};
