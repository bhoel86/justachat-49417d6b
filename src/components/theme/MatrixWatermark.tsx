/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useTheme } from "@/contexts/ThemeContext";
import simulationBg from '@/assets/matrix/simulation-bg.jpg';

/**
 * Matrix/Simulation watermark - subtle background imagery
 * Shows the iconic Matrix figure behind chat content
 */
export const MatrixWatermark = () => {
  const { theme } = useTheme();
  
  if (theme !== 'matrix') return null;

  return (
    <div 
      className="fixed inset-0 top-14 pointer-events-none overflow-hidden z-0"
    >
      {/* Matrix figure background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${simulationBg})`,
          opacity: 0.12,
        }}
      />
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 90%)',
        }}
      />
    </div>
  );
};
