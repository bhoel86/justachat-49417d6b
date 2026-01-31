import { useTheme } from "@/contexts/ThemeContext";
import { Heart, Sparkles } from "lucide-react";
import { ValentinesCupid } from "@/components/theme/ValentinesCupid";

/**
 * Global Valentine's theme effects - floating hearts and glowing background
 * Matches the home page's rich styling with floating, rotating hearts and animated glows
 * Renders everywhere EXCEPT radio UI and main chat message areas
 */

// Heart colors matching home page style
const heartColors = ['#ff1493', '#ff69b4', '#dc143c', '#e91e63', '#ff6b9d', '#f48fb1'];

// Heart positions similar to home page ValentinesFloatingHearts
const floatingHearts = [
  // Large prominent hearts - corners
  { top: '6%', left: '2%', size: 28, delay: 0, duration: 4, glow: true },
  { top: '10%', right: '3%', size: 32, delay: 0.5, duration: 4.5, glow: true },
  { bottom: '8%', left: '4%', size: 26, delay: 1, duration: 3.8, glow: true },
  { bottom: '10%', right: '2%', size: 30, delay: 1.5, duration: 4.2, glow: true },
  
  // Medium hearts - scattered along edges
  { top: '22%', left: '5%', size: 18, delay: 0.3, duration: 3.5, glow: false },
  { top: '30%', right: '6%', size: 20, delay: 0.8, duration: 3.8, glow: false },
  { top: '48%', left: '3%', size: 16, delay: 1.2, duration: 3.2, glow: true },
  { top: '42%', right: '4%', size: 22, delay: 0.6, duration: 4, glow: true },
  { bottom: '30%', left: '6%', size: 18, delay: 1.8, duration: 3.6, glow: false },
  { bottom: '35%', right: '5%', size: 16, delay: 2, duration: 3.4, glow: false },
  
  // Small accent hearts
  { top: '18%', left: '12%', size: 12, delay: 0.4, duration: 3, glow: false },
  { top: '25%', right: '14%', size: 10, delay: 0.9, duration: 2.8, glow: false },
  { top: '58%', left: '8%', size: 14, delay: 1.4, duration: 3.2, glow: false },
  { top: '52%', right: '12%', size: 12, delay: 1.7, duration: 3, glow: false },
  { bottom: '22%', left: '14%', size: 10, delay: 2.2, duration: 2.9, glow: false },
  { bottom: '28%', right: '10%', size: 14, delay: 2.4, duration: 3.1, glow: false },
  
  // Tiny scattered hearts
  { top: '38%', left: '16%', size: 8, delay: 0.7, duration: 2.5, glow: false },
  { top: '68%', right: '16%', size: 8, delay: 1.1, duration: 2.6, glow: false },
  { bottom: '48%', left: '18%', size: 8, delay: 1.6, duration: 2.4, glow: false },
  { bottom: '55%', right: '18%', size: 8, delay: 2.1, duration: 2.7, glow: false },
];

// Sparkle positions
const sparkles = [
  { top: '12%', left: '20%', size: 10, delay: 0.2 },
  { top: '22%', right: '18%', size: 12, delay: 0.7 },
  { top: '42%', left: '14%', size: 8, delay: 1.1 },
  { top: '52%', right: '20%', size: 10, delay: 1.5 },
  { bottom: '32%', left: '16%', size: 12, delay: 1.9 },
  { bottom: '22%', right: '14%', size: 8, delay: 2.3 },
  { top: '68%', left: '6%', size: 10, delay: 0.5 },
  { bottom: '42%', right: '8%', size: 8, delay: 1.3 },
];

export const ValentinesGlobalEffects = () => {
  const { theme } = useTheme();
  
  if (theme !== 'valentines') return null;
  
  return (
    <>
      {/* Global glowing gradient background overlay - matching home page */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 400px 300px at 10% 15%, #ff1493 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 90% 10%, #ff69b4 0%, transparent 55%),
            radial-gradient(ellipse 300px 200px at 50% 90%, #dc143c 0%, transparent 50%),
            radial-gradient(ellipse 200px 150px at 25% 85%, #ff6b9d 0%, transparent 50%),
            radial-gradient(ellipse 180px 140px at 75% 75%, #e91e63 0%, transparent 50%)
          `,
          opacity: 0.15,
          animation: 'valentinesGlowPulse 4s ease-in-out infinite',
        }}
      />
      
      {/* Subtle ambient glow in corners */}
      <div 
        className="fixed top-0 left-0 w-64 h-64 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, #ff1493 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: 0.2,
        }}
      />
      <div 
        className="fixed bottom-0 right-0 w-64 h-64 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, #ff69b4 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: 0.2,
        }}
      />
      
      {/* Floating hearts - matching home page animation style */}
      <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
        {floatingHearts.map((heart, index) => {
          const color = heartColors[index % heartColors.length];
          const { size, delay, duration, glow, ...position } = heart;
          
          return (
            <div
              key={`global-heart-${index}`}
              className="absolute"
              style={{ 
                ...position,
                animation: `valentinesFloatRotate ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            >
              <Heart 
                size={size} 
                fill={color}
                stroke={glow ? '#ffb6c1' : 'none'}
                strokeWidth={glow ? 0.5 : 0}
                style={{ 
                  opacity: glow ? 0.7 : 0.4,
                  filter: glow ? `drop-shadow(0 0 ${size/2}px ${color})` : 'none',
                }}
              />
            </div>
          );
        })}
        
        {/* Sparkles */}
        {sparkles.map((sparkle, index) => {
          const { size, delay, ...position } = sparkle;
          return (
            <div
              key={`global-sparkle-${index}`}
              className="absolute text-pink-300"
              style={{ 
                ...position,
                animation: 'valentinesSparkle 2s ease-in-out infinite',
                animationDelay: `${delay}s`,
                opacity: 0.5,
              }}
            >
              <Sparkles size={size} />
            </div>
          );
        })}
      </div>

      {/* Cupid + arrows (portal renders to document.body) */}
      <ValentinesCupid />
    </>
  );
};
