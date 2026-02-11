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
  const [signingOut, setSigningOut] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);

  const isAdmin = role === 'admin' || role === 'owner';
  const isOwner = role === 'owner';
  const isModerator = role === 'moderator' || role === 'admin' || role === 'owner';
  
  // Show loading screen during initial load OR during signout transition
  const isLoading = loading || signingOut;

  // Separate initial load from ongoing auth changes to prevent race conditions
  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    // Auto-logout on browser/tab close (not on in-page navigation)
    const handleBeforeUnload = () => {
      // Use sendBeacon to sign out reliably during page unload
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const accessToken = session?.access_token;
      if (supabaseUrl && accessToken) {
        navigator.sendBeacon(
          `${supabaseUrl}/auth/v1/logout`,
          new Blob([JSON.stringify({})], { type: 'application/json' })
        );
      }
      // Clear local storage regardless
      clearAuthStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Role check function that can optionally control loading state
    const fetchRole = async (userId: string, controlLoading: boolean) => {
      try {
        const { data } = await supabaseUntyped
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        if (isMounted) {
          setRole(data?.role as AppRole ?? 'user');
        }
      } catch {
        if (isMounted) setRole('user');
      } finally {
        // Only set loading false after role is fetched (prevents flicker)
        if (controlLoading && isMounted) {
          setLoading(false);
        }
      }
    };

    // Listener for ONGOING auth changes (does NOT control loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('[Auth] State change:', event, session?.user?.email, isInitialLoad ? '(initial)' : '(ongoing)');
        
        setSession(session);
        setUser(session?.user ?? null);

        // For ongoing changes (not initial load), fire and forget role check
        if (!isInitialLoad) {
          if (session?.user) {
            fetchRole(session.user.id, false); // Don't control loading
          } else {
            setRole(null);
          }
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
                await fetchRole(data.session.user.id, true);
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
          
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchRole(session.user.id, true);
            return; // fetchRole sets loading=false
          }
        }
      } catch (err) {
        console.error('[Auth] initializeAuth error:', err);
      } finally {
        window.clearTimeout(safetyTimeout);
        // Mark initial load as complete
        isInitialLoad = false;
        // Ensure loading is false if we get here
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Logout from chat function - call this when leaving chat room
  const logoutFromChat = async () => {
    // Set signing out state to show loading screen during transition
    setSigningOut(true);
    
    // Best-effort sign-out; if it fails, still clear local storage to prevent re-login.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    } finally {
      clearAuthStorage();
    }
    setSession(null);
    setUser(null);
    setRole(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  const refreshRole = async () => {
    if (user) {
      const { data } = await supabaseUntyped
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setRole(data?.role as AppRole ?? 'user');
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
    // Set signing out state to show loading screen during transition
    setSigningOut(true);
    
    // Best-effort sign-out; if it fails, still clear local storage to prevent re-login.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    } finally {
      clearAuthStorage();
    }
    setSession(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading: isLoading, isAdmin, isOwner, isModerator, role, signUp, signIn, signOut, logoutFromChat, refreshRole }}>
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
