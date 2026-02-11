/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LogOut, Users, MessageSquare, Shield, Music, Gamepad2, Vote, Tv, 
  Dumbbell, Cpu, Heart, Coffee, HelpCircle, Hash, Settings, FileText,
  Ban, Key, MapPin, UserCog, ChevronDown, Mail, VolumeX, Menu, 
  Download, Terminal, LifeBuoy, MessageCircle, Server, Bot, RefreshCw, Unlock, BookOpen,
  Radio, Camera, Rocket, Info, Sparkles
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LobbyMirrorRoom from "@/components/home/LobbyMirrorRoom";
import PayPalDonateModal from "@/components/home/PayPalDonateModal";
import { getRoomBotCount } from "@/lib/chatBots";
import { supabaseUntyped } from "@/hooks/useAuth";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
// Room background images
import generalBg from "@/assets/rooms/general-bg.jpg";
import adultsBg from "@/assets/rooms/adults-bg.jpg";
import musicBg from "@/assets/rooms/music-bg.jpg";
import helpBg from "@/assets/rooms/help-bg.jpg";
import gamesBg from "@/assets/rooms/games-bg.jpg";
import politicsBg from "@/assets/rooms/politics-bg.jpg";
import moviesBg from "@/assets/rooms/movies-bg.jpg";
import sportsBg from "@/assets/rooms/sports-bg.jpg";
import technologyBg from "@/assets/rooms/technology-bg.jpg";
import datingBg from "@/assets/rooms/dating-bg.jpg";
import loungeBg from "@/assets/rooms/lounge-bg.jpg";
import triviaBg from "@/assets/rooms/trivia-bg.jpg";

// Banner and footer graphics
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";
import retroHeaderImg from "@/assets/themes/retro-header-login-cutout.png";
import { OGWelcomeBanner } from "@/components/theme/OGWelcomeBanner";
import { RetroWelcomeBanner } from "@/components/theme/RetroWelcomeBanner";
import { ValentinesWelcomeBanner } from "@/components/theme/ValentinesWelcomeBanner";
import { StPatricksWelcomeBanner } from "@/components/theme/StPatricksWelcomeBanner";
import { MatrixWelcomeBanner } from "@/components/theme/MatrixWelcomeBanner";
import { ValentinesFloatingHearts } from "@/components/theme/ValentinesFloatingHearts";
import { StPatricksFloatingIcons } from "@/components/theme/StPatricksFloatingIcons";
import { MatrixFloatingCode } from "@/components/theme/MatrixFloatingCode";

import { ThemedMascot } from "@/components/theme/ThemedMascot";
import { useTheme } from "@/contexts/ThemeContext";
import FriendsTray from "@/components/friends/FriendsTray";
import { usePngCutout } from "@/hooks/usePngCutout";
import FriendsList from "@/components/friends/FriendsList";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Channel {
  id: string;
  name: string;
  description: string | null;
}

interface RoomUserCounts {
  [channelId: string]: number;
}

const roomIcons: Record<string, React.ReactNode> = {
  "general": <Hash className="w-4 h-4" />,
  "adults-21-plus": <Shield className="w-4 h-4" />,
  "music": <Music className="w-4 h-4" />,
  "help": <HelpCircle className="w-4 h-4" />,
  "games": <Gamepad2 className="w-4 h-4" />,
  "politics": <Vote className="w-4 h-4" />,
  "movies-tv": <Tv className="w-4 h-4" />,
  "sports": <Dumbbell className="w-4 h-4" />,
  "technology": <Cpu className="w-4 h-4" />,
  "dating": <Heart className="w-4 h-4" />,
  "lounge": <Coffee className="w-4 h-4" />,
  "trivia": <MessageSquare className="w-4 h-4" />,
};

const roomColors: Record<string, string> = {
  "general": "from-blue-500 to-cyan-500",
  "adults-21-plus": "from-red-600 to-pink-600",
  "music": "from-purple-500 to-pink-500",
  "help": "from-green-500 to-emerald-500",
  "games": "from-orange-500 to-yellow-500",
  "politics": "from-slate-500 to-zinc-600",
  "movies-tv": "from-indigo-500 to-violet-500",
  "sports": "from-lime-500 to-green-500",
  "technology": "from-cyan-500 to-blue-500",
  "dating": "from-pink-500 to-rose-500",
  "lounge": "from-amber-500 to-orange-500",
  "trivia": "from-teal-500 to-cyan-500",
};

const roomBackgrounds: Record<string, string> = {
  "general": generalBg,
  "adults-21-plus": adultsBg,
  "music": musicBg,
  "help": helpBg,
  "games": gamesBg,
  "politics": politicsBg,
  "movies-tv": moviesBg,
  "sports": sportsBg,
  "technology": technologyBg,
  "dating": datingBg,
  "lounge": loungeBg,
  "trivia": triviaBg,
};

const formatRoomName = (name: string) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('21 Plus', '21+');
};

const Home = () => {
  const { user, loading: authLoading, signOut, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobileRaw = useIsMobile();
  // useIsMobile returns undefined initially - treat as loading
  const isMobileLoading = isMobileRaw === undefined;
  const isMobile = isMobileRaw ?? false;
  
  // Combine auth loading with mobile detection loading to prevent layout flash
  const isPageLoading = authLoading || isMobileLoading;
  
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';
  const isValentines = theme === 'valentines';
  const isStPatricks = theme === 'stpatricks';
  const isMatrix = theme === 'matrix';
  const retroBannerCutout = usePngCutout(retroHeaderImg);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [roomUserCounts, setRoomUserCounts] = useState<RoomUserCounts>({});
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [botsGloballyEnabled, setBotsGloballyEnabled] = useState(false);
  const [botsAllowedChannels, setBotsAllowedChannels] = useState<string[]>([]);
  const [moderatorBotsEnabled, setModeratorBotsEnabled] = useState(false);
  const [friendsCounts, setFriendsCounts] = useState({ total: 0, online: 0, pending: 0 });

  // OAuth callback processing guard (VPS):
  // IMPORTANT: must be reactive (not module-level), otherwise it can get stuck "true"
  // after we clear the hash, causing a blank screen when user is null.
  const [oauthProcessing, setOauthProcessing] = useState(() =>
    typeof window !== "undefined" && window.location.hash.includes("access_token")
  );

  // Safety fallback: if session isn't established shortly after returning from Google,
  // stop waiting and let normal redirect logic run.
  useEffect(() => {
    if (!oauthProcessing) return;
    const t = window.setTimeout(() => setOauthProcessing(false), 4000);
    return () => window.clearTimeout(t);
  }, [oauthProcessing]);

  // Scroll to top on page load - use requestAnimationFrame to ensure it runs after render
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  // Don't redirect while processing OAuth callback - wait for session to be established
  useEffect(() => {
    if (oauthProcessing) return;
    
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate, oauthProcessing]);

  // Fetch bot settings for room counts
  useEffect(() => {
    const fetchBotSettings = async () => {
      const { data } = await supabaseUntyped
        .from('bot_settings')
        .select('enabled, allowed_channels, moderator_bots_enabled')
        .limit(1)
        .single();
      if (data) {
        setBotsGloballyEnabled(data.enabled ?? false);
        setBotsAllowedChannels(data.allowed_channels ?? []);
        setModeratorBotsEnabled(data.moderator_bots_enabled ?? false);
      }
    };
    fetchBotSettings();

    // Subscribe to changes
    const channel = supabase
      .channel('home-bot-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bot_settings' }, (payload) => {
        const newData = payload.new as { enabled?: boolean; allowed_channels?: string[]; moderator_bots_enabled?: boolean };
        setBotsGloballyEnabled(newData.enabled ?? false);
        setBotsAllowedChannels(newData.allowed_channels ?? []);
        setModeratorBotsEnabled(newData.moderator_bots_enabled ?? false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("id, name, description")
        .eq("is_private", false)
        .order("name");

      if (error) {
        toast.error("Failed to load rooms");
      } else {
        setChannels(data || []);
      }
      setLoadingChannels(false);
    };

    if (user) {
      fetchChannels();
    }
  }, [user]);

  // Fetch member counts from channel_members table + subscribe to presence for live online users
  useEffect(() => {
    if (!channels.length) return;

    // Fetch actual member counts from channel_members table
    const fetchMemberCounts = async () => {
      const counts: RoomUserCounts = {};
      
      // Batch fetch: get all channel_members grouped by channel
      for (const channel of channels) {
        const { count } = await supabase
          .from('channel_members')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', channel.id);
        counts[channel.id] = count || 0;
      }
      setRoomUserCounts(counts);
    };

    fetchMemberCounts();

    // Subscribe to channel_members changes — apply deltas directly from payload
    // to avoid flicker from delete-then-insert upsert pattern
    const knownMembers: Record<string, Set<string>> = {};
    // Seed known members from initial fetch
    channels.forEach(ch => { knownMembers[ch.id] = new Set(); });

    const seedKnownMembers = async () => {
      for (const channel of channels) {
        const { data } = await supabase
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channel.id);
        if (data) {
          knownMembers[channel.id] = new Set(data.map(d => d.user_id));
        }
      }
    };
    seedKnownMembers();

    // Buffer DELETE events to absorb delete-then-insert upsert pattern
    const pendingDeletes: Record<string, ReturnType<typeof setTimeout>> = {};

    const flushCount = (channelId: string) => {
      setRoomUserCounts(prev => ({ ...prev, [channelId]: knownMembers[channelId]?.size || 0 }));
    };

    const memberChannel = supabase
      .channel('lobby-member-counts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channel_members' },
        (payload) => {
          const row = payload.new as any;
          if (row?.channel_id && row?.user_id) {
            if (!knownMembers[row.channel_id]) knownMembers[row.channel_id] = new Set();
            knownMembers[row.channel_id].add(row.user_id);
            // Cancel any pending delete flush for this channel — the insert absorbed it
            if (pendingDeletes[row.channel_id]) {
              clearTimeout(pendingDeletes[row.channel_id]);
              delete pendingDeletes[row.channel_id];
            }
            flushCount(row.channel_id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'channel_members' },
        (payload) => {
          const row = payload.old as any;
          if (row?.channel_id && row?.user_id) {
            knownMembers[row.channel_id]?.delete(row.user_id);
            // Delay the state update — if an INSERT follows within 1s, it cancels this
            if (pendingDeletes[row.channel_id]) clearTimeout(pendingDeletes[row.channel_id]);
            pendingDeletes[row.channel_id] = setTimeout(() => {
              flushCount(row.channel_id);
              delete pendingDeletes[row.channel_id];
            }, 1000);
          }
        }
      )
      .subscribe();

    // Polling fallback: re-fetch actual counts every 15s to catch missed Realtime events
    // (e.g., user closes browser and keepalive DELETE isn't captured by Realtime)
    const pollInterval = setInterval(async () => {
      for (const channel of channels) {
        const { data } = await supabase
          .from('channel_members')
          .select('user_id')
          .eq('channel_id', channel.id);
        if (data) {
          knownMembers[channel.id] = new Set(data.map(d => d.user_id));
          flushCount(channel.id);
        }
      }
    }, 15000);

    return () => {
      Object.values(pendingDeletes).forEach(t => clearTimeout(t));
      clearInterval(pollInterval);
      supabase.removeChannel(memberChannel);
    };
  }, [channels]);

  const handleJoinRoom = (channel: Channel) => {
    navigate(`/chat/${channel.name}`);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };


  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    // Prevent blank screen on OAuth callback failure
    if (oauthProcessing) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
            <div className="text-center">
              <p className="text-foreground font-medium">Finishing sign-in…</p>
              <p className="text-sm text-muted-foreground">If this takes more than a moment, you’ll be sent back to login.</p>
            </div>
          </div>
        </div>
      );
    }

    // Redirect will happen via the effect above; keep a painted background so we
    // don't show the browser's white default (or a black flash) between routes.
    return <div className="min-h-screen bg-background" aria-hidden="true" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      
      {/* Floating theme decorations */}
      <ValentinesFloatingHearts />
      <StPatricksFloatingIcons />
      <MatrixFloatingCode />
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 ${
        isRetro 
          ? 'bg-[hsl(50_100%_70%)] border-black border-b-[3px]' 
          : 'border-border bg-card'
      }`}>
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center ${
              isRetro 
                ? 'bg-[hsl(330_90%_55%)] border-[3px] border-black shadow-[3px_3px_0px_black]' 
                : 'rounded-xl jac-gradient-bg'
            }`}>
              {isValentines ? (
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" fill="currentColor" />
              ) : (
                <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${isRetro ? 'text-white' : 'text-primary-foreground'}`} />
              )}
            </div>
            <h1 className={`text-lg sm:text-2xl font-bold brand ${
              isRetro 
                ? 'text-[hsl(330_90%_50%)] font-["Press_Start_2P"] text-xs sm:text-sm' 
                : 'text-primary'
            }`}>
              {isRetro ? 'JAC' : 'Justachat'}<sup className={`${isRetro ? 'text-[6px] text-[hsl(185_90%_40%)]' : 'text-[8px] sm:text-xs'}`}>™</sup>
            </h1>

            {/* Site Navigation Dropdown - moved next to logo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 border-primary/50 hover:border-primary hover:bg-primary/10">
                  <Menu className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 max-h-[80vh] overflow-y-auto bg-popover border border-border shadow-lg z-50">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Site Navigation
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* About Section */}
                <DropdownMenuItem asChild>
                  <Link to="/about" className="flex items-center gap-2 cursor-pointer">
                    <Info className="w-4 h-4 text-blue-500" />
                    <div>
                      <span>About Us</span>
                      <p className="text-xs text-muted-foreground">Learn about Justachat</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/features" className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <span>Features</span>
                      <p className="text-xs text-muted-foreground">Explore what we offer</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/faq" className="flex items-center gap-2 cursor-pointer">
                    <HelpCircle className="w-4 h-4 text-cyan-500" />
                    <div>
                      <span>FAQ</span>
                      <p className="text-xs text-muted-foreground">Common questions answered</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/ethos" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <div>
                      <span>Why This Exists</span>
                      <p className="text-xs text-muted-foreground">A place for real conversation</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                {/* Help Section */}
                <DropdownMenuItem asChild>
                  <Link to="/help" className="flex items-center gap-2 cursor-pointer">
                    <LifeBuoy className="w-4 h-4 text-green-500" />
                    <div>
                      <span>Help & Support</span>
                      <p className="text-xs text-muted-foreground">Get help & contact support</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Desktop Clients</DropdownMenuLabel>
                
                {/* JAC Chat Client Download */}
                <DropdownMenuItem asChild>
                  <Link to="/downloads" className="flex items-center gap-2 cursor-pointer">
                    <Terminal className="w-4 h-4 text-primary" />
                    <div>
                      <span>JAC Chat Client</span>
                      <p className="text-xs text-muted-foreground">Desktop app for Windows, Mac, Linux</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                {/* mIRC Connection Guide */}
                <DropdownMenuItem asChild>
                  <Link to="/mirc" className="flex items-center gap-2 cursor-pointer">
                    <Download className="w-4 h-4 text-purple-500" />
                    <div>
                      <span>Connect with mIRC</span>
                      <p className="text-xs text-muted-foreground">Step-by-step guide</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Contact</DropdownMenuLabel>
                
                {/* Contact Section */}
                <DropdownMenuItem asChild>
                  <a 
                    href="mailto:support@justachat.net" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    <div>
                      <span>Email Support</span>
                      <p className="text-xs text-muted-foreground">support@justachat.net</p>
                    </div>
                  </a>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link to="/chat/help" className="flex items-center gap-2 cursor-pointer">
                    <MessageCircle className="w-4 h-4 text-teal-500" />
                    <div>
                      <span>Live Chat Support</span>
                      <p className="text-xs text-muted-foreground">Ask in #help channel</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/site-index" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span>Site Index</span>
                      <p className="text-xs text-muted-foreground">All pages in one place</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Support Us</DropdownMenuLabel>
                
                <DropdownMenuItem 
                  onClick={() => setShowDonateModal(true)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-pink-500" />
                  <div>
                    <span>Donate</span>
                    <p className="text-xs text-muted-foreground">Help keep Justachat running</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Retro 80s Banner - centered between menu and theme selector */}
          {isRetro && (
            <div className="flex-1 flex justify-center">
              <img 
                src={retroBannerCutout ?? retroHeaderImg} 
                alt="Justachat 80s" 
                className="h-8 sm:h-12 object-contain"
                style={{ filter: 'drop-shadow(2px 2px 0px hsl(0 0% 0%))' }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Selector */}
            <ThemeSelector />
            
            {/* Admin Dropdown - Owner/Admin Only */}
            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 border-primary/50 text-primary hover:bg-primary/10 text-xs sm:text-sm px-2 sm:px-3">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Admin Panel</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto bg-popover border border-border shadow-xl z-50">
                  <DropdownMenuLabel className="flex items-center gap-2 sticky top-0 bg-popover z-10">
                    <Shield className="w-4 h-4 text-primary" />
                    {isOwner ? 'Owner Controls' : 'Admin Controls'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Moderation Section */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Moderation</DropdownMenuLabel>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/admin/bans" className="flex items-center gap-2 cursor-pointer">
                      <Ban className="w-4 h-4 text-destructive" />
                      <div>
                        <span>Ban List</span>
                        <p className="text-xs text-muted-foreground">Manage banned users</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/admin/mutes" className="flex items-center gap-2 cursor-pointer">
                      <VolumeX className="w-4 h-4 text-amber-500" />
                      <div>
                        <span>Mute List</span>
                        <p className="text-xs text-muted-foreground">Manage muted users</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/admin/klines" className="flex items-center gap-2 cursor-pointer">
                      <Server className="w-4 h-4 text-orange-500" />
                      <div>
                        <span>K-Lines</span>
                        <p className="text-xs text-muted-foreground">Global IP bans</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/admin/messages" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <div>
                        <span>Messages</span>
                        <p className="text-xs text-muted-foreground">View & moderate</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">User Management</DropdownMenuLabel>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/admin/users" className="flex items-center gap-2 cursor-pointer">
                      <UserCog className="w-4 h-4 text-primary" />
                      <div>
                        <span>User Management</span>
                        <p className="text-xs text-muted-foreground">Roles & permissions</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/map" className="flex items-center gap-2 cursor-pointer">
                      <MapPin className="w-4 h-4 text-primary" />
                      <div>
                        <span>User Locations</span>
                        <p className="text-xs text-muted-foreground">View user map</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/admin/bots" className="flex items-center gap-2 cursor-pointer">
                      <Bot className="w-4 h-4 text-cyan-500" />
                      <div>
                        <span>Chat Bots</span>
                        <p className="text-xs text-muted-foreground">Manage AI personalities</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Owner Only</DropdownMenuLabel>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <span>Audit Logs</span>
                            <p className="text-xs text-muted-foreground">View access history</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/admin/emails" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="w-4 h-4 text-green-500" />
                          <div>
                            <span>User Emails</span>
                            <p className="text-xs text-muted-foreground">View email addresses</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/admin/api" className="flex items-center gap-2 cursor-pointer">
                          <Key className="w-4 h-4 text-amber-500" />
                          <div>
                            <span>API & Secrets</span>
                            <p className="text-xs text-muted-foreground">View API info</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link to="/admin/deploy" className="flex items-center gap-2 cursor-pointer">
                          <Rocket className="w-4 h-4 text-primary" />
                          <div>
                            <span>Deploy (VPS)</span>
                            <p className="text-xs text-muted-foreground">Backups & GitHub sync</p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Welcome back!</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2 sm:px-3">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>


      {/* MOBILE SIMPLIFIED VIEW */}
      {isMobile ? (
        <main className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
          {/* Live Chat Mirror - Takes most of the screen */}
          <div className="flex-1 min-h-0 mx-2 mt-2 rounded-lg overflow-hidden border border-border">
            <LobbyMirrorRoom />
          </div>
          
          {/* Bottom Bar: Horizontal Rooms + Quick Actions */}
          <div className="shrink-0 px-2 py-2 border-t border-border bg-card/50">
            {/* Room Cards - Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
              {loadingChannels ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-20 h-14 bg-muted animate-pulse rounded-lg" />
                ))
              ) : (
                channels.map((channel) => {
                  const botsEnabledForChannel = botsGloballyEnabled && botsAllowedChannels.includes(channel.name);
                  const userCount = (roomUserCounts[channel.id] || 0) + (botsEnabledForChannel ? getRoomBotCount(channel.name) : 0);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleJoinRoom(channel)}
                      className={`shrink-0 w-20 h-14 relative overflow-hidden transition-all active:scale-95 ${
                        isRetro 
                          ? 'retro-room-card' 
                          : isValentines
                            ? 'bg-card rounded-lg border border-pink-400/50'
                            : 'bg-card rounded-lg border border-border'
                      }`}
                    >
                      {/* Background gradient */}
                      {!isRetro && (
                        <>
                          <div className={`absolute inset-0 bg-gradient-to-br ${roomColors[channel.name] || 'from-primary to-accent'} opacity-40`} />
                          <div className="absolute inset-0 bg-black/40" />
                        </>
                      )}
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center px-1">
                        <span className="text-white/90 mb-0.5">
                          {roomIcons[channel.name] || <Hash className="w-4 h-4" />}
                        </span>
                        <h3 className="text-[9px] font-semibold text-white text-center leading-tight truncate w-full">
                          {formatRoomName(channel.name).replace(' 21+', '').replace('Movies Tv', 'Movies')}
                        </h3>
                        <span className="text-[8px] text-white/70">{userCount}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              {/* Friends */}
              {user && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 h-9 gap-1.5 relative text-xs">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Friends
                      {friendsCounts.pending > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 text-[9px] flex items-center justify-center font-bold rounded-full bg-destructive text-destructive-foreground">
                          {friendsCounts.pending}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] p-0">
                    <SheetHeader className="px-4 py-3 border-b">
                      <SheetTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Friends
                      </SheetTitle>
                    </SheetHeader>
                    <div className="h-[calc(100vh-80px)] overflow-hidden">
                      <FriendsList
                        currentUserId={user.id}
                        onOpenPm={(userId, username) => navigate(`/chat/general`)}
                        onCountsChange={setFriendsCounts}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Voice */}
              <Link to="/voice-chat" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 text-xs border-violet-500/40">
                  <Radio className="h-3.5 w-3.5 text-violet-500" />
                  Voice
                </Button>
              </Link>
              
              {/* Cams */}
              <Link to="/video-chat" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 text-xs border-green-500/40">
                  <Camera className="h-3.5 w-3.5 text-green-500" />
                  Cams
                </Button>
              </Link>
              
              {/* Games */}
              <Link to="/games" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 text-xs border-orange-500/40">
                  <Gamepad2 className="h-3.5 w-3.5 text-orange-500" />
                  Games
                </Button>
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* DESKTOP FULL VIEW */
        <>
          {/* Main Content */}
          <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {/* Chat Rooms + Lobby Mirror Side by Side - Same Height */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 sm:gap-4" style={{ height: '480px' }}>
              {/* Room Cards */}
              <div className="lg:w-64 xl:w-72 flex-shrink-0 h-full">
                <div className={`p-2 sm:p-3 h-full overflow-hidden flex flex-col ${
                  isRetro 
                    ? 'retro-lobby-sidebar' 
                    : 'rounded-lg sm:rounded-xl border border-border bg-card/50 backdrop-blur-sm'
                }`}>
                  <div className="mb-2 flex-shrink-0">
                    <h2 className={`font-bold mb-0.5 flex items-center gap-1.5 ${isRetro ? 'retro-lobby-heading' : 'text-sm sm:text-base'}`}>
                      {isRetro ? (
                        '📁 CHAT ROOMS'
                      ) : isValentines ? (
                        <>
                          <Heart 
                            className="w-4 h-4 text-pink-400" 
                            fill="currentColor"
                            style={{ 
                              filter: 'drop-shadow(0 0 4px #ff69b4)',
                              animation: 'valentinesHeartBounce 2s ease-in-out infinite'
                            }}
                          />
                          <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 bg-clip-text text-transparent">
                            Chat Rooms
                          </span>
                          <Heart 
                            className="w-3 h-3 text-rose-400" 
                            fill="currentColor"
                            style={{ 
                              filter: 'drop-shadow(0 0 3px #e91e63)',
                              animation: 'valentinesHeartBounce 2.5s ease-in-out infinite',
                              animationDelay: '0.3s'
                            }}
                          />
                        </>
                      ) : (
                        'Chat Rooms'
                      )}
                    </h2>
                    <p className={`${isRetro ? 'retro-lobby-subtext' : 'text-[10px] sm:text-xs'} ${isValentines ? 'text-pink-300/80' : isRetro ? '' : 'text-muted-foreground'}`}>
                      {isValentines ? '💕 Find your chat match' : 'Select a room to join'}
                    </p>
                  </div>

                  {loadingChannels ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-1.5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`h-12 sm:h-14 bg-card animate-pulse ${isRetro ? 'border-2 border-foreground' : 'rounded-md'}`} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-1.5 lg:max-h-[280px] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
                        {channels.map((channel) => {
                          const botsEnabledForChannel = botsGloballyEnabled && botsAllowedChannels.includes(channel.name);
                          const userCount = (roomUserCounts[channel.id] || 0) + (botsEnabledForChannel ? getRoomBotCount(channel.name) : 0);
                          return (
                            <button
                              key={channel.id}
                              onClick={() => handleJoinRoom(channel)}
                              className={`group relative h-8 sm:h-9 overflow-hidden transition-all duration-200 active:scale-95 ${
                                isRetro 
                                  ? 'retro-room-card' 
                                  : isValentines
                                    ? 'bg-card rounded-lg border-2 border-pink-400/50 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5'
                                    : 'bg-card rounded-md border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1'
                              }`}
                            >
                              {/* Background - theme aware */}
                              {isRetro ? null : isValentines ? (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 opacity-40 group-hover:opacity-60 transition-opacity" />
                                  <div className="absolute inset-0 bg-black/30" />
                                  {/* Floating heart accent */}
                                  <div className="absolute -right-1 -top-1 text-pink-300/60 group-hover:text-pink-200 transition-colors transform group-hover:scale-110 group-hover:rotate-12">
                                    <Heart className="w-3 h-3" fill="currentColor" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className={`absolute inset-0 bg-gradient-to-r ${roomColors[channel.name] || 'from-primary to-accent'} opacity-40 group-hover:opacity-60 transition-opacity`} />
                                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                                  {/* Shimmer effect on hover */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                </>
                              )}
                              
                              {/* Content - room name with count */}
                              <div className="relative h-full flex items-center justify-between px-2">
                                <h3 className={`truncate ${
                                  isRetro 
                                    ? '' 
                                    : isValentines
                                      ? 'font-semibold text-xs sm:text-sm text-white drop-shadow-[0_1px_2px_rgba(236,72,153,0.8)]'
                                      : 'font-semibold text-xs sm:text-sm text-white drop-shadow-lg'
                                }`}>
                                  {isRetro ? '>' : isValentines ? '♡' : '#'}{formatRoomName(channel.name)}
                                </h3>
                                <span className={`shrink-0 ml-1 ${
                                  isRetro 
                                    ? 'room-count' 
                                    : isValentines 
                                      ? 'text-xs font-medium text-pink-200'
                                      : 'text-xs font-medium text-white/90'
                                }`}>
                                  {isRetro ? `[${userCount}]` : `(${userCount})`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Voice Chat Section */}
                      <div className="mt-2">
                        <Link
                          to="/voice-chat"
                          className={`group relative flex h-9 sm:h-10 w-full overflow-hidden transition-all duration-200 active:scale-[0.98] ${
                            isRetro 
                              ? 'retro-feature-link' 
                              : 'bg-card rounded-md border border-violet-500/60 hover:border-violet-500 hover:shadow-md hover:shadow-violet-500/20'
                          }`}
                        >
                          {!isRetro && <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-40 group-hover:opacity-60 transition-opacity" />}
                          {!isRetro && <div className="absolute inset-0 bg-black/30" />}
                          <div className="relative h-full flex items-center gap-2 px-2">
                            <div className={`p-1 text-white ${isRetro ? 'retro-feature-icon' : 'rounded bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm group-hover:scale-105 transition-transform'}`}>
                              <Radio className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col">
                              <h3 className={`font-bold whitespace-nowrap flex items-center gap-0.5 ${isRetro ? '' : 'text-[9px] sm:text-[10px] text-white drop-shadow-md'}`}>
                                🎙️ Voice
                              </h3>
                              <span className={`${isRetro ? '' : 'text-[7px] text-white/80'}`}>Live broadcast</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Video Chat Section */}
                      <div className="mt-1.5">
                        <Link
                          to="/video-chat"
                          className={`group relative flex h-9 sm:h-10 w-full overflow-hidden transition-all duration-200 active:scale-[0.98] ${
                            isRetro 
                              ? 'retro-feature-link' 
                              : 'bg-card rounded-md border border-green-500/60 hover:border-green-500 hover:shadow-md hover:shadow-green-500/20'
                          }`}
                        >
                          {!isRetro && <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-40 group-hover:opacity-60 transition-opacity" />}
                          {!isRetro && <div className="absolute inset-0 bg-black/30" />}
                          <div className="relative h-full flex items-center gap-2 px-2">
                            <div className={`p-1 text-white ${isRetro ? 'retro-feature-icon' : 'rounded bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:scale-105 transition-transform'}`}>
                              <Camera className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col">
                              <h3 className={`font-bold whitespace-nowrap flex items-center gap-0.5 ${isRetro ? '' : 'text-[9px] sm:text-[10px] text-white drop-shadow-md'}`}>
                                📹 Cams
                              </h3>
                              <span className={`${isRetro ? '' : 'text-[7px] text-white/80'}`}>Webcam live</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Games Section */}
                      <div className="mt-1.5">
                        <Link
                          to="/games"
                          className={`group relative flex h-8 sm:h-9 w-full overflow-hidden transition-all duration-200 active:scale-[0.98] ${
                            isRetro 
                              ? 'retro-feature-link' 
                              : 'bg-card rounded-md border border-orange-500/60 hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/20'
                          }`}
                        >
                          {!isRetro && <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-600 opacity-40 group-hover:opacity-60 transition-opacity" />}
                          {!isRetro && <div className="absolute inset-0 bg-black/30" />}
                          <div className="relative h-full flex items-center gap-2 px-2">
                            <div className={`p-1 text-white ${isRetro ? 'retro-feature-icon' : 'rounded bg-gradient-to-br from-orange-500 to-yellow-600 shadow-sm group-hover:scale-105 transition-transform'}`}>
                              <Gamepad2 className="w-2.5 h-2.5" />
                            </div>
                            <h3 className={`font-bold whitespace-nowrap ${isRetro ? '' : 'text-[8px] sm:text-[9px] text-white drop-shadow-md'}`}>
                              🎮 Games
                            </h3>
                          </div>
                        </Link>
                      </div>
                      
                      {/* Dating Section */}
                      <div className="mt-1.5">
                        <Link
                          to="/dating"
                          className={`group relative flex h-9 sm:h-10 w-full overflow-hidden transition-all duration-200 active:scale-[0.98] ${
                            isRetro 
                              ? 'retro-feature-link' 
                              : 'bg-card rounded-md border border-pink-500/60 hover:border-pink-500 hover:shadow-md hover:shadow-pink-500/20'
                          }`}
                        >
                          {!isRetro && (
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                              style={{ backgroundImage: `url(${datingBg})` }}
                            />
                          )}
                          {!isRetro && <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-30 group-hover:opacity-40 transition-opacity" />}
                          {!isRetro && <div className="absolute inset-0 bg-black/30" />}
                          <div className="relative h-full flex items-center gap-2 px-2">
                            <div className={`p-1 text-white ${isRetro ? 'retro-feature-icon' : 'rounded bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm group-hover:scale-105 transition-transform'}`}>
                              <Heart className="w-3 h-3" />
                            </div>
                            <div className="flex flex-col">
                              <h3 className={`font-bold whitespace-nowrap flex items-center gap-0.5 ${isRetro ? '' : 'text-[9px] sm:text-[10px] text-white drop-shadow-md'}`}>
                                💕 Dating
                              </h3>
                              <span className={`${isRetro ? '' : 'text-[7px] text-white/80'}`}>Find your match</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Center - Public Chat Preview */}
              <div className="flex-1 min-w-0 h-full">
                <LobbyMirrorRoom />
              </div>
            </div>
            
            {/* Footer - Clean and organized */}
            <footer className={`mt-8 sm:mt-12 pt-6 sm:pt-8 border-t ${
              isRetro 
                ? 'bg-[hsl(50_100%_70%)] border-t-[3px] border-black -mx-4 px-4' 
                : 'border-border'
            }`}>
              <div className="flex flex-col gap-4">
                {/* Main footer row */}
                <div className="flex items-center">
                  {/* Logo and tagline - left side */}
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 flex items-center justify-center shadow-lg ${
                      isRetro 
                        ? 'bg-[hsl(330_90%_55%)] border-[3px] border-black shadow-[3px_3px_0px_black]' 
                        : 'rounded-xl jac-gradient-bg'
                    }`}>
                      <MessageSquare className={`w-4 h-4 ${isRetro ? 'text-white' : 'text-primary-foreground'}`} />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${
                        isRetro 
                          ? 'font-["Press_Start_2P"] text-[8px] text-black' 
                          : 'jac-gradient-text'
                      }`}>
                        {isRetro ? 'JUSTACHAT' : 'Justachat'}<sup className={`${isRetro ? 'text-[6px] text-[hsl(185_90%_40%)]' : 'text-[7px]'}`}>™</sup>
                      </h3>
                      <p className={`text-xs ${
                        isRetro 
                          ? 'font-["VT323"] text-sm text-black/70' 
                          : 'text-muted-foreground'
                      }`}>Chat. Connect. Chill.</p>
                    </div>
                  </div>
                  
                  {/* Spacer to push mascots/social to center */}
                  <div className="flex-1" />
                  
                  {/* Center section with mascots and social links */}
                  <div className="flex items-center">
                    {/* Left mascot - theme aware */}
                    <ThemedMascot side="left" />
                    
                    {/* Social Media Links + Copyright centered */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <a 
                          href="https://www.facebook.com/profile.php?id=61587064682802" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                            isRetro 
                              ? 'bg-[hsl(185_90%_50%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                              : 'rounded-lg bg-secondary hover:bg-primary/20'
                          }`}
                          title="Facebook"
                        >
                          <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a 
                          href="https://www.instagram.com/justachatunix/"
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                            isRetro 
                              ? 'bg-[hsl(330_90%_55%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                              : 'rounded-lg bg-secondary hover:bg-primary/20'
                          }`}
                          title="Instagram"
                        >
                          <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                        <a 
                          href="https://www.tiktok.com/@0justachat0" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                            isRetro 
                              ? 'bg-[hsl(270_50%_60%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                              : 'rounded-lg bg-secondary hover:bg-primary/20'
                          }`}
                          title="TikTok"
                        >
                          <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </a>
                        <a 
                          href="https://x.com/UnixJustachat" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all group ${
                            isRetro 
                              ? 'bg-[hsl(185_90%_50%)] border-[3px] border-black shadow-[3px_3px_0px_black] hover:bg-[hsl(50_90%_60%)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_black]' 
                              : 'rounded-lg bg-secondary hover:bg-primary/20'
                          }`}
                          title="X (Twitter)"
                        >
                          <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isRetro ? 'text-black' : 'text-muted-foreground group-hover:text-primary'}`} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      </div>
                      
                      {/* Copyright & Version - directly under social links */}
                      <div className="text-center mt-2">
                        <p className={`text-xs ${
                          isRetro 
                            ? 'font-["Press_Start_2P"] text-[8px] text-black' 
                            : 'text-muted-foreground'
                        }`}>
                          © {new Date().getFullYear()} <span className={isRetro ? 'text-[hsl(330_90%_45%)]' : ''}>Justachat™</span> All rights reserved.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <a 
                            href="https://justachat.net" 
                            className={`text-xs transition-colors ${
                              isRetro 
                                ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                                : 'text-muted-foreground hover:text-primary'
                            }`}
                          >
                            justachat.net
                          </a>
                          <span className={`text-xs ${isRetro ? 'text-black/50' : 'text-muted-foreground/50'}`}>•</span>
                          <Link 
                            to="/legal" 
                            className={`text-xs transition-colors ${
                              isRetro 
                                ? 'font-["VT323"] text-base text-[hsl(185_90%_35%)] hover:text-[hsl(330_90%_45%)]' 
                                : 'text-muted-foreground hover:text-primary'
                            }`}
                          >
                            Legal
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right mascot - theme aware */}
                    <ThemedMascot side="right" />
                  </div>
                  
                  {/* Spacer on right to balance */}
                  <div className="flex-1" />
                </div>
              </div>
            </footer>
          </main>
        </>
      )}
      
      {/* PayPal Donate Modal */}
      <PayPalDonateModal open={showDonateModal} onOpenChange={setShowDonateModal} />
      
      {/* Friends Tray - floating minimizable friends list */}
      {user && !isMobile && (
        <FriendsTray
          currentUserId={user.id}
          onOpenPm={(userId, username) => navigate(`/chat/general?pm=${userId}`)}
        />
      )}
    </div>
  );
};

export default Home;
