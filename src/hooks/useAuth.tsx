import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkUserRole(session.user.id);
        checkMinorStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Logout from chat function - call this when leaving chat room
  const logoutFromChat = async () => {
    // Local sign-out clears browser storage even if the server session is already gone.
    // This prevents the "sign out then immediately sign back in" loop.
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setUser(null);
    setRole(null);
    setIsMinor(false);
    setHasParentConsent(true);
    // Redirect to auth page
    window.location.href = '/auth';
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
    // Use local sign-out to reliably clear auth in the browser.
    await supabase.auth.signOut({ scope: 'local' });
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
