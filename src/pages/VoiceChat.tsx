/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceBroadcast } from '@/hooks/useVoiceBroadcast';
import { usePrivateChats } from '@/hooks/usePrivateChats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AudioVisualizerRing from '@/components/voice/AudioVisualizerRing';
import VideoUserMenu from '@/components/video/VideoUserMenu';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import PMTray from '@/components/chat/PMTray';
import { TestViewersToggle, TEST_VIEWERS, TEST_BROADCASTERS, TestViewer } from '@/components/video/TestViewersToggle';
import { 
  Mic, MicOff, ArrowLeft, Users, Volume2, Radio, 
  Crown, Shield, Star, MoreVertical
} from 'lucide-react';

const VoiceChat = () => {
  const { user, loading, role: currentUserRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [testUsersEnabled, setTestUsersEnabled] = useState(false);

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

  const broadcastOptions = useMemo(() => ({
    roomId: 'voice-chat-main',
    odious: user?.id || '',
    username: profileLoaded ? (profile?.username || '') : '',
    avatarUrl: profile?.avatar_url
  }), [user?.id, profileLoaded, profile?.username, profile?.avatar_url]);

  const {
    isBroadcasting,
    isConnected,
    participants,
    audioLevel,
    startBroadcast,
    stopBroadcast
  } = useVoiceBroadcast(broadcastOptions);

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

  // Alt+M keyboard shortcut for push-to-talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm' && !e.repeat) {
        e.preventDefault();
        startBroadcast();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && !isLocked) {
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
  
  // Moderator bot for voice chat (Echo)
  const modBot: TestViewer = {
    odious: 'mod-echo',
    username: 'Echo',
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
  
  // Merge real listeners with test viewers + mod bot
  const realListeners = participants.filter(p => !p.isBroadcasting);
  const listeners = [
    modBot, // Moderator bot always at top
    ...realListeners,
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Back button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {/* Center: Justachat Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg jac-gradient-bg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg jac-gradient-text">Justachat™</span>
          </div>
          
          {/* Right: Room info */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {participants.length}
              {isConnected && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />}
            </p>
          </div>
          
          {/* Broadcast Button + Audio Meter */}
          <div className="flex items-center gap-3">
            {/* Audio Level Meter - Only show when broadcasting */}
            {isBroadcasting && (
              <div className="hidden sm:flex items-center gap-2 bg-card/80 rounded-lg px-3 py-2 border border-border">
                <Mic className="w-4 h-4 text-destructive animate-pulse" />
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
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white'
              }`}
            >
              <Mic className={`w-4 h-4 ${isBroadcasting ? 'animate-pulse' : ''}`} />
              {isLocked ? '🔒 Locked On' : isBroadcasting ? 'Broadcasting...' : 'Hold to Talk'}
            </Button>

            {/* Test Users Toggle - Owner only */}
            <TestViewersToggle
              isOwner={isOwner}
              enabled={testUsersEnabled}
              onToggle={setTestUsersEnabled}
              testViewers={testViewers}
              testBroadcasters={testBroadcasters}
            />
          </div>
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
                    <VideoUserMenu
                      key={broadcaster.odious}
                      odious={broadcaster.odious}
                      username={broadcaster.username}
                      avatarUrl={broadcaster.avatarUrl}
                      role={combinedRoles[broadcaster.odious]}
                      currentUserId={user.id}
                      currentUserRole={currentUserRole}
                      onPmClick={broadcaster.odious !== user.id ? () => openChat(broadcaster.odious, broadcaster.username) : undefined}
                      onSelfProfileUpdated={broadcaster.odious === user.id ? refreshProfile : undefined}
                    >
                      <div 
                        className="relative bg-gradient-to-br from-destructive/20 to-orange-500/20 rounded-xl p-4 border border-destructive/30 cursor-pointer hover:border-destructive/50 transition-colors"
                      >
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge variant="destructive" className="text-[10px]">
                            <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                            LIVE
                          </Badge>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <AudioVisualizerRing 
                            audioLevel={'audioLevel' in broadcaster ? (broadcaster.audioLevel || 0) : 0} 
                            size={72}
                          >
                            <Avatar className="w-full h-full">
                              <AvatarImage src={broadcaster.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-destructive to-orange-500 text-destructive-foreground text-lg">
                                {broadcaster.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </AudioVisualizerRing>
                          <div className="text-center">
                            <p className="font-medium text-sm truncate max-w-[100px]">
                              {broadcaster.username}
                            </p>
                            {getRoleBadge(broadcaster.odious)}
                          </div>
                        </div>
                      </div>
                    </VideoUserMenu>
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
                    <VideoUserMenu
                      key={listener.odious}
                      odious={listener.odious}
                      username={listener.username}
                      avatarUrl={listener.avatarUrl}
                      role={combinedRoles[listener.odious]}
                      currentUserId={user.id}
                      currentUserRole={currentUserRole}
                      onPmClick={listener.odious !== user.id ? () => openChat(listener.odious, listener.username) : undefined}
                      onSelfProfileUpdated={listener.odious === user.id ? refreshProfile : undefined}
                    >
                      <button 
                        className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group"
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
                        <MoreVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </VideoUserMenu>
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
            <li>• <strong>Hold</strong> the <strong>Hold to Talk</strong> button to broadcast your voice</li>
            <li>• <strong>Double-click</strong> to lock broadcast on (click again to unlock)</li>
            <li>• Or press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs font-mono">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-xs font-mono">M</kbd> as a keyboard shortcut</li>
            <li>• <strong>Release</strong> to stop broadcasting</li>
            <li>• Everyone in the room will hear you while you hold</li>
          </ul>
        </div>
      </main>

      {/* Private Chat Windows */}
      {activeChats.map((chat) => (
        <PrivateChatWindow
          key={chat.id}
          targetUserId={chat.targetUserId}
          targetUsername={chat.targetUsername}
          currentUserId={user.id}
          currentUsername={profile?.username || 'Anonymous'}
          initialPosition={chat.position}
          zIndex={chat.zIndex}
          onClose={() => closeChat(chat.id)}
          onFocus={() => bringToFront(chat.id)}
          onMinimize={() => minimizeChat(chat.id)}
          onNewMessage={() => setUnread(chat.id)}
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

export default VoiceChat;
