import { useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Music,
  ChevronDown,
  Radio,
  Power,
  Volume2,
  VolumeX,
  Speaker,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRadioOptional } from "@/contexts/RadioContext";
import { cn } from "@/lib/utils";

export interface RadioPlayerBarProps {
  canControlRadio?: boolean;
  radioListenerCount?: number;
  className?: string;
}

// Volume control component with click-to-open persistent slider
const VolumeControl = ({ volume, setVolume }: { volume: number; setVolume: (v: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                // Ctrl/Cmd+click to mute/unmute directly
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  setVolume(volume > 0 ? 0 : 50);
                }
              }}
            >
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Click for volume</TooltipContent>
      </Tooltip>
      <PopoverContent side="top" align="center" className="w-auto p-3 flex flex-col items-center gap-2">
        <span className="text-xs font-medium">{volume}%</span>
        <Slider
          value={[volume]}
          max={100}
          step={1}
          orientation="vertical"
          onValueChange={(value) => setVolume(value[0])}
          className="h-24 w-3"
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setVolume(volume > 0 ? 0 : 50)}>
          {volume > 0 ? "Mute" : "Unmute"}
        </Button>
      </PopoverContent>
    </Popover>
  );
};

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function RadioPlayerBar({ canControlRadio = false, radioListenerCount = 0, className }: RadioPlayerBarProps) {
  const radio = useRadioOptional();
  if (!radio) return null;

  return (
    <div className={cn("flex items-center gap-3 px-3 py-2 bg-secondary/50 rounded-lg", className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Album Art */}
        <div
          className={cn(
            "relative w-12 h-12 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0",
            radio.isPlaying ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
          )}
        >
          {radio.albumArt ? (
            <img
              src={radio.albumArt}
              alt={radio.currentSong?.title || "Album art"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-6 w-6 text-primary" />
            </div>
          )}
          {radio.isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
                <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: "80%", animationDelay: "450ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {radio.currentSong ? (
            <>
              <p className="text-sm font-medium text-foreground truncate">{radio.currentSong.title}</p>
              <p className="text-xs text-muted-foreground truncate">{radio.currentSong.artist}</p>
              {/* Progress Bar */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground w-8 text-right">{formatTime(radio.currentTime)}</span>
                <Slider
                  value={[radio.currentTime]}
                  max={radio.duration || 100}
                  step={1}
                  onValueChange={(value) => radio.seekTo(value[0])}
                  className="flex-1 h-1 cursor-pointer"
                  disabled={!canControlRadio}
                />
                <span className="text-[10px] text-muted-foreground w-8">{formatTime(radio.duration)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Loading radio...</p>
          )}
        </div>
      </div>

      {/* Basic controls for all users - Play/Pause and Volume */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={radio.toggle} className="h-8 w-8 bg-primary/10">
              {radio.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{radio.isPlaying ? "Pause" : "Play"}</TooltipContent>
        </Tooltip>

        {/* Volume for all users */}
        <VolumeControl volume={radio.volume} setVolume={radio.setVolume} />
      </div>

      {/* Advanced controls - Visible to all, but only functional for admins/owners */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={!canControlRadio}>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 text-xs gap-1.5", !canControlRadio && "opacity-60 cursor-not-allowed")}
            disabled={!canControlRadio}
          >
            {radioListenerCount > 0 && (
              <div className="flex items-center gap-0.5">
                <Speaker className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-primary font-medium">{radioListenerCount}</span>
              </div>
            )}
            {radio.currentGenre}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
          {radio.genres.map((genre) => (
            <DropdownMenuItem
              key={genre}
              onClick={() => radio.setGenre(genre)}
              className={radio.currentGenre === genre ? "bg-primary/10" : ""}
            >
              {genre}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={canControlRadio ? radio.shuffle : undefined}
              className={cn("h-7 w-7", !canControlRadio && "opacity-60 cursor-not-allowed")}
              disabled={!canControlRadio}
            >
              <Shuffle className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canControlRadio ? "Shuffle" : "Shuffle (Admin only)"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={canControlRadio ? radio.previous : undefined}
              className={cn("h-7 w-7", !canControlRadio && "opacity-60 cursor-not-allowed")}
              disabled={!canControlRadio}
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canControlRadio ? "Previous Song" : "Previous (Admin only)"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={canControlRadio ? radio.skip : undefined}
              className={cn("h-7 w-7", !canControlRadio && "opacity-60 cursor-not-allowed")}
              disabled={!canControlRadio}
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canControlRadio ? "Next Song" : "Next (Admin only)"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={canControlRadio ? radio.skipGenre : undefined}
              className={cn("h-7 w-7", !canControlRadio && "opacity-60 cursor-not-allowed")}
              disabled={!canControlRadio}
            >
              <Radio className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canControlRadio ? "Next Genre" : "Next Genre (Admin only)"}</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={canControlRadio ? radio.resetRadio : undefined}
            className={cn("h-7 w-7", canControlRadio ? "hover:text-destructive" : "opacity-60 cursor-not-allowed")}
            disabled={!canControlRadio}
          >
            <Power className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{canControlRadio ? "Reset Radio" : "Reset (Admin only)"}</TooltipContent>
      </Tooltip>
    </div>
  );
}
