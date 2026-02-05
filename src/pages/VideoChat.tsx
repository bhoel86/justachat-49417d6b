/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useVideoBroadcast } from '@/hooks/useVideoBroadcast';
import { usePrivateChats } from '@/hooks/usePrivateChats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VideoTile from '@/components/video/VideoTile';
import VideoGrid from '@/components/video/VideoGrid';
import VideoChatBar from '@/components/video/VideoChatBar';
import VideoUserMenu from '@/components/video/VideoUserMenu';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import PMTray from '@/components/chat/PMTray';
import { TestViewersToggle, TEST_VIEWERS, TEST_BROADCASTERS, TestViewer } from '@/components/video/TestViewersToggle';
import AIEnhanceToggle from '@/components/video/AIEnhanceToggle';
import { 
  Video, VideoOff, ArrowLeft, Users, Mic, MicOff,
  Crown, Shield, Star, Camera, MoreVertical
} from 'lucide-react';

const VideoChat = () => {
  const { user, loading, role: currentUserRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [testUsersEnabled, setTestUsersEnabled] = useState(false);
  const [aiEnhanceEnabled, setAiEnhanceEnabled] = useState(false);
  const [aiEnhanceStrength, setAiEnhanceStrength] = useState(50);
  const [beautyMode, setBeautyMode] = useState(false);
  const [softFocus, setSoftFocus] = useState(40);
  const [warmth, setWarmth] = useState(30);

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
    reorderChats,
  } = usePrivateChats(user?.id || '', profile?.username || 'Anonymous');

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setProfileLoaded(true);
    }
  }, [user?.id]);

  // Fetch user profile
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Don't initialize broadcast until profile is ready (to avoid Anonymous)
  const broadcastOptions = useMemo(() => ({
    roomId: 'video-chat-main',
    odious: user?.id || '',
    username: profileLoaded ? (profile?.username || '') : '',
    avatarUrl: profile?.avatar_url
  }), [user?.id, profileLoaded, profile?.username, profile?.avatar_url]);

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
      navigate('/home');
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

  const isOwner = currentUserRole === 'owner';
  
  // Moderator bot for video chat (Pixel)
  const modBot: TestViewer = {
    odious: 'mod-pixel',
    username: 'Pixel',
    avatarUrl: null,
    isBroadcasting: false,
    role: 'moderator',
  };
  
  // Test users when enabled
  const testViewers: TestViewer[] = testUsersEnabled ? TEST_VIEWERS : [];
  const testBroadcasters: TestViewer[] = testUsersEnabled ? TEST_BROADCASTERS : [];
  
  // Merge real broadcasters with test broadcasters
  const realBroadcasters = participants.filter(p => p.isBroadcasting);
  const broadcasters = [
    ...realBroadcasters,
    ...testBroadcasters,
  ];
  
  // Merge real viewers with test viewers + mod bot
  const realViewers = participants.filter(p => !p.isBroadcasting);
  const viewers = [
    modBot, // Moderator bot always at top
    ...realViewers,
    ...testViewers,
  ];

  // Build rolesByUserId including test users and mod bot
  const combinedRoles: Record<string, string> = { ...rolesByUserId };
  combinedRoles[modBot.odious] = 'moderator';
  if (testUsersEnabled) {
    [...testViewers, ...testBroadcasters].forEach(tv => {
      if (tv.role) combinedRoles[tv.odious] = tv.role;
    });
  }

  const getRoleBadge = (odious: string) => {
    const role = combinedRoles[odious];
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0 z-10">
        <div className="container mx-auto px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="hover:bg-primary/10 h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">Video Chat</h1>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />
                  {participants.length} online
                  {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                </p>
              </div>
            </div>
          </div>
          
          {/* Broadcast Controls - Compact */}
          <div className="flex items-center gap-1.5">
            {isBroadcasting && (
              <Button
                variant={isAudioMuted ? "destructive" : "secondary"}
                size="sm"
                onClick={toggleAudioMute}
                className="h-8 w-8 p-0"
                title={isAudioMuted ? "Unmute" : "Mute"}
              >
                {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </Button>
            )}
            
            {/* Compact Audio Meter */}
            {isBroadcasting && !isAudioMuted && (
              <div className="hidden md:flex items-center gap-1 bg-card/80 rounded px-2 py-1 border border-border">
                <div className="flex items-end gap-px h-4">
                  {[...Array(8)].map((_, i) => {
                    const threshold = (i + 1) * 12.5;
                    const isActive = audioLevel >= threshold;
                    const barColor = i < 5 ? 'bg-green-500' : i < 7 ? 'bg-yellow-500' : 'bg-destructive';
                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-sm ${isActive ? barColor : 'bg-muted'}`}
                        style={{ height: `${(i + 1) * 2}px`, opacity: isActive ? 1 : 0.3 }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            
            <Button
              size="sm"
              onMouseDown={() => { if (!isLocked) startBroadcast(); }}
              onMouseUp={() => { if (!isLocked) stopBroadcast(); }}
              onMouseLeave={() => { if (!isLocked) stopBroadcast(); }}
              onTouchStart={() => { if (!isLocked) startBroadcast(); }}
              onTouchEnd={() => { if (!isLocked) stopBroadcast(); }}
              onDoubleClick={() => {
                if (isLocked) { setIsLocked(false); stopBroadcast(); }
                else { setIsLocked(true); startBroadcast(); }
              }}
              className={`gap-1.5 select-none h-8 text-xs ${
                isLocked
                  ? 'bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300'
                  : isBroadcasting 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              }`}
            >
              {isBroadcasting ? <Video className="w-3.5 h-3.5 animate-pulse" /> : <VideoOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isLocked ? '🔒 Locked' : isBroadcasting ? 'Live' : 'Stream'}</span>
            </Button>
            
            <TestViewersToggle
              isOwner={isOwner}
              enabled={testUsersEnabled}
              onToggle={setTestUsersEnabled}
              testViewers={testViewers}
              testBroadcasters={testBroadcasters}
            />
            
            {/* AI Enhancement Toggle */}
            {isBroadcasting && (
              <AIEnhanceToggle
                isEnabled={aiEnhanceEnabled}
                strength={aiEnhanceStrength}
                beautyMode={beautyMode}
                softFocus={softFocus}
                warmth={warmth}
                onToggle={() => setAiEnhanceEnabled(!aiEnhanceEnabled)}
                onStrengthChange={setAiEnhanceStrength}
                onBeautyModeToggle={() => setBeautyMode(!beautyMode)}
                onSoftFocusChange={setSoftFocus}
                onWarmthChange={setWarmth}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Fills remaining viewport */}
      <main className="flex-1 container mx-auto px-3 py-2 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
          {/* Broadcasters Section - Video Grid */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="bg-card rounded-lg border border-border p-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <Video className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-semibold">Live Streams</h2>
                {(broadcasters.length > 0 || isBroadcasting) && (
                  <Badge className="bg-green-500 text-white animate-pulse text-[10px] px-1.5 py-0">
                    {broadcasters.filter(b => b.odious !== user.id).length + (isBroadcasting ? 1 : 0)} LIVE
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">Max 6 • Equal sizing</span>
              </div>
              
              {/* Video grid area - using new VideoGrid component */}
              <div className="flex-1 min-h-0">
                <VideoGrid
                  broadcasters={broadcasters}
                  localBroadcaster={isBroadcasting && localStream ? {
                    odious: user.id,
                    username: profile?.username || 'You',
                    avatarUrl: profile?.avatar_url,
                    stream: localStream,
                  } : null}
                  currentUserId={user.id}
                  getRoleBadge={getRoleBadge}
                  getRemoteStream={getRemoteStream}
                  aiEnhanced={aiEnhanceEnabled}
                  enhanceStrength={aiEnhanceStrength}
                  beautyMode={beautyMode}
                  softFocus={softFocus}
                  warmth={warmth}
                  maxSlots={6}
                />
              </div>
            </div>

            {/* Chat Bar - Compact */}
            {profile && (
              <div className="mt-2 shrink-0">
                <VideoChatBar 
                  roomId="video-chat-main"
                  odious={user.id}
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  currentUserRole={currentUserRole}
                  onPmClick={openChat}
                />
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="bg-card rounded-lg border border-border p-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Members</h2>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{viewers.length + broadcasters.length + (isBroadcasting ? 1 : 0)}</Badge>
              </div>
              
              {/* Scrollable member list */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
                {/* Active Broadcasters */}
                {(broadcasters.length > 0 || isBroadcasting) && (
                  <>
                    <p className="text-[10px] text-green-500 font-medium flex items-center gap-1 sticky top-0 bg-card py-0.5">
                      <Video className="w-2.5 h-2.5" /> Live
                    </p>
                    {isBroadcasting && (
                      <VideoUserMenu
                        odious={user.id}
                        username={profile?.username || 'You'}
                        avatarUrl={profile?.avatar_url}
                        role={combinedRoles[user.id]}
                        currentUserId={user.id}
                        currentUserRole={currentUserRole}
                        onSelfProfileUpdated={refreshProfile}
                      >
                        <button className="w-full flex items-center gap-2 p-1.5 rounded bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-left group">
                          <Avatar className="w-6 h-6 ring-1 ring-green-500">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-green-500/20">
                              {(profile?.username || 'Y').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium truncate flex-1">{profile?.username || 'You'}</span>
                          {getRoleBadge(user.id)}
                          <Video className="w-3 h-3 text-green-500" />
                        </button>
                      </VideoUserMenu>
                    )}
                    {broadcasters.filter(b => b.odious !== user.id).map((broadcaster) => (
                      <VideoUserMenu
                        key={broadcaster.odious}
                        odious={broadcaster.odious}
                        username={broadcaster.username}
                        avatarUrl={broadcaster.avatarUrl}
                        role={combinedRoles[broadcaster.odious]}
                        currentUserId={user.id}
                        currentUserRole={currentUserRole}
                        onPmClick={() => openChat(broadcaster.odious, broadcaster.username)}
                      >
                        <button className="w-full flex items-center gap-2 p-1.5 rounded bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-left group">
                          <Avatar className="w-6 h-6 ring-1 ring-green-500">
                            <AvatarImage src={broadcaster.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px] bg-green-500/20">
                              {broadcaster.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium truncate flex-1">{broadcaster.username}</span>
                          {getRoleBadge(broadcaster.odious)}
                          <Video className="w-3 h-3 text-green-500" />
                        </button>
                      </VideoUserMenu>
                    ))}
                  </>
                )}
                
                {/* Viewers */}
                {viewers.length > 0 && (broadcasters.length > 0 || isBroadcasting) && (
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 sticky top-0 bg-card py-0.5 mt-1">
                    <Users className="w-2.5 h-2.5" /> Viewing
                  </p>
                )}
                
                {viewers.map((viewer) => (
                  <VideoUserMenu
                    key={viewer.odious}
                    odious={viewer.odious}
                    username={viewer.username}
                    avatarUrl={viewer.avatarUrl}
                    role={combinedRoles[viewer.odious]}
                    currentUserId={user.id}
                    currentUserRole={currentUserRole}
                    onPmClick={viewer.odious !== user.id ? () => openChat(viewer.odious, viewer.username) : undefined}
                    onSelfProfileUpdated={viewer.odious === user.id ? refreshProfile : undefined}
                  >
                    <button className="w-full flex items-center gap-2 p-1.5 rounded bg-muted/50 hover:bg-muted text-left group">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={viewer.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/20">
                          {viewer.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate flex-1">{viewer.username}</span>
                      {getRoleBadge(viewer.odious)}
                      {viewer.odious === user.id && (
                        <Badge variant="secondary" className="text-[8px] px-1 py-0">You</Badge>
                      )}
                    </button>
                  </VideoUserMenu>
                ))}
                
                {viewers.length === 0 && !isBroadcasting && broadcasters.length === 0 && (
                  <p className="text-center text-muted-foreground text-xs py-3">No members</p>
                )}
              </div>
            </div>
          </div>
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
