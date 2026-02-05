import { useState, useRef, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, X, Minus, GripHorizontal, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import FriendsList from "./FriendsList";
import { useTheme } from "@/contexts/ThemeContext";

interface FriendsTrayProps {
  currentUserId: string;
  onOpenPm: (userId: string, username: string) => void;
   getUnreadCount?: (userId: string) => number;
   totalUnreadCount?: number;
   doNotDisturb?: boolean;
   onToggleDND?: () => void;
   awayMode?: boolean;
   onToggleAway?: () => void;
}

type SizeMode = 'normal' | 'mid' | 'full';

const FriendsTray = ({ 
  currentUserId, 
  onOpenPm, 
   getUnreadCount,
   totalUnreadCount = 0,
   doNotDisturb,
   onToggleDND,
   awayMode,
   onToggleAway,
}: FriendsTrayProps) => {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [sizeMode, setSizeMode] = useState<SizeMode>('normal');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [counts, setCounts] = useState({ total: 0, online: 0, pending: 0 });
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  const handleCountsChange = useCallback((newCounts: { total: number; online: number; pending: number }) => {
    setCounts(newCounts);
  }, []);

  // Click outside to minimize
  useEffect(() => {
    if (!isOpen || isMinimized || isMobile) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMinimized(true);
        setPosition({ x: 0, y: 0 });
      }
    };

    // Delay adding listener to prevent immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMinimized, isMobile]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't allow dragging when maximized
    if (sizeMode !== 'normal') return;
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
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
    setPosition({ x: 0, y: 0 });
    setSizeMode('normal');
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(true);
    setPosition({ x: 0, y: 0 });
    setSizeMode('normal');
  };

  const handleToggleSize = () => {
    // Cycle through: normal -> mid -> full -> normal
    if (sizeMode === 'normal') {
      setSizeMode('mid');
      setPosition({ x: 0, y: 0 });
    } else if (sizeMode === 'mid') {
      setSizeMode('full');
      setPosition({ x: 0, y: 0 });
    } else {
      setSizeMode('normal');
    }
  };

  // Get size styles based on mode
  const getSizeStyles = () => {
    if (isMobile) return {};
    
    switch (sizeMode) {
      case 'full':
        return {
          top: 16,
          right: 16,
          bottom: 16,
          left: 'auto',
          width: 'calc(100vw - 32px)',
          maxWidth: 500,
          height: 'calc(100vh - 32px)',
        };
      case 'mid':
        return {
          right: 16,
          bottom: 16,
          width: 320,
          height: 'calc(50vh)',
          minHeight: 300,
        };
      default:
        return {
          right: 16,
          bottom: 16,
          width: 288,
          height: 400,
          transform: `translate(${position.x}px, ${position.y}px)`,
        };
    }
  };

  // Minimized state - just the icon tab at the bottom
  if (isMinimized && !isOpen) {
    return (
       <div className={cn(
         "fixed z-[998]",
         isMobile 
           ? "top-2 left-2" // Mobile: top-left corner, out of the way
           : "bottom-0 right-4" // Desktop: bottom-right tab
       )}>
        <button
          onClick={handleToggle}
          className={cn(
             "relative flex items-center gap-2 transition-all",
             isMobile 
               ? "px-2 py-1.5 border rounded-lg shadow-lg" // Mobile: compact rounded button
               : "px-4 py-2 border border-b-0", // Desktop: tab style
            isRetro 
               ? "retro-friends-tray bg-[hsl(50_100%_70%)] border-[3px] border-black rounded-none shadow-[3px_0_0_black,-3px_0_0_black]"
               : "bg-card/95 backdrop-blur-sm shadow-lg border-border hover:bg-muted hover:border-primary/50",
             !isMobile && !isRetro && "rounded-t-lg border-b-0"
          )}
        >
          <Users className={cn("h-4 w-4", isRetro ? "text-[hsl(330_90%_45%)]" : "text-primary")} />
           {/* Hide label on mobile for compactness */}
           {!isMobile && (
             <span className={cn("text-sm font-medium", isRetro ? "font-['VT323'] text-base text-black" : "")}>Friends</span>
           )}
          {counts.total > 0 && (
             <Badge variant="secondary" className={cn(
               "text-xs px-1.5 py-0", 
               isRetro ? "border-2 border-black rounded-none bg-[hsl(185_90%_55%)] text-black" : "",
               isMobile && "text-[10px] px-1"
             )}>
              {counts.online}/{counts.total}
            </Badge>
          )}
           {/* Unread messages badge */}
           {totalUnreadCount > 0 && (
             <span className={cn(
               "absolute -top-2 -left-2 h-5 w-5 text-[10px] flex items-center justify-center font-bold animate-bounce",
               isRetro ? "bg-[hsl(185_90%_55%)] text-black border-2 border-black rounded-none" : "rounded-full bg-primary text-primary-foreground"
             )}>
               {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
             </span>
           )}
          {counts.pending > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center font-bold animate-pulse",
              isRetro ? "bg-[hsl(330_90%_55%)] text-white border border-black rounded-none" : "rounded-full bg-destructive text-destructive-foreground"
            )}>
              {counts.pending}
            </span>
          )}
           {!isMobile && (
             <ChevronUp className={cn("h-3 w-3 ml-1", isRetro ? "text-black" : "text-muted-foreground")} />
           )}
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
        isRetro 
          ? "retro-friends-tray" 
          : "bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl",
        isMobile && "inset-x-2 bottom-2 max-h-[70vh]"
      )}
      style={!isMobile ? getSizeStyles() : undefined}
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b",
          isRetro 
            ? "retro-friends-header bg-[hsl(330_90%_55%)] border-black border-b-2" 
            : "border-border rounded-t-lg bg-muted/50",
          !isMobile && sizeMode === 'normal' && "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={!isMobile ? handleMouseDown : undefined}
      >
        {!isMobile && sizeMode === 'normal' && (
          <GripHorizontal className={cn("h-4 w-4 shrink-0", isRetro ? "text-white" : "text-muted-foreground")} />
        )}
        <Users className={cn("h-4 w-4 shrink-0", isRetro ? "text-white" : "text-primary")} />
        <span className={cn("font-medium text-sm flex-1", isRetro ? "font-['Press_Start_2P'] text-[0.5rem] text-white uppercase" : "")}>Friends</span>
        {counts.pending > 0 && (
          <Badge variant="destructive" className={cn("text-xs px-1.5 py-0", isRetro ? "border-2 border-black rounded-none" : "")}>
            {counts.pending} new
          </Badge>
        )}
        {/* Size toggle button */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded hover:bg-muted shrink-0"
            onClick={handleToggleSize}
            title={sizeMode === 'normal' ? 'Expand' : sizeMode === 'mid' ? 'Fullscreen' : 'Restore'}
          >
            {sizeMode === 'full' ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
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
           getUnreadCount={getUnreadCount}
           doNotDisturb={doNotDisturb}
           onToggleDND={onToggleDND}
           awayMode={awayMode}
           onToggleAway={onToggleAway}
        />
      </div>
    </div>
  );
};

export default FriendsTray;
