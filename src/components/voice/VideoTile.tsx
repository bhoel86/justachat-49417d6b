import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTileProps {
  stream?: MediaStream | null;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal?: boolean;
  backgroundEffect?: 'none' | 'blur' | 'green';
}

export default function VideoTile({
  stream,
  username,
  isMuted,
  isSpeaking,
  isLocal = false,
  backgroundEffect = 'none',
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    const updateHasVideo = () => {
      const tracks = stream.getVideoTracks();
      const active = tracks.some((t) => t.enabled && t.readyState === 'live');
      setHasVideo(active);
    };

    const tryPlay = () => {
      // Some browsers need an explicit play() after srcObject is set
      video.play().catch(() => {
        // ignore autoplay errors; user gesture (join button) usually resolves it
      });
    };

    updateHasVideo();
    tryPlay();

    const handleLoaded = () => tryPlay();
    video.addEventListener('loadedmetadata', handleLoaded);

    const handleAddTrack = () => {
      updateHasVideo();
      tryPlay();
    };
    const handleRemoveTrack = () => updateHasVideo();
    stream.addEventListener('addtrack', handleAddTrack);
    stream.addEventListener('removetrack', handleRemoveTrack);

    // Track-level changes (ended/mute) can affect whether we should show video
    const tracks = stream.getVideoTracks();
    tracks.forEach((t) => {
      t.addEventListener('ended', updateHasVideo);
      t.addEventListener('mute', updateHasVideo);
      t.addEventListener('unmute', updateHasVideo);
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      stream.removeEventListener('addtrack', handleAddTrack);
      stream.removeEventListener('removetrack', handleRemoveTrack);
      tracks.forEach((t) => {
        t.removeEventListener('ended', updateHasVideo);
        t.removeEventListener('mute', updateHasVideo);
        t.removeEventListener('unmute', updateHasVideo);
      });
    };
  }, [stream]);

  // Apply video effects
  useEffect(() => {
    if (!hasVideo || backgroundEffect === 'none' || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const processFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      if (backgroundEffect === 'blur') {
        // Simple blur effect (CSS filter is more performant for blur)
        ctx.filter = 'blur(0px)';
      } else if (backgroundEffect === 'green') {
        // Green screen effect - replace green with transparent
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Detect green pixels (adjust thresholds as needed)
          if (g > 100 && g > r * 1.4 && g > b * 1.4) {
            data[i + 3] = 0; // Make transparent
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      animationId = requestAnimationFrame(processFrame);
    };

    processFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [hasVideo, backgroundEffect]);

  return (
    <div
      className={cn(
        "relative aspect-video rounded-xl overflow-hidden bg-muted/50 transition-all duration-200",
        isSpeaking && "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
        isLocal && "transform scale-x-[-1]" // Mirror local video
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local to prevent echo
        className={cn(
          "w-full h-full object-cover",
          !hasVideo && "hidden",
          // Don't use `display: none` when effects are enabled; the canvas needs video frames.
          backgroundEffect !== 'none' && "opacity-0 absolute inset-0 pointer-events-none"
        )}
      />

      {/* Canvas for effects */}
      {backgroundEffect !== 'none' && hasVideo && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />
      )}

      {/* JustAChat logo placeholder when no video */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40">
          <div className={cn(
            "flex flex-col items-center gap-2 transition-all duration-200",
            isSpeaking && "scale-105"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-xl jac-gradient-bg flex items-center justify-center shadow-lg",
              isSpeaking && "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
            )}>
              <Volume2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-xs font-bold jac-gradient-text">Justachat™</span>
          </div>
        </div>
      )}

      {/* Speaking indicator waves */}
      {isSpeaking && !hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-24 h-24 rounded-full border-2 border-green-500/50 animate-ping" />
          <div className="absolute w-28 h-28 rounded-full border border-green-500/30 animate-ping animation-delay-150" />
        </div>
      )}

      {/* Username and status */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white truncate">
            {username}
          </span>
          <div className={cn(
            "p-1 rounded-full",
            isMuted ? "bg-red-500/80" : "bg-green-500/80"
          )}>
            {isMuted ? (
              <MicOff className="h-3 w-3 text-white" />
            ) : (
              <Mic className="h-3 w-3 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary/80 rounded text-xs text-primary-foreground font-medium">
          You
        </div>
      )}
    </div>
  );
}
