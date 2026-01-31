import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Terminal Blood global effects:
 * - red pulse corners
 * - subtle scanlines
 */
export const TerminalBloodGlobalEffects: React.FC = () => {
  const { theme } = useTheme();
  if (theme !== "terminalblood") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(239,68,68,0.14),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(255,109,109,0.10),transparent_55%),radial-gradient(circle_at_50%_85%,rgba(249,115,22,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.0),rgba(0,0,0,0.75))]" />

      <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:100%_4px]" />
      <div className="absolute inset-0 opacity-[0.08] animate-[jac-blood_5s_ease-in-out_infinite] bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.14),transparent_55%)]" />

      <style>{`
        @keyframes jac-blood {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.14; }
        }
      `}</style>
    </div>
  );
};