/**
 * Helper(s) to detect preview/dev environments.
 */

const getHost = (hostname?: string) => {
  if (hostname) return hostname.toLowerCase();
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
};

export const isPreviewHost = (hostname?: string) => {
  const host = getHost(hostname);
  // Matches preview domain patterns
  const isPreviewApp = host.includes('lovable') && host.endsWith('.app');
  const isPreviewProject = host.includes('lovableproject') && host.endsWith('.com');
  return isPreviewApp || isPreviewProject;
};

export const isLocalDevHost = (hostname?: string) => {
  const host = getHost(hostname);
  return host === 'localhost' || host === '127.0.0.1';
};

export const isPreviewModeHost = (hostname?: string) => {
  return isPreviewHost(hostname) || isLocalDevHost(hostname);
};
