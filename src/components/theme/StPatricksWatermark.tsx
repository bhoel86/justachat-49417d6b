/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useTheme } from "@/contexts/ThemeContext";

/**
 * St. Patrick's Day watermark - shamrock cluster with Irish charm
 */
export const StPatricksWatermark = () => {
  const { theme } = useTheme();
  
  if (theme !== 'stpatricks') return null;
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0"
      style={{ opacity: 0.08 }}
    >
      <div className="relative">
        {/* Main large shamrock */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 24 24"
          fill="hsl(var(--primary))"
          style={{
            filter: 'drop-shadow(0 0 20px hsl(142 76% 36% / 0.4))',
            animation: 'stpatricksFloat 6s ease-in-out infinite',
          }}
        >
          <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1.5 1 2.5 2 3-2 0-4.5 1-4.5 3.5S8.5 15.5 10 15c-1 1-2 3-2 4.5 0 1.5 1.5 2.5 3 2.5s2-1 2-2v-6c0 0 0 2 0 2v4c0 1 .5 2 2 2s3-1 3-2.5c0-1.5-1-3.5-2-4.5 1.5.5 3.5-.5 3.5-3S16 9.5 14 9.5c1-0.5 2-1.5 2-3C16 3.5 14.5 2 13 2c-0.5 0-1 0.5-1 1.5V5c0-1.5-.5-3-1-3z" />
          <path d="M12 14v6" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
        </svg>
        
        {/* Small decorative shamrocks */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="hsl(var(--primary))"
          className="absolute -top-4 -left-8"
          style={{ opacity: 0.6, animation: 'stpatricksFloat 4s ease-in-out infinite 0.5s' }}
        >
          <path d="M12 2c-1.5 0-3 1.5-3 3.5 0 1.5 1 2.5 2 3-2 0-4.5 1-4.5 3.5S8.5 15.5 10 15c-1 1-2 3-2 4.5 0 1.5 1.5 2.5 3 2.5s2-1 2-2v-6c0 0 0 2 0 2v4c0 1 .5 2 2 2s3-1 3-2.5c0-1.5-1-3.5-2-4.5 1.5.5 3.5-.5 3.5-3S16 9.5 14 9.5c1-0.5 2-1.5 2-3C16 3.5 14.5 2 13 2c-0.5 0-1 0.5-1 1.5V5c0-1.5-.5-3-1-3z" />
        </svg>
        
        <svg
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="hsl(var(--accent))"
          className="absolute -bottom-2 -right-6"
          style={{ opacity: 0.5, animation: 'stpatricksFloat 5s ease-in-out infinite 1s' }}
        >
          <circle cx="12" cy="12" r="10" />
          <text x="12" y="16" textAnchor="middle" fill="hsl(35 90% 30%)" fontSize="10" fontWeight="bold">☘</text>
        </svg>
      </div>
    </div>
  );
};
