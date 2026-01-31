import { useTheme } from "@/contexts/ThemeContext";

/**
 * Matrix watermark - ASCII rabbit hidden in matrix code
 * Subtly visible in chat backgrounds
 */
export const MatrixWatermark = () => {
  const { theme } = useTheme();
  
  if (theme !== 'matrix') return null;
  
  // ASCII art rabbit made of matrix characters
  const asciiRabbit = `
    (\\(\\
    ( -.-)
    o_(")(")
  `;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ opacity: 0.06 }}
    >
      <div className="relative">
        {/* Main rabbit silhouette */}
        <div
          className="text-center font-mono"
          style={{
            fontSize: '150px',
            color: 'hsl(120 100% 50%)',
            filter: 'drop-shadow(0 0 20px hsl(120 100% 50% / 0.4))',
            animation: 'matrixRabbitFloat 8s ease-in-out infinite',
          }}
        >
          🐰
        </div>
        
        {/* Overlay text hint */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-xs whitespace-nowrap"
          style={{
            color: 'hsl(120 100% 60%)',
            textShadow: '0 0 10px hsl(120 100% 50%)',
            opacity: 0.8,
          }}
        >
          Wake up, Neo...
        </div>
      </div>
    </div>
  );
};
