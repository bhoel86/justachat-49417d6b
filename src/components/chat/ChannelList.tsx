/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Plus, Lock, Home, MoreVertical, Trash2, EyeOff, Eye, Palette, Sparkles, Settings, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped, useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getRoomTheme } from "@/lib/roomConfig";
import { useTheme } from "@/contexts/ThemeContext";

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string | null;
  is_hidden?: boolean;
  name_color?: string | null;
  name_gradient_from?: string | null;
  name_gradient_to?: string | null;
  bg_color?: string | null;
}

interface ChannelListProps {
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  /** When true, selects the first channel when none is selected (legacy behavior). */
  autoSelectFirst?: boolean;
}

// Color and gradient presets for rooms
const ROOM_COLOR_PRESETS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
];

const ROOM_GRADIENT_PRESETS = [
  { name: 'Sunset', from: '#f97316', to: '#ec4899' },
  { name: 'Ocean', from: '#06b6d4', to: '#3b82f6' },
  { name: 'Forest', from: '#22c55e', to: '#06b6d4' },
  { name: 'Aurora', from: '#a855f7', to: '#06b6d4' },
  { name: 'Fire', from: '#ef4444', to: '#f59e0b' },
  { name: 'Royal', from: '#6366f1', to: '#a855f7' },
];

const ChannelList = ({ currentChannelId, onChannelSelect, autoSelectFirst = true }: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [deleteConfirmChannel, setDeleteConfirmChannel] = useState<Channel | null>(null);
  const [roomTextColor, setRoomTextColor] = useState<string | null>(null);
  const [roomBgColor, setRoomBgColor] = useState<string | null>(null);
  const [roomGradient, setRoomGradient] = useState<{ name: string; from: string; to: string } | null>(null);
  const { user, isAdmin, isOwner } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';
  const isValentines = theme === 'valentines';
  const isStPatricks = theme === 'stpatricks';

  const fetchChannels = async () => {
    const { data } = await supabaseUntyped
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) {
      setChannels(data);
      // Auto-select general if no channel selected
      if (autoSelectFirst && !currentChannelId && data.length > 0) {
        onChannelSelect(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChannels();

    // Subscribe to channel changes
    const channel = supabase
      .channel('channel-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channels' },
        () => fetchChannels()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !user) return;

    const channelName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (channelName.length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid name",
        description: "Channel name must be at least 2 characters."
      });
      return;
    }

    const { data, error } = await supabaseUntyped
      .from('channels')
      .insert({
        name: channelName,
        description: newChannelDesc.trim() || null,
        is_private: isPrivate,
        created_by: user.id,
        name_color: roomGradient ? null : roomTextColor,
        name_gradient_from: roomGradient?.from || null,
        name_gradient_to: roomGradient?.to || null,
        bg_color: roomBgColor
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create channel",
        description: error.message.includes('unique') ? "A channel with that name already exists." : error.message
      });
      return;
    }

    toast({
      title: "Channel created",
      description: `#${channelName} is ready to use!`
    });

    setNewChannelName("");
    setNewChannelDesc("");
    setIsPrivate(false);
    setRoomTextColor(null);
    setRoomBgColor(null);
    setRoomGradient(null);
    setIsCreateOpen(false);
    
    if (data) {
      onChannelSelect(data);
    }
  };

  const handleDeleteChannel = async (channel: Channel) => {
    if (channel.name === 'general') {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: "The general channel cannot be deleted."
      });
      return;
    }

    const { error } = await supabaseUntyped
      .from('channels')
      .delete()
      .eq('id', channel.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete channel",
        description: error.message
      });
      return;
    }

    // Log the delete action
    if (user) {
      await supabaseUntyped.from('audit_logs').insert({
        user_id: user.id,
        action: 'channel_delete',
        resource_type: 'channel',
        resource_id: channel.id,
        details: {
          channel_name: channel.name,
          was_private: channel.is_private,
          was_hidden: channel.is_hidden
        }
      });
    }

    toast({
      title: "Channel deleted",
      description: `#${channel.name} has been removed.`
    });

    setDeleteConfirmChannel(null);

    // Switch to general if current channel was deleted
    if (currentChannelId === channel.id) {
      const general = channels.find(c => c.name === 'general');
      if (general) onChannelSelect(general);
    }
  };

  const handleToggleHidden = async (channel: Channel) => {
    const newHiddenState = !channel.is_hidden;
    
    const { error } = await supabaseUntyped
      .from('channels')
      .update({ is_hidden: newHiddenState })
      .eq('id', channel.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update channel",
        description: error.message
      });
      return;
    }

    // Log the hide/show action
    if (user) {
      await supabaseUntyped.from('audit_logs').insert({
        user_id: user.id,
        action: newHiddenState ? 'channel_hide' : 'channel_show',
        resource_type: 'channel',
        resource_id: channel.id,
        details: {
          channel_name: channel.name,
          is_hidden: newHiddenState
        }
      });
    }

    toast({
      title: newHiddenState ? "Channel hidden" : "Channel visible",
      description: newHiddenState 
        ? `#${channel.name} is now hidden from regular users.`
        : `#${channel.name} is now visible to everyone.`
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-secondary/30 border-r border-border p-4 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary/30 border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground text-sm flex-1">Channels</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create Channel</DialogTitle>
                <DialogDescription>
                  Create a new channel for your community.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <div className="flex items-center mt-1">
                    <span className="text-muted-foreground mr-1">#</span>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="new-channel"
                      className="flex-1 bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={30}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description (optional)</label>
                  <input
                    type="text"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    placeholder="What's this channel about?"
                    className="w-full mt-1 bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="private" className="text-sm text-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Private channel
                  </label>
                </div>
                
                {/* Text Color Selection */}
                <div>
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
                    <Palette className="h-3 w-3" />
                    Room Name Color
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRoomTextColor(null)}
                      className={cn(
                        "w-6 h-6 rounded border-2 flex items-center justify-center text-[10px]",
                        !roomTextColor ? "border-primary" : "border-border"
                      )}
                    >
                      ✕
                    </button>
                    {ROOM_COLOR_PRESETS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setRoomTextColor(color.value)}
                        className={cn(
                          "w-6 h-6 rounded",
                          roomTextColor === color.value ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Background Color Selection */}
                <div>
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
                    <Palette className="h-3 w-3" />
                    Room Background
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRoomBgColor(null)}
                      className={cn(
                        "w-6 h-6 rounded border-2 flex items-center justify-center text-[10px]",
                        !roomBgColor ? "border-primary" : "border-border"
                      )}
                    >
                      ✕
                    </button>
                    {ROOM_COLOR_PRESETS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setRoomBgColor(color.value)}
                        className={cn(
                          "w-6 h-6 rounded opacity-50",
                          roomBgColor === color.value ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Gradient Selection */}
                <div>
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2">
                    <Sparkles className="h-3 w-3" />
                    Gradient Text
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRoomGradient(null)}
                      className={cn(
                        "w-8 h-6 rounded border-2 flex items-center justify-center text-[10px]",
                        !roomGradient ? "border-primary" : "border-border"
                      )}
                    >
                      None
                    </button>
                    {ROOM_GRADIENT_PRESETS.map((gradient) => (
                      <button
                        key={gradient.name}
                        type="button"
                        onClick={() => setRoomGradient(gradient)}
                        className={cn(
                          "w-8 h-6 rounded",
                          roomGradient?.name === gradient.name ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                        )}
                        style={{ 
                          background: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})` 
                        }}
                        title={gradient.name}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Preview */}
                {(roomTextColor || roomBgColor || roomGradient) && (
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Preview:</p>
                    <span 
                      className={cn(
                        "text-sm font-semibold px-1.5 py-0.5 rounded",
                        roomGradient && "bg-clip-text text-transparent"
                      )}
                      style={{
                        color: !roomGradient ? (roomTextColor || undefined) : undefined,
                        backgroundColor: roomBgColor ? `${roomBgColor}40` : undefined,
                        backgroundImage: roomGradient 
                          ? `linear-gradient(90deg, ${roomGradient.from}, ${roomGradient.to})`
                          : undefined,
                      }}
                    >
                      #{newChannelName || 'channel-name'}
                    </span>
                  </div>
                )}
                
                <Button
                  onClick={handleCreateChannel}
                  variant="jac"
                  className="w-full"
                  disabled={!newChannelName.trim()}
                >
                  Create Channel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {channels.map((channel) => {
          const roomTheme = getRoomTheme(channel.name);
          const hasCustomGradient = channel.name_gradient_from && channel.name_gradient_to;
          const hasCustomColor = channel.name_color;
          const isSelected = currentChannelId === channel.id;
          
          // Custom style for channel name
          const getChannelNameStyle = () => {
            if (!isSelected) return {};
            if (hasCustomGradient) {
              return {
                backgroundImage: `linear-gradient(90deg, ${channel.name_gradient_from}, ${channel.name_gradient_to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              };
            }
            if (hasCustomColor) {
              return { color: channel.name_color };
            }
            return {};
          };
          
          const getChannelBgStyle = () => {
            if (!isSelected || !channel.bg_color) return {};
            return { backgroundColor: `${channel.bg_color}30` };
          };
          
          return (
            <div
              key={channel.id}
              className={cn(
                "group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-300 overflow-hidden",
                isRetro 
                  ? cn(
                      "border-[2px] border-foreground",
                      isSelected 
                        ? "shadow-[0_0_8px_rgba(0,255,0,0.4),inset_0_0_8px_rgba(0,255,0,0.1)] border-primary" 
                        : "hover:shadow-[0_0_6px_rgba(0,255,0,0.3)]"
                    )
                  : isValentines
                    ? cn(
                        "border border-pink-400/30",
                        isSelected 
                          ? "border-pink-400 shadow-md shadow-pink-500/20" 
                          : "hover:border-pink-400/60 hover:shadow-sm hover:shadow-pink-500/10"
                      )
                    : isStPatricks
                      ? cn(
                          "border border-emerald-500/30",
                          isSelected 
                            ? "border-emerald-400 shadow-md shadow-emerald-500/20" 
                            : "hover:border-emerald-400/60 hover:shadow-sm hover:shadow-emerald-500/10"
                        )
                      : cn(
                          isSelected
                            ? "border border-current/20 shadow-md"
                            : "hover:bg-secondary/50 hover:shadow-sm"
                        ),
                channel.is_hidden && "opacity-50",
                // Always show theme background color as bubble (when not using custom theme styles)
                !isRetro && !isValentines && !isStPatricks && !channel.bg_color && roomTheme.bgColor
              )}
              style={channel.bg_color ? { backgroundColor: `${channel.bg_color}30` } : undefined}
              onClick={() => onChannelSelect(channel)}
            >
              {/* Theme-specific background effects */}
              {isRetro && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 to-cyan-900/40 group-hover:from-green-800/50 group-hover:to-cyan-800/50 transition-all" />
                  <div className="absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />
                </>
              )}
              {isValentines && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-rose-400/20 to-pink-500/20 group-hover:from-pink-500/30 group-hover:via-rose-400/30 group-hover:to-pink-500/30 transition-all" />
                  {isSelected && (
                    <div className="absolute -right-0.5 -top-0.5 text-pink-300/60">
                      <Heart className="w-2.5 h-2.5" fill="currentColor" />
                    </div>
                  )}
                </>
              )}
              {isStPatricks && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-500/20 to-emerald-600/20 group-hover:from-emerald-600/30 group-hover:via-green-500/30 group-hover:to-emerald-600/30 transition-all" />
                  {isSelected && (
                    <div className="absolute -right-0.5 -top-0.5 text-emerald-400/60 text-xs">
                      ☘
                    </div>
                  )}
                </>
              )}
              
              {/* Channel icon */}
              <div className="relative z-10">
                {channel.is_private ? (
                  <Lock 
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isRetro ? "text-primary" : isValentines ? "text-pink-400" : isStPatricks ? "text-emerald-400" : hasCustomColor ? undefined : roomTheme.textColor
                    )} 
                    style={!isRetro && !isValentines && !isStPatricks && hasCustomColor ? { color: channel.name_color! } : {}}
                  />
                ) : isValentines ? (
                  <Heart 
                    className="h-3.5 w-3.5 shrink-0 text-pink-400" 
                    fill={isSelected ? "currentColor" : "none"}
                  />
                ) : isStPatricks ? (
                  <span className="text-emerald-400 text-sm leading-none">☘</span>
                ) : (
                  <Hash 
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isRetro ? "text-primary" : hasCustomColor ? undefined : roomTheme.textColor
                    )} 
                    style={!isRetro && hasCustomColor ? { color: channel.name_color! } : {}}
                  />
                )}
              </div>
              
              {/* Channel name */}
              <span 
                className={cn(
                  "relative z-10 flex-1 truncate text-xs font-semibold uppercase",
                  isRetro 
                    ? "font-mono text-primary tracking-wider" 
                    : isValentines 
                      ? "text-pink-300" 
                      : isStPatricks
                        ? "text-emerald-300"
                        : hasCustomColor || hasCustomGradient ? undefined : roomTheme.textColor
                )}
                style={!isRetro && !isValentines && !isStPatricks ? getChannelNameStyle() : {}}
              >
                {channel.name}
              </span>
              {channel.is_hidden && isAdmin && (
                <span title="Hidden">
                  <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                </span>
              )}
              
              {/* Gear icon for room owner or site admin/owner - NOT visible to other room owners */}
              {((user && channel.created_by === user.id) || isOwner || isAdmin) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('openRoomSettings', { detail: channel }));
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-opacity shrink-0"
                  title="Room Settings"
                >
                  <Settings className="h-3 w-3" />
                </button>
              )}
              
              {/* Dropdown menu for site owners or admins (hide/delete) */}
              {(isOwner || isAdmin || (user && channel.created_by === user.id)) && channel.name !== 'general' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-opacity shrink-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-popover border-border z-50">
                    {/* Hide/Show - Site Admin only */}
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHidden(channel);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {channel.is_hidden ? (
                          <>
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Show Channel
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-2" />
                            Hide Channel
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    
                    {/* Delete - Site Owner or Room Owner */}
                    {(isOwner || (user && channel.created_by === user.id)) && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmChannel(channel);
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Channel
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmChannel} onOpenChange={() => setDeleteConfirmChannel(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete #{deleteConfirmChannel?.name}? This action cannot be undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmChannel && handleDeleteChannel(deleteConfirmChannel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Back to lobby */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/lobby')}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Lobby
        </Button>
      </div>
    </div>
  );
};

export default ChannelList;
