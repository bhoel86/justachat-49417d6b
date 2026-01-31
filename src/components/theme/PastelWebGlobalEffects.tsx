import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Pastel Web global effects:
 * - playful sparkles and soft stickers vibe
 * - subtle dotted pattern
 */
export const PastelWebGlobalEffects: React.FC = () => {
  const { theme } = useTheme();
  if (theme !== "pastelweb") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[5]">
      {/* Soft pastel background bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.20),transparent_45%),radial-gradient(circle_at_75%_25%,rgba(168,85,247,0.22),transparent_45%),radial-gradient(circle_at_55%_75%,rgba(236,72,153,0.18),transparent_55%)]" />

      {/* Dot paper pattern */}
      <div className="absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(circle_at_50%_35%,black,transparent_75%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.35)_1px,transparent_1px)] bg-[size:18px_18px]" />
      </div>

      {/* Sticker sparkles */}
      <div className="absolute left-[6%] top-[10%] h-3 w-3 rotate-12 rounded-[4px] bg-emerald-400/60 shadow-[0_0_0_3px_rgba(0,0,0,0.15)] animate-[jac-float_4.2s_ease-in-out_infinite]" />
      <div className="absolute right-[8%] top-[16%] h-4 w-4 -rotate-6 rounded-[6px] bg-fuchsia-400/60 shadow-[0_0_0_3px_rgba(0,0,0,0.15)] animate-[jac-float_4.8s_ease-in-out_infinite]" />
      <div className="absolute left-[10%] bottom-[14%] h-4 w-4 rotate-6 rounded-[6px] bg-cyan-300/60 shadow-[0_0_0_3px_rgba(0,0,0,0.15)] animate-[jac-float_5.0s_ease-in-out_infinite]" />
      <div className="absolute right-[12%] bottom-[12%] h-3 w-3 -rotate-12 rounded-[4px] bg-yellow-300/70 shadow-[0_0_0_3px_rgba(0,0,0,0.15)] animate-[jac-float_4.4s_ease-in-out_infinite]" />

      <style>{`
        @keyframes jac-float {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-10px) rotate(var(--r, 0deg)); }
        }
      `}</style>
    </div>
  );
};