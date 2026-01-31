import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Star } from 'lucide-react';

interface ValentinesWelcomeBannerProps {
  onJoinClick?: () => void;
  variant?: 'mobile' | 'desktop';
}

export const ValentinesWelcomeBanner: React.FC<ValentinesWelcomeBannerProps> = ({ 
  onJoinClick,
  variant = 'desktop'
}) => {
  const { theme } = useTheme();

  if (theme !== 'valentines') {
    return null;
  }

  const isMobile = variant === 'mobile';

  return (
    <div 
      className={`relative overflow-hidden ${
        isMobile ? 'h-32' : 'h-36 sm:h-44 md:h-52'
      }`}
      style={{
        background: 'linear-gradient(135deg, #1a0a12 0%, #2d1020 25%, #3d1530 50%, #2d1020 75%, #1a0a12 100%)',
      }}
    >
      {/* Animated gradient overlay */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 400px 300px at 15% 50%, #ff1493 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 85% 40%, #ff69b4 0%, transparent 55%),
            radial-gradient(ellipse 300px 200px at 50% 90%, #dc143c 0%, transparent 50%),
            radial-gradient(ellipse 200px 150px at 30% 20%, #ff6b9d 0%, transparent 50%),
            radial-gradient(ellipse 180px 140px at 70% 70%, #e91e63 0%, transparent 50%)
          `,
          animation: 'valentinesGlowPulse 4s ease-in-out infinite',
        }}
      />

      {/* Floating 3D hearts - Left side */}
      <div className="absolute left-[3%] top-[15%]" style={{ animation: 'valentinesHeartBounce 2.5s ease-in-out infinite' }}>
        <Heart size={32} fill="#ff1493" stroke="#ff69b4" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 15px #ff1493) drop-shadow(0 0 30px #ff1493)' }} />
      </div>
      <div className="absolute left-[8%] top-[55%]" style={{ animation: 'valentinesHeartBounce 3s ease-in-out infinite', animationDelay: '0.5s' }}>
        <Heart size={20} fill="#ff69b4" stroke="#ffb6c1" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 10px #ff69b4)' }} />
      </div>
      <div className="absolute left-[18%] top-[25%]" style={{ animation: 'valentinesHeartBounce 2.8s ease-in-out infinite', animationDelay: '1s' }}>
        <Heart size={16} fill="#e91e63" stroke="#f48fb1" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 8px #e91e63)' }} />
      </div>
      <div className="absolute left-[12%] top-[70%]" style={{ animation: 'valentinesHeartBounce 3.2s ease-in-out infinite', animationDelay: '0.3s' }}>
        <Heart size={24} fill="#dc143c" stroke="#ff6b6b" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 12px #dc143c)' }} />
      </div>

      {/* Floating 3D hearts - Right side */}
      <div className="absolute right-[3%] top-[20%]" style={{ animation: 'valentinesHeartBounce 2.6s ease-in-out infinite', animationDelay: '0.2s' }}>
        <Heart size={36} fill="#ff1493" stroke="#ff69b4" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 18px #ff1493) drop-shadow(0 0 35px #ff1493)' }} />
      </div>
      <div className="absolute right-[10%] top-[60%]" style={{ animation: 'valentinesHeartBounce 2.9s ease-in-out infinite', animationDelay: '0.7s' }}>
        <Heart size={22} fill="#ff69b4" stroke="#ffb6c1" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 10px #ff69b4)' }} />
      </div>
      <div className="absolute right-[15%] top-[30%]" style={{ animation: 'valentinesHeartBounce 3.1s ease-in-out infinite', animationDelay: '1.2s' }}>
        <Heart size={18} fill="#e91e63" stroke="#f48fb1" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 8px #e91e63)' }} />
      </div>
      <div className="absolute right-[20%] top-[75%]" style={{ animation: 'valentinesHeartBounce 2.7s ease-in-out infinite', animationDelay: '0.4s' }}>
        <Heart size={14} fill="#ff6b9d" stroke="#ffb6c1" strokeWidth={1} style={{ filter: 'drop-shadow(0 0 6px #ff6b9d)' }} />
      </div>

      {/* Sparkle stars */}
      <Star className="absolute left-[25%] top-[40%] w-3 h-3" fill="#ffd700" stroke="none" style={{ animation: 'valentinesSparkle 1.5s ease-in-out infinite', filter: 'drop-shadow(0 0 4px #ffd700)' }} />
      <Star className="absolute right-[25%] top-[35%] w-4 h-4" fill="#ffd700" stroke="none" style={{ animation: 'valentinesSparkle 1.5s ease-in-out infinite', animationDelay: '0.5s', filter: 'drop-shadow(0 0 5px #ffd700)' }} />
      <Sparkles className="absolute left-[30%] top-[65%] w-4 h-4 text-pink-300" style={{ animation: 'valentinesSparkle 2s ease-in-out infinite', animationDelay: '0.3s' }} />
      <Sparkles className="absolute right-[28%] top-[55%] w-5 h-5 text-rose-300" style={{ animation: 'valentinesSparkle 2s ease-in-out infinite', animationDelay: '0.8s' }} />

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center px-4">
          {/* Glowing heart icon above text */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Heart 
                size={isMobile ? 40 : 56} 
                fill="url(#heartGradient)" 
                stroke="#ffb6c1"
                strokeWidth={1}
                style={{ 
                  filter: 'drop-shadow(0 0 20px #ff1493) drop-shadow(0 0 40px #ff69b4) drop-shadow(0 0 60px #ff1493)',
                  animation: 'valentinesMainHeart 2s ease-in-out infinite',
                }}
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff1493" />
                    <stop offset="50%" stopColor="#ff69b4" />
                    <stop offset="100%" stopColor="#dc143c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Main heading */}
          <h2 
            className={`font-bold tracking-wide ${
              isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl md:text-5xl'
            }`}
            style={{
              background: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 25%, #fff 50%, #ff1493 75%, #ff69b4 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'valentinesTextShimmer 3s ease-in-out infinite',
              filter: 'drop-shadow(0 2px 10px rgba(255, 20, 147, 0.5))',
            }}
          >
            Happy Valentine's Day!
          </h2>
          
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-2 my-2">
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
            <Heart size={12} fill="#ff69b4" className="text-pink-400" />
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent via-pink-400 to-transparent" />
          </div>

          {/* Tagline */}
          <p 
            className={`font-medium tracking-wide ${
              isMobile ? 'text-sm' : 'text-base sm:text-lg'
            }`}
            style={{
              color: '#ffb6c1',
              textShadow: '0 0 15px rgba(255, 105, 180, 0.6)',
            }}
          >
            Spread Love in Every Chat ✨
          </p>
        </div>
        
        {/* Join button */}
        {!isMobile && onJoinClick && (
          <Button 
            onClick={onJoinClick}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-sm px-5 py-2.5 h-auto font-bold text-white border-0"
            style={{ 
              background: 'linear-gradient(135deg, #ff1493 0%, #dc143c 50%, #ff1493 100%)',
              backgroundSize: '200% 200%',
              animation: 'valentinesButtonGlow 2s ease-in-out infinite',
              boxShadow: '0 0 20px rgba(255, 20, 147, 0.6), 0 0 40px rgba(255, 20, 147, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          >
            <Heart className="w-4 h-4 mr-2" fill="currentColor" />
            Join the Love
          </Button>
        )}
      </div>

      {/* Bottom glow line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #ff1493 20%, #ff69b4 50%, #ff1493 80%, transparent 100%)',
          boxShadow: '0 0 20px #ff1493, 0 0 40px #ff69b4',
        }}
      />
    </div>
  );
};
