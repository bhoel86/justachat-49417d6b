import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState, useMemo } from "react";

/**
 * Matrix-style falling code rain effect
 * Creates columns of falling characters across the screen
 */

// Matrix character set (Katakana + numbers + symbols)
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789@#$%^&*()+=[]{}|;:,.<>?";

interface CodeColumn {
  id: number;
  left: number;
  chars: string[];
  speed: number;
  opacity: number;
  delay: number;
}

const generateColumns = (count: number): CodeColumn[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: (i / count) * 100 + Math.random() * 2,
    chars: Array.from({ length: 15 + Math.floor(Math.random() * 10) }, () => 
      MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
    ),
    speed: 3 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.5,
    delay: Math.random() * 5,
  }));
};

export const MatrixFloatingCode = () => {
  const { theme } = useTheme();
  const [columns, setColumns] = useState<CodeColumn[]>([]);
  
  // Generate columns on mount
  useEffect(() => {
    if (theme === 'matrix') {
      const columnCount = Math.floor(window.innerWidth / 30);
      setColumns(generateColumns(columnCount));
    }
  }, [theme]);

  // Periodically randomize characters
  useEffect(() => {
    if (theme !== 'matrix') return;
    
    const interval = setInterval(() => {
      setColumns(prev => prev.map(col => ({
        ...col,
        chars: col.chars.map((char, i) => 
          Math.random() > 0.9 
            ? MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
            : char
        )
      })));
    }, 200);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme !== 'matrix') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute top-0 flex flex-col text-xs font-mono"
          style={{
            left: `${col.left}%`,
            animation: `matrixRain ${col.speed}s linear infinite`,
            animationDelay: `${col.delay}s`,
            opacity: col.opacity,
          }}
        >
          {col.chars.map((char, i) => (
            <span
              key={i}
              className="leading-tight"
              style={{
                color: i === 0 
                  ? 'hsl(120 100% 90%)' 
                  : i < 3 
                    ? 'hsl(120 100% 70%)' 
                    : 'hsl(120 100% 50%)',
                textShadow: i === 0 
                  ? '0 0 10px hsl(120 100% 70%), 0 0 20px hsl(120 100% 50%)' 
                  : '0 0 5px hsl(120 100% 50%)',
                opacity: 1 - (i / col.chars.length) * 0.7,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
      
      {/* Hidden rabbit silhouettes - Easter eggs */}
      <div
        className="absolute opacity-[0.04] pointer-events-none"
        style={{
          top: '20%',
          right: '10%',
          fontSize: '120px',
          color: 'hsl(120 100% 50%)',
          animation: 'matrixRabbitFloat 8s ease-in-out infinite',
          textShadow: '0 0 20px hsl(120 100% 50%)',
        }}
      >
        🐰
      </div>
      <div
        className="absolute opacity-[0.03] pointer-events-none"
        style={{
          bottom: '15%',
          left: '5%',
          fontSize: '80px',
          color: 'hsl(120 100% 50%)',
          animation: 'matrixRabbitFloat 10s ease-in-out infinite 2s',
          textShadow: '0 0 15px hsl(120 100% 50%)',
          transform: 'scaleX(-1)',
        }}
      >
        🐇
      </div>

      {/* Ambient corner glows */}
      <div 
        className="absolute top-0 left-0 w-96 h-96 opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(120 100% 50%) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-96 h-96 opacity-15"
        style={{
          background: 'radial-gradient(circle, hsl(120 100% 50%) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
};
