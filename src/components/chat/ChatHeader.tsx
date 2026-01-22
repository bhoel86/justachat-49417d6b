import { MessageCircle, Users, LogOut, Crown, ShieldCheck, Info, Hash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onlineCount: number;
  topic?: string;
  channelName?: string;
}

const ChatHeader = ({ onlineCount, topic, channelName = 'general' }: ChatHeaderProps) => {
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
    <header className="flex flex-col bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl jac-gradient-bg flex items-center justify-center jac-glow">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4 text-primary" />
                <h1 className="font-display font-bold text-lg text-foreground">{channelName}</h1>
              </div>
              {getRoleBadge()}
            </div>
            <p className="text-xs text-muted-foreground">JAC - Just A Chat</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{onlineCount} online</span>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium mb-1">Commands</p>
              <p className="text-xs text-muted-foreground">Type /help to see all available commands</p>
            </TooltipContent>
          </Tooltip>
          
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
      </div>
      
      {/* Topic bar */}
      {topic && (
        <div className="px-4 py-2 bg-secondary/30 border-t border-border/50">
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground/80">Topic:</span> {topic}
          </p>
        </div>
      )}
    </header>
  );
};

export default ChatHeader;
