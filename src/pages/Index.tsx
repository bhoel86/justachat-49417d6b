import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ChatRoom from "@/components/chat/ChatRoom";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { channelId } = useParams<{ channelId: string }>();

  // Scroll to top on page load
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ChatRoom initialChannelId={channelId} />;
};

export default Index;
