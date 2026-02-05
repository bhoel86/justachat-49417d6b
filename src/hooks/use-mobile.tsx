/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import * as React from "react";
import { useState, useEffect, useMemo } from "react";

const MOBILE_BREAKPOINT = 768;

// SSR-safe initial value based on navigator.userAgent if available
const getInitialMobileState = (): boolean | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  // Try to get immediate value from window width
  if (typeof window.innerWidth === 'number') {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  
  return undefined;
};

export function useIsMobile() {
  // Initialize with actual value immediately to prevent flash
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    const initial = getInitialMobileState();
    return initial ?? false;
  });
  const [hasHydrated, setHasHydrated] = useState(() => getInitialMobileState() !== undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    setHasHydrated(true);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return undefined until hydrated to signal loading state
  if (!hasHydrated) return undefined;
  
  return isMobile;
}
