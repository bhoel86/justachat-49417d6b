/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Power, PowerOff, Loader2, Hash, ToggleLeft, ToggleRight, RefreshCw, Gauge } from "lucide-react";
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
import { MODERATORS, type ModeratorInfo } from "@/lib/roomConfig";

interface BotSettings {
  id: string;
  enabled: boolean;
  allowed_channels: string[];
  chat_speed: number;
  moderator_bots_enabled: boolean;
  updated_at: string;
}

// Build room list from MODERATORS (exclude voice/video media bots)
const MEDIA_ROOMS = ['voice-chat', 'video-chat'];
const ROOM_ENTRIES = Object.entries(MODERATORS).filter(
  ([room]) => !MEDIA_ROOMS.includes(room)
);
const ROOM_NAMES = ROOM_ENTRIES.map(([room]) => room);

const AdminBots = () => {
  const navigate = useNavigate();
  const { user, session, isAdmin, isOwner, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isOwner))) {
      navigate("/lobby");
    }
  }, [user, isAdmin, isOwner, authLoading, navigate]);

  const fetchSettings = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const accessToken = session?.access_token || supabaseKey;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(
        `${supabaseUrl}/rest/v1/bot_settings?select=*&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.error("Error fetching bot settings:", res.status);
        toast.error(`Failed to load bot settings: HTTP ${res.status}`);
        return;
      }

      const rows = await res.json();
      if (rows.length > 0) {
        setSettings(rows[0] as BotSettings);
      } else {
        console.log("No bot settings found, attempting to create defaults...");
        const createRes = await fetch(
          `${supabaseUrl}/rest/v1/bot_settings`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              enabled: true,
              allowed_channels: ROOM_NAMES,
              chat_speed: 5,
              moderator_bots_enabled: true,
              updated_by: user?.id
            }),
          }
        );

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error("Error creating bot settings:", errText);
          if (createRes.status === 403 || errText.includes('RLS')) {
            toast.error("Bot settings not initialized. Run fix-bots-and-sync.sh on VPS to set up.");
          } else {
            toast.error(`Failed to initialize: ${errText}`);
          }
        } else {
          const newRows = await createRes.json();
          setSettings(newRows[0] as BotSettings);
          toast.success("Bot settings initialized");
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error("Bot settings fetch timed out");
        toast.error("Request timed out — try refreshing");
      } else {
        console.error("Error:", err);
        toast.error("Failed to connect to database");
      }
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

  const getAuthHeaders = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const accessToken = session?.access_token || supabaseKey;
    return { supabaseUrl, supabaseKey, accessToken };
  };

  const updateBotSettings = async (updates: Record<string, any>) => {
    if (!settings) return false;
    const { supabaseUrl, supabaseKey, accessToken } = getAuthHeaders();
    const res = await fetch(
      `${supabaseUrl}/rest/v1/bot_settings?id=eq.${settings.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ ...updates, updated_by: user?.id }),
      }
    );
    return res.ok;
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!settings) return;
    setSaving(true);
    try {
      const ok = await updateBotSettings({ enabled });
      if (!ok) throw new Error('Update failed');
      setSettings({ ...settings, enabled });
      toast.success(enabled ? "All moderator bots enabled" : "All moderator bots disabled");
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
      const ok = await updateBotSettings({ allowed_channels: newChannels });
      if (!ok) throw new Error('Update failed');
      setSettings({ ...settings, allowed_channels: newChannels });
      const mod = MODERATORS[roomName];
      toast.success(`${mod?.name || roomName} ${enabled ? 'enabled' : 'disabled'} in #${roomName}`);
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
      const ok = await updateBotSettings({ allowed_channels: ROOM_NAMES });
      if (!ok) throw new Error('Update failed');
      setSettings({ ...settings, allowed_channels: ROOM_NAMES });
      toast.success("All room bots enabled");
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
      const ok = await updateBotSettings({ allowed_channels: [] });
      if (!ok) throw new Error('Update failed');
      setSettings({ ...settings, allowed_channels: [] });
      toast.success("All room bots disabled");
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
      const ok = await updateBotSettings({ chat_speed: speed });
      if (!ok) throw new Error('Update failed');
      setSettings({ ...settings, chat_speed: speed });
      toast.success(`Bot response delay set to ${speed}s`);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to update speed");
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

  const enabledCount = settings?.allowed_channels.filter(c => ROOM_NAMES.includes(c)).length ?? 0;

  return (
    <AdminSidebar>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Room Moderator Bots
            </h1>
            <p className="text-sm text-muted-foreground">
              {ROOM_ENTRIES.length} moderator bots — one per room
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {settings?.enabled ? (
                  <Power className="h-4 w-4 text-green-500" />
                ) : (
                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                )}
                Master Switch
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
                <Hash className="h-4 w-4 text-primary" />
                Active Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {enabledCount} / {ROOM_NAMES.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                Response Delay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{settings?.chat_speed || 5}s</span>
                  </span>
                  <Badge variant="outline">{settings?.chat_speed || 5}s</Badge>
                </div>
                <Slider
                  value={[settings?.chat_speed || 5]}
                  onValueChange={(value) => {
                    if (settings) setSettings({ ...settings, chat_speed: value[0] });
                  }}
                  onValueCommit={(value) => handleSpeedChange(value[0])}
                  min={1}
                  max={60}
                  step={1}
                  disabled={saving || !settings?.enabled}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1s</span>
                  <span>30s</span>
                  <span>60s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableAllRooms}
            disabled={saving || !settings?.enabled}
          >
            <ToggleRight className="h-4 w-4 mr-2" />
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisableAllRooms}
            disabled={saving || !settings?.enabled}
          >
            <ToggleLeft className="h-4 w-4 mr-2" />
            Disable All
          </Button>
        </div>

        {/* Room Bot List — one card per room */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Per-Room Moderator Bot Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border">
                {ROOM_ENTRIES.map(([room, mod]) => {
                  const enabled = isRoomEnabled(room) && (settings?.enabled ?? false);
                  return (
                    <div
                      key={room}
                      className={`flex items-center justify-between px-6 py-4 transition-colors ${
                        enabled ? '' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                            enabled
                              ? "bg-primary/20"
                              : "bg-muted"
                          }`}
                        >
                          {mod.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-sm flex items-center gap-2">
                            {mod.name}
                            <Badge variant="outline" className="text-xs font-normal">
                              {mod.displayName}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            #{formatRoomName(room)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            enabled ? "bg-green-500" : "bg-muted-foreground"
                          }`}
                        />
                        <Switch
                          checked={isRoomEnabled(room)}
                          onCheckedChange={(checked) => handleRoomToggle(room, checked)}
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
      </div>
    </AdminSidebar>
  );
};

export default AdminBots;
