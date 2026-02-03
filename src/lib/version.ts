/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

/**
 * Justachat™ Version Configuration
 * 
 * Project Inception: January 22, 2026 @ 13:03 UTC
 * VPS Launch = v1.0 (first production release)
 * Subsequent updates: v1.1, v1.2, v1.3, etc.
 * 
 * Update this file before each deployment to VPS.
 */

export const APP_VERSION = "1.0";
export const APP_BUILD_DATE = "2026-01-27";
export const APP_CODENAME = "Genesis"; // Optional: fun codenames for major versions
export const APP_INCEPTION_DATE = "2026-01-22T13:03:00Z"; // The moment Unix first asked for help

// For display purposes
export const getVersionString = () => `v${APP_VERSION}`;
export const getFullVersionString = () => `Justachat™ v${APP_VERSION} (${APP_CODENAME})`;
export const getBuildInfo = () => `Build: ${APP_BUILD_DATE}`;
export const getInceptionInfo = () => `Conceived: January 30, 2026`;

// Version comparison helper
export const parseVersion = (version: string): number[] => {
  return version.split('.').map(n => parseInt(n, 10) || 0);
};

export const compareVersions = (a: string, b: string): number => {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
};
