import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Heart, MessageSquare } from 'lucide-react';
import matrixRabbitImg from '@/assets/matrix/ascii-rabbit.png';

/**
 * Chat watermark component - OG theme only
 * Displays "Justachat™" branding matching the header style
 */
export const ChatWatermark: React.FC = () => {
  const { theme } = useTheme();

  // Common wrapper styles
  const wrapperClasses = "absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none";

  // OG/JAC Theme - Clean branded watermark matching header
  if (theme === 'jac') {
    return (
      <div className={wrapperClasses}>
        <div 
          className="flex items-center gap-3"
          style={{ opacity: 0.06 }}
        >
          {/* Speech bubble icon */}
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
            }}
          >
            <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
          </div>
          
          {/* Brand text */}
          <div 
            className="font-bold text-5xl sm:text-6xl md:text-7xl tracking-tight"
            style={{
              color: 'hsl(var(--foreground))',
            }}
          >
            Justachat<sup className="text-lg sm:text-xl">™</sup>
          </div>
        </div>
      </div>
    );
  }

  // 80s Retro Theme - Neon stroked text with gradient
  if (theme === 'retro80s') {
    return (
      <div className={wrapperClasses}>
        <div 
          className="text-center"
          style={{ opacity: 0.12 }}
        >
          <div 
            className="font-display text-6xl sm:text-7xl md:text-8xl font-black tracking-tight"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px hsl(var(--accent))',
              textShadow: '4px 4px 0 hsl(var(--primary) / 0.3)',
            }}
          >
            Justachat™
          </div>
          <div 
            className="font-display text-2xl sm:text-3xl font-bold mt-2 tracking-widest"
            style={{
              color: 'hsl(var(--accent))',
            }}
          >
            ★ 80s VIBES ★
          </div>
        </div>
      </div>
    );
  }

  // Valentines Theme - Hearts with romantic styling
  if (theme === 'valentines') {
    return (
      <div className={wrapperClasses}>
        <div 
          className="text-center"
          style={{ opacity: 0.08 }}
        >
          {/* Glowing heart cluster */}
          <div className="flex justify-center items-center gap-2 mb-3">
            <Heart 
              className="w-16 h-16 sm:w-20 sm:h-20"
              fill="#ff1493"
              stroke="none"
              style={{ 
                filter: 'drop-shadow(0 0 20px #ff1493)',
                transform: 'rotate(-15deg)',
              }}
            />
            <Heart 
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
              fill="#ff69b4"
              stroke="none"
              style={{ 
                filter: 'drop-shadow(0 0 30px #ff69b4)',
              }}
            />
            <Heart 
              className="w-16 h-16 sm:w-20 sm:h-20"
              fill="#dc143c"
              stroke="none"
              style={{ 
                filter: 'drop-shadow(0 0 20px #dc143c)',
                transform: 'rotate(15deg)',
              }}
            />
          </div>
          
          {/* Brand name */}
          <div 
            className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
            style={{
              color: '#ff1493',
              textShadow: '0 0 30px rgba(255, 20, 147, 0.5)',
            }}
          >
            Justachat™
          </div>
          
          {/* Valentine's tagline */}
          <div 
            className="font-display text-xl sm:text-2xl font-bold mt-2 tracking-widest flex items-center justify-center gap-3"
            style={{
              color: '#ff69b4',
            }}
          >
            <Heart className="w-4 h-4" fill="currentColor" />
            <span>SPREAD THE LOVE</span>
            <Heart className="w-4 h-4" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  // St. Patrick's Day Theme - Shamrock with Irish charm
  if (theme === 'stpatricks') {
    return (
      <div 
        className={wrapperClasses}
        style={{ opacity: 0.08 }}
      >
        <div className="text-center">
          {/* Shamrock cluster */}
          <div className="flex justify-center items-center gap-4 mb-3">
            <span 
              className="text-5xl sm:text-6xl"
              style={{ 
                filter: 'drop-shadow(0 0 15px hsl(142 76% 36% / 0.6))',
                transform: 'rotate(-10deg)',
              }}
            >
              ☘️
            </span>
            <span 
              className="text-7xl sm:text-8xl md:text-9xl"
              style={{ 
                filter: 'drop-shadow(0 0 25px hsl(142 76% 36% / 0.6))',
              }}
            >
              ☘️
            </span>
            <span 
              className="text-5xl sm:text-6xl"
              style={{ 
                filter: 'drop-shadow(0 0 15px hsl(142 76% 36% / 0.6))',
                transform: 'rotate(10deg)',
              }}
            >
              ☘️
            </span>
          </div>
          
          {/* Brand name */}
          <div 
            className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
            style={{
              color: 'hsl(var(--primary))',
              textShadow: '0 0 30px hsl(142 76% 36% / 0.4)',
            }}
          >
            Justachat™
          </div>
          
          {/* Irish tagline */}
          <div 
            className="font-display text-xl sm:text-2xl font-bold mt-2 tracking-widest"
            style={{
              color: 'hsl(var(--accent))',
            }}
          >
            ☘ LUCK O' THE IRISH ☘
          </div>
        </div>
      </div>
    );
  }

  // Matrix Theme - ASCII rabbit with terminal styling
  if (theme === 'matrix') {
    return (
      <div 
        className={wrapperClasses}
        style={{ opacity: 0.15 }}
      >
        <div className="text-center">
          {/* ASCII Rabbit Image */}
          <img
            src={matrixRabbitImg}
            alt=""
            className="w-48 h-48 sm:w-64 sm:h-64 object-contain mx-auto mb-4"
            style={{
              filter: 'drop-shadow(0 0 30px hsl(120 100% 50% / 0.4))',
            }}
          />
          
          {/* Brand name in terminal font */}
          <div 
            className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
            style={{
              color: 'hsl(120 100% 50%)',
              textShadow: '0 0 20px hsl(120 100% 50% / 0.6)',
            }}
          >
            Justachat™
          </div>
          
          {/* Matrix tagline */}
          <div 
            className="font-mono text-lg sm:text-xl mt-2 tracking-widest"
            style={{
              color: 'hsl(120 80% 40%)',
            }}
          >
            &gt; FOLLOW THE WHITE RABBIT_
          </div>
        </div>
      </div>
    );
  }

  // Vaporwave Theme - 90s cyber OS styling
  if (theme === 'vapor') {
    return (
      <div className={wrapperClasses}>
        {/* Grid overlay */}
        <div 
          className="absolute inset-0"
          style={{
            opacity: 0.03,
            backgroundImage: `
              linear-gradient(rgba(46, 242, 194, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(46, 242, 194, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Center watermark text */}
        <div 
          className="text-center transform rotate-[-8deg]"
          style={{ opacity: 0.06 }}
        >
          <div 
            className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-widest"
            style={{ 
              fontFamily: "'Press Start 2P', monospace",
              color: '#8F7AC8',
              textShadow: '4px 4px 0 #1A1A1A, 8px 8px 0 #2EF2C2',
            }}
          >
            JAC™
          </div>
          <div 
            className="text-xl sm:text-2xl mt-4 tracking-widest"
            style={{ 
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#FFE066',
            }}
          >
            JUSTACHAT™ // EST. 2024
          </div>
        </div>
      </div>
    );
  }

  // Default fallback - same as OG
  return (
    <div className={wrapperClasses}>
      <div 
        className="text-center"
        style={{ opacity: 0.08 }}
      >
        <div 
          className="font-display text-5xl sm:text-6xl md:text-7xl font-black tracking-tight"
          style={{
            color: 'hsl(var(--primary))',
            textShadow: '0 0 40px hsl(var(--primary) / 0.3)',
          }}
        >
          Justachat™
        </div>
        <div 
          className="font-display text-lg sm:text-xl font-semibold mt-1 tracking-widest text-muted-foreground"
        >
          Just Chat.
        </div>
      </div>
    </div>
  );
};

export default ChatWatermark;
