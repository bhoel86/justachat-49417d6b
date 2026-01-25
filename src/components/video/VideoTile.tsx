import { useEffect, useRef, forwardRef, useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Sparkles } from 'lucide-react';

interface VideoTileProps {
  stream?: MediaStream | null;
  username: string;
  avatarUrl?: string | null;
  isLocal?: boolean;
  isBroadcasting?: boolean;
  roleBadge?: React.ReactNode;
  aiEnhanced?: boolean;
}

const VideoTile = forwardRef<HTMLDivElement, VideoTileProps>(({ 
  stream, 
  username, 
  avatarUrl, 
  isLocal = false,
  isBroadcasting = false,
  roleBadge,
  aiEnhanced = false
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [useCanvas, setUseCanvas] = useState(false);

  // Apply CSS-based enhancement (much safer and faster)
  const getEnhancementStyle = useCallback((): React.CSSProperties => {
    if (!aiEnhanced) return {};
    return {
      filter: 'contrast(1.05) saturate(1.1) brightness(1.02)',
    };
  }, [aiEnhanced]);

  // Canvas-based sharpening with safe pixel access
  const applyEnhancement = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !aiEnhanced) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx || video.paused || video.ended || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(applyEnhancement);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    
    // Ensure valid dimensions
    if (vw < 10 || vh < 10) {
      animationFrameRef.current = requestAnimationFrame(applyEnhancement);
      return;
    }

    // Match canvas size to video
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    try {
      // Draw video frame
      ctx.drawImage(video, 0, 0, vw, vh);

      // Apply CSS-like filters via canvas (safer than pixel manipulation)
      ctx.filter = 'contrast(1.08) saturate(1.12) brightness(1.02)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      
    } catch (e) {
      console.error('Enhancement error:', e);
      // Fallback: just draw video without enhancement
      ctx.filter = 'none';
      ctx.drawImage(video, 0, 0, vw, vh);
    }

    animationFrameRef.current = requestAnimationFrame(applyEnhancement);
  }, [aiEnhanced]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Start/stop enhancement loop
  useEffect(() => {
    if (aiEnhanced && stream) {
      setUseCanvas(true);
      // Wait for video to be ready
      const timer = setTimeout(() => {
        applyEnhancement();
      }, 200);
      return () => {
        clearTimeout(timer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    } else {
      setUseCanvas(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [aiEnhanced, stream, applyEnhancement]);

  return (
    <div 
      ref={ref}
      className={`relative bg-gradient-to-br ${
        isBroadcasting 
          ? 'from-green-500/20 to-emerald-500/20 border-green-500/50' 
          : 'from-muted/50 to-muted/30 border-border'
      } rounded-xl border overflow-hidden aspect-video`}
    >
      {/* Live Badge */}
      {isBroadcasting && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          {aiEnhanced && (
            <Badge variant="secondary" className="text-[10px] bg-primary/80 text-primary-foreground">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          )}
          <Badge variant="destructive" className="text-[10px] animate-pulse">
            <Video className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </div>
      )}

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="text-[10px]">
            You
          </Badge>
        </div>
      )}

      {/* Video or Placeholder */}
      {stream ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover ${useCanvas ? 'hidden' : ''}`}
            style={!useCanvas ? getEnhancementStyle() : undefined}
          />
          {useCanvas && (
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
            />
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/50">
          <Avatar className="w-16 h-16">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-primary/20">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <VideoOff className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      {/* Username overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium truncate">{username}</span>
          {roleBadge}
        </div>
      </div>
    </div>
  );
});

VideoTile.displayName = 'VideoTile';

export default VideoTile;
