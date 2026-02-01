import { useTheme } from '@/contexts/ThemeContext';

/**
 * Jungle Expedition watermark - Justachat™ with jungle styling
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
      {/* Jungle styled Justachat watermark */}
      <div 
        className="text-center select-none"
        style={{
          transform: 'rotate(-12deg)',
        }}
      >
        {/* Main title with jungle styling */}
        <div 
          className="text-[48px] sm:text-[72px] md:text-[96px] font-black tracking-tight"
          style={{
            fontFamily: "'Georgia', serif",
            color: 'hsl(var(--primary))',
            opacity: 0.12,
            textShadow: '4px 4px 0 rgba(0,0,0,0.05)',
            letterSpacing: '-0.02em',
          }}
        >
          Justachat
          <span 
            className="text-[24px] sm:text-[36px] md:text-[48px] align-super"
            style={{ fontFamily: 'inherit' }}
          >
            ™
          </span>
        </div>
      </div>
    </div>
  );
};
