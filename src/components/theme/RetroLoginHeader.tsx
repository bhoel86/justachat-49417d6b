import React from "react";

interface RetroLoginHeaderProps {
  subtitle?: string;
}

/**
 * Retro80s login header that matches the page palette.
 * Intentionally NO glow / NO neon; uses existing retro window chrome styles.
 */
export const RetroLoginHeader: React.FC<RetroLoginHeaderProps> = ({ subtitle }) => {
  return (
    <div className="w-full max-w-[360px]">
      <div className="border-[var(--theme-border-width)] border-border bg-card">
        <div className="retro-title-bar">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-foreground">
              Justachat
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-foreground">™</span>
          </div>

          {/* Decorative only (not interactive) */}
          <div className="retro-window-controls" aria-hidden="true">
            <div className="retro-window-btn">_</div>
            <div className="retro-window-btn">□</div>
            <div className="retro-window-btn">×</div>
          </div>
        </div>

        {subtitle ? (
          <div className="px-3 py-2 text-center">
            <p className="text-muted-foreground text-xs sm:text-sm tracking-wide">{subtitle}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
