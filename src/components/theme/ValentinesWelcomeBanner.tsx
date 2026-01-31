import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';

interface ValentinesWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const ValentinesWelcomeBanner: React.FC<ValentinesWelcomeBannerProps> = ({ 
  onJoinClick,
  variant = 'desktop'
}) => {
  const { theme } = useTheme();

  // Only show for valentines theme
  if (theme !== 'valentines') {
    return null;
  }

  const isMobile = variant === 'mobile';

  return (
    <div 
      className={`relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 ${
        isMobile ? 'h-24' : 'h-24 sm:h-32 md:h-40'
      }`}
      style={{
        borderTop: '2px solid hsl(var(--accent))',
        borderBottom: '2px solid hsl(var(--accent))',
      }}
    >
      {/* Glowing orbs effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 182, 193, 0.6) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(255, 105, 180, 0.5) 0%, transparent 35%),
            radial-gradient(circle at 50% 50%, rgba(255, 20, 147, 0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* Animated hearts */}
      <Heart className="absolute top-2 left-4 w-4 h-4 text-pink-200/60 animate-pulse" fill="currentColor" />
      <Heart className="absolute top-4 right-8 w-5 h-5 text-rose-200/50 animate-pulse" fill="currentColor" style={{ animationDelay: '0.5s' }} />
      <Sparkles className="absolute bottom-4 left-12 w-4 h-4 text-pink-100/50 animate-pulse" style={{ animationDelay: '1s' }} />
      <Heart className="absolute bottom-3 right-16 w-3 h-3 text-rose-300/60 animate-pulse" fill="currentColor" style={{ animationDelay: '0.3s' }} />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-100" fill="currentColor" />
            <h2 
              className={`font-bold tracking-tight ${
                isMobile ? 'text-2xl' : 'text-2xl sm:text-3xl md:text-4xl'
              }`}
              style={{
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,182,193,0.5)',
              }}
            >
              Happy Valentine's! 💕
            </h2>
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-100" fill="currentColor" />
          </div>
          <p 
            className={`font-medium ${
              isMobile ? 'text-xs' : 'text-xs sm:text-sm md:text-base'
            }`}
            style={{
              color: 'rgba(255,255,255,0.9)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Spread the love in every chat!
          </p>
        </div>
        
        {/* Join button for desktop */}
        {!isMobile && onJoinClick && (
          <Button 
            onClick={onJoinClick}
            className="absolute right-2 sm:right-4 top-2 sm:top-4 bg-pink-100 text-rose-600 hover:bg-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-auto font-bold border-2 border-rose-300"
            style={{ boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)' }}
          >
            <Heart className="w-3 h-3 mr-1" fill="currentColor" />
            Join Chat
          </Button>
        )}
      </div>
    </div>
  );
};
