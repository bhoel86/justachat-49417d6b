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

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center ${isMobile ? 'py-4 px-4' : 'py-8 px-6'}`}>
        {/* Geometric icon */}
        <div 
          className={`${isMobile ? 'w-12 h-12 mb-2' : 'w-20 h-20 mb-4'} rounded-none flex items-center justify-center`}
          style={{
            border: '2px solid hsl(120 100% 50%)',
            boxShadow: '0 0 20px hsl(120 100% 50% / 0.5), inset 0 0 20px hsl(120 100% 50% / 0.1)',
            background: 'hsl(120 100% 5%)',
          }}
        >
          <Terminal 
            className={`${isMobile ? 'w-6 h-6' : 'w-10 h-10'}`}
            style={{ 
              color: 'hsl(120 100% 50%)',
              filter: 'drop-shadow(0 0 10px hsl(120 100% 50%))',
            }}
          />
        </div>

        {/* Title */}
        <h1 
          className={`font-mono font-bold tracking-widest ${isMobile ? 'text-xl' : 'text-3xl sm:text-4xl'}`}
          style={{
            color: 'hsl(120 100% 50%)',
            textShadow: '0 0 10px hsl(120 100% 50%), 0 0 20px hsl(120 100% 50%), 0 0 40px hsl(120 100% 50%)',
            animation: 'matrixGlow 3s ease-in-out infinite',
          }}
        >
          JUSTACHAT
        </h1>

        {/* Tagline */}
        <p 
          className={`font-mono tracking-wide mt-2 ${isMobile ? 'text-xs' : 'text-sm sm:text-base'}`}
          style={{
            color: 'hsl(120 100% 70%)',
            textShadow: '0 0 5px hsl(120 100% 50%)',
          }}
        >
          Wake up. You're already inside.
        </p>

        {/* Terminal-style buttons */}
        {!isMobile && onJoinClick && (
          <div className="flex gap-4 mt-6">
            <Button
              onClick={onJoinClick}
              className="font-mono uppercase tracking-wider px-6 py-2 rounded-none"
              style={{
                background: 'transparent',
                border: '1px solid hsl(120 100% 50%)',
                color: 'hsl(120 100% 50%)',
                boxShadow: '0 0 10px hsl(120 100% 50% / 0.3)',
              }}
            >
              [ ENTER NETWORK ]
            </Button>
          </div>
        )}

        {/* Follow the white rabbit hint */}
        <p 
          className={`font-mono ${isMobile ? 'text-[8px] mt-2' : 'text-xs mt-4'}`}
          style={{
            color: 'hsl(120 100% 40%)',
            opacity: 0.6,
          }}
        >
          follow the white rabbit...
        </p>
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
