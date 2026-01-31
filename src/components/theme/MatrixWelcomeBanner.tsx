import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

interface MatrixWelcomeBannerProps {
  variant?: 'desktop' | 'mobile';
  onJoinClick?: () => void;
}

/**
 * Matrix-themed welcome banner for the lobby
 * Features terminal aesthetic with hidden rabbit Easter eggs
 */
export const MatrixWelcomeBanner = ({ variant = 'desktop', onJoinClick }: MatrixWelcomeBannerProps) => {
  const { theme } = useTheme();
  
  if (theme !== 'matrix') return null;

  const isMobile = variant === 'mobile';

  return (
    <div 
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(120 100% 3%) 0%, hsl(120 80% 5%) 50%, hsl(120 100% 3%) 100%)',
        borderTop: '1px solid hsl(120 100% 50% / 0.3)',
        borderBottom: '1px solid hsl(120 100% 50% / 0.3)',
      }}
    >
      {/* Scanline effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(120 100% 50% / 0.03) 2px, hsl(120 100% 50% / 0.03) 4px)',
        }}
      />

      {/* Hidden rabbit watermark */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.04 }}
      >
        <span style={{ fontSize: isMobile ? '100px' : '200px', filter: 'blur(1px)' }}>🐰</span>
      </div>

      {/* Content - compact */}
      <div className={`relative z-10 flex items-center justify-center gap-4 ${isMobile ? 'py-2 px-3' : 'py-3 px-4'}`}>
        {/* Geometric icon - smaller */}
        <div 
          className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-none flex items-center justify-center flex-shrink-0`}
          style={{
            border: '1px solid hsl(120 100% 50%)',
            boxShadow: '0 0 15px hsl(120 100% 50% / 0.4)',
            background: 'hsl(120 100% 5%)',
          }}
        >
          <Terminal 
            className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}
            style={{ 
              color: 'hsl(120 100% 50%)',
              filter: 'drop-shadow(0 0 8px hsl(120 100% 50%))',
            }}
          />
        </div>

        {/* Text content - horizontal */}
        <div className="flex flex-col">
          {/* Title */}
          <h1 
            className={`font-mono font-bold tracking-widest ${isMobile ? 'text-base' : 'text-xl'}`}
            style={{
              color: 'hsl(120 100% 50%)',
              textShadow: '0 0 10px hsl(120 100% 50%), 0 0 20px hsl(120 100% 50%)',
            }}
          >
            JUSTACHAT
          </h1>

          {/* Tagline */}
          <p 
            className={`font-mono tracking-wide ${isMobile ? 'text-[10px]' : 'text-xs'}`}
            style={{
              color: 'hsl(120 100% 70%)',
              textShadow: '0 0 5px hsl(120 100% 50%)',
            }}
          >
            Wake up. You're already inside.
          </p>
        </div>

        {/* Terminal-style button - inline */}
        {!isMobile && onJoinClick && (
          <Button
            onClick={onJoinClick}
            size="sm"
            className="font-mono uppercase tracking-wider px-4 py-1 rounded-none text-xs ml-auto"
            style={{
              background: 'transparent',
              border: '1px solid hsl(120 100% 50%)',
              color: 'hsl(120 100% 50%)',
              boxShadow: '0 0 10px hsl(120 100% 50% / 0.3)',
            }}
          >
            [ ENTER ]
          </Button>
        )}
      </div>

      {/* Decorative corners */}
      <div 
        className="absolute top-2 left-2 w-4 h-4 border-t border-l"
        style={{ borderColor: 'hsl(120 100% 50% / 0.5)' }}
      />
      <div 
        className="absolute top-2 right-2 w-4 h-4 border-t border-r"
        style={{ borderColor: 'hsl(120 100% 50% / 0.5)' }}
      />
      <div 
        className="absolute bottom-2 left-2 w-4 h-4 border-b border-l"
        style={{ borderColor: 'hsl(120 100% 50% / 0.5)' }}
      />
      <div 
        className="absolute bottom-2 right-2 w-4 h-4 border-b border-r"
        style={{ borderColor: 'hsl(120 100% 50% / 0.5)' }}
      />
    </div>
  );
};
