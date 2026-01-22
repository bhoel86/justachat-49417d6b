import { Trash2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  id: string;
  message: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
  isSystem?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}

const MessageBubble = ({ 
  id, 
  message, 
  sender, 
  timestamp, 
  isOwn, 
  isSystem = false,
  canDelete = false,
  onDelete 
}: MessageBubbleProps) => {
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
        {!isOwn && (
          <p className="text-xs font-medium text-primary mb-1">{sender}</p>
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
