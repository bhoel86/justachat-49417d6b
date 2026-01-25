import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceBroadcast } from '@/hooks/useVoiceBroadcast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mic, MicOff, ArrowLeft, Users, Volume2, Radio, 
  Crown, Shield, Star 
} from 'lucide-react';

const VoiceChat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string>>({});

  // Fetch user profile
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };
    
    fetchProfile();
  }, [user?.id]);

  const {
    isBroadcasting,
    isConnected,
    participants,
    toggleBroadcast
  } = useVoiceBroadcast({
    roomId: 'voice-chat-main',
    odious: user?.id || '',
    username: profile?.username || 'Anonymous',
    avatarUrl: profile?.avatar_url
  });

  // Fetch roles for all participants
  useEffect(() => {
    if (!participants.length) return;
    
    const fetchRoles = async () => {
      const roles: Record<string, string> = {};
      
      for (const participant of participants) {
        try {
          // Check owner first
          const { data: isOwner } = await supabase.rpc('is_owner', { _user_id: participant.odious });
          if (isOwner) {
            roles[participant.odious] = 'owner';
            continue;
          }
          
          // Check admin
          const { data: isAdmin } = await supabase.rpc('has_role', { 
            _user_id: participant.odious, 
            _role: 'admin' 
          });
          if (isAdmin) {
            roles[participant.odious] = 'admin';
            continue;
          }
          
          // Check moderator
          const { data: isMod } = await supabase.rpc('has_role', { 
            _user_id: participant.odious, 
            _role: 'moderator' 
          });
          if (isMod) {
            roles[participant.odious] = 'moderator';
          }
        } catch (e) {
          console.error('Error fetching role for', participant.odious, e);
        }
      }
      
      setRolesByUserId(roles);
    };
    
    fetchRoles();
  }, [participants]);

  // Scroll to top on load
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  const broadcasters = participants.filter(p => p.isBroadcasting);
  const listeners = participants.filter(p => !p.isBroadcasting);

  const getRoleBadge = (odious: string) => {
    const role = rolesByUserId[odious];
    if (!role) return null;
    
    switch (role) {
      case 'owner':
        return (
          <Badge className="text-[9px] px-1 py-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
            <Crown className="w-2.5 h-2.5 mr-0.5" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="text-[9px] px-1 py-0 bg-primary text-primary-foreground">
            <Shield className="w-2.5 h-2.5 mr-0.5" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge variant="secondary" className="text-[9px] px-1 py-0">
            <Star className="w-2.5 h-2.5 mr-0.5" />
            Mod
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Voice Chat</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {participants.length} {participants.length === 1 ? 'listener' : 'listeners'}
                  {isConnected && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />}
                </p>
              </div>
            </div>
          </div>
          
          {/* Broadcast Button */}
          <Button
            onClick={toggleBroadcast}
            className={`gap-2 ${
              isBroadcasting 
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse' 
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
            }`}
          >
            {isBroadcasting ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop Broadcasting
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Broadcasting
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcasters Section */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-destructive" />
                <h2 className="text-lg font-semibold">Live Broadcasters</h2>
                {broadcasters.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {broadcasters.length} LIVE
                  </Badge>
                )}
              </div>
              
              {broadcasters.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No one is broadcasting yet</p>
                  <p className="text-sm mt-1">Click the mic button to start!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {broadcasters.map((broadcaster) => (
                    <div 
                      key={broadcaster.odious}
                      className="relative bg-gradient-to-br from-destructive/20 to-orange-500/20 rounded-xl p-4 border border-destructive/30 animate-pulse"
                    >
                      <div className="absolute -top-2 -right-2">
                        <Badge variant="destructive" className="text-[10px]">
                          <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                          LIVE
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="w-16 h-16 ring-2 ring-destructive ring-offset-2 ring-offset-background">
                          <AvatarImage src={broadcaster.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-destructive to-orange-500 text-destructive-foreground">
                            {broadcaster.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="font-medium text-sm truncate max-w-[100px]">
                            {broadcaster.username}
                          </p>
                          {getRoleBadge(broadcaster.odious)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Listeners Section */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Listeners</h2>
                <Badge variant="secondary">{listeners.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {listeners.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No listeners yet
                  </p>
                ) : (
                  listeners.map((listener) => (
                    <div 
                      key={listener.odious}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={listener.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/20">
                          {listener.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{listener.username}</p>
                        {getRoleBadge(listener.odious)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-muted/50 rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            How Voice Chat Works
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click the <strong>Start Broadcasting</strong> button to share your voice live</li>
            <li>• Everyone in the room will hear you instantly</li>
            <li>• Click <strong>Stop Broadcasting</strong> when you're done speaking</li>
            <li>• Listeners can hear all active broadcasters</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default VoiceChat;
