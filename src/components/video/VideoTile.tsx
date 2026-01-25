import { useEffect, useRef, forwardRef } from 'react';
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
  enhanceStrength?: number; // 0-100
}

const VideoTile = forwardRef<HTMLDivElement, VideoTileProps>(({ 
  stream, 
  username, 
  avatarUrl, 
  isLocal = false,
  isBroadcasting = false,
  roleBadge,
  aiEnhanced = false,
  enhanceStrength = 50
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Calculate CSS filter values based on strength (0-100)
  const getEnhancementFilter = (): string => {
    if (!aiEnhanced) return 'none';
    
    // Scale strength: 0 = subtle, 50 = medium, 100 = aggressive
    const s = enhanceStrength / 100;
    
    // Contrast: 1.0 (off) to 1.2 (max)
    const contrast = 1 + (s * 0.2);
    // Saturation: 1.0 (off) to 1.3 (max)  
    const saturate = 1 + (s * 0.3);
    // Brightness: 1.0 (off) to 1.08 (max)
    const brightness = 1 + (s * 0.08);
    // Sharpness via subtle unsharp mask effect (using drop-shadow trick)
    // We'll use a tiny bit of contrast boost for perceived sharpness
    
    return `contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
  };

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
              AI {enhanceStrength}%
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
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
          style={{ filter: getEnhancementFilter() }}
        />
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
