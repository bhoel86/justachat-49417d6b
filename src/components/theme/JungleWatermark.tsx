import { useTheme } from '@/contexts/ThemeContext';

/**
 * Jungle Expedition watermark - tropical leaves and vines pattern
 * Only visible for the jungle theme
 */
export const JungleWatermark = () => {
  const { theme } = useTheme();
  
  // Only show for jungle theme
  if (theme !== 'jungle') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* Jungle styled watermark with tropical elements */}
      <div 
        className="text-center select-none opacity-[0.08]"
        style={{
          transform: 'rotate(-15deg) scale(1.2)',
        }}
      >
        {/* Large tropical leaves pattern */}
        <div className="relative">
          {/* Central leaf cluster */}
          <div className="text-[120px] sm:text-[180px] leading-none text-jungle-primary">
            🌿
          </div>
          {/* Surrounding leaves */}
          <div className="absolute -top-8 -left-16 text-[60px] sm:text-[80px] rotate-[-30deg] text-jungle-secondary">
            🍃
          </div>
          <div className="absolute -top-4 -right-16 text-[60px] sm:text-[80px] rotate-[30deg] text-jungle-secondary">
            🍃
          </div>
          <div className="absolute -bottom-8 left-0 text-[50px] sm:text-[70px] rotate-[15deg] text-jungle-accent">
            🌴
          </div>
          <div className="absolute -bottom-4 right-4 text-[40px] sm:text-[60px] rotate-[-10deg] text-jungle-accent">
            🦜
          </div>
        </div>
        {/* Expedition text */}
        <div 
          className="mt-4 text-lg sm:text-2xl font-bold tracking-[0.3em] uppercase text-jungle-primary"
          style={{
            fontFamily: "'Courier New', monospace",
            textShadow: '2px 2px 0 rgba(0,0,0,0.1)',
          }}
        >
          EXPEDITION
        </div>
      </div>
    </div>
  );
};
