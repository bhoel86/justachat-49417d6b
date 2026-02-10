/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AlertCircle, Play, Pause, SkipForward, SkipBack, Shuffle, Music, ChevronDown, Radio, Zap, Volume2, VolumeX, Power, Smile, MoreHorizontal, Palette, Sparkles, ImagePlus, X, Loader2, ImageIcon, Speaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmojiPicker from "./EmojiPicker";
import TextFormatMenu, { TextFormat, encodeFormat } from "./TextFormatMenu";
import MentionAutocomplete from "./MentionAutocomplete";
import CommandAutocomplete, { CommandDefinition } from "./CommandAutocomplete";
import AsciiArtPicker from "./AsciiArtPicker";
import { useRadioOptional } from "@/contexts/RadioContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInputHistory } from "@/hooks/useInputHistory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageCompression";
import { useTheme } from "@/contexts/ThemeContext";
import matrixInputBg from "@/assets/matrix/matrix-input-bg.jpg";

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
              {volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Click for volume</TooltipContent>
      </Tooltip>
      <PopoverContent 
        side="top" 
        align="center" 
        className="w-auto p-3 flex flex-col items-center gap-2"
      >
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setVolume(volume > 0 ? 0 : 50)}
        >
          {volume > 0 ? 'Mute' : 'Unmute'}
        </Button>
      </PopoverContent>
    </Popover>
  );
};

// Fun IRC-style user actions - imported from shared lib
import { USER_ACTIONS, type UserAction } from "@/lib/userActions";

interface ChatInputProps {
  onSend: (message: string) => void;
  isMuted?: boolean;
  canControlRadio?: boolean;
  onlineUsers?: { username: string; avatarUrl?: string | null }[];
  radioListenerCount?: number;
}

const ChatInput = ({ onSend, isMuted = false, canControlRadio = false, onlineUsers = [], radioListenerCount = 0 }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedAction, setSelectedAction] = useState<{ emoji: string; action: string; suffix: string } | null>(null);
  const [textFormat, setTextFormat] = useState<TextFormat>({ textStyle: 'none' });
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 48, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const radio = useRadioOptional();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { addToHistory, navigateHistory, resetHistoryNavigation } = useInputHistory();
  const { theme } = useTheme();
  const isSimulation = theme === 'matrix';

  // Detect @mention and /command typing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setMessage(value);
    setCursorPosition(cursorPos);

    // Find if we're currently typing a mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setShowCommands(false);
      // Position the autocomplete above the input
      if (inputRef.current) {
        const inputRect = inputRef.current.getBoundingClientRect();
        setMentionPosition({ top: 48, left: Math.min(mentionMatch.index! * 8, inputRect.width - 200) });
      }
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }

    // Check if typing a command (starts with / at beginning of input)
    if (value.startsWith('/') && !mentionMatch) {
      const cmdText = value.slice(1); // Remove leading /
      // Only show if no space yet (still typing command name) or if space and checking for subcommands
      const parts = cmdText.split(' ');
      if (parts.length <= 2 && !parts[parts.length - 1].includes(' ')) {
        setCommandQuery(cmdText);
        setShowCommands(true);
      } else {
        setShowCommands(false);
      }
    } else {
      setShowCommands(false);
      setCommandQuery("");
    }
  }, []);

  // Handle mention selection
  const handleMentionSelect = useCallback((username: string) => {
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const newTextBefore = textBeforeCursor.slice(0, mentionMatch.index) + `@${username} `;
      setMessage(newTextBefore + textAfterCursor);
      // Move cursor to after the mention
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = newTextBefore.length;
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }
    setShowMentions(false);
    setMentionQuery("");
  }, [message, cursorPosition]);

  // Handle command selection
  const handleCommandSelect = useCallback((command: CommandDefinition) => {
    setMessage(command.command + ' ');
    setShowCommands(false);
    setCommandQuery("");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const pos = command.command.length + 1;
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }, []);

  // Handle command with user selection
  const handleCommandWithUser = useCallback((command: CommandDefinition, username: string) => {
    setMessage(`${command.command} ${username} `);
    setShowCommands(false);
    setCommandQuery("");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const pos = command.command.length + username.length + 2;
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }, []);

  // Close mentions/commands on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMentions) {
        setShowMentions(false);
      }
      if (showCommands) {
        setShowCommands(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMentions, showCommands]);

  // Emoji categories for mobile dropdown
  const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '😮', '😢', '😡', '🎉', '💯'];

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Initial size check (allow larger files since we'll compress)
    if (file.size > 25 * 1024 * 1024) { // 25MB raw limit before compression
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Please select an image under 25MB",
      });
      return;
    }

    try {
      // Compress and resize image (max 1920px, JPEG @ 85% quality)
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        outputType: "image/jpeg",
      });

      // After compression, check it's under the backend limit
      if (compressed.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Image still too large",
          description: "After compression, the image is still over 10MB. Please select a smaller image.",
        });
        return;
      }

      setAttachedImage(compressed);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      toast({
        variant: "destructive",
        title: "Failed to process image",
        description: err instanceof Error ? err.message : "Could not compress image",
      });
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
    setUploadProgress(0);

    try {
      const safeName = attachedImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const suggestedPath = `${Date.now()}-${safeName}`;

      // Use a direct request to the backend upload endpoint.
      // This avoids inconsistent multipart handling in some environments AND gives real upload progress.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("You must be signed in to upload images.");

      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-image`;
      const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const formData = new FormData();
      formData.append("file", attachedImage);
      formData.append("bucket", "chat-images");
      formData.append("path", suggestedPath);

      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.responseType = "json";

        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        if (apikey) xhr.setRequestHeader("apikey", apikey);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            // keep 100% for server response / moderation time
            setUploadProgress(Math.min(99, Math.max(0, pct)));
          }
        };

        xhr.onload = () => {
          const resp = xhr.response ?? (() => {
            try {
              return xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
              return xhr.responseText;
            }
          })();

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(resp);
            return;
          }

          const detail =
            (resp && typeof resp === "object" && (resp.message || resp.error || resp.details))
              ? (resp.message || resp.error || resp.details)
              : (typeof resp === "string" ? resp : xhr.responseText);

          reject(new Error(`Upload failed (HTTP ${xhr.status}): ${detail || "Unknown error"}`));
        };

        xhr.onerror = () => reject(new Error("Upload failed: network error"));
        xhr.send(formData);
      });

      setUploadProgress(100);
      
      if (data?.error) {
        // Handle specific error types
        if (data.error === "Rate limit exceeded") {
          toast({
            variant: "destructive",
            title: "Too many uploads",
            description: data.message || `Please wait before uploading again.`,
          });
        } else if (data.error === "Content policy violation") {
          toast({
            variant: "destructive",
            title: "Image blocked",
            description: data.message || "This image cannot be uploaded.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: data.message || data.error,
          });
        }
        return null;
      }
      
      return data?.url || null;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      });
      return null;
    } finally {
      setIsUploading(false);
      // keep the bar visible briefly after completion/failure
      setTimeout(() => setUploadProgress(0), 500);
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
      
      // Add to history before sending
      addToHistory(message.trim());
      resetHistoryNavigation();
      
      onSend(finalMessage);
      setMessage("");
      clearImage();
    }
  };

  // Handle keyboard navigation for history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Don't handle if autocomplete is open
    if (showCommands || showMentions) return;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = navigateHistory('up', message);
      if (prevInput !== null) {
        setMessage(prevInput);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = navigateHistory('down', message);
      if (nextInput !== null) {
        setMessage(nextInput);
      }
    }
  }, [showCommands, showMentions, navigateHistory, message]);

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
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 p-4 bg-card border-t border-border overflow-hidden isolate">
      {/* Simulation theme background */}
      {isSimulation && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-10"
          style={{
            backgroundImage: `url(${matrixInputBg})`,
            opacity: 0.15,
          }}
        />
      )}
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

          {/* Basic controls for all users - Play/Pause and Volume */}
          <div className="flex items-center gap-0.5">
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

            {/* Volume for all users - Click to open persistent slider */}
            <VolumeControl volume={radio.volume} setVolume={radio.setVolume} />
          </div>

          {/* Advanced controls - Visible to all, but only functional for admins/owners */}
          {/* Genre Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!canControlRadio}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-7 px-2 text-xs gap-1.5 ${!canControlRadio ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                  onClick={canControlRadio ? radio.shuffle : undefined}
                  className={`h-7 w-7 ${!canControlRadio ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={!canControlRadio}
                >
                  <Shuffle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{canControlRadio ? 'Shuffle' : 'Shuffle (Admin only)'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={canControlRadio ? radio.previous : undefined}
                  className={`h-7 w-7 ${!canControlRadio ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={!canControlRadio}
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{canControlRadio ? 'Previous Song' : 'Previous (Admin only)'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={canControlRadio ? radio.skip : undefined}
                  className={`h-7 w-7 ${!canControlRadio ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={!canControlRadio}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{canControlRadio ? 'Next Song' : 'Next (Admin only)'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={canControlRadio ? radio.skipGenre : undefined}
                  className={`h-7 w-7 ${!canControlRadio ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={!canControlRadio}
                >
                  <Radio className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{canControlRadio ? 'Next Genre' : 'Next Genre (Admin only)'}</TooltipContent>
            </Tooltip>
          </div>

          {/* Power/Reset Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={canControlRadio ? radio.resetRadio : undefined}
                className={`h-7 w-7 ${canControlRadio ? 'hover:text-destructive' : 'opacity-60 cursor-not-allowed'}`}
                disabled={!canControlRadio}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{canControlRadio ? 'Reset Radio' : 'Reset (Admin only)'}</TooltipContent>
          </Tooltip>

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
            <EmojiPicker onEmojiSelect={handleEmojiSelect} onGifSelect={(gifUrl) => onSend(`[img:${gifUrl}]`)} />
            <AsciiArtPicker onArtSelect={(art) => setMessage(prev => prev + art)} />
            
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
              
              {/* ASCII Art Quick Picks */}
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Palette className="h-3 w-3" /> ASCII Art
              </DropdownMenuLabel>
              <div className="flex flex-wrap gap-1 px-2 pb-2">
                <button
                  type="button"
                  onClick={() => setMessage(prev => prev + '¯\\_(ツ)_/¯')}
                  className="h-7 px-2 text-xs flex items-center justify-center rounded hover:bg-muted"
                >
                  Shrug
                </button>
                <button
                  type="button"
                  onClick={() => setMessage(prev => prev + '( ͡° ͜ʖ ͡°)')}
                  className="h-7 px-2 text-xs flex items-center justify-center rounded hover:bg-muted"
                >
                  Lenny
                </button>
                <button
                  type="button"
                  onClick={() => setMessage(prev => prev + 'ʕ•ᴥ•ʔ')}
                  className="h-7 px-2 text-xs flex items-center justify-center rounded hover:bg-muted"
                >
                  Bear
                </button>
                <button
                  type="button"
                  onClick={() => setMessage(prev => prev + '(╯°□°)╯︵ ┻━┻')}
                  className="h-7 px-2 text-xs flex items-center justify-center rounded hover:bg-muted"
                >
                  Flip
                </button>
                <button
                  type="button"
                  onClick={() => setMessage(prev => prev + '♪♫•*¨*•.¸¸♪♫')}
                  className="h-7 px-2 text-xs flex items-center justify-center rounded hover:bg-muted"
                >
                  Music
                </button>
                <button
                  type="button"
                  onClick={() => setMessage(prev => prev + '@}-,-\'---')}
                  className="h-7 px-2 text-xs flex items-center justify-center rounded hover:bg-muted"
                >
                  Rose
                </button>
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
         accept=".jpg,.jpeg,.png,.gif,.webp,.heic"
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
              className={`h-10 lg:h-12 w-10 lg:w-12 rounded-xl object-cover ${isUploading ? 'opacity-50' : ''}`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-xl overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-foreground drop-shadow-sm">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            )}
            {!isUploading && (
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
        )}

        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isMuted ? "Commands only..." : "Type a message... (↑ for history)"}
            className="w-full bg-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {showMentions && (
            <MentionAutocomplete
              query={mentionQuery}
              users={onlineUsers}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
              position={mentionPosition}
            />
          )}
          {showCommands && (
            <CommandAutocomplete
              query={commandQuery}
              onSelect={handleCommandSelect}
              onSelectUser={handleCommandWithUser}
              onClose={() => setShowCommands(false)}
              users={onlineUsers}
            />
          )}
        </div>
        <Button
          type="submit"
          variant="jac"
          size="icon"
         className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl shrink-0 touch-manipulation"
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
