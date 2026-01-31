import React, { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

// Procedural glyph band (no copyrighted text)
const GLYPHS = ["⟊","⟟","⟒","⟡","⟐","⟠","⟣","⟤","⟥","⟦","⟧","⌁","⌂","⌬","⌭","⌮","⌯","⍜","⍝","⍟","⍣","⍤","⍥","⍦","⍧","⧉","⧊","⧋","⧌","⧍","⧎","⧏","⧐","⧑","⧒"];

function makeLine(len = 220) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    if (Math.random() < 0.06) out += " · ";
    if (Math.random() < 0.02) out += " ⟐ ";
  }
  return out;
}

/**
 * Alien Crypt global effects:
 * - top/bottom glyph marquee
 * - bio haze glows
 */
export const AlienCryptGlobalEffects: React.FC = () => {
  const { theme } = useTheme();
  const a = useMemo(() => makeLine(240), []);
  const b = useMemo(() => makeLine(240), []);
  if (theme !== "aliencrypt") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(34,211,238,0.12),transparent_52%),radial-gradient(circle_at_75%_15%,rgba(34,197,94,0.14),transparent_55%),radial-gradient(circle_at_60%_75%,rgba(168,85,247,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.0),rgba(0,0,0,0.6))]" />

      {/* Glyph bands */}
      <div className="absolute left-0 right-0 top-0 border-b border-emerald-400/20 bg-black/20 py-2">
        <div className="overflow-hidden whitespace-nowrap font-mono text-xs tracking-[0.35em] text-emerald-200/70">
          <span className="inline-block animate-[jac-marquee_28s_linear_infinite]">{a} {b}</span>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 border-t border-emerald-400/20 bg-black/20 py-2">
        <div className="overflow-hidden whitespace-nowrap font-mono text-xs tracking-[0.35em] text-emerald-200/60">
          <span className="inline-block animate-[jac-marquee_34s_linear_infinite_reverse]">{b} {a}</span>
        </div>
      </div>

      <style>{`
        @keyframes jac-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes jac-marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};