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
  
  // Username dropdown component with 3-dot menu
  const UsernameWithDropdown = ({ username, userId, isOwnMessage, avatarUrl }: { username: string; userId?: string; isOwnMessage: boolean; avatarUrl?: string | null }) => {
    if (!userId) return <span className="text-xs font-medium text-primary">{username}</span>;
    
    return (
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-0.5 rounded hover:bg-accent/50 transition-colors cursor-pointer opacity-60 hover:opacity-100">
              <MoreVertical className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 bg-popover border border-border shadow-lg z-50"
          >
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
        <span className="text-xs font-medium text-primary">{username}</span>
      </div>
    );
  };

  // System message styling
  if (isSystem) {
    return (
      <div className="flex justify-center animate-message-in">
        <div className="flex items-start gap-2 max-w-[90%] px-4 py-2 bg-secondary/50 rounded-lg border border-border/50">
          <Terminal className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
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
        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 rounded-bl-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{sender.split(' ')[0]}</span>
            <p className="text-xs font-bold text-primary">{sender.split(' ').slice(1).join(' ')}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">MOD</span>
          </div>
          <p className="text-sm leading-relaxed break-words text-foreground">{message}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
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
        <div className="px-4 py-2 text-sm italic text-primary">
          {message}
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
          "max-w-[80%] rounded-2xl px-4 py-3 relative",
          isOwn
            ? "bg-jac-bubble-user text-primary-foreground rounded-br-md"
            : "bg-jac-bubble-other text-foreground rounded-bl-md"
        )}
      >
        {!isOwn ? (
          <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={false} avatarUrl={senderAvatarUrl} />
        ) : (
          <div className="flex justify-end mb-1">
            <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={true} avatarUrl={senderAvatarUrl} />
          </div>
        )}
        <p className="text-sm leading-relaxed break-words pr-6 whitespace-pre-wrap">{displayMessage}</p>
        {(translatedMessage || detectedLanguage) && (
          <div className="flex items-center gap-2 mt-1">
            {detectedLanguage && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                isOwn ? "bg-primary-foreground/10 text-primary-foreground/70" : "bg-muted text-muted-foreground"
              )}>
                {detectedLanguage}
              </span>
            )}
            {translatedMessage && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={cn(
                  "flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 transition-opacity",
                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                <Languages className="h-3 w-3" />
                {showOriginal ? 'Show translation' : 'Show original'}
              </button>
            )}
          </div>
        )}
        {isTranslating && (
          <span className="flex items-center gap-1 text-[10px] mt-1 opacity-50">
            <Languages className="h-3 w-3 animate-pulse" />
            Translating...
          </span>
        )}
        <div className="flex items-center justify-between mt-1">
          <p
            className={cn(
              "text-[10px]",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(id)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20",
                isOwn ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-destructive"
              )}
              title="Delete message"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
