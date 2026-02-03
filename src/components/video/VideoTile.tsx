/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

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
  beautyMode?: boolean;
  softFocus?: number; // 0-100
  warmth?: number; // 0-100
}

const VideoTile = forwardRef<HTMLDivElement, VideoTileProps>(({ 
  stream, 
  username, 
  avatarUrl, 
  isLocal = false,
  isBroadcasting = false,
  roleBadge,
  aiEnhanced = false,
  enhanceStrength = 50,
  beautyMode = false,
  softFocus = 40,
  warmth = 30,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Calculate CSS filter values based on all settings
  const getVideoFilter = (): string => {
    const filters: string[] = [];
    
    // Enhancement filters
    if (aiEnhanced) {
      const s = enhanceStrength / 100;
      const contrast = 1 + (s * 0.2);
      const saturate = 1 + (s * 0.3);
      const brightness = 1 + (s * 0.08);
      
      filters.push(`contrast(${contrast.toFixed(2)})`);
      filters.push(`saturate(${saturate.toFixed(2)})`);
      filters.push(`brightness(${brightness.toFixed(2)})`);
    }
    
    // Beauty mode filters
    if (beautyMode) {
      // Soft focus - uses blur for skin smoothing effect
      // Very subtle blur (0.2-1.5px) creates soft focus without losing detail
      const blurAmount = (softFocus / 100) * 1.2;
      if (blurAmount > 0.1) {
        filters.push(`blur(${blurAmount.toFixed(1)}px)`);
      }
      
      // Warmth - adjusts hue and sepia to warm shadows (reduces dark circles)
      // sepia adds warmth, hue-rotate fine-tunes
      const sepiaAmount = (warmth / 100) * 0.15;
      const hueRotate = (warmth / 100) * -5; // Slight shift toward warm
      
      if (sepiaAmount > 0.01) {
        filters.push(`sepia(${sepiaAmount.toFixed(2)})`);
      }
      if (Math.abs(hueRotate) > 0.5) {
        filters.push(`hue-rotate(${hueRotate.toFixed(1)}deg)`);
      }
      
      // Add slight brightness boost to lift shadows
      const shadowLift = 1 + (warmth / 100) * 0.05;
      filters.push(`brightness(${shadowLift.toFixed(2)})`);
    }
    
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  const hasActiveFilters = aiEnhanced || beautyMode;

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
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[10px] bg-primary/80 text-primary-foreground">
              <Sparkles className="w-3 h-3 mr-1" />
              {beautyMode ? '✨' : 'AI'}
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
          style={{ filter: getVideoFilter() }}
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
