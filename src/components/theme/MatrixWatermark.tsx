import { useTheme } from "@/contexts/ThemeContext";
import matrixRabbitImg from '@/assets/matrix/ascii-rabbit.png';

/**
 * Matrix watermark - ASCII rabbit hidden in matrix code
 * Subtly visible in chat backgrounds
 */
export const MatrixWatermark = () => {
  const { theme } = useTheme();
  
  if (theme !== 'matrix') return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0"
      style={{ opacity: 0.15 }}
    >
      {/* Main rabbit image - larger and more visible */}
      <img
        src={matrixRabbitImg}
        alt=""
        className="w-72 h-72 sm:w-96 sm:h-96 object-contain"
        style={{
          filter: 'drop-shadow(0 0 40px hsl(120 100% 50% / 0.4))',
          animation: 'matrixRabbitFloat 10s ease-in-out infinite',
        }}
      />
    </div>
  );
};
