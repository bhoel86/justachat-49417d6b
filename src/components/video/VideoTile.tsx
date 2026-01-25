import { useEffect, useRef, forwardRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff } from 'lucide-react';

interface VideoTileProps {
  stream?: MediaStream | null;
  username: string;
  avatarUrl?: string | null;
  isLocal?: boolean;
  isBroadcasting?: boolean;
  roleBadge?: React.ReactNode;
}

const VideoTile = forwardRef<HTMLDivElement, VideoTileProps>(({ 
  stream, 
  username, 
  avatarUrl, 
  isLocal = false,
  isBroadcasting = false,
  roleBadge 
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
        <div className="absolute top-2 right-2 z-10">
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
