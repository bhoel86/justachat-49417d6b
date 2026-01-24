import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Power, PowerOff, Check, Loader2, Users, Hash, ToggleLeft, ToggleRight } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CHAT_BOTS, ROOM_BOTS, ALL_BOTS, getRoomBots, getUniqueRoomNames } from "@/lib/chatBots";

interface BotSettings {
  id: string;
  enabled: boolean;
  allowed_channels: string[];
  updated_at: string;
}

const ROOM_NAMES = getUniqueRoomNames();

const AdminBots = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOwner, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("global");

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isOwner))) {
      navigate("/");
    }
  }, [user, isAdmin, isOwner, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: botData, error: botError } = await supabase
          .from("bot_settings")
          .select("*")
          .limit(1)
          .single();

        if (botError && botError.code !== "PGRST116") {
          console.error("Error fetching bot settings:", botError);
        }
        
        if (botData) {
          setSettings(botData);
        }

        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("id, name")
          .eq("is_hidden", false)
          .order("name");

        if (channelError) {
          console.error("Error fetching channels:", channelError);
        } else {
          setChannels(channelData || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
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

    const allRoomNames = ROOM_NAMES;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("bot_settings")
        .update({ 
          allowed_channels: allRoomNames,
          updated_by: user?.id 
        })
        .eq("id", settings.id);

      if (error) throw error;

      setSettings({ ...settings, allowed_channels: allRoomNames });
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

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Bot Management</h1>
            <p className="text-muted-foreground">
              {ALL_BOTS.length} total bots • {CHAT_BOTS.length} global • {ROOM_BOTS.length} room-specific
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings?.enabled ? (
                <Power className="h-5 w-5 text-green-500" />
              ) : (
                <PowerOff className="h-5 w-5 text-muted-foreground" />
              )}
              Master Bot Control
            </CardTitle>
            <CardDescription>
              Enable or disable all simulated chat users globally
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bot-toggle" className="text-base">
                  {settings?.enabled ? "Bots are active" : "Bots are disabled"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {settings?.enabled
                    ? `Active in ${settings.allowed_channels.length} rooms`
                    : "No bots will appear in any room"}
                </p>
              </div>
              <Switch
                id="bot-toggle"
                checked={settings?.enabled ?? false}
                onCheckedChange={handleToggleEnabled}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Per-Room Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Room Controls
                </CardTitle>
                <CardDescription>
                  Toggle bots on/off for each room individually
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAllRooms}
                  disabled={saving || !settings?.enabled}
                >
                  <ToggleRight className="h-4 w-4 mr-1" />
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisableAllRooms}
                  disabled={saving || !settings?.enabled}
                >
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Disable All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ROOM_NAMES.map((room) => {
                const roomBots = getRoomBots(room);
                const enabled = isRoomEnabled(room);
                
                return (
                  <div
                    key={room}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      enabled && settings?.enabled
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          enabled && settings?.enabled ? 'bg-green-500' : 'bg-muted-foreground'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm capitalize">
                          #{formatRoomName(room)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {roomBots.length} bots
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => handleRoomToggle(room, checked)}
                      disabled={saving || !settings?.enabled}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bot Lists with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bot Directory</span>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {CHAT_BOTS.length} Global
                </Badge>
                <Badge variant="secondary">
                  <Hash className="h-3 w-3 mr-1" />
                  {ROOM_BOTS.length} Room-Specific
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Global bots appear in all enabled rooms. Room-specific bots only appear in their assigned room when enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-auto gap-1 mb-4 flex-wrap">
                  <TabsTrigger value="global" className="text-xs">
                    Global ({CHAT_BOTS.length})
                  </TabsTrigger>
                  {ROOM_NAMES.map((room) => (
                    <TabsTrigger key={room} value={room} className="text-xs capitalize">
                      {formatRoomName(room)} ({getRoomBots(room).length})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {/* Global Bots Tab */}
              <TabsContent value="global">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {CHAT_BOTS.map((bot) => (
                    <div
                      key={bot.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          settings?.enabled
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
                        className={`h-2 w-2 rounded-full ${
                          settings?.enabled ? "bg-green-500" : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Room-Specific Bot Tabs */}
              {ROOM_NAMES.map((room) => {
                const roomEnabled = isRoomEnabled(room);
                const roomBots = getRoomBots(room);
                
                return (
                  <TabsContent key={room} value={room}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={roomEnabled && settings?.enabled ? '' : 'opacity-50'}>
                          #{room}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {roomBots.length} bots assigned
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${roomEnabled && settings?.enabled ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {roomEnabled && settings?.enabled ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={roomEnabled}
                          onCheckedChange={(checked) => handleRoomToggle(room, checked)}
                          disabled={saving || !settings?.enabled}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {roomBots.map((bot) => (
                        <div
                          key={bot.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-opacity ${
                            roomEnabled && settings?.enabled ? 'bg-card' : 'bg-muted/30 opacity-60'
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              roomEnabled && settings?.enabled
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
                            className={`h-2 w-2 rounded-full ${
                              roomEnabled && settings?.enabled ? "bg-green-500" : "bg-muted-foreground"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminSidebar>
  );
};

export default AdminBots;