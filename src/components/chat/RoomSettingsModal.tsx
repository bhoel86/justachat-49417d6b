import { useState, useEffect } from "react";
import { Lock, Key, Users, Shield, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabaseUntyped } from "@/hooks/useAuth";
import { Channel } from "./ChannelList";

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

const RoomSettingsModal = ({ open, onOpenChange, channel, userId }: RoomSettingsModalProps) => {
  const [roomPassword, setRoomPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [roomBans, setRoomBans] = useState<RoomBan[]>([]);
  const [roomMutes, setRoomMutes] = useState<RoomMute[]>([]);
  const [roomAdmins, setRoomAdmins] = useState<RoomAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && channel) {
      fetchRoomData();
    }
  }, [open, channel]);

  const fetchRoomData = async () => {
    // Fetch current passwords
    const { data: channelData } = await supabaseUntyped
      .from('channels')
      .select('room_password, admin_password')
      .eq('id', channel.id)
      .single();
    
    if (channelData) {
      setRoomPassword(channelData.room_password || "");
      setAdminPassword(channelData.admin_password || "");
    }

    // Fetch room bans with profiles
    const { data: bans } = await supabaseUntyped
      .from('room_bans')
      .select('*')
      .eq('channel_id', channel.id);
    
    if (bans && bans.length > 0) {
      const userIds = bans.map((b: RoomBan) => b.user_id);
      const { data: profiles } = await supabaseUntyped
        .from('profiles')
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
        .from('profiles')
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
        .from('profiles')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Room Settings - #{channel.name}
          </DialogTitle>
          <DialogDescription>
            Manage your room's security and moderation settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="passwords" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="passwords" className="text-xs">
              <Key className="h-3 w-3 mr-1" />
              Passwords
            </TabsTrigger>
            <TabsTrigger value="bans" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Bans ({roomBans.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Admins ({roomAdmins.length})
            </TabsTrigger>
          </TabsList>

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
              Save Passwords
            </Button>
          </TabsContent>

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
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveBan(ban.id)} className="text-destructive hover:text-destructive">
                      Unban
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">💡 <strong>Tip:</strong> Use these commands in chat:</p>
              <code className="text-xs block">/roomban @username [reason]</code>
              <code className="text-xs block">/roommute @username [duration]</code>
              <code className="text-xs block">/roomkick @username</code>
            </div>
          </TabsContent>

          <TabsContent value="admins" className="mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {roomAdmins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No room admins. Share your admin password to add them.</p>
              ) : (
                roomAdmins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{admin.profile?.username || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">Since {new Date(admin.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveAdmin(admin.id)} className="text-destructive hover:text-destructive">
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Room admins can use moderation commands in your room. They gain admin access by using <code>/admin [password]</code> with your admin password.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomSettingsModal;
