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

  useEffect(() => {
    let isMounted = true;
    let initialResolved = false;

    const fetchRole = async (userId: string, accessToken?: string) => {
      try {
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
              console.log('[Auth] Role resolved:', best);
              setRole(best);
            }
          } else {
            if (isMounted) setRole('user');
          }
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          if (isMounted) setRole('user');
        }
      } catch {
        if (isMounted) setRole('user');
      }
    };

    const resolveSession = (session: Session | null) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchRole(session.user.id, session.access_token).finally(() => {
          if (isMounted && !initialResolved) {
            initialResolved = true;
            setLoading(false);
          }
        });
      } else {
        setRole(null);
        if (isMounted && !initialResolved) {
          initialResolved = true;
          setLoading(false);
        }
      }
    };

    // Auth listener handles ongoing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        console.log('[Auth] State change:', event, session?.user?.email);
        resolveSession(session);

        // Clear URL hash after OAuth callback is processed (VPS fix)
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // Belt-and-suspenders: also call getSession() directly so we don't
    // depend solely on the listener firing (which can hang on some VPS setups).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && !initialResolved) {
        console.log('[Auth] getSession resolved:', session?.user?.email ?? 'no session');
        resolveSession(session);
      }
    }).catch(() => {
      // If getSession also hangs/fails, safety timeout below handles it
    });

    // Safety timeout — never stay loading forever
    const safetyTimeout = window.setTimeout(() => {
      if (isMounted && !initialResolved) {
        console.warn('[Auth] Safety timeout reached, forcing loading=false');
        initialResolved = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.clearTimeout(safetyTimeout);
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    try {
      // Use direct REST call with timeout to prevent VPS hangs
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          data: { username, age },
          gotrue_meta_security: {},
          code_challenge: undefined,
          code_challenge_method: undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const body = await res.json();

      if (!res.ok) {
        return { error: new Error(body.msg || body.message || body.error_description || 'Signup failed'), data: null };
      }

      // If identities is empty array, user already exists
      if (body.identities && body.identities.length === 0) {
        return { error: new Error('User already registered'), data: null };
      }

      return { error: null, data: { user: body as User } };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { error: new Error('Signup timed out. Please try again.'), data: null };
      }
      return { error: err instanceof Error ? err : new Error(String(err)), data: null };
    }
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
