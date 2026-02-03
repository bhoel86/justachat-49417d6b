/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useTheme } from "@/contexts/ThemeContext";
import matrixMascotLeft from '@/assets/matrix/matrix-mascot-left.png';
import matrixMascotRight from '@/assets/matrix/matrix-mascot-right.png';
import { usePngCutout } from "@/hooks/usePngCutout";

/**
 * Matrix footer mascots - pixel art rabbit mascots with matrix aesthetic
 * Left: rabbit facing right, Right: rabbit facing left
 */

export const MatrixMascot = ({ side }: { side: 'left' | 'right' }) => {
  const { theme } = useTheme();
  
  // Apply cutout processing to strip any background artifacts
  const leftCutout = usePngCutout(side === 'left' ? matrixMascotLeft : undefined);
  const rightCutout = usePngCutout(side === 'right' ? matrixMascotRight : undefined);
  
  if (theme !== 'matrix') return null;
  
  const imageSrc = side === 'left' 
    ? (leftCutout ?? matrixMascotLeft) 
    : (rightCutout ?? matrixMascotRight);
  
  return (
    <div 
      className="h-14 sm:h-16 flex items-center justify-center"
      style={{
        animation: 'matrixRabbitFloat 5s ease-in-out infinite',
        animationDelay: side === 'right' ? '0.5s' : '0s',
      }}
    >
      <img
        src={imageSrc}
        alt={side === 'left' ? 'Matrix Rabbit Left' : 'Matrix Rabbit Right'}
        className="h-12 sm:h-14 w-auto object-contain opacity-75"
        style={{
          filter: 'drop-shadow(0 0 12px hsl(120 100% 50% / 0.7))',
        }}
      />
    </div>
  );
};
