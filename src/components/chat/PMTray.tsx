/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
 import { MessageSquare, X, GripHorizontal, GripVertical, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MinimizedChat {
  id: string;
  targetUsername: string;
  hasUnread: boolean;
}

 interface InboxMessage {
   senderId: string;
   senderUsername: string;
   count: number;
 }
 
interface PMTrayProps {
  minimizedChats: MinimizedChat[];
  onRestore: (chatId: string) => void;
  onClose: (chatId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
   inbox?: InboxMessage[];
   onOpenInboxChat?: (userId: string, username: string) => void;
}

 const PMTray = ({ 
   minimizedChats, 
   onRestore, 
   onClose, 
   onReorder, 
   inbox = [],
   onOpenInboxChat,
 }: PMTrayProps) => {
  const isMobile = useIsMobile();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTab, setDraggedTab] = useState<number | null>(null);
  const [dragOverTab, setDragOverTab] = useState<number | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  // Tray position dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  // Tab drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTab(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(index);
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = draggedTab;
    if (fromIndex !== null && fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  // Show tray if there are chats OR if DND toggle should be visible
   const showTray = minimizedChats.length > 0 || inbox.length > 0;
  
  if (!showTray) return null;

  return (
    <div 
      ref={trayRef}
      className="fixed bottom-0 left-1/2 z-[999] flex items-end gap-1 pb-2 lg:pb-2"
      style={{ 
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
      }}
    >
      {/* Drag handle for whole tray */}
      {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "flex items-center justify-center px-2 py-2 rounded-t-lg border border-b-0 border-border bg-muted/80 cursor-grab shadow-lg",
            isDragging && "cursor-grabbing"
          )}
        >
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {minimizedChats.map((chat, index) => (
        <div
          key={chat.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "group relative flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-border bg-card shadow-lg cursor-pointer transition-all hover:bg-muted",
            chat.hasUnread && "border-primary bg-primary/10",
            draggedTab === index && "opacity-50",
            dragOverTab === index && "border-l-2 border-l-primary"
          )}
          onClick={() => onRestore(chat.id)}
        >
          {/* Drag grip for reordering */}
          <div 
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3" />
          </div>

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
 
       {/* Inbox messages (from away mode) */}
       {inbox.map((msg) => (
         <div
           key={msg.senderId}
           className="group relative flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-blue-500/50 bg-blue-500/10 shadow-lg cursor-pointer transition-all hover:bg-blue-500/20"
           onClick={() => onOpenInboxChat?.(msg.senderId, msg.senderUsername)}
         >
           {/* Inbox indicator */}
           <Inbox className="h-3.5 w-3.5 text-blue-500" />
           
           {/* Avatar */}
           <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
             {msg.senderUsername.charAt(0).toUpperCase()}
           </div>
           
           {/* Username */}
           <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
             {msg.senderUsername}
           </span>
           
           {/* Count badge */}
           <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
             {msg.count > 9 ? '9+' : msg.count}
           </span>
         </div>
       ))}
    </div>
  );
};

export default PMTray;
