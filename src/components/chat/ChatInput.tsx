import { useState } from "react";
import { Send, AlertCircle, Radio, Play, Pause, SkipForward, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <div className="flex items-center gap-3">
            {/* Album Art */}
            <div className={`relative w-10 h-10 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0 ${radio.isPlaying ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
              {radio.currentStation?.albumArt ? (
                <img 
                  src={radio.currentStation.albumArt} 
                  alt={radio.currentStation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-5 w-5 text-primary" />
                </div>
              )}
              {radio.isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-primary animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                    <span className="w-0.5 bg-primary animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                    <span className="w-0.5 bg-primary animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                    <span className="w-0.5 bg-primary animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              {radio.currentStation ? (
                <>
                  <p className="text-xs font-medium text-foreground truncate">
                    {radio.currentStation.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {radio.currentStation.artist} • {radio.currentStation.genre}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Radio off</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={radio.toggle}
              className="h-7 w-7"
              title={radio.isPlaying ? 'Pause' : 'Play'}
            >
              {radio.isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={radio.skip}
              className="h-7 w-7"
              title="Skip"
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
