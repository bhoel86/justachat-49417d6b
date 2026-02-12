/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/lib/authStorage';

// Legacy alias — all tables are now in generated types so we just re-export
// the typed client. Consumers can migrate to importing supabase directly.
const supabaseUntyped = supabase as any;

type AppRole = 'owner' | 'admin' | 'moderator' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isModerator: boolean;
  role: AppRole | null;
  signUp: (email: string, password: string, username: string, age: number) => Promise<{ error: Error | null; data: { user: User | null } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logoutFromChat: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  const isAdmin = role === 'admin' || role === 'owner';
  const isOwner = role === 'owner';
  const isModerator = role === 'moderator' || role === 'admin' || role === 'owner';

  // Separate initial load from ongoing auth changes to prevent race conditions
  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    // Browser-close auto-logout removed — sessionStorage is unreliable
    // across origin-changing redirects (HTTP→HTTPS, www→non-www) which
    // caused users to be logged out on every page refresh on VPS.

    // Role check function that can optionally control loading state
    // Uses direct REST fetch with timeout to prevent Supabase client hanging
    const fetchRole = async (userId: string, controlLoading: boolean, accessToken?: string) => {
      try {
        console.log('[Auth] Fetching role for user:', userId);
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&select=role`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${accessToken || supabaseKey}`,
                'Accept': 'application/json',
              },
              signal: controller.signal,
            }
          );
          clearTimeout(timeout);
          
          if (res.ok) {
            const rows = await res.json();
            if (isMounted) {
              const roleOrder: AppRole[] = ['owner', 'admin', 'moderator', 'user'];
              let best: AppRole = 'user';
              for (const row of rows) {
                const idx = roleOrder.indexOf(row.role);
                if (idx >= 0 && idx < roleOrder.indexOf(best)) {
                  best = row.role;
                }
              }
              console.log('[Auth] Role resolved:', best, 'from', rows.length, 'rows');
              setRole(best);
            }
          } else {
            console.warn('[Auth] Role fetch HTTP error:', res.status);
            if (isMounted) setRole('user');
          }
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          if (fetchErr.name === 'AbortError') {
            console.warn('[Auth] Role fetch timed out after 5s');
          } else {
            console.error('[Auth] Role fetch error:', fetchErr);
          }
          if (isMounted) setRole('user');
        }
      } catch (err) {
        console.error('[Auth] Role fetch exception:', err);
        if (isMounted) setRole('user');
      } finally {
        if (controlLoading && isMounted) {
          setLoading(false);
        }
      }
    };

    // Listener for ONGOING auth changes (does NOT control loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        // During initial load, IGNORE auth state changes — initializeAuth handles it.
        // This prevents the race condition where the listener restores a session
        // before the browser-close check can sign it out.
        if (isInitialLoad) {
          console.log('[Auth] Ignoring initial auth event:', event);
          return;
        }
        
        console.log('[Auth] State change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchRole(session.user.id, false, session.access_token);
        } else {
          setRole(null);
        }

        // Clear URL hash after OAuth callback is processed (VPS fix)
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          console.log('[Auth] OAuth callback processed, clearing hash');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // INITIAL load - controls loading state, waits for role before setting loading=false
    const initializeAuth = async () => {
      // Safety timeout - NEVER stay loading forever (mobile fix)
      const safetyTimeout = window.setTimeout(() => {
        if (isMounted && loading) {
          console.warn('[Auth] Safety timeout reached, forcing loading=false');
          isInitialLoad = false;
          setLoading(false);
        }
      }, 5000);

      try {
        // Handle OAuth callback hash explicitly (VPS self-hosted fix)
        const hash = window.location.hash;
        
        if (hash && hash.includes('access_token')) {
          console.log('[Auth] Detected OAuth callback hash, setting session from URL...');
          const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          try {
            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error) {
                console.error('[Auth] Failed to set session from OAuth hash:', error);
              } else if (data.session && isMounted) {
                console.log('[Auth] Session established from OAuth hash');
                setSession(data.session);
                setUser(data.session.user);
                await fetchRole(data.session.user.id, true, data.session.access_token);
                return; // fetchRole sets loading=false
              }
            } else {
              console.warn('[Auth] OAuth hash missing tokens');
            }
          } finally {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          // No OAuth callback, check for existing session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[Auth] getSession failed:', error);
          }
          
          if (!isMounted) return;

          // Browser-close auto-logout removed (see comment at top of effect)
          
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchRole(session.user.id, true, session.access_token);
            return; // fetchRole sets loading=false
          }
        }
      } catch (err) {
        console.error('[Auth] initializeAuth error:', err);
      } finally {
        window.clearTimeout(safetyTimeout);
        // Mark initial load as complete so the listener starts processing events
        isInitialLoad = false;
        // Ensure loading is false if we get here
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Logout from chat function - call this when leaving chat room
  const logoutFromChat = async () => {
    console.log('[Auth] logoutFromChat called');
    
    // Clear state first
    setSession(null);
    setUser(null);
    setRole(null);
    
    // Best-effort sign-out; if it fails, still clear local storage to prevent re-login.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    clearAuthStorage();
    localStorage.removeItem('jac_personal_theme');
    
    // Redirect to login page
    window.location.replace('/login');
  };

  const refreshRole = async () => {
    if (user) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const accessToken = session?.access_token;
        
        const res = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${user.id}&select=role`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken || supabaseKey}`,
              'Accept': 'application/json',
            },
          }
        );
        if (res.ok) {
          const rows = await res.json();
          const roleOrder: AppRole[] = ['owner', 'admin', 'moderator', 'user'];
          let best: AppRole = 'user';
          for (const row of rows) {
            const idx = roleOrder.indexOf(row.role);
            if (idx >= 0 && idx < roleOrder.indexOf(best)) {
              best = row.role;
            }
          }
          setRole(best);
        }
      } catch {
        // keep existing role
      }
    }
  };

  const signUp = async (email: string, password: string, username: string, age: number) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          age
        }
      }
    });
    
    return { error, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');
    
    // Clear state first to prevent re-render loops
    setSession(null);
    setUser(null);
    setRole(null);
    
    // Best-effort sign-out; if it fails, still clear local storage to prevent re-login.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    clearAuthStorage();
    localStorage.removeItem('jac_personal_theme');
    
    // Use replace to prevent back-button returning to lobby
    console.log('[Auth] Redirecting to /login');
    window.location.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isOwner, isModerator, role, signUp, signIn, signOut, logoutFromChat, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export untyped client for use in other components
export { supabaseUntyped };
