import { MessageCircle, Users, LogOut, Crown, ShieldCheck, Info, Hash, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRoomTheme, getDefaultTopic } from "@/lib/roomConfig";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onlineCount: number;
  topic?: string;
  channelName?: string;
  onLanguageClick?: () => void;
  currentLanguage?: string;
}

const ChatHeader = ({ onlineCount, topic, channelName = 'general', onLanguageClick, currentLanguage = 'en' }: ChatHeaderProps) => {
  const { logoutFromChat, role } = useAuth();
  const theme = getRoomTheme(channelName);
  const displayTopic = topic || getDefaultTopic(channelName);

  const getRoleBadge = () => {
    if (role === 'owner') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px] font-medium">
          <Crown className="h-2.5 w-2.5" />
          Owner
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-400/20 text-red-400 text-[10px] font-medium">
          <ShieldCheck className="h-2.5 w-2.5" />
          Admin
        </span>
      );
    }
    return null;
  };

  return (
    <header className="flex flex-col bg-card border-b border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
            theme.gradient
          )}>
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Hash className={cn("h-3.5 w-3.5", theme.textColor)} />
                <h1 className={cn("font-display font-bold text-sm", theme.textColor)}>{channelName}</h1>
              </div>
              {getRoleBadge()}
            </div>
            <p className="text-[10px] text-muted-foreground">Justachat™</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{onlineCount}</span>
          </div>
          
          {onLanguageClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLanguageClick}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Language: {currentLanguage.toUpperCase()}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium mb-1">Commands</p>
              <p className="text-xs text-muted-foreground">Type /help for all commands</p>
            </TooltipContent>
          </Tooltip>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={logoutFromChat}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Leave chat"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Topic bar with colored background */}
      <div className={cn(
        "px-3 py-1.5 border-t border-border/50",
        theme.bgColor
      )}>
        <p className="text-[11px] truncate">
          <span className={cn("font-semibold", theme.textColor)}>Topic:</span>{' '}
          <span className="text-foreground/80">{displayTopic}</span>
        </p>
      </div>
    </header>
  );
};

export default ChatHeader;
