import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorage } from '@/lib/authStorage';

// Create an untyped client for tables not yet in generated types
const supabaseUntyped = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] State change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer role check with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
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

    // Handle OAuth callback hash explicitly (VPS self-hosted fix)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      console.log('[Auth] Detected OAuth callback hash, setting session from URL...');
      // Some self-hosted + proxy setups don't reliably auto-ingest the hash.
      // So we explicitly parse it and call setSession(), which will trigger SIGNED_IN.
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      (async () => {
        try {
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('[Auth] Failed to set session from OAuth hash:', error);
            } else if (data.session) {
            console.log('[Auth] Session established from OAuth hash (manual setSession)');
              setSession(data.session);
              setUser(data.session.user);
              setLoading(false);
              checkUserRole(data.session.user.id);
            }
          } else {
            console.warn('[Auth] OAuth hash missing access_token or refresh_token');
          }
        } finally {
          // Always clear the hash to avoid leaking tokens and to prevent re-processing on refresh.
          window.history.replaceState(null, '', window.location.pathname);
        }
      })();
    } else {
      // No OAuth callback, check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          checkUserRole(session.user.id);
        }
      });
    }

    return () => subscription.unsubscribe();
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
    // Redirect to auth page
    window.location.href = '/home';
  };

  const checkUserRole = async (userId: string) => {
    const { data } = await supabaseUntyped
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setRole(data.role as AppRole);
    } else {
      setRole('user');
    }
  };

  // Public method to refresh role (e.g., after /oper command)
  const refreshRole = async () => {
    if (user) {
      await checkUserRole(user.id);
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
