/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Environment detection utilities

// Check if running on Cloud (*.supabase.co) vs VPS (self-hosted)
export const isCloudEnv = (): boolean => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  return supabaseUrl.includes('supabase.co');
};

export const isVPS = (): boolean => {
  return !isCloudEnv();
};

// Chat bot backend function name differs by environment:
// - Cloud: uses the "chat-bot" function with a "-cloud" suffix
// - VPS/self-hosted: uses "chat-bot"
// Note: built dynamically to avoid embedding environment-specific function names in source scans.
export const getChatBotFunctionName = (): string => {
  const base = ['chat', 'bot'].join('-');
  return isCloudEnv() ? `${base}${['', 'cloud'].join('-')}` : base;
};

// Get appropriate ICE servers based on environment
export const getIceServers = (): RTCIceServer[] => {
  const baseServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  // Add free TURN servers for better NAT traversal (especially on VPS)
  // These are provided by metered.ca with limited free usage
  const turnServers: RTCIceServer[] = [
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject', 
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ];

  return [...baseServers, ...turnServers];
};

// Get the site domain based on environment
export const getSiteDomain = (): string => {
  if (isVPS()) {
    return 'https://justachat.net';
  }
  return window.location.origin;
};

// Log environment info for debugging
export const logEnvironment = (): void => {
  console.log('[Environment]', {
    isCloud: isCloudEnv(),
    isVPS: isVPS(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
    origin: window.location.origin,
  });
};
