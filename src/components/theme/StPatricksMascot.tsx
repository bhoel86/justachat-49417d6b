/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useTheme } from "@/contexts/ThemeContext";
import { Sparkles } from "lucide-react";

/**
 * St. Patrick's Day footer mascots - leprechaun-themed decorations
 */

// Pot of gold SVG
const PotOfGold = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    {/* Pot */}
    <ellipse cx="24" cy="38" rx="16" ry="6" fill="hsl(0 0% 20%)" />
    <path d="M8 32c0 8 7 12 16 12s16-4 16-12V28H8v4z" fill="hsl(0 0% 25%)" />
    <ellipse cx="24" cy="28" rx="16" ry="5" fill="hsl(0 0% 30%)" />
    
    {/* Gold coins piling out */}
    <circle cx="18" cy="26" r="4" fill="hsl(45 93% 50%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    <circle cx="24" cy="24" r="4" fill="hsl(45 93% 55%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    <circle cx="30" cy="26" r="4" fill="hsl(45 93% 50%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    <circle cx="21" cy="22" r="3.5" fill="hsl(45 93% 52%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    <circle cx="27" cy="22" r="3.5" fill="hsl(45 93% 52%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    <circle cx="24" cy="20" r="3" fill="hsl(45 93% 55%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    
    {/* Shamrock on coin */}
    <text x="24" y="25" textAnchor="middle" fill="hsl(142 76% 30%)" fontSize="4">☘</text>
  </svg>
);

// Leprechaun hat SVG
const LeprechaunHat = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    {/* Hat brim */}
    <ellipse cx="24" cy="36" rx="20" ry="4" fill="hsl(142 50% 25%)" />
    
    {/* Hat body */}
    <path d="M12 36c0 0 2-20 12-20s12 20 12 20" fill="hsl(142 60% 30%)" />
    <rect x="12" y="32" width="24" height="4" fill="hsl(142 50% 25%)" />
    
    {/* Hat band */}
    <rect x="12" y="28" width="24" height="5" fill="hsl(0 0% 15%)" />
    
    {/* Gold buckle */}
    <rect x="20" y="27" width="8" height="7" rx="1" fill="hsl(45 93% 50%)" stroke="hsl(35 90% 40%)" strokeWidth="0.5" />
    <rect x="22" y="29" width="4" height="3" fill="hsl(0 0% 15%)" />
  </svg>
);

export const StPatricksMascot = () => {
  const { theme } = useTheme();
  
  if (theme !== 'stpatricks') return null;
  
  return (
    <>
      {/* Left mascot - Pot of Gold */}
      <div 
        className="absolute left-4 bottom-0 opacity-70 hidden md:block"
        style={{
          animation: 'stpatricksFloat 4s ease-in-out infinite',
        }}
      >
        <div className="relative">
          <PotOfGold />
          <Sparkles 
            className="absolute -top-2 -right-1 text-accent" 
            size={14}
            style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite' }}
          />
        </div>
      </div>
      
      {/* Right mascot - Leprechaun Hat */}
      <div 
        className="absolute right-4 bottom-0 opacity-70 hidden md:block"
        style={{
          animation: 'stpatricksFloat 4s ease-in-out infinite 0.5s',
        }}
      >
        <div className="relative">
          <LeprechaunHat />
          <Sparkles 
            className="absolute -top-2 -left-1 text-accent" 
            size={14}
            style={{ animation: 'stpatricksSparkle 2s ease-in-out infinite 0.3s' }}
          />
        </div>
      </div>
    </>
  );
};
