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
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
    >
      {/* Subtle Matrix figure background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${simulationBg})`,
          opacity: 0.08,
          filter: 'blur(1px)',
        }}
      />
      {/* Gradient overlay to fade edges */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, hsl(var(--background)) 80%)',
        }}
      />
    </div>
  );
};
