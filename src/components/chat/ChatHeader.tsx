import { MessageCircle, Users, LogOut, Crown, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onlineCount: number;
}

const ChatHeader = ({ onlineCount }: ChatHeaderProps) => {
  const { signOut, role } = useAuth();

  const getRoleBadge = () => {
    if (role === 'owner') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-xs font-medium">
          <Crown className="h-3 w-3" />
          Owner
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-400/20 text-red-400 text-xs font-medium">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </span>
      );
    }
    return null;
  };

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl jac-gradient-bg flex items-center justify-center jac-glow">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-lg jac-gradient-text">JAC</h1>
            {getRoleBadge()}
          </div>
          <p className="text-xs text-muted-foreground">Just A Chat</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{onlineCount} online</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
