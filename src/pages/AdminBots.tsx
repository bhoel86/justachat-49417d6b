import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Power, PowerOff, Loader2, Hash, ToggleLeft, ToggleRight, RefreshCw, Users, Gauge } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { CHAT_BOTS, ROOM_BOTS, ALL_BOTS, getRoomBots, getUniqueRoomNames } from "@/lib/chatBots";

interface BotSettings {
  id: string;
  enabled: boolean;
  allowed_channels: string[];
  chat_speed: number;
  moderator_bots_enabled: boolean;
  updated_at: string;
}

const ROOM_NAMES = getUniqueRoomNames();

const AdminBots = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isOwner))) {
      navigate("/");
    }
  }, [user, isAdmin, isOwner, authLoading, navigate]);

  const fetchSettings = async () => {
    try {
      const { data: botData, error: botError } = await supabase
        .from("bot_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (botError) {
        console.error("Error fetching bot settings:", botError);
        return;
      }
      
      if (botData) {
        setSettings(botData as BotSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from("bot_settings")
          .insert({
            enabled: true,
            allowed_channels: ROOM_NAMES,
            chat_speed: 5,
            moderator_bots_enabled: true,
            updated_by: user?.id
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating bot settings:", createError);
          toast.error("Failed to initialize bot settings");
        } else {
          setSettings(newSettings as BotSettings);
          toast.success("Bot settings initialized");
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ enabled, updated_by: user?.id })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, enabled });
      toast.success(enabled ? "Bots enabled" : "Bots disabled");
    } catch (err) {
      console.error("Error updating bot settings:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRoomToggle = async (roomName: string, enabled: boolean) => {
    if (!settings) return;

    const newChannels = enabled
      ? [...settings.allowed_channels, roomName]
      : settings.allowed_channels.filter((c) => c !== roomName);

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ 
          allowed_channels: newChannels,
          updated_by: user?.id 
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, allowed_channels: newChannels });
      toast.success(`Bots ${enabled ? 'enabled' : 'disabled'} for #${roomName}`);
    } catch (err) {
      console.error("Error saving channels:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAllRooms = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ 
          allowed_channels: ROOM_NAMES,
          updated_by: user?.id 
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, allowed_channels: ROOM_NAMES });
      toast.success("Bots enabled for all rooms");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAllRooms = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ 
          allowed_channels: [],
          updated_by: user?.id 
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, allowed_channels: [] });
      toast.success("Bots disabled for all rooms");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ 
          chat_speed: speed,
          updated_by: user?.id 
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, chat_speed: speed });
      toast.success(`Bot speed set to ${speed}s`);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to update speed");
    } finally {
      setSaving(false);
    }
  };

  const handleModeratorBotsToggle = async (enabled: boolean) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ 
          moderator_bots_enabled: enabled,
          updated_by: user?.id 
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, moderator_bots_enabled: enabled });
      toast.success(enabled ? "Moderator bots will stay active" : "Moderator bots follow main toggle");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const formatRoomName = (name: string) => {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isRoomEnabled = (roomName: string) => {
    return settings?.allowed_channels.includes(roomName) ?? false;
  };

  if (authLoading || loading) {
    return (
      <AdminSidebar>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminSidebar>
    );
  }

  const displayBots = selectedRoom 
    ? getRoomBots(selectedRoom)
    : CHAT_BOTS;

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Bot Management
            </h1>
            <p className="text-sm text-muted-foreground">
              {ALL_BOTS.length} total bots • {CHAT_BOTS.length} global • {ROOM_BOTS.length} room-specific
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {settings?.enabled ? (
                  <Power className="h-4 w-4 text-green-500" />
                ) : (
                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                )}
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${settings?.enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {settings?.enabled ? 'Active' : 'Off'}
                </span>
                <Switch
                  checked={settings?.enabled ?? false}
                  onCheckedChange={handleToggleEnabled}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Global Bots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{CHAT_BOTS.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-secondary-foreground" />
                Room Bots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ROOM_BOTS.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {settings?.allowed_channels.length || 0} / {ROOM_NAMES.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Row: Speed Control & Moderator Bots */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Speed Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-5 w-5 text-primary" />
                Chat Speed
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Bots respond every <span className="font-bold text-foreground">{settings?.chat_speed || 5}</span> seconds
                </span>
                <Badge variant="outline">{settings?.chat_speed || 5}s delay</Badge>
              </div>
              <Slider
                value={[settings?.chat_speed || 5]}
                onValueChange={(value) => {
                  if (settings) {
                    setSettings({ ...settings, chat_speed: value[0] });
                  }
                }}
                onValueCommit={(value) => handleSpeedChange(value[0])}
                min={1}
                max={60}
                step={1}
                disabled={saving || !settings?.enabled}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1s (Fast)</span>
                <span>30s</span>
                <span>60s (Slow)</span>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Moderator Bots Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Moderator Bots
                </span>
                <Switch
                  checked={settings?.moderator_bots_enabled ?? true}
                  onCheckedChange={handleModeratorBotsToggle}
                  disabled={saving}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Keep moderator bots running</p>
                  <p className="text-xs text-muted-foreground">
                    Room moderator bots stay active even when main bots are off
                  </p>
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {/* Video/Voice moderators */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Media Rooms</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={settings?.moderator_bots_enabled ? "default" : "secondary"}>
                          Pixel (Video)
                        </Badge>
                        <Badge variant={settings?.moderator_bots_enabled ? "default" : "secondary"}>
                          Echo (Voice)
                        </Badge>
                      </div>
                    </div>
                    {/* Room-specific moderators */}
                    {ROOM_NAMES.map((room) => {
                      const roomBots = getRoomBots(room);
                      if (roomBots.length === 0) return null;
                      const firstBot = roomBots[0];
                      return (
                        <div key={room} className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            #{formatRoomName(room)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={settings?.moderator_bots_enabled && isRoomEnabled(room) ? "default" : "secondary"}
                            >
                              {firstBot.username}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {settings?.moderator_bots_enabled ? "Always on" : "Follow main toggle"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Split Layout: Rooms List | Bot Directory */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Room Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Rooms
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEnableAllRooms}
                    disabled={saving || !settings?.enabled}
                    title="Enable All"
                  >
                    <ToggleRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDisableAllRooms}
                    disabled={saving || !settings?.enabled}
                    title="Disable All"
                  >
                    <ToggleLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-4 pt-0">
                  {/* Global bots option */}
                  <div
                    onClick={() => setSelectedRoom(null)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRoom === null
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Global Bots</span>
                    </div>
                    <Badge variant="outline">{CHAT_BOTS.length}</Badge>
                  </div>

                  {ROOM_NAMES.map((room) => {
                    const roomBots = getRoomBots(room);
                    const enabled = isRoomEnabled(room);
                    const isSelected = selectedRoom === room;
                    
                    return (
                      <div
                        key={room}
                        onClick={() => setSelectedRoom(room)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              enabled && settings?.enabled ? 'bg-green-500' : 'bg-muted-foreground'
                            }`}
                          />
                          <span className="font-medium text-sm">#{formatRoomName(room)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{roomBots.length}</Badge>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) => {
                              handleRoomToggle(room, checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={saving || !settings?.enabled}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right: Bot Directory */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {selectedRoom ? `#${formatRoomName(selectedRoom)} Bots` : 'Global Bots'}
                </span>
                <Badge variant="secondary">{displayBots.length} bots</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {displayBots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p>No bots in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayBots.map((bot) => {
                      const isActive = selectedRoom 
                        ? isRoomEnabled(selectedRoom) && settings?.enabled
                        : settings?.enabled;
                      
                      return (
                        <div
                          key={bot.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-opacity ${
                            isActive ? 'bg-card' : 'bg-muted/30 opacity-60'
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                              isActive
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {bot.username[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{bot.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {bot.style} • {bot.gender}
                            </p>
                          </div>
                          <div
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isActive ? "bg-green-500" : "bg-muted-foreground"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminBots;
