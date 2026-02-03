/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect } from "react";
import { Lock, Key, Users, Shield, Save, Filter, Palette, Bot, MessageSquare, Image, Ban, VolumeX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabaseUntyped } from "@/hooks/useAuth";
import { Channel } from "./ChannelList";
import { useChannelModerationSettings } from "@/hooks/useChannelModerationSettings";
import { cn } from "@/lib/utils";

interface RoomSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
  userId: string;
}

interface RoomBan {
  id: string;
  user_id: string;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  profile?: { username: string };
}

interface RoomMute {
  id: string;
  user_id: string;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  profile?: { username: string };
}

interface RoomAdmin {
  id: string;
  user_id: string;
  created_at: string;
  profile?: { username: string };
}

// Color presets for topics and banners
const COLOR_PRESETS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
];

const GRADIENT_PRESETS = [
  { name: 'Sunset', from: '#f97316', to: '#ec4899' },
  { name: 'Ocean', from: '#06b6d4', to: '#3b82f6' },
  { name: 'Forest', from: '#22c55e', to: '#06b6d4' },
  { name: 'Aurora', from: '#a855f7', to: '#06b6d4' },
  { name: 'Fire', from: '#ef4444', to: '#f59e0b' },
  { name: 'Royal', from: '#6366f1', to: '#a855f7' },
  { name: 'Candy', from: '#ec4899', to: '#f43f5e' },
  { name: 'Lime', from: '#84cc16', to: '#22c55e' },
];

const RoomSettingsModal = ({ open, onOpenChange, channel, userId }: RoomSettingsModalProps) => {
  const [roomPassword, setRoomPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [roomBans, setRoomBans] = useState<RoomBan[]>([]);
  const [roomMutes, setRoomMutes] = useState<RoomMute[]>([]);
  const [roomAdmins, setRoomAdmins] = useState<RoomAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingModeration, setSavingModeration] = useState(false);
  
  // Welcome & Topic state
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [topicText, setTopicText] = useState("");
  const [topicColor, setTopicColor] = useState<string | null>(null);
  const [topicGradient, setTopicGradient] = useState<{ from: string; to: string } | null>(null);
  const [bannerColor, setBannerColor] = useState<string | null>(null);
  
  // Appearance state
  const [nameColor, setNameColor] = useState<string | null>(null);
  const [nameGradientFrom, setNameGradientFrom] = useState<string | null>(null);
  const [nameGradientTo, setNameGradientTo] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const { 
    settings: moderationSettings, 
    updateSettings: updateModerationSettings,
    loading: moderationLoading 
  } = useChannelModerationSettings(channel?.id || null);

  useEffect(() => {
    if (open && channel) {
      fetchRoomData();
    }
  }, [open, channel]);

  const fetchRoomData = async () => {
    // Fetch channel data including colors and passwords
    const { data: channelData } = await supabaseUntyped
      .from('channels')
      .select('room_password, admin_password, name_color, name_gradient_from, name_gradient_to, bg_color, description')
      .eq('id', channel.id)
      .single();
    
    if (channelData) {
      setRoomPassword(channelData.room_password || "");
      setAdminPassword(channelData.admin_password || "");
      setNameColor(channelData.name_color || null);
      setNameGradientFrom(channelData.name_gradient_from || null);
      setNameGradientTo(channelData.name_gradient_to || null);
      setBgColor(channelData.bg_color || null);
    }

    // Fetch channel settings (topic)
    const { data: settingsData } = await supabaseUntyped
      .from('channel_settings')
      .select('topic')
      .eq('channel_id', channel.id)
      .maybeSingle();
    
    if (settingsData) {
      setTopicText(settingsData.topic || "");
    }

    // Fetch room bans with profiles
    const { data: bans } = await supabaseUntyped
      .from('room_bans')
      .select('*')
      .eq('channel_id', channel.id);
    
    if (bans && bans.length > 0) {
      const userIds = bans.map((b: RoomBan) => b.user_id);
      const { data: profiles } = await supabaseUntyped
        .from('profiles_public')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map((p: { user_id: string; username: string }) => [p.user_id, p]) || []);
      setRoomBans(bans.map((b: RoomBan) => ({ ...b, profile: profileMap.get(b.user_id) })));
    } else {
      setRoomBans([]);
    }

    // Fetch room mutes with profiles
    const { data: mutes } = await supabaseUntyped
      .from('room_mutes')
      .select('*')
      .eq('channel_id', channel.id);
    
    if (mutes && mutes.length > 0) {
      const userIds = mutes.map((m: RoomMute) => m.user_id);
      const { data: profiles } = await supabaseUntyped
        .from('profiles_public')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map((p: { user_id: string; username: string }) => [p.user_id, p]) || []);
      setRoomMutes(mutes.map((m: RoomMute) => ({ ...m, profile: profileMap.get(m.user_id) })));
    } else {
      setRoomMutes([]);
    }

    // Fetch room admins with profiles
    const { data: admins } = await supabaseUntyped
      .from('room_admins')
      .select('*')
      .eq('channel_id', channel.id);
    
    if (admins && admins.length > 0) {
      const userIds = admins.map((a: RoomAdmin) => a.user_id);
      const { data: profiles } = await supabaseUntyped
        .from('profiles_public')
        .select('user_id, username')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map((p: { user_id: string; username: string }) => [p.user_id, p]) || []);
      setRoomAdmins(admins.map((a: RoomAdmin) => ({ ...a, profile: profileMap.get(a.user_id) })));
    } else {
      setRoomAdmins([]);
    }
  };

  const handleSavePasswords = async () => {
    setLoading(true);
    const { error } = await supabaseUntyped
      .from('channels')
      .update({
        room_password: roomPassword || null,
        admin_password: adminPassword || null
      })
      .eq('id', channel.id);
    
    setLoading(false);
    
    if (error) {
      toast({ variant: "destructive", title: "Failed to save", description: error.message });
    } else {
      toast({ title: "Settings saved", description: "Room passwords updated successfully." });
    }
  };

  const handleSaveAppearance = async () => {
    setLoading(true);
    const { error } = await supabaseUntyped
      .from('channels')
      .update({
        name_color: nameGradientFrom ? null : nameColor,
        name_gradient_from: nameGradientFrom,
        name_gradient_to: nameGradientTo,
        bg_color: bgColor
      })
      .eq('id', channel.id);
    
    setLoading(false);
    
    if (error) {
      toast({ variant: "destructive", title: "Failed to save", description: error.message });
    } else {
      toast({ title: "Appearance saved", description: "Room colors updated successfully." });
    }
  };

  const handleSaveTopic = async () => {
    setLoading(true);
    
    // Upsert channel settings
    const { error } = await supabaseUntyped
      .from('channel_settings')
      .upsert({
        channel_id: channel.id,
        channel_name: channel.name,
        topic: topicText || null,
        updated_by: userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'channel_id'
      });
    
    setLoading(false);
    
    if (error) {
      toast({ variant: "destructive", title: "Failed to save topic", description: error.message });
    } else {
      toast({ title: "Topic saved", description: "Room topic updated successfully." });
    }
  };

  const handleRemoveBan = async (banId: string) => {
    const { error } = await supabaseUntyped
      .from('room_bans')
      .delete()
      .eq('id', banId);
    
    if (!error) {
      setRoomBans(prev => prev.filter(b => b.id !== banId));
      toast({ title: "Ban removed" });
    }
  };

  const handleRemoveMute = async (muteId: string) => {
    const { error } = await supabaseUntyped
      .from('room_mutes')
      .delete()
      .eq('id', muteId);
    
    if (!error) {
      setRoomMutes(prev => prev.filter(m => m.id !== muteId));
      toast({ title: "Mute removed" });
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    const { error } = await supabaseUntyped
      .from('room_admins')
      .delete()
      .eq('id', adminId);
    
    if (!error) {
      setRoomAdmins(prev => prev.filter(a => a.id !== adminId));
      toast({ title: "Admin removed" });
    }
  };

  const selectGradient = (gradient: { from: string; to: string } | null) => {
    if (gradient) {
      setNameGradientFrom(gradient.from);
      setNameGradientTo(gradient.to);
      setNameColor(null);
    } else {
      setNameGradientFrom(null);
      setNameGradientTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Room Settings - #{channel.name}
          </DialogTitle>
          <DialogDescription>
            Manage your room's settings, appearance, and moderation.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-4">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="appearance" className="text-[10px] px-1 py-1.5">
              <Palette className="h-3 w-3 mr-0.5" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="topic" className="text-[10px] px-1 py-1.5">
              <MessageSquare className="h-3 w-3 mr-0.5" />
              Topic
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-[10px] px-1 py-1.5">
              <Bot className="h-3 w-3 mr-0.5" />
              AI Mod
            </TabsTrigger>
            <TabsTrigger value="bans" className="text-[10px] px-1 py-1.5">
              <Ban className="h-3 w-3 mr-0.5" />
              Bans
            </TabsTrigger>
            <TabsTrigger value="mutes" className="text-[10px] px-1 py-1.5">
              <VolumeX className="h-3 w-3 mr-0.5" />
              Mutes
            </TabsTrigger>
            <TabsTrigger value="passwords" className="text-[10px] px-1 py-1.5">
              <Key className="h-3 w-3 mr-0.5" />
              Access
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            {/* Room Name Color */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                <Palette className="h-3 w-3" />
                Room Name Color
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setNameColor(null); setNameGradientFrom(null); setNameGradientTo(null); }}
                  className={cn(
                    "w-6 h-6 rounded border-2 flex items-center justify-center text-[10px]",
                    !nameColor && !nameGradientFrom ? "border-primary" : "border-border"
                  )}
                >
                  ✕
                </button>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => { setNameColor(color.value); setNameGradientFrom(null); setNameGradientTo(null); }}
                    className={cn(
                      "w-6 h-6 rounded",
                      nameColor === color.value ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Gradient Selection */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                Gradient Text
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => selectGradient(null)}
                  className={cn(
                    "px-2 h-6 rounded border-2 flex items-center justify-center text-[10px]",
                    !nameGradientFrom ? "border-primary" : "border-border"
                  )}
                >
                  None
                </button>
                {GRADIENT_PRESETS.map((gradient) => (
                  <button
                    key={gradient.name}
                    type="button"
                    onClick={() => selectGradient(gradient)}
                    className={cn(
                      "w-10 h-6 rounded",
                      nameGradientFrom === gradient.from ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                    )}
                    style={{ 
                      background: `linear-gradient(90deg, ${gradient.from}, ${gradient.to})` 
                    }}
                    title={gradient.name}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                Room Background Tint
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setBgColor(null)}
                  className={cn(
                    "w-6 h-6 rounded border-2 flex items-center justify-center text-[10px]",
                    !bgColor ? "border-primary" : "border-border"
                  )}
                >
                  ✕
                </button>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setBgColor(color.value)}
                    className={cn(
                      "w-6 h-6 rounded opacity-60",
                      bgColor === color.value ? "ring-2 ring-white ring-offset-1 ring-offset-background" : ""
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-[10px] text-muted-foreground mb-2">Preview:</p>
              <div 
                className="p-2 rounded"
                style={{ backgroundColor: bgColor ? `${bgColor}30` : undefined }}
              >
                <span 
                  className={cn(
                    "text-sm font-semibold",
                    nameGradientFrom && "bg-clip-text text-transparent"
                  )}
                  style={{
                    color: !nameGradientFrom ? (nameColor || undefined) : undefined,
                    backgroundImage: nameGradientFrom && nameGradientTo 
                      ? `linear-gradient(90deg, ${nameGradientFrom}, ${nameGradientTo})`
                      : undefined,
                  }}
                >
                  #{channel.name}
                </span>
              </div>
            </div>

            <Button onClick={handleSaveAppearance} disabled={loading} className="w-full" variant="jac">
              <Save className="h-4 w-4 mr-2" />
              Save Appearance
            </Button>
          </TabsContent>

          {/* Topic Tab */}
          <TabsContent value="topic" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">Room Topic</Label>
              <p className="text-xs text-muted-foreground mb-2">Set a topic that appears in the room header.</p>
              <Textarea
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                placeholder="What's this room about?"
                className="resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{topicText.length}/200 characters</p>
            </div>

            <Button onClick={handleSaveTopic} disabled={loading} className="w-full" variant="jac">
              <Save className="h-4 w-4 mr-2" />
              Save Topic
            </Button>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> You can also use <code>/topic [message]</code> in chat to quickly update the topic.
              </p>
            </div>
          </TabsContent>

          {/* AI Moderation Tab */}
          <TabsContent value="moderation" className="mt-4 space-y-4">
            {moderationLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading settings...</p>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg">
                    <Checkbox
                      id="url-filter"
                      checked={moderationSettings.url_filter_enabled}
                      onCheckedChange={async (checked) => {
                        setSavingModeration(true);
                        const success = await updateModerationSettings({ url_filter_enabled: !!checked });
                        setSavingModeration(false);
                        if (success) {
                          toast({ title: "URL filter updated" });
                        } else {
                          toast({ variant: "destructive", title: "Failed to update" });
                        }
                      }}
                      disabled={savingModeration}
                    />
                    <div>
                      <Label htmlFor="url-filter" className="text-sm font-medium cursor-pointer">
                        URL Filter
                      </Label>
                      <p className="text-xs text-muted-foreground">Block links and URLs in messages</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg">
                    <Checkbox
                      id="profanity-filter"
                      checked={moderationSettings.profanity_filter_enabled}
                      onCheckedChange={async (checked) => {
                        setSavingModeration(true);
                        const success = await updateModerationSettings({ profanity_filter_enabled: !!checked });
                        setSavingModeration(false);
                        if (success) {
                          toast({ title: "Profanity filter updated" });
                        } else {
                          toast({ variant: "destructive", title: "Failed to update" });
                        }
                      }}
                      disabled={savingModeration}
                    />
                    <div>
                      <Label htmlFor="profanity-filter" className="text-sm font-medium cursor-pointer">
                        Profanity Filter
                      </Label>
                      <p className="text-xs text-muted-foreground">Replace bad words with asterisks</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-lg">
                    <Checkbox
                      id="link-preview"
                      checked={moderationSettings.link_preview_enabled}
                      onCheckedChange={async (checked) => {
                        setSavingModeration(true);
                        const success = await updateModerationSettings({ link_preview_enabled: !!checked });
                        setSavingModeration(false);
                        if (success) {
                          toast({ title: "Link preview setting updated" });
                        } else {
                          toast({ variant: "destructive", title: "Failed to update" });
                        }
                      }}
                      disabled={savingModeration}
                    />
                    <div>
                      <Label htmlFor="link-preview" className="text-sm font-medium cursor-pointer">
                        Link Previews
                      </Label>
                      <p className="text-xs text-muted-foreground">Show URL previews (requires URL filter off)</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Note:</strong> These settings only apply to this room. Adult channels (21+) bypass all filters automatically.
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          {/* Bans Tab */}
          <TabsContent value="bans" className="mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roomBans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No banned users in this room.</p>
              ) : (
                roomBans.map((ban) => (
                  <div key={ban.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{ban.profile?.username || 'Unknown'}</p>
                      {ban.reason && <p className="text-xs text-muted-foreground">{ban.reason}</p>}
                      {ban.expires_at && (
                        <p className="text-[10px] text-muted-foreground">
                          Expires: {new Date(ban.expires_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveBan(ban.id)} className="text-destructive hover:text-destructive">
                      Unban
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">💡 <strong>Commands:</strong></p>
              <code className="text-xs block">/roomban @username [reason]</code>
              <code className="text-xs block">/roomkick @username</code>
            </div>
          </TabsContent>

          {/* Mutes Tab */}
          <TabsContent value="mutes" className="mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roomMutes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No muted users in this room.</p>
              ) : (
                roomMutes.map((mute) => (
                  <div key={mute.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{mute.profile?.username || 'Unknown'}</p>
                      {mute.reason && <p className="text-xs text-muted-foreground">{mute.reason}</p>}
                      {mute.expires_at && (
                        <p className="text-[10px] text-muted-foreground">
                          Expires: {new Date(mute.expires_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveMute(mute.id)} className="text-destructive hover:text-destructive">
                      Unmute
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">💡 <strong>Commands:</strong></p>
              <code className="text-xs block">/roommute @username [duration]</code>
              <code className="text-xs block">/roomquiet @username [duration]</code>
            </div>
          </TabsContent>

          {/* Passwords/Access Tab */}
          <TabsContent value="passwords" className="space-y-4 mt-4">
            <div>
              <Label className="text-sm">Room Password</Label>
              <p className="text-xs text-muted-foreground mb-2">Users must enter this to join the room.</p>
              <Input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Leave empty for no password"
              />
            </div>
            
            <div>
              <Label className="text-sm">Admin Password</Label>
              <p className="text-xs text-muted-foreground mb-2">Users can use /admin [password] to gain room admin powers.</p>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Leave empty to disable"
              />
            </div>
            
            <Button onClick={handleSavePasswords} disabled={loading} className="w-full" variant="jac">
              <Save className="h-4 w-4 mr-2" />
              Save Access Settings
            </Button>

            {/* Room Admins */}
            <div className="mt-6">
              <Label className="text-sm flex items-center gap-1 mb-2">
                <Users className="h-3 w-3" />
                Room Admins ({roomAdmins.length})
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {roomAdmins.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No room admins. Share your admin password to add them.</p>
                ) : (
                  roomAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{admin.profile?.username || 'Unknown'}</p>
                        <p className="text-[10px] text-muted-foreground">Since {new Date(admin.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveAdmin(admin.id)} className="text-destructive hover:text-destructive">
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomSettingsModal;
