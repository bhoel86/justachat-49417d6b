import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

/**
 * Matrix-style falling code rain effect
 * Creates dense columns of falling characters with JUSTACHAT mixed in
 */

// Matrix character set (Katakana + numbers + symbols + JUSTACHAT letters)
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンJUSTACHAT0123456789@#$%^&*";
const JUSTACHAT_CHARS = "JUSTACHAT";

interface CodeColumn {
  id: number;
  left: number;
  chars: string[];
  speed: number;
  opacity: number;
  delay: number;
  isJustachat: boolean; // Special columns that spell JUSTACHAT
}

const generateColumns = (count: number): CodeColumn[] => {
  return Array.from({ length: count }, (_, i) => {
    // Every ~15th column is a "JUSTACHAT" column
    const isJustachat = i % 15 === 0;
    const charSet = isJustachat ? JUSTACHAT_CHARS : MATRIX_CHARS;
    
    return {
      id: i,
      left: (i / count) * 100, // Tighter spacing, no random offset
      chars: Array.from({ length: 20 + Math.floor(Math.random() * 15) }, () => 
        charSet[Math.floor(Math.random() * charSet.length)]
      ),
      speed: 8 + Math.random() * 6, // Slower: 8-14 seconds instead of 3-7
      opacity: 0.4 + Math.random() * 0.4,
      delay: Math.random() * 8,
      isJustachat,
    };
  });
};

export const MatrixFloatingCode = () => {
  const { theme } = useTheme();
  const [columns, setColumns] = useState<CodeColumn[]>([]);
  
  // Generate columns on mount - more columns for tighter spacing
  useEffect(() => {
    if (theme === 'matrix') {
      const columnCount = Math.floor(window.innerWidth / 18); // Tighter: 18px instead of 30px
      setColumns(generateColumns(columnCount));
    }
  }, [theme]);

  // Periodically randomize characters
  useEffect(() => {
    if (theme !== 'matrix') return;
    
    const interval = setInterval(() => {
      setColumns(prev => prev.map(col => ({
        ...col,
        chars: col.chars.map((char) => {
          if (Math.random() > 0.92) {
            const charSet = col.isJustachat ? JUSTACHAT_CHARS : MATRIX_CHARS;
            return charSet[Math.floor(Math.random() * charSet.length)];
          }
          return char;
        })
      })));
    }, 150);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme !== 'matrix') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute top-0 flex flex-col text-[10px] font-mono"
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
              className="leading-none"
              style={{
                color: i === 0 
                  ? 'hsl(120 100% 95%)' 
                  : i < 3 
                    ? 'hsl(120 100% 75%)' 
                    : col.isJustachat 
                      ? 'hsl(120 100% 60%)'
                      : 'hsl(120 100% 50%)',
                textShadow: i === 0 
                  ? '0 0 15px hsl(120 100% 80%), 0 0 30px hsl(120 100% 60%)' 
                  : col.isJustachat
                    ? '0 0 8px hsl(120 100% 60%)'
                    : '0 0 5px hsl(120 100% 50%)',
                opacity: 1 - (i / col.chars.length) * 0.6,
                fontWeight: col.isJustachat ? 'bold' : 'normal',
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
      
      {/* Floating JUSTACHAT text streams */}
      <div
        className="absolute font-mono font-bold text-sm tracking-[0.5em] whitespace-nowrap"
        style={{
          top: '15%',
          left: '10%',
          color: 'hsl(120 100% 60%)',
          textShadow: '0 0 20px hsl(120 100% 50%), 0 0 40px hsl(120 100% 40%)',
          opacity: 0.15,
          animation: 'matrixRabbitFloat 12s ease-in-out infinite',
        }}
      >
        JUSTACHAT
      </div>
      <div
        className="absolute font-mono font-bold text-xs tracking-[0.3em] whitespace-nowrap"
        style={{
          top: '45%',
          right: '5%',
          color: 'hsl(120 100% 55%)',
          textShadow: '0 0 15px hsl(120 100% 50%)',
          opacity: 0.1,
          animation: 'matrixRabbitFloat 15s ease-in-out infinite 3s',
        }}
      >
        JUSTACHAT
      </div>
      <div
        className="absolute font-mono font-bold text-lg tracking-[0.4em] whitespace-nowrap"
        style={{
          bottom: '20%',
          left: '30%',
          color: 'hsl(120 100% 65%)',
          textShadow: '0 0 25px hsl(120 100% 50%), 0 0 50px hsl(120 100% 40%)',
          opacity: 0.08,
          animation: 'matrixRabbitFloat 10s ease-in-out infinite 5s',
        }}
      >
        JUSTACHAT
      </div>

      {/* Ambient corner glows */}
      <div 
        className="absolute top-0 left-0 w-80 h-80 opacity-25"
        style={{
          background: 'radial-gradient(circle, hsl(120 100% 50%) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-80 h-80 opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(120 100% 50%) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(120 100% 50%) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
};
