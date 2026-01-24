import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MinimizedChat {
  id: string;
  targetUsername: string;
  hasUnread: boolean;
}

interface PMTrayProps {
  minimizedChats: MinimizedChat[];
  onRestore: (chatId: string) => void;
  onClose: (chatId: string) => void;
}

const PMTray = ({ minimizedChats, onRestore, onClose }: PMTrayProps) => {
  if (minimizedChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[999] flex items-end gap-1 pb-2">
      {minimizedChats.map((chat) => (
        <div
          key={chat.id}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-border bg-card shadow-lg cursor-pointer transition-all hover:bg-muted",
            chat.hasUnread && "border-primary bg-primary/10"
          )}
          onClick={() => onRestore(chat.id)}
        >
          {/* Unread indicator */}
          {chat.hasUnread && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
          
          {/* Avatar */}
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
            {chat.targetUsername.charAt(0).toUpperCase()}
          </div>
          
          {/* Username */}
          <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
            {chat.targetUsername}
          </span>
          
          {/* Message icon */}
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          
          {/* Close button - appears on hover */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose(chat.id);
            }}
            className="h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive absolute -top-2 -right-2 bg-card border border-border"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PMTray;
