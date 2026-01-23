import { useState } from "react";
import { Send, AlertCircle, Play, Pause, SkipForward, SkipBack, Shuffle, Music, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EmojiPicker from "./EmojiPicker";
import { useRadioOptional } from "@/contexts/RadioContext";

interface ChatInputProps {
  onSend: (message: string) => void;
  isMuted?: boolean;
}

const ChatInput = ({ onSend, isMuted = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
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
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Click play to start</p>
              )}
            </div>
          </div>

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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={radio.shuffle}
              className="h-7 w-7"
              title="Shuffle"
            >
              <Shuffle className="h-3 w-3" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={radio.previous}
              className="h-7 w-7"
              title="Previous"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={radio.toggle}
              className="h-8 w-8 bg-primary/10"
              title={radio.isPlaying ? 'Pause' : 'Play'}
            >
              {radio.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={radio.skip}
              className="h-7 w-7"
              title="Next"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>
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
