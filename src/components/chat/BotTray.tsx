/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, X, GripHorizontal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ModeratorInfo } from "@/lib/roomConfig";

interface MinimizedBotChat {
  id: string;
  moderator: ModeratorInfo;
  channelName: string;
}

interface BotTrayProps {
  minimizedChats: MinimizedBotChat[];
  onRestore: (chatId: string) => void;
  onClose: (chatId: string) => void;
}

const BotTray = ({ minimizedChats, onRestore, onClose }: BotTrayProps) => {
  const isMobile = useIsMobile();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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

  if (minimizedChats.length === 0) return null;

  return (
    <div 
      ref={trayRef}
      className="fixed bottom-0 right-4 z-[998] flex items-end gap-1 pb-2 lg:pb-2"
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Drag handle for whole tray */}
      {!isMobile && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "flex items-center justify-center px-2 py-2 rounded-t-lg border border-b-0 border-cyan-500/30 bg-cyan-500/10 cursor-grab shadow-lg",
            isDragging && "cursor-grabbing"
          )}
        >
          <GripHorizontal className="h-4 w-4 text-cyan-400" />
        </div>
      )}

      {minimizedChats.map((chat) => (
        <div
          key={chat.id}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-primary/10 shadow-lg cursor-pointer transition-all hover:bg-cyan-500/30"
          onClick={() => onRestore(chat.id)}
        >
          {/* Bot avatar */}
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-sm shrink-0">
            {chat.moderator.avatar}
          </div>
          
          {/* Bot name */}
          <span className="text-sm font-medium text-foreground max-w-[80px] truncate">
            {chat.moderator.name}
          </span>
          
          {/* Bot icon */}
          <Bot className="h-3.5 w-3.5 text-cyan-400" />
          
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

export default BotTray;
