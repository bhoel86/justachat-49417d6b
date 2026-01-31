import React from 'react';

const VaporWatermark: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(46, 242, 194, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46, 242, 194, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Corner decorations - Windows 95 style buttons */}
      <div className="absolute top-4 left-4 opacity-10">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="80" height="80" fill="#8F7AC8" stroke="#1A1A1A" strokeWidth="3" />
          <rect x="4" y="4" width="72" height="12" fill="#2EF2C2" />
          <text x="8" y="13" fill="#1A1A1A" fontSize="8" fontFamily="monospace">SYSTEM</text>
        </svg>
      </div>
      
      <div className="absolute top-4 right-4 opacity-10">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="80" height="80" fill="#FFE066" stroke="#1A1A1A" strokeWidth="3" />
          <rect x="4" y="4" width="72" height="12" fill="#FF5C8A" />
          <text x="8" y="13" fill="#1A1A1A" fontSize="8" fontFamily="monospace">ALERTS</text>
        </svg>
      </div>
      
      <div className="absolute bottom-4 left-4 opacity-10">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="80" height="80" fill="#FFB6D5" stroke="#1A1A1A" strokeWidth="3" />
          <rect x="4" y="4" width="72" height="12" fill="#8F7AC8" />
          <text x="8" y="13" fill="#F5F1E8" fontSize="8" fontFamily="monospace">INBOX</text>
        </svg>
      </div>
      
      <div className="absolute bottom-4 right-4 opacity-10">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="80" height="80" fill="#2EF2C2" stroke="#1A1A1A" strokeWidth="3" />
          <rect x="4" y="4" width="72" height="12" fill="#FFE066" />
          <text x="8" y="13" fill="#1A1A1A" fontSize="8" fontFamily="monospace">NETWORK</text>
        </svg>
      </div>
      
      {/* Center watermark text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="opacity-[0.04] transform rotate-[-15deg]">
          <span 
            className="text-8xl font-bold tracking-widest"
            style={{ 
              fontFamily: "'Press Start 2P', monospace",
              color: '#8F7AC8',
              textShadow: '4px 4px 0 #1A1A1A'
            }}
          >
            JAC
          </span>
        </div>
      </div>
    </div>
  );
};

export default VaporWatermark;
