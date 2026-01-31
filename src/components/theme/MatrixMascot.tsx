import { useTheme } from "@/contexts/ThemeContext";

/**
 * Matrix footer mascots - white rabbit silhouettes
 * Left: rabbit facing right, Right: rabbit facing left
 */

// Matrix-styled rabbit SVG
const MatrixRabbit = ({ facing = 'right' }: { facing?: 'left' | 'right' }) => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    style={{
      transform: facing === 'left' ? 'scaleX(-1)' : 'none',
      filter: 'drop-shadow(0 0 10px hsl(120 100% 50% / 0.5))',
    }}
  >
    {/* Rabbit body - simplified geometric style */}
    <ellipse cx="24" cy="32" rx="12" ry="10" fill="hsl(120 100% 50%)" fillOpacity="0.8" />
    
    {/* Head */}
    <circle cx="24" cy="20" r="8" fill="hsl(120 100% 50%)" fillOpacity="0.8" />
    
    {/* Ears */}
    <ellipse cx="20" cy="8" rx="3" ry="8" fill="hsl(120 100% 50%)" fillOpacity="0.7" />
    <ellipse cx="28" cy="8" rx="3" ry="8" fill="hsl(120 100% 50%)" fillOpacity="0.7" />
    
    {/* Inner ears */}
    <ellipse cx="20" cy="8" rx="1.5" ry="5" fill="hsl(120 100% 30%)" fillOpacity="0.5" />
    <ellipse cx="28" cy="8" rx="1.5" ry="5" fill="hsl(120 100% 30%)" fillOpacity="0.5" />
    
    {/* Eye - glowing */}
    <circle cx="26" cy="19" r="2" fill="hsl(120 100% 90%)" />
    <circle cx="26" cy="19" r="1" fill="hsl(0 0% 0%)" />
    
    {/* Tail */}
    <circle cx="36" cy="34" r="4" fill="hsl(120 100% 60%)" fillOpacity="0.6" />
    
    {/* Matrix code overlay hint */}
    <text x="24" y="32" textAnchor="middle" fill="hsl(120 100% 30%)" fontSize="4" fontFamily="monospace" fillOpacity="0.5">
      01
    </text>
  </svg>
);

// Red pill / Blue pill icons
const RedPill = () => (
  <div
    className="w-10 h-10 rounded-full flex items-center justify-center"
    style={{
      background: 'linear-gradient(135deg, hsl(0 80% 50%) 0%, hsl(0 70% 40%) 100%)',
      boxShadow: '0 0 15px hsl(0 80% 50% / 0.5)',
      border: '1px solid hsl(0 80% 60%)',
    }}
  >
    <span className="font-mono text-xs text-white" style={{ textShadow: '0 0 5px hsl(0 80% 50%)' }}>
      真
    </span>
  </div>
);

const BluePill = () => (
  <div
    className="w-10 h-10 rounded-full flex items-center justify-center"
    style={{
      background: 'linear-gradient(135deg, hsl(210 80% 50%) 0%, hsl(210 70% 40%) 100%)',
      boxShadow: '0 0 15px hsl(210 80% 50% / 0.5)',
      border: '1px solid hsl(210 80% 60%)',
    }}
  >
    <span className="font-mono text-xs text-white" style={{ textShadow: '0 0 5px hsl(210 80% 50%)' }}>
      偽
    </span>
  </div>
);

export const MatrixMascot = ({ side }: { side: 'left' | 'right' }) => {
  const { theme } = useTheme();
  
  if (theme !== 'matrix') return null;
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center gap-2"
      style={{
        animation: 'matrixRabbitFloat 5s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      {side === 'left' ? (
        <>
          <MatrixRabbit facing="right" />
          <RedPill />
        </>
      ) : (
        <>
          <BluePill />
          <MatrixRabbit facing="left" />
        </>
      )}
    </div>
  );
};
