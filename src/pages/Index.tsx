import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ChatRoom from "@/components/chat/ChatRoom";

const LAST_CHANNEL_KEY = 'jac-last-channel';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { channelName } = useParams<{ channelName: string }>();

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

  return <ChatRoom initialChannelName={channelName} />;
};

export default Index;
