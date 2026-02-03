/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState } from "react";
import { Trash2, Terminal, MessageSquareLock, Ban, Flag, Info, User, MoreVertical, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/avatar/UserAvatar";
import FormattedText from "./FormattedText";
import { useTheme } from "@/contexts/ThemeContext";
import { getSimulationPill, getPillEmoji, getBotPill, getPillType, PillChoice } from "@/hooks/useSimulationPill";
import matrixPillsImg from "@/assets/matrix/matrix-pills.jpg";

interface MessageBubbleProps {
  id: string;
  message: string;
  sender: string;
  senderId?: string;
  senderAvatarUrl?: string | null;
  timestamp: Date;
  isOwn: boolean;
  isSystem?: boolean;
  isModerator?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  onPmClick?: (userId: string, username: string) => void;
  onBlockClick?: (userId: string, username: string) => void;
  onReportClick?: (userId: string, username: string) => void;
  onInfoClick?: (userId: string, username: string) => void;
  translatedMessage?: string | null;
  detectedLanguage?: string | null;
  isTranslating?: boolean;
}

const MessageBubble = ({ 
  id, 
  message, 
  sender, 
  senderId,
  senderAvatarUrl,
  timestamp, 
  isOwn, 
  isSystem = false,
  isModerator = false,
  canDelete = false,
  onDelete,
  onPmClick,
  onBlockClick,
  onReportClick,
  onInfoClick,
  translatedMessage,
  detectedLanguage,
  isTranslating = false
}: MessageBubbleProps) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const displayMessage = translatedMessage && !showOriginal ? translatedMessage : message;
  const { theme } = useTheme();
  const isSimulation = theme === 'matrix';
  
  // Check if this is a bot message
  const isBot = senderId?.startsWith('bot-') || senderId?.startsWith('sim-');
  
  // Get pill choice for Simulation theme display - user's own pill or bot's simulated pill
  const pillChoice: PillChoice = isSimulation 
    ? (isBot && senderId ? getBotPill(senderId) : getSimulationPill()) 
    : null;
  
  // Pill image component for Simulation theme
  const PillIndicator = ({ pill, size = 'sm' }: { pill: PillChoice; size?: 'sm' | 'md' }) => {
    if (!pill) return null;
    const sizeClasses = size === 'sm' ? 'w-4 h-3' : 'w-5 h-4';
    return (
      <div 
        className={`${sizeClasses} bg-cover bg-no-repeat rounded-sm shrink-0`}
        style={{
          backgroundImage: `url(${matrixPillsImg})`,
          backgroundPosition: pill === 'red' ? '0% 50%' : '100% 50%',
          backgroundSize: '200% 100%',
        }}
        title={pill === 'red' ? 'Red Pill' : 'Blue Pill'}
      />
    );
  };
  
  // Username dropdown component with 3-dot menu
  const UsernameWithDropdown = ({ username, userId, isOwnMessage, avatarUrl }: { username: string; userId?: string; isOwnMessage: boolean; avatarUrl?: string | null }) => {
    const textColor = isOwnMessage ? "text-primary-foreground/90" : "text-primary";
    const iconColor = isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground";
    
    if (!userId) return <span className={`text-xs font-medium ${textColor} flex items-center gap-1`}>{pillChoice && <PillIndicator pill={pillChoice} />}{username}</span>;
    
    return (
      <div className="flex items-center gap-0.5">
        {/* Pill indicator for Simulation theme - show for own messages OR bot messages */}
        {pillChoice && (isOwnMessage || isBot) && (
          <PillIndicator pill={pillChoice} />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`p-0.5 rounded hover:bg-accent/50 transition-colors cursor-pointer opacity-60 hover:opacity-100 ${iconColor}`}>
              <MoreVertical className="h-2.5 w-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="bottom"
            sideOffset={4}
            avoidCollisions={false}
            className="w-48 bg-popover border border-border shadow-lg z-50 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="flex items-center gap-2">
              <UserAvatar
                avatarUrl={avatarUrl}
                username={username}
                size="sm"
              />
              <div>
                <p className="font-medium text-sm">{username}</p>
                <p className="text-xs text-muted-foreground">{isOwnMessage ? 'You' : 'User'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {!isOwnMessage && onPmClick && (
              <DropdownMenuItem 
                onClick={() => onPmClick(userId, username)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <MessageSquareLock className="h-4 w-4 text-primary" />
                <span>Private Message</span>
              </DropdownMenuItem>
            )}
            
            {onInfoClick && (
              <DropdownMenuItem 
                onClick={() => onInfoClick(userId, username)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
                <span>View Info</span>
              </DropdownMenuItem>
            )}
            
            {!isOwnMessage && (
              <>
                <DropdownMenuSeparator />
                
                {onBlockClick && (
                  <DropdownMenuItem 
                    onClick={() => onBlockClick(userId, username)}
                    className="flex items-center gap-2 cursor-pointer text-amber-500 focus:text-amber-500"
                  >
                    <Ban className="h-4 w-4" />
                    <span>Block User</span>
                  </DropdownMenuItem>
                )}
                
                {onReportClick && (
                  <DropdownMenuItem 
                    onClick={() => onReportClick(userId, username)}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Report User</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            {isOwnMessage && (
              <DropdownMenuItem 
                onClick={() => onInfoClick?.(userId, username)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className={`text-xs font-medium ${textColor} truncate max-w-[100px]`}>{username}</span>
      </div>
    );
  };

  // System message styling
  if (isSystem) {
    return (
      <div className="flex justify-center animate-message-in">
        <div className="flex items-start gap-1.5 max-w-[90%] px-2 py-1 bg-secondary/50 rounded-lg border border-border/50">
          <Terminal className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
            {message.split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
            )}
          </div>
        </div>
      </div>
    );
  }

  // Moderator message styling
  if (isModerator) {
    return (
      <div className="flex justify-start animate-message-in">
        <div className="max-w-[85%] rounded-lg px-2 py-1.5 bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 rounded-bl-sm">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-sm">{sender.split(' ')[0]}</span>
            <p className="text-[10px] font-bold text-primary">{sender.split(' ').slice(1).join(' ')}</p>
            <span className="text-[9px] px-1 py-0.5 rounded-full bg-primary/20 text-primary font-medium">MOD</span>
          </div>
          <p className="text-sm leading-snug break-words text-foreground">{message}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  // Check if this is an action message (/me)
  const isAction = message.startsWith('* ');

  if (isAction) {
    return (
      <div className="flex justify-center animate-message-in">
        <div className="px-2 py-1 text-xs italic text-primary">
          {message}
        </div>
      </div>
    );
  }

  // Check if message is ONLY an image/GIF (no text besides the tag)
  const imgMatch = message.match(/^\[img:(https?:\/\/[^\]]+)\]$/);
  const isImageOnly = !!imgMatch;
  
  // Render image-only messages without bubble
  if (isImageOnly && imgMatch) {
    const imageUrl = imgMatch[1];
    return (
      <div
        className={cn(
          "flex animate-message-in group",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        <div className="max-w-[85%]">
          <div className="flex items-center gap-1 mb-0.5">
            {!isOwn ? (
              <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={false} avatarUrl={senderAvatarUrl} />
            ) : (
              <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={true} avatarUrl={senderAvatarUrl} />
            )}
            <span className="text-[9px] ml-1 text-muted-foreground">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 ml-1 text-muted-foreground hover:text-destructive"
                title="Delete message"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
          {/* Reuse FormattedText's image renderer so we get consistent loading/error UI (incl. URL on failure) */}
          <FormattedText text={`[img:${imageUrl}]`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex animate-message-in group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-2 py-1 relative",
          isOwn
            ? "bg-jac-bubble-user text-primary-foreground rounded-br-sm"
            : "bg-jac-bubble-other text-foreground rounded-bl-sm"
        )}
      >
        <div className="flex items-center gap-1">
          {!isOwn ? (
            <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={false} avatarUrl={senderAvatarUrl} />
          ) : (
            <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={true} avatarUrl={senderAvatarUrl} />
          )}
          <span
            className={cn(
              "text-[9px] ml-1",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(id)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 ml-auto",
                isOwn ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-destructive"
              )}
              title="Delete message"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        <FormattedText text={displayMessage} className="text-sm leading-snug break-words whitespace-pre-wrap" />
        {(translatedMessage || detectedLanguage) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {detectedLanguage && (
              <span className={cn(
                "text-[9px] px-1 py-0.5 rounded-full",
                isOwn ? "bg-primary-foreground/10 text-primary-foreground/70" : "bg-muted text-muted-foreground"
              )}>
                {detectedLanguage}
              </span>
            )}
            {translatedMessage && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={cn(
                  "flex items-center gap-0.5 text-[9px] opacity-70 hover:opacity-100 transition-opacity",
                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                <Languages className="h-2.5 w-2.5" />
                {showOriginal ? 'Show translation' : 'Show original'}
              </button>
            )}
          </div>
        )}
        {isTranslating && (
          <span className="flex items-center gap-0.5 text-[9px] mt-0.5 opacity-50">
            <Languages className="h-2.5 w-2.5 animate-pulse" />
            Translating...
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
