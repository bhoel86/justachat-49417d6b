import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';

interface ValentinesWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

// Floating heart positions for the banner
const bannerHearts = [
  { left: '5%', top: '10%', size: 24, delay: 0, opacity: 0.8 },
  { left: '15%', top: '60%', size: 18, delay: 0.3, opacity: 0.6 },
  { left: '25%', top: '25%', size: 14, delay: 0.6, opacity: 0.7 },
  { right: '5%', top: '15%', size: 28, delay: 0.2, opacity: 0.9 },
  { right: '12%', top: '55%', size: 16, delay: 0.5, opacity: 0.5 },
  { right: '22%', top: '30%', size: 20, delay: 0.8, opacity: 0.7 },
  { left: '35%', top: '70%', size: 12, delay: 1.0, opacity: 0.6 },
  { right: '35%', top: '65%', size: 14, delay: 1.2, opacity: 0.5 },
];

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
      className={`relative overflow-hidden ${
        isMobile ? 'h-28' : 'h-28 sm:h-36 md:h-44'
      }`}
      style={{
        background: 'linear-gradient(135deg, hsl(340 50% 15%) 0%, hsl(340 60% 20%) 30%, hsl(350 50% 18%) 70%, hsl(340 40% 12%) 100%)',
        borderTop: '2px solid hsl(340 80% 50% / 0.5)',
        borderBottom: '2px solid hsl(340 80% 50% / 0.5)',
      }}
    >
      {/* Animated glow orbs */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 300px 200px at 20% 50%, hsl(340 80% 50% / 0.3) 0%, transparent 70%),
            radial-gradient(ellipse 250px 180px at 80% 40%, hsl(350 70% 55% / 0.25) 0%, transparent 70%),
            radial-gradient(ellipse 200px 150px at 50% 80%, hsl(330 70% 45% / 0.2) 0%, transparent 70%)
          `,
        }}
      />

      {/* Floating hearts with glow */}
      {bannerHearts.map((heart, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: heart.left,
            right: heart.right,
            top: heart.top,
            animation: `valentinesBannerFloat 3s ease-in-out infinite`,
            animationDelay: `${heart.delay}s`,
          }}
        >
          <Heart 
            size={heart.size} 
            fill="currentColor"
            className="text-pink-400"
            style={{ 
              opacity: heart.opacity,
              filter: `drop-shadow(0 0 ${heart.size / 3}px hsl(340 80% 60% / 0.8))`,
            }}
          />
        </div>
      ))}

      {/* Sparkle effects */}
      <Sparkles 
        className="absolute top-4 left-[30%] w-4 h-4 text-pink-300/60" 
        style={{ animation: 'valentinesPulse 2s ease-in-out infinite' }}
      />
      <Sparkles 
        className="absolute bottom-4 right-[28%] w-5 h-5 text-rose-300/50" 
        style={{ animation: 'valentinesPulse 2s ease-in-out infinite', animationDelay: '0.5s' }}
      />
      <Sparkles 
        className="absolute top-1/2 left-[8%] w-3 h-3 text-pink-200/40" 
        style={{ animation: 'valentinesPulse 2s ease-in-out infinite', animationDelay: '1s' }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center">
          {/* Main heading with glow */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Heart 
              className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" 
              fill="currentColor"
              style={{ filter: 'drop-shadow(0 0 10px hsl(340 80% 60% / 0.8))' }}
            />
            <h2 
              className={`font-bold tracking-tight ${
                isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl md:text-5xl'
              }`}
              style={{
                background: 'linear-gradient(135deg, hsl(340 90% 75%) 0%, hsl(350 85% 70%) 50%, hsl(340 80% 80%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px hsl(340 80% 60% / 0.5))',
              }}
            >
              Happy Valentine's!
            </h2>
            <Heart 
              className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" 
              fill="currentColor"
              style={{ filter: 'drop-shadow(0 0 10px hsl(340 80% 60% / 0.8))' }}
            />
          </div>
          
          {/* Tagline */}
          <p 
            className={`font-medium ${
              isMobile ? 'text-sm' : 'text-sm sm:text-base md:text-lg'
            }`}
            style={{
              color: 'hsl(340 70% 80%)',
              textShadow: '0 0 10px hsl(340 80% 60% / 0.4)',
            }}
          >
            💕 Spread love in every chat! 💕
          </p>
        </div>
        
        {/* Join button for desktop */}
        {!isMobile && onJoinClick && (
          <Button 
            onClick={onJoinClick}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 h-auto font-bold"
            style={{ 
              background: 'linear-gradient(135deg, hsl(340 80% 55%) 0%, hsl(350 75% 50%) 100%)',
              boxShadow: '0 0 20px hsl(340 80% 55% / 0.5), 0 4px 15px hsl(340 80% 40% / 0.3)',
              border: '1px solid hsl(340 70% 70% / 0.5)',
            }}
          >
            <Heart className="w-4 h-4 mr-1.5" fill="currentColor" />
            Join Chat
          </Button>
        )}
      </div>
    </div>
  );
};
