import { MessagesSquare, Users, LogOut, Crown, ShieldCheck, Info, Hash, Globe, Bell, BellOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRoomTheme, getDefaultTopic } from "@/lib/roomConfig";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import jungleHeaderLogo from "@/assets/themes/jungle-header-logo.png";

interface ChatHeaderProps {
  onlineCount: number;
  topic?: string;
  channelName?: string;
  onLanguageClick?: () => void;
  currentLanguage?: string;
  doNotDisturb?: boolean;
  onToggleDND?: () => void;
}

const ChatHeader = ({ onlineCount, topic, channelName = 'general', onLanguageClick, currentLanguage = 'en', doNotDisturb, onToggleDND }: ChatHeaderProps) => {
  const { logoutFromChat, role } = useAuth();
  const { theme: siteTheme } = useTheme();
  const roomTheme = getRoomTheme(channelName);
  const displayTopic = topic || getDefaultTopic(channelName);
  
  // Use site theme colors for special themes, otherwise use room-specific colors
  const isStPatricks = siteTheme === 'stpatricks';
  const isValentines = siteTheme === 'valentines';
  const isMatrix = siteTheme === 'matrix';
  const isJungle = siteTheme === 'jungle';
  
  // Override colors for special site themes
  const effectiveGradient = isJungle
    ? 'from-green-600 to-emerald-700'
    : isMatrix
      ? 'from-green-500 to-green-700'
      : isStPatricks 
        ? 'from-emerald-500 to-green-600' 
        : isValentines 
          ? 'from-pink-500 to-rose-500'
          : roomTheme.gradient;
  
  const effectiveTextColor = isJungle
    ? 'text-green-500'
    : isMatrix
      ? 'text-green-400'
      : isStPatricks 
        ? 'text-emerald-400' 
        : isValentines 
          ? 'text-pink-400'
          : roomTheme.textColor;
  
  const effectiveBgColor = isJungle
    ? 'bg-green-600/20'
    : isMatrix
      ? 'bg-green-500/20'
      : isStPatricks 
        ? 'bg-emerald-500/20' 
        : isValentines 
          ? 'bg-pink-500/20'
          : roomTheme.bgColor;
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
    <header className={cn(
      "flex flex-col border-b",
      isJungle ? "bg-[#0a1f0a] border-green-900/50" : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between px-3 py-2 relative">
        {/* Left section - channel info */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
            effectiveGradient
          )}>
            <MessagesSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Hash className={cn("h-3.5 w-3.5", effectiveTextColor)} />
                <h1 className={cn("font-display font-bold text-sm", effectiveTextColor)}>{channelName}</h1>
              </div>
              {getRoleBadge()}
            </div>
            <p className={cn("text-[10px]", isJungle ? "text-green-500/70" : "text-muted-foreground")}>
              {isJungle ? "Jungle Expedition" : "Justachat™"}
            </p>
          </div>
        </div>
        
        {/* Center section - Jungle branding (only for jungle theme) */}
        {isJungle && (
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <div className="relative px-4 py-1">
              {/* Vine border decorations */}
              <span className="absolute -left-2 top-0 text-green-500 text-sm">🌿</span>
              <span className="absolute -left-1 bottom-0 text-green-600 text-xs rotate-180">🌿</span>
              <span className="absolute -right-2 top-0 text-green-500 text-sm scale-x-[-1]">🌿</span>
              <span className="absolute -right-1 bottom-0 text-green-600 text-xs rotate-180 scale-x-[-1]">🌿</span>
              {/* Corner leaves */}
              <span className="absolute left-2 -top-1 text-green-400 text-[10px]">🍃</span>
              <span className="absolute right-2 -top-1 text-green-400 text-[10px] scale-x-[-1]">🍃</span>
              <span className="absolute left-4 -bottom-1 text-green-500 text-[10px]">🍃</span>
              <span className="absolute right-4 -bottom-1 text-green-500 text-[10px] scale-x-[-1]">🍃</span>
              {/* The logo */}
              <img 
                src={jungleHeaderLogo} 
                alt="Justachat Jungle"
                className="h-10 object-contain"
              />
            </div>
          </div>
        )}
        
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{onlineCount} online</span>
            {onToggleDND && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleDND}
                    className={cn(
                      "ml-1 p-0.5 rounded-full transition-colors",
                      doNotDisturb ? "text-amber-500" : "hover:text-foreground"
                    )}
                  >
                    {doNotDisturb ? (
                      <BellOff className="h-3.5 w-3.5" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {doNotDisturb ? 'Do Not Disturb: ON' : 'Do Not Disturb: OFF'}
                </TooltipContent>
              </Tooltip>
            )}
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
        effectiveBgColor
      )}>
        <p className="text-[11px] truncate">
          <span className={cn("font-semibold", effectiveTextColor)}>Topic:</span>{' '}
          <span className="text-foreground/80">{displayTopic}</span>
        </p>
      </div>
    </header>
  );
};

export default ChatHeader;
