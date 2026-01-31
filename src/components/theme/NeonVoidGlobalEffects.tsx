import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Neon Void global effects:
 * - subtle neon grid + vignette
 * - corner glows
 * Renders everywhere, but stays pointer-events:none.
 */
export const NeonVoidGlobalEffects: React.FC = () => {
  const { theme } = useTheme();
  if (theme !== "neonvoid") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[5]">
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,255,214,0.10),transparent_55%),radial-gradient(circle_at_10%_10%,rgba(192,38,211,0.10),transparent_40%),radial-gradient(circle_at_90%_15%,rgba(34,211,238,0.10),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.0),rgba(0,0,0,0.65))]" />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_72%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,214,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,214,0.18)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      {/* Soft scanline shimmer */}
      <div className="absolute inset-0 opacity-[0.08] mix-blend-screen animate-[jac-scan_7s_linear_infinite] bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.35),transparent)] bg-[length:100%_140px]" />

      <style>{`
        @keyframes jac-scan {
          0% { background-position-y: -140px; }
          100% { background-position-y: calc(100vh + 140px); }
        }
      `}</style>
    </div>
  );
};