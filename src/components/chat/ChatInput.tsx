import { useState, useRef } from "react";
import { Send, AlertCircle, Play, Pause, SkipForward, SkipBack, Shuffle, Music, ChevronDown, Radio, Zap, Volume2, VolumeX, Power, Smile, MoreHorizontal, Palette, Sparkles, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmojiPicker from "./EmojiPicker";
import TextFormatMenu, { TextFormat, encodeFormat } from "./TextFormatMenu";
import { useRadioOptional } from "@/contexts/RadioContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [textFormat, setTextFormat] = useState<TextFormat>({ textStyle: 'none' });
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const radio = useRadioOptional();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Emoji categories for mobile dropdown
  const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '😮', '😢', '😡', '🎉', '💯'];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please select an image under 5MB",
        });
        return;
      }
      setAttachedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!attachedImage) return null;
    
    setIsUploading(true);
    try {
      const fileExt = attachedImage.name.split('.').pop();
      const fileName = `chat-${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Reusing avatars bucket for chat images
        .upload(filePath, attachedImage);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl: string | null = null;
    if (attachedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl && !message.trim()) return; // Failed upload with no text
    }
    
    if (message.trim() || imageUrl) {
      const isCommand = message.trim().startsWith('/');
      let finalMessage = isCommand ? message.trim() : encodeFormat(textFormat, message.trim());
      
      // Append image as a special format
      if (imageUrl) {
        finalMessage = finalMessage ? `${finalMessage} [img:${imageUrl}]` : `[img:${imageUrl}]`;
      }
      
      onSend(finalMessage);
      setMessage("");
      clearImage();
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

              {/* Vertical Volume Slider */}
              <div className="relative group/volume">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => radio.setVolume(radio.volume > 0 ? 0 : 50)}
                      className="h-7 w-7"
                    >
                      {radio.volume === 0 ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{radio.volume === 0 ? 'Unmute' : 'Mute'}</TooltipContent>
                </Tooltip>
                
                {/* Vertical slider popup */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/volume:flex flex-col items-center bg-popover border border-border rounded-lg p-2 shadow-lg z-50">
                  <span className="text-[10px] text-muted-foreground mb-1">{radio.volume}%</span>
                  <Slider
                    value={[radio.volume]}
                    max={100}
                    step={1}
                    orientation="vertical"
                    onValueChange={(value) => radio.setVolume(value[0])}
                    className="h-20 w-2"
                  />
                </div>
              </div>

              {/* Power/Reset Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={radio.resetRadio}
                    className="h-7 w-7 hover:text-destructive"
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Radio</TooltipContent>
              </Tooltip>
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
      <div className="flex gap-2 items-center justify-center max-w-3xl mx-auto w-full">
        {/* Desktop: Show individual buttons */}
        {!isMobile && (
          <>
            <TextFormatMenu currentFormat={textFormat} onFormatChange={setTextFormat} />
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
          </>
        )}

        {/* Mobile: Condensed dropdown with all options */}
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              side="top"
              className="w-64 bg-popover border border-border z-50"
            >
              {/* Quick Emojis */}
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Smile className="h-3 w-3" /> Emojis
              </DropdownMenuLabel>
              <div className="flex flex-wrap gap-1 px-2 pb-2">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Text Formatting */}
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Palette className="h-3 w-3" /> Text Style
              </DropdownMenuLabel>
              <div className="flex flex-wrap gap-1 px-2 pb-2">
                <Button
                  type="button"
                  variant={textFormat.textStyle === 'none' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTextFormat({ textStyle: 'none' })}
                  className="h-7 text-xs px-2"
                >
                  None
                </Button>
                <Button
                  type="button"
                  variant={textFormat.textStyle === 'rainbow' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTextFormat({ textStyle: 'rainbow' })}
                  className="h-7 text-xs px-2"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Rainbow
                </Button>
                <button
                  type="button"
                  onClick={() => setTextFormat({ textStyle: 'color', textValue: '#ef4444' })}
                  className="h-6 w-6 rounded bg-red-500"
                  title="Red"
                />
                <button
                  type="button"
                  onClick={() => setTextFormat({ textStyle: 'color', textValue: '#3b82f6' })}
                  className="h-6 w-6 rounded bg-blue-500"
                  title="Blue"
                />
                <button
                  type="button"
                  onClick={() => setTextFormat({ textStyle: 'color', textValue: '#22c55e' })}
                  className="h-6 w-6 rounded bg-green-500"
                  title="Green"
                />
                <button
                  type="button"
                  onClick={() => setTextFormat({ textStyle: 'color', textValue: '#a855f7' })}
                  className="h-6 w-6 rounded bg-purple-500"
                  title="Purple"
                />
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Fun Actions */}
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Fun Actions
              </DropdownMenuLabel>
              {selectedAction ? (
                <>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    {selectedAction.emoji} Select target for "{selectedAction.action}"
                  </div>
                  <ScrollArea className="max-h-32">
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
                      <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                        No users online
                      </DropdownMenuItem>
                    )}
                  </ScrollArea>
                  <DropdownMenuItem onClick={() => setSelectedAction(null)} className="text-muted-foreground text-xs">
                    ← Back
                  </DropdownMenuItem>
                </>
              ) : (
                <ScrollArea className="max-h-40">
                  <div className="px-1">
                    {USER_ACTIONS.funny.slice(0, 4).map((action, idx) => (
                      <DropdownMenuItem
                        key={`funny-${idx}`}
                        onClick={() => setSelectedAction(action)}
                        className="cursor-pointer text-xs"
                      >
                        <span className="mr-2">{action.emoji}</span>
                        {action.action}
                      </DropdownMenuItem>
                    ))}
                    {USER_ACTIONS.nice.slice(0, 4).map((action, idx) => (
                      <DropdownMenuItem
                        key={`nice-${idx}`}
                        onClick={() => setSelectedAction(action)}
                        className="cursor-pointer text-xs"
                      >
                        <span className="mr-2">{action.emoji}</span>
                        {action.action}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        
        {/* Image attachment button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl shrink-0"
              disabled={isMuted || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach Image</TooltipContent>
        </Tooltip>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-10 lg:h-12 w-10 lg:w-12 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        )}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isMuted ? "Commands only..." : "Type a message..."}
          className="flex-1 min-w-0 bg-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <Button
          type="submit"
          variant="jac"
          size="icon"
          className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl shrink-0"
          disabled={(!message.trim() && !attachedImage) || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
