import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ChatRoom from "@/components/chat/ChatRoom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { useSimulationPill } from "@/hooks/useSimulationPill";
import { PillTransitionOverlay } from "@/components/theme/PillTransitionOverlay";

const LAST_CHANNEL_KEY = 'jac-last-channel';
const GOOGLE_WELCOME_SHOWN_KEY = 'jac-google-welcome-shown';
const PILL_LOGIN_PENDING_KEY = 'jac-pill-login-pending';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { channelName } = useParams<{ channelName: string }>();
  const googleWelcomeShownRef = useRef(false);
  const { theme } = useTheme();
  const { pill } = useSimulationPill();
  const isMatrix = theme === 'matrix';
  
  // Track if the pill transition is complete (shown briefly on chat entry)
  const [showEntryTransition, setShowEntryTransition] = useState(false);
  const [entryTransitionDone, setEntryTransitionDone] = useState(false);

  // OAuth callback processing guard (VPS)
  const [oauthProcessing, setOauthProcessing] = useState(() =>
    typeof window !== "undefined" && window.location.hash.includes("access_token")
  );

  // Safety fallback: stop waiting after a short delay
  useEffect(() => {
    if (!oauthProcessing) return;
    const t = window.setTimeout(() => setOauthProcessing(false), 4000);
    return () => window.clearTimeout(t);
  }, [oauthProcessing]);

  // Show welcome toast for new Google OAuth users
  useEffect(() => {
    if (!user || googleWelcomeShownRef.current) return;
    
    // Check if this is a Google OAuth user (has Google provider data)
    const isGoogleUser = user.app_metadata?.provider === 'google' || 
                         user.identities?.some(i => i.provider === 'google');
    
    if (isGoogleUser) {
      // Check if we've already shown the welcome for this user
      const welcomeShownKey = `${GOOGLE_WELCOME_SHOWN_KEY}-${user.id}`;
      const alreadyShown = localStorage.getItem(welcomeShownKey);
      
      if (!alreadyShown) {
        googleWelcomeShownRef.current = true;
        
        // Get username to show in toast
        supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            const username = data?.username || 'there';
            toast.success(`Welcome, ${username}!`, {
              description: 'You can change your username anytime in your profile settings.',
              duration: 6000,
            });
            localStorage.setItem(welcomeShownKey, 'true');
          });
      }
    }
  }, [user]);

  // Scroll to top on page load
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  // Store current channel when it changes
  useEffect(() => {
    if (channelName) {
      try {
        localStorage.setItem(LAST_CHANNEL_KEY, channelName);
      } catch {
        // Ignore storage errors
      }
    }
  }, [channelName]);

  // Redirect to last visited channel or general if no channel specified
  useEffect(() => {
    if (!channelName) {
      try {
        const lastChannel = localStorage.getItem(LAST_CHANNEL_KEY);
        navigate(`/chat/${lastChannel || 'general'}`, { replace: true });
      } catch {
        navigate('/chat/general', { replace: true });
      }
    }
  }, [channelName, navigate]);

  // Don't redirect while processing OAuth callback - wait for session to be established
  useEffect(() => {
    if (oauthProcessing) return;
    
    if (!loading && !user) {
      navigate("/home");
    }
  }, [user, loading, navigate, oauthProcessing]);

  // Show pill transition on Matrix theme when entering chat after login
  useEffect(() => {
    if (!user || !isMatrix || !pill || entryTransitionDone) return;
    
    // Check if we just logged in (set by Auth.tsx)
    const loginPending = sessionStorage.getItem(PILL_LOGIN_PENDING_KEY);
    if (loginPending) {
      setShowEntryTransition(true);
      // Clear the flag so it doesn't show again on refresh
      sessionStorage.removeItem(PILL_LOGIN_PENDING_KEY);
    } else {
      // No pending login, skip transition
      setEntryTransitionDone(true);
    }
  }, [user, isMatrix, pill, entryTransitionDone]);

  if (loading || !channelName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    if (oauthProcessing) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
            <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
          </div>
        </div>
      );
    }

    return null;
  }

  // For Matrix theme: show brief pill transition on entry
  if (isMatrix && showEntryTransition && pill) {
    return (
      <>
        <PillTransitionOverlay 
          pill={pill} 
          show={true} 
          onComplete={() => {
            setShowEntryTransition(false);
            setEntryTransitionDone(true);
          }} 
        />
        {/* Render chat behind the overlay so it's ready when transition ends */}
        <div className="opacity-0">
          <ChatRoom initialChannelName={channelName} />
        </div>
      </>
    );
  }

  return <ChatRoom initialChannelName={channelName} />;
};

export default Index;
