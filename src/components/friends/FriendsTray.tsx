import { useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, X, Minus, GripHorizontal, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import FriendsList from "./FriendsList";

interface FriendsTrayProps {
  currentUserId: string;
  onOpenPm: (userId: string, username: string) => void;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 400;
const MIN_HEIGHT = 300;
const MAX_HEIGHT = 600;
const DEFAULT_WIDTH = 288;
const DEFAULT_HEIGHT = 400;

const FriendsTray = ({ 
  currentUserId, 
  onOpenPm, 
}: FriendsTrayProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [counts, setCounts] = useState({ total: 0, online: 0, pending: 0 });
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initialWidth: number; initialHeight: number } | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  const handleCountsChange = useCallback((newCounts: { total: number; online: number; pending: number }) => {
    setCounts(newCounts);
  }, []);

  // Handle dragging the popup window
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

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      
      let newWidth = resizeRef.current.initialWidth;
      let newHeight = resizeRef.current.initialHeight;
      
      // Resize from left edge (inverted because we're anchored to the right)
      if (isResizing.includes('w')) {
        newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeRef.current.initialWidth - deltaX));
      }
      
      // Resize from right edge
      if (isResizing.includes('e')) {
        newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeRef.current.initialWidth + deltaX));
      }
      
      // Resize from top edge (inverted because we're anchored to the bottom)
      if (isResizing.includes('n')) {
        newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeRef.current.initialHeight - deltaY));
      }
      
      // Resize from bottom edge
      if (isResizing.includes('s')) {
        newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeRef.current.initialHeight + deltaY));
      }
      
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      resizeRef.current = null;
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: size.width,
      initialHeight: size.height,
    };
  };

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
    // Reset position when minimizing
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
    setPosition({ x: 0, y: 0 });
  };

  // Minimized state - just the icon tab at the bottom
  if (isMinimized && !isOpen) {
    return (
      <div className="fixed bottom-0 right-4 z-[998]">
        <button
          onClick={handleToggle}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2 rounded-t-lg border border-b-0",
            "bg-card/95 backdrop-blur-sm shadow-lg transition-all hover:bg-muted",
            "border-border hover:border-primary/50"
          )}
        >
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Friends</span>
          {counts.total > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {counts.online}/{counts.total}
            </Badge>
          )}
          {counts.pending > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold animate-pulse">
              {counts.pending}
            </span>
          )}
          <ChevronUp className="h-3 w-3 text-muted-foreground ml-1" />
        </button>
      </div>
    );
  }

  // Open popup state
  return (
    <div 
      ref={trayRef}
      className={cn(
        "fixed z-[998] flex flex-col",
        "bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl",
        isMobile && "inset-x-2 bottom-2 max-h-[70vh]"
      )}
      style={!isMobile ? { 
        right: 16,
        bottom: 16,
        width: size.width,
        height: size.height,
        transform: `translate(${position.x}px, ${position.y}px)`,
      } : undefined}
    >
      {/* Resize handles - desktop only */}
      {!isMobile && (
        <>
          {/* Edge handles */}
          <div 
            className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize z-10 hover:bg-primary/20 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div 
            className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize z-10 hover:bg-primary/20 rounded"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div 
            className="absolute top-3 -left-1 bottom-3 w-2 cursor-w-resize z-10 hover:bg-primary/20 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div 
            className="absolute top-3 -right-1 bottom-3 w-2 cursor-e-resize z-10 hover:bg-primary/20 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
          {/* Corner handles */}
          <div 
            className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize z-20 hover:bg-primary/30 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize z-20 hover:bg-primary/30 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div 
            className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize z-20 hover:bg-primary/30 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize z-20 hover:bg-primary/30 rounded"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
        </>
      )}

      {/* Header */}
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b border-border rounded-t-lg bg-muted/50",
          !isMobile && "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={!isMobile ? handleMouseDown : undefined}
      >
        {!isMobile && (
          <GripHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <Users className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium text-sm flex-1">Friends</span>
        {counts.pending > 0 && (
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            {counts.pending} new
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded hover:bg-muted shrink-0"
          onClick={handleMinimize}
          title="Minimize"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded hover:bg-destructive/20 hover:text-destructive shrink-0"
          onClick={handleClose}
          title="Close"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Friends List Content */}
      <div className="flex-1 overflow-hidden">
        <FriendsList
          currentUserId={currentUserId}
          onOpenPm={onOpenPm}
          onCountsChange={handleCountsChange}
        />
      </div>

      {/* Resize indicator in corner */}
      {!isMobile && (
        <div 
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground rotate-180">
            <path d="M11 1L1 11M7 1L1 7M11 5L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default FriendsTray;
