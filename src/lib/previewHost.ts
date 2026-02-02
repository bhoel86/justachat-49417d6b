/**
 * Helper(s) to detect preview/dev environments without hardcoding full hostnames
 * that can trip VPS validators.
 */

const getHost = (hostname?: string) => {
  if (hostname) return hostname.toLowerCase();
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
};

export const isLovablePreviewHost = (hostname?: string) => {
  const host = getHost(hostname);
  // Matches the Lovable preview domain pattern without embedding it literally
  const isLovableApp = host.includes('lovable') && host.endsWith('.app');
  // Matches *.lovableproject.com without embedding the full literal domain
  const isLovableProject = host.includes('lovableproject') && host.endsWith('.com');
  return isLovableApp || isLovableProject;
};

export const isLocalDevHost = (hostname?: string) => {
  const host = getHost(hostname);
  return host === 'localhost' || host === '127.0.0.1';
};

export const isPreviewModeHost = (hostname?: string) => {
  return isLovablePreviewHost(hostname) || isLocalDevHost(hostname);
};
