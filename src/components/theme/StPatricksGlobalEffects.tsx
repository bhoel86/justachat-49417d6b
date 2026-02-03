/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles } from "lucide-react";

/**
 * Global St. Patrick's Day theme effects - floating shamrocks, gold coins, and glowing background
 * Renders everywhere when the St. Patrick's theme is active
 */

// Shamrock SVG component
const Shamrock: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    {/* Three-leaf clover/shamrock */}
    <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1.5 1 2.5 2 3-2 0-4.5 1-4.5 3.5S8.5 15.5 10 15c-1 1-2 3-2 4.5 0 1.5 1.5 2.5 3 2.5s2-1 2-2v-6c0 0 0 2 0 2v4c0 1 .5 2 2 2s3-1 3-2.5c0-1.5-1-3.5-2-4.5 1.5.5 3.5-.5 3.5-3S16 9.5 14 9.5c1-0.5 2-1.5 2-3C16 3.5 14.5 2 13 2c-0.5 0-1 0.5-1 1.5V5c0-1.5-.5-3-1-3z" />
    {/* Stem */}
    <path d="M12 14v6" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Gold coin SVG component
const GoldCoin: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" fill="hsl(45 93% 47%)" stroke="hsl(35 90% 40%)" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="7" stroke="hsl(35 90% 40%)" strokeWidth="0.5" fill="none" />
    <text x="12" y="16" textAnchor="middle" fill="hsl(35 90% 30%)" fontSize="10" fontWeight="bold">☘</text>
  </svg>
);

// Shamrock positions for floating animation
const floatingShamrocks = [
  { top: '5%', left: '3%', size: 28, delay: 0, duration: 4, glow: true },
  { top: '8%', right: '4%', size: 32, delay: 0.5, duration: 4.5, glow: true },
  { bottom: '10%', left: '5%', size: 26, delay: 1, duration: 3.8, glow: true },
  { bottom: '8%', right: '3%', size: 30, delay: 1.5, duration: 4.2, glow: true },
  { top: '20%', left: '6%', size: 18, delay: 0.3, duration: 3.5, glow: false },
  { top: '28%', right: '7%', size: 20, delay: 0.8, duration: 3.8, glow: false },
  { top: '45%', left: '4%', size: 16, delay: 1.2, duration: 3.2, glow: true },
  { top: '40%', right: '5%', size: 22, delay: 0.6, duration: 4, glow: true },
  { bottom: '28%', left: '7%', size: 18, delay: 1.8, duration: 3.6, glow: false },
  { bottom: '32%', right: '6%', size: 16, delay: 2, duration: 3.4, glow: false },
  { top: '16%', left: '14%', size: 12, delay: 0.4, duration: 3, glow: false },
  { top: '55%', left: '10%', size: 14, delay: 1.4, duration: 3.2, glow: false },
  { top: '50%', right: '14%', size: 12, delay: 1.7, duration: 3, glow: false },
  { bottom: '20%', left: '16%', size: 10, delay: 2.2, duration: 2.9, glow: false },
  { top: '65%', right: '12%', size: 14, delay: 2.4, duration: 3.1, glow: false },
];

// Gold coin positions
const goldCoins = [
  { top: '12%', left: '18%', size: 16, delay: 0.2 },
  { top: '20%', right: '20%', size: 18, delay: 0.7 },
  { top: '38%', left: '12%', size: 14, delay: 1.1 },
  { top: '48%', right: '18%', size: 16, delay: 1.5 },
  { bottom: '25%', left: '20%', size: 18, delay: 1.9 },
  { bottom: '18%', right: '16%', size: 14, delay: 2.3 },
];

// Sparkle positions
const sparkles = [
  { top: '10%', left: '22%', size: 10, delay: 0.2 },
  { top: '25%', right: '22%', size: 12, delay: 0.7 },
  { top: '42%', left: '16%', size: 8, delay: 1.1 },
  { bottom: '35%', right: '20%', size: 10, delay: 1.5 },
  { bottom: '20%', left: '18%', size: 12, delay: 1.9 },
];

export const StPatricksGlobalEffects = () => {
  const { theme } = useTheme();
  
  if (theme !== 'stpatricks') return null;
  
  return (
    <>
      {/* Global glowing gradient background overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 400px 300px at 10% 15%, hsl(142 76% 36% / 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 90% 10%, hsl(120 60% 30% / 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 300px 200px at 50% 90%, hsl(45 93% 47% / 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 200px 150px at 25% 85%, hsl(142 76% 36% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 180px 140px at 75% 75%, hsl(45 93% 47% / 0.08) 0%, transparent 50%)
          `,
          animation: 'stpatricksGoldShimmer 5s ease-in-out infinite',
        }}
      />
      
      {/* Green corner glows */}
      <div 
        className="fixed top-0 left-0 w-64 h-64 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, hsl(142 76% 36% / 0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div 
        className="fixed bottom-0 right-0 w-64 h-64 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, hsl(45 93% 47% / 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Floating shamrocks */}
      <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
        {floatingShamrocks.map((shamrock, index) => {
          const { size, delay, duration, glow, ...position } = shamrock;
          
          return (
            <div
              key={`shamrock-${index}`}
              className="absolute text-primary"
              style={{ 
                ...position,
                animation: `stpatricksFloat ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                opacity: glow ? 0.7 : 0.4,
                filter: glow ? 'drop-shadow(0 0 8px hsl(142 76% 36% / 0.6))' : 'none',
              }}
            >
              <Shamrock size={size} />
            </div>
          );
        })}
        
        {/* Gold coins */}
        {goldCoins.map((coin, index) => {
          const { size, delay, ...position } = coin;
          return (
            <div
              key={`coin-${index}`}
              className="absolute"
              style={{ 
                ...position,
                animation: 'stpatricksGoldShimmer 3s ease-in-out infinite',
                animationDelay: `${delay}s`,
              }}
            >
              <GoldCoin size={size} />
            </div>
          );
        })}
        
        {/* Sparkles */}
        {sparkles.map((sparkle, index) => {
          const { size, delay, ...position } = sparkle;
          return (
            <div
              key={`sparkle-${index}`}
              className="absolute text-accent"
              style={{ 
                ...position,
                animation: 'stpatricksSparkle 2s ease-in-out infinite',
                animationDelay: `${delay}s`,
                opacity: 0.6,
              }}
            >
              <Sparkles size={size} />
            </div>
          );
        })}
      </div>
    </>
  );
};
