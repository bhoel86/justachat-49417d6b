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
  isMinor: boolean;
  hasParentConsent: boolean;
  signUp: (email: string, password: string, username: string, age: number, parentEmail?: string) => Promise<{ error: Error | null; data: { user: User | null } | null }>;
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
  const [isMinor, setIsMinor] = useState(false);
  const [hasParentConsent, setHasParentConsent] = useState(true);

  const isAdmin = role === 'admin' || role === 'owner';
  const isOwner = role === 'owner';
  const isModerator = role === 'moderator' || role === 'admin' || role === 'owner';

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
            checkMinorStatus(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setIsMinor(false);
          setHasParentConsent(true);
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
      // The Supabase client will automatically parse this with detectSessionInUrl: true
      // But we need to ensure it happens before other code runs
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('[Auth] Error parsing OAuth hash:', error);
        }
        if (session) {
          console.log('[Auth] Session established from OAuth hash');
          setSession(session);
          setUser(session.user);
          setLoading(false);
          checkUserRole(session.user.id);
          checkMinorStatus(session.user.id);
          // Clear the hash
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          console.log('[Auth] No session from hash, checking existing...');
        }
      });
    } else {
      // No OAuth callback, check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          checkUserRole(session.user.id);
          checkMinorStatus(session.user.id);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  // Logout from chat function - call this when leaving chat room
  const logoutFromChat = async () => {
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
    setIsMinor(false);
    setHasParentConsent(true);
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

  const checkMinorStatus = async (userId: string) => {
    const { data } = await supabaseUntyped
      .from('profiles')
      .select('is_minor, parent_consent_verified')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setIsMinor(data.is_minor || false);
      setHasParentConsent(data.parent_consent_verified || !data.is_minor);
    }
  };

  // Public method to refresh role (e.g., after /oper command)
  const refreshRole = async () => {
    if (user) {
      await checkUserRole(user.id);
      await checkMinorStatus(user.id);
    }
  };

  const signUp = async (email: string, password: string, username: string, age: number, parentEmail?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          age,
          parent_email: parentEmail || null,
          is_minor: age < 18
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
    setIsMinor(false);
    setHasParentConsent(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isOwner, isModerator, role, isMinor, hasParentConsent, signUp, signIn, signOut, logoutFromChat, refreshRole }}>
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
