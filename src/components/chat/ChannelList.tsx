import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Plus, Lock, Home, MoreVertical, Trash2, EyeOff, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped, useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string | null;
  is_hidden?: boolean;
}

interface ChannelListProps {
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
}

const ChannelList = ({ currentChannelId, onChannelSelect }: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [deleteConfirmChannel, setDeleteConfirmChannel] = useState<Channel | null>(null);
  const { user, isAdmin, isOwner } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchChannels = async () => {
    const { data } = await supabaseUntyped
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) {
      setChannels(data);
      // Auto-select general if no channel selected
      if (!currentChannelId && data.length > 0) {
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
        created_by: user.id
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
      <div className="w-56 bg-secondary/30 border-r border-border p-4 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-56 bg-secondary/30 border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Channels</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
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
          const theme = getRoomTheme(channel.name);
          return (
            <div
              key={channel.id}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                currentChannelId === channel.id
                  ? cn(theme.bgColor, "border border-current/20")
                  : "hover:bg-secondary",
                channel.is_hidden && "opacity-50"
              )}
              onClick={() => onChannelSelect(channel)}
            >
              {channel.is_private ? (
                <Lock className={cn("h-3.5 w-3.5 shrink-0", currentChannelId === channel.id ? theme.textColor : "text-muted-foreground")} />
              ) : (
                <Hash className={cn("h-3.5 w-3.5 shrink-0", currentChannelId === channel.id ? theme.textColor : "text-muted-foreground")} />
              )}
              <span className={cn(
                "flex-1 truncate text-xs font-medium",
                currentChannelId === channel.id ? theme.textColor : "text-muted-foreground hover:text-foreground"
              )}>
                {channel.name}
              </span>
              {channel.is_hidden && isAdmin && (
                <span title="Hidden">
                  <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
                </span>
              )}
              
              {/* Dropdown menu for owners/admins */}
              {(isOwner || isAdmin) && channel.name !== 'general' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-popover border-border z-50">
                    {/* Hide/Show - Admin only */}
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
                    
                    {/* Delete - Owner only */}
                    {isOwner && (
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
          onClick={() => navigate('/')}
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
