import { useState } from "react";
import { Send, AlertCircle, Play, Pause, SkipForward, SkipBack, Shuffle, Music, ChevronDown, Radio, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import EmojiPicker from "./EmojiPicker";
import { useRadioOptional } from "@/contexts/RadioContext";

// Fun IRC-style user actions
const USER_ACTIONS = {
  funny: [
    { emoji: "🐟", action: "slaps", suffix: "around with a large trout" },
    { emoji: "🍕", action: "throws", suffix: "a slice of pizza at" },
    { emoji: "🎸", action: "serenades", suffix: "with an air guitar solo" },
    { emoji: "💨", action: "blows", suffix: "a raspberry at" },
    { emoji: "🤡", action: "does", suffix: "a silly dance for" },
    { emoji: "🎪", action: "juggles", suffix: "flaming torches for" },
    { emoji: "🦆", action: "releases", suffix: "a rubber duck army on" },
    { emoji: "🌮", action: "challenges", suffix: "to a taco eating contest" },
  ],
  nice: [
    { emoji: "🙌", action: "high-fives", suffix: "" },
    { emoji: "🤗", action: "gives", suffix: "a warm hug" },
    { emoji: "🎉", action: "celebrates", suffix: "with confetti" },
    { emoji: "⭐", action: "awards", suffix: "a gold star" },
    { emoji: "☕", action: "offers", suffix: "a cup of coffee" },
    { emoji: "🍪", action: "shares", suffix: "cookies with" },
    { emoji: "👏", action: "applauds", suffix: "enthusiastically" },
    { emoji: "💐", action: "gives", suffix: "a bouquet of flowers" },
  ],
};

interface ChatInputProps {
  onSend: (message: string) => void;
  isMuted?: boolean;
  canControlRadio?: boolean;
  onlineUsers?: { username: string }[];
}

const ChatInput = ({ onSend, isMuted = false, canControlRadio = false, onlineUsers = [] }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedAction, setSelectedAction] = useState<{ emoji: string; action: string; suffix: string } | null>(null);
  const radio = useRadioOptional();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  // Handle action with selected user
  const handleActionWithUser = (username: string) => {
    if (selectedAction) {
      const actionMessage = selectedAction.suffix 
        ? `/me ${selectedAction.emoji} ${selectedAction.action} ${username} ${selectedAction.suffix}`
        : `/me ${selectedAction.emoji} ${selectedAction.action} ${username}`;
      onSend(actionMessage);
      setSelectedAction(null);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 bg-card border-t border-border">
      {/* Radio Player GUI */}
      {radio && (
        <div className="flex items-center gap-3 px-3 py-2 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Album Art */}
            <div className={`relative w-12 h-12 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0 ${radio.isPlaying ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
              {radio.albumArt ? (
                <img 
                  src={radio.albumArt} 
                  alt={radio.currentSong?.title || 'Album art'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-6 w-6 text-primary" />
                </div>
              )}
              {radio.isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-4">
                    <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                    <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                    <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                    <span className="w-1 bg-primary rounded-full animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              {radio.currentSong ? (
                <>
                  <p className="text-sm font-medium text-foreground truncate">
                    {radio.currentSong.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {radio.currentSong.artist}
                  </p>
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                      {formatTime(radio.currentTime)}
                    </span>
                    <Slider
                      value={[radio.currentTime]}
                      max={radio.duration || 100}
                      step={1}
                      onValueChange={(value) => radio.seekTo(value[0])}
                      className="flex-1 h-1 cursor-pointer"
                      disabled={!canControlRadio}
                    />
                    <span className="text-[10px] text-muted-foreground w-8">
                      {formatTime(radio.duration)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Loading radio...</p>
              )}
            </div>
          </div>

          {/* Controls - Only visible to admins/owners */}
          {canControlRadio && (
            <>
              {/* Genre Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                    {radio.currentGenre}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                  {radio.genres.map((genre) => (
                    <DropdownMenuItem 
                      key={genre} 
                      onClick={() => radio.setGenre(genre)}
                      className={radio.currentGenre === genre ? 'bg-primary/10' : ''}
                    >
                      {genre}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Controls */}
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={radio.shuffle}
                      className="h-7 w-7"
                    >
                      <Shuffle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Shuffle</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={radio.previous}
                      className="h-7 w-7"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous Song</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={radio.toggle}
                      className="h-8 w-8 bg-primary/10"
                    >
                      {radio.isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{radio.isPlaying ? 'Pause' : 'Play'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={radio.skip}
                      className="h-7 w-7"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Song</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={radio.skipGenre}
                      className="h-7 w-7"
                    >
                      <Radio className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Genre</TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      )}

      {isMuted && (
        <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>You are muted. You can still use commands.</span>
        </div>
      )}
      <div className="flex gap-2">
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        
        {/* User Actions Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl shrink-0"
                >
                  <Zap className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Fun Actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-56 bg-popover border border-border z-50">
            {selectedAction ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {selectedAction.emoji} Select target for "{selectedAction.action}"
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onlineUsers.length > 0 ? (
                  onlineUsers.map((user) => (
                    <DropdownMenuItem
                      key={user.username}
                      onClick={() => handleActionWithUser(user.username)}
                      className="cursor-pointer"
                    >
                      @{user.username}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    No users online
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedAction(null)} className="text-muted-foreground">
                  ← Back to actions
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  🤪 Funny
                </DropdownMenuLabel>
                {USER_ACTIONS.funny.map((action, idx) => (
                  <DropdownMenuItem
                    key={`funny-${idx}`}
                    onClick={() => setSelectedAction(action)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.action} {action.suffix ? `... ${action.suffix.slice(0, 15)}...` : ''}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  💖 Nice
                </DropdownMenuLabel>
                {USER_ACTIONS.nice.map((action, idx) => (
                  <DropdownMenuItem
                    key={`nice-${idx}`}
                    onClick={() => setSelectedAction(action)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{action.emoji}</span>
                    {action.action} {action.suffix ? `... ${action.suffix.slice(0, 15)}...` : ''}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isMuted ? "You can only use commands..." : "Type a message or /command..."}
          className="flex-1 bg-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <Button
          type="submit"
          variant="jac"
          size="icon"
          className="h-12 w-12 rounded-xl shrink-0"
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
