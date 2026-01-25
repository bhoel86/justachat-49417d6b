import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useVideoBroadcast } from '@/hooks/useVideoBroadcast';
import { usePrivateChats } from '@/hooks/usePrivateChats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoTile from '@/components/video/VideoTile';
import VideoChatBar from '@/components/video/VideoChatBar';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import PMTray from '@/components/chat/PMTray';
import { 
  Video, VideoOff, ArrowLeft, Users, Mic, MicOff,
  Crown, Shield, Star, Camera
} from 'lucide-react';

const VideoChat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);

  // Private messaging system
  const {
    activeChats,
    minimizedChats,
    openChat,
    closeChat,
    bringToFront,
    minimizeChat,
    restoreChat,
    setUnread,
    reorderChats
  } = usePrivateChats(user?.id || '', profile?.username || 'Anonymous');

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

  // Memoize options to prevent hook re-initialization
  const broadcastOptions = useMemo(() => ({
    roomId: 'video-chat-main',
    odious: user?.id || '',
    username: profile?.username || 'Anonymous',
    avatarUrl: profile?.avatar_url
  }), [user?.id, profile?.username, profile?.avatar_url]);

  const {
    isBroadcasting,
    isAudioMuted,
    isConnected,
    participants,
    localStream,
    audioLevel,
    startBroadcast,
    stopBroadcast,
    toggleAudioMute,
    getRemoteStream
  } = useVideoBroadcast(broadcastOptions);

  // Fetch roles for all participants
  useEffect(() => {
    if (!participants.length) return;
    
    const fetchRoles = async () => {
      const roles: Record<string, string> = {};
      
      for (const participant of participants) {
        try {
          const { data: isOwner } = await supabase.rpc('is_owner', { _user_id: participant.odious });
          if (isOwner) {
            roles[participant.odious] = 'owner';
            continue;
          }
          
          const { data: isAdmin } = await supabase.rpc('has_role', { 
            _user_id: participant.odious, 
            _role: 'admin' 
          });
          if (isAdmin) {
            roles[participant.odious] = 'admin';
            continue;
          }
          
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

  // Alt+V keyboard shortcut for push-to-broadcast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v' && !e.repeat) {
        e.preventDefault();
        startBroadcast();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v' && !isLocked) {
        stopBroadcast();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startBroadcast, stopBroadcast, isLocked]);

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
  const viewers = participants.filter(p => !p.isBroadcasting);

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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Video Chat</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {participants.length} {participants.length === 1 ? 'viewer' : 'viewers'}
                  {isConnected && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />}
                </p>
              </div>
            </div>
          </div>
          
          {/* Broadcast Button + Audio Mute + Audio Meter */}
          <div className="flex items-center gap-2">
            {/* Audio Mute Button - Only show when broadcasting */}
            {isBroadcasting && (
              <Button
                variant={isAudioMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleAudioMute}
                className="shrink-0"
                title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isAudioMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
            
            {/* Audio Level Meter - Only show when broadcasting and not muted */}
            {isBroadcasting && !isAudioMuted && (
              <div className="hidden sm:flex items-center gap-2 bg-card/80 rounded-lg px-3 py-2 border border-border">
                <Mic className="w-4 h-4 text-green-500 animate-pulse" />
                <div className="flex items-end gap-0.5 h-6">
                  {[...Array(10)].map((_, i) => {
                    const threshold = (i + 1) * 10;
                    const isActive = audioLevel >= threshold;
                    const barColor = i < 6 
                      ? 'bg-green-500' 
                      : i < 8 
                        ? 'bg-yellow-500' 
                        : 'bg-destructive';
                    return (
                      <div
                        key={i}
                        className={`w-1.5 rounded-sm transition-all duration-75 ${
                          isActive ? barColor : 'bg-muted'
                        }`}
                        style={{ 
                          height: `${(i + 1) * 2.4}px`,
                          opacity: isActive ? 1 : 0.3
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(audioLevel)}%
                </span>
              </div>
            )}
            
            {/* Muted indicator */}
            {isBroadcasting && isAudioMuted && (
              <Badge variant="destructive" className="hidden sm:flex gap-1">
                <MicOff className="w-3 h-3" />
                Muted
              </Badge>
            )}
            
            <Button
              onMouseDown={() => { if (!isLocked) startBroadcast(); }}
              onMouseUp={() => { if (!isLocked) stopBroadcast(); }}
              onMouseLeave={() => { if (!isLocked) stopBroadcast(); }}
              onTouchStart={() => { if (!isLocked) startBroadcast(); }}
              onTouchEnd={() => { if (!isLocked) stopBroadcast(); }}
              onDoubleClick={() => {
                if (isLocked) {
                  setIsLocked(false);
                  stopBroadcast();
                } else {
                  setIsLocked(true);
                  startBroadcast();
                }
              }}
              className={`gap-2 select-none ${
                isLocked
                  ? 'bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300'
                  : isBroadcasting 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              }`}
            >
              {isBroadcasting ? (
                <Video className="w-4 h-4 animate-pulse" />
              ) : (
                <VideoOff className="w-4 h-4" />
              )}
              {isLocked ? '🔒 Locked On' : isBroadcasting ? 'Broadcasting...' : 'Hold to Stream'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Broadcasters Section - Video Grid */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">Live Streams</h2>
                {broadcasters.length > 0 && (
                  <Badge className="bg-green-500 text-white animate-pulse">
                    {broadcasters.length} LIVE
                  </Badge>
                )}
              </div>
              
              {/* Local video preview when broadcasting */}
              {isBroadcasting && localStream && (
                <div className="mb-4">
                  <VideoTile
                    stream={localStream}
                    username={profile?.username || 'You'}
                    avatarUrl={profile?.avatar_url}
                    isLocal={true}
                    isBroadcasting={true}
                    roleBadge={getRoleBadge(user.id)}
                  />
                </div>
              )}
              
              {broadcasters.length === 0 && !isBroadcasting ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No one is streaming yet</p>
                  <p className="text-sm mt-1">Click the camera button to start!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {broadcasters
                    .filter(b => b.odious !== user.id) // Don't show self twice
                    .map((broadcaster) => (
                    <VideoTile
                      key={broadcaster.odious}
                      stream={getRemoteStream(broadcaster.odious)}
                      username={broadcaster.username}
                      avatarUrl={broadcaster.avatarUrl}
                      isBroadcasting={true}
                      roleBadge={getRoleBadge(broadcaster.odious)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Chat Bar under video - only render when profile is loaded */}
            {profile && (
              <div className="mt-4">
                <VideoChatBar 
                  roomId="video-chat-main"
                  odious={user.id}
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  onPmClick={openChat}
                />
              </div>
            )}
          </div>

          {/* Viewers Section */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-4 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Viewers</h2>
                <Badge variant="secondary">{viewers.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {viewers.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No viewers yet
                  </p>
                ) : (
                  viewers.map((viewer) => (
                    <button 
                      key={viewer.odious}
                      onClick={() => viewer.odious !== user.id && openChat(viewer.odious, viewer.username)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={viewer.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/20">
                          {viewer.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{viewer.username}</p>
                        {getRoleBadge(viewer.odious)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-muted/50 rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4 text-green-500" />
            How Video Chat Works
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Hold</strong> the <strong>Hold to Stream</strong> button to broadcast your webcam</li>
            <li>• <strong>Double-click</strong> to lock broadcast on (click again to unlock)</li>
            <li>• Or press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs font-mono">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs font-mono">V</kbd> as a keyboard shortcut</li>
            <li>• <strong>Release</strong> to stop streaming</li>
            <li>• Everyone in the room will see your video while you hold</li>
            <li>• <strong>Click</strong> any username to send a private message</li>
          </ul>
        </div>
      </main>

      {/* Private Message Windows */}
      {activeChats.map((chat) => (
        <PrivateChatWindow
          key={chat.id}
          targetUserId={chat.targetUserId}
          targetUsername={chat.targetUsername}
          currentUserId={user.id}
          currentUsername={profile?.username || 'Anonymous'}
          onClose={() => closeChat(chat.id)}
          onMinimize={() => minimizeChat(chat.id)}
          onNewMessage={() => setUnread(chat.id)}
          initialPosition={chat.position}
          zIndex={chat.zIndex}
          onFocus={() => bringToFront(chat.id)}
        />
      ))}

      {/* PM Tray */}
      <PMTray
        minimizedChats={minimizedChats}
        onRestore={restoreChat}
        onClose={closeChat}
        onReorder={reorderChats}
      />
    </div>
  );
};

export default VideoChat;
