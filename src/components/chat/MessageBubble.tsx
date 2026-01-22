import { useState } from "react";
import { Trash2, Terminal, MessageSquareLock, Ban, Flag, Info, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
  id: string;
  message: string;
  sender: string;
  senderId?: string;
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
}

const MessageBubble = ({ 
  id, 
  message, 
  sender, 
  senderId,
  timestamp, 
  isOwn, 
  isSystem = false,
  isModerator = false,
  canDelete = false,
  onDelete,
  onPmClick,
  onBlockClick,
  onReportClick,
  onInfoClick
}: MessageBubbleProps) => {
  
  // Username dropdown component
  const UsernameWithDropdown = ({ username, userId, isOwnMessage }: { username: string; userId?: string; isOwnMessage: boolean }) => {
    if (!userId) return <span className="text-xs font-medium text-primary">{username}</span>;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer">
            {username}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-48 bg-popover border border-border shadow-lg z-50"
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
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
          <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={false} />
        ) : (
          <div className="flex justify-end mb-1">
            <UsernameWithDropdown username={sender} userId={senderId} isOwnMessage={true} />
          </div>
        )}
        <p className="text-sm leading-relaxed break-words pr-6">{message}</p>
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
