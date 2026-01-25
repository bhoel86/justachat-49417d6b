import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LogOut, Users, MessageSquare, Shield, Music, Gamepad2, Vote, Tv, 
  Dumbbell, Cpu, Heart, Coffee, HelpCircle, Hash, Settings, FileText,
  Ban, Key, MapPin, UserCog, ChevronDown, Mail, VolumeX, Menu, 
  Download, Terminal, LifeBuoy, MessageCircle, Server, Bot, RefreshCw, Unlock, BookOpen,
  Radio
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
import FakeChatPreview from "@/components/home/FakeChatPreview";
import { proxyAdminRequest } from "@/lib/ircProxyAdmin";

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
import welcomeBanner from "@/assets/welcome-banner.png";
import footerMascots from "@/assets/footer-mascots.png";
import DonationBanner from "@/components/home/DonationBanner";

interface Channel {
  id: string;
  name: string;
  description: string | null;
}

interface RoomUserCounts {
  [channelId: string]: number;
}

const roomIcons: Record<string, React.ReactNode> = {
  "general": <Hash className="w-8 h-8" />,
  "adults-21-plus": <Shield className="w-8 h-8" />,
  "music": <Music className="w-8 h-8" />,
  "help": <HelpCircle className="w-8 h-8" />,
  "games": <Gamepad2 className="w-8 h-8" />,
  "politics": <Vote className="w-8 h-8" />,
  "movies-tv": <Tv className="w-8 h-8" />,
  "sports": <Dumbbell className="w-8 h-8" />,
  "technology": <Cpu className="w-8 h-8" />,
  "dating": <Heart className="w-8 h-8" />,
  "lounge": <Coffee className="w-8 h-8" />,
  "trivia": <MessageSquare className="w-8 h-8" />,
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
  const { user, loading, signOut, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [roomUserCounts, setRoomUserCounts] = useState<RoomUserCounts>({});
  const [isUnbanningIp, setIsUnbanningIp] = useState(false);

  // Scroll to top on page load - use requestAnimationFrame to ensure it runs after render
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  // Subscribe to presence for all rooms to get user counts
  useEffect(() => {
    if (!channels.length) return;

    const presenceChannels: ReturnType<typeof supabase.channel>[] = [];

    channels.forEach((channel) => {
      const presenceChannel = supabase.channel(`room:${channel.id}:presence`);
      
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const userCount = Object.keys(state).length;
          setRoomUserCounts(prev => ({ ...prev, [channel.id]: userCount }));
        })
        .subscribe();

      presenceChannels.push(presenceChannel);
    });

    return () => {
      presenceChannels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [channels]);

  const handleJoinRoom = (channel: Channel) => {
    navigate(`/chat/${channel.name}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Quick unban/allowlist my IP via IRC proxy
  const handleUnbanMyIp = async () => {
    setIsUnbanningIp(true);
    try {
      // Detect user's current IP
      const services = [
        'https://api.ipify.org?format=json',
        'https://api.my-ip.io/v2/ip.json',
      ];
      
      let myIp: string | null = null;
      for (const service of services) {
        try {
          const res = await fetch(service, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json();
            myIp = data.ip || data.IP;
            if (myIp) break;
          }
        } catch {
          continue;
        }
      }
      
      if (!myIp) {
        toast.error("Could not detect your IP address");
        return;
      }

      // Get proxy URL and token from localStorage (set in AdminIRC)
      const proxyUrl = localStorage.getItem('irc_proxy_url') || 'http://localhost:6680';
      const adminToken = localStorage.getItem('irc_admin_token');

      // Prevent confusing mixed-content failures when the app runs on HTTPS.
      try {
        const u = new URL(proxyUrl);
        const isHttpsSite = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const isHttpProxy = u.protocol === 'http:';
        const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
        if (isHttpsSite && isHttpProxy && !isLocalhost) {
          toast.error('Proxy Admin URL must be HTTPS', {
            description:
              'Open Admin → IRC Gateway and switch the Proxy URL to an https:// domain (enable ADMIN_SSL_ENABLED=true on the VPS).',
          });
          return;
        }
      } catch {
        // ignore
      }
      
      if (!adminToken) {
        toast.error("IRC proxy not configured", {
          description: "Set up the proxy connection first",
          action: {
            label: "Go to IRC Gateway",
            onClick: () => navigate("/admin/irc")
          }
        });
        return;
      }

      // Unban the IP
      const unbanRelay = await proxyAdminRequest({
        proxyUrl,
        adminToken,
        path: "/unban",
        method: "POST",
        body: { ip: myIp },
      });

      // Add to allowlist
      const allowRelay = await proxyAdminRequest({
        proxyUrl,
        adminToken,
        path: "/allowlist",
        method: "POST",
        body: { ip: myIp, label: `Admin (${user?.email?.split('@')[0] || 'self'})` },
      });

      if (unbanRelay.ok || allowRelay.ok) {
        toast.success(`Unbanned & allowlisted your IP: ${myIp}`);
      } else {
        toast.error("Failed to unban/allowlist IP");
      }
    } catch (e) {
      toast.error("Failed to connect to IRC proxy");
    } finally {
      setIsUnbanningIp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold brand jac-gradient-text">Justachat<sup className="text-[8px] sm:text-xs">™</sup></h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Site Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 border-primary/50 hover:border-primary hover:bg-primary/10">
                  <Menu className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-popover border border-border shadow-lg z-50">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Site Navigation
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* About Section */}
                <DropdownMenuItem asChild>
                  <Link to="/ethos" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <div>
                      <span>Our Story</span>
                      <p className="text-xs text-muted-foreground">Why Justachat exists</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                {/* Games Section */}
                <DropdownMenuItem asChild>
                  <Link to="/games" className="flex items-center gap-2 cursor-pointer">
                    <Gamepad2 className="w-4 h-4 text-orange-500" />
                    <div>
                      <span>Game Arcade</span>
                      <p className="text-xs text-muted-foreground">Free games to play</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                
                {/* Help Section */}
                <DropdownMenuItem asChild>
                  <Link to="/chat/help" className="flex items-center gap-2 cursor-pointer">
                    <LifeBuoy className="w-4 h-4 text-green-500" />
                    <div>
                      <span>Help & Support</span>
                      <p className="text-xs text-muted-foreground">Get help from the community</p>
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
                
                {/* mIRC & Proxy Section */}
                <DropdownMenuItem asChild>
                  <Link to="/download-proxy" className="flex items-center gap-2 cursor-pointer">
                    <Download className="w-4 h-4 text-purple-500" />
                    <div>
                      <span>mIRC Theme Package</span>
                      <p className="text-xs text-muted-foreground">For existing mIRC users</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Contact</DropdownMenuLabel>
                
                {/* Contact Section */}
                <DropdownMenuItem asChild>
                  <a 
                    href="mailto:support@justachat.com" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    <div>
                      <span>Email Support</span>
                      <p className="text-xs text-muted-foreground">support@justachat.com</p>
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
              </DropdownMenuContent>
            </DropdownMenu>

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
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Quick Actions</DropdownMenuLabel>
                      
                      <DropdownMenuItem 
                        onClick={handleUnbanMyIp}
                        disabled={isUnbanningIp}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {isUnbanningIp ? (
                          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <Unlock className="w-4 h-4 text-primary" />
                        )}
                        <div>
                          <span>Unban My IP</span>
                          <p className="text-xs text-muted-foreground">Quick IRC proxy fix</p>
                        </div>
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

      {/* Donation Banner */}
      <div className="container mx-auto px-3 sm:px-4 pt-4">
        <DonationBanner />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Room Cards - Horizontal scroll on mobile */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="rounded-xl sm:rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-3 sm:p-4">
              <div className="mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Chat Rooms</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">Select a room to join</p>
              </div>

              {loadingChannels ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 sm:h-20 rounded-lg bg-card animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2 lg:max-h-[calc(100vh-380px)] lg:overflow-y-auto lg:pr-2 scrollbar-thin">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => handleJoinRoom(channel)}
                        className="group relative h-16 sm:h-20 rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1 active:scale-95 active:translate-y-0"
                      >
                        {/* Background image */}
                        {roomBackgrounds[channel.name] && (
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
                            style={{ backgroundImage: `url(${roomBackgrounds[channel.name]})` }}
                          />
                        )}
                        
                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${roomColors[channel.name] || 'from-primary to-accent'} opacity-20 group-hover:opacity-30 transition-opacity`} />
                        
                        {/* Dark overlay for readability */}
                        <div className="absolute inset-0 bg-black/40" />
                        
                        {/* Content - stacked vertically */}
                        <div className="relative h-full flex flex-col items-center justify-center gap-1 px-2 py-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${roomColors[channel.name] || 'from-primary to-accent'} text-white shadow-md group-hover:scale-105 transition-transform`}>
                            {roomIcons[channel.name] ? (
                              <div className="w-5 h-5 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                                {roomIcons[channel.name]}
                              </div>
                            ) : (
                              <Hash className="w-5 h-5" />
                            )}
                          </div>
                          <h3 className="font-semibold text-[10px] sm:text-xs text-white drop-shadow-md text-center leading-tight">
                            #{formatRoomName(channel.name)}
                          </h3>
                          {/* User count badge */}
                          <div className="flex items-center gap-0.5 text-white/80">
                            <Users className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-medium">{roomUserCounts[channel.id] || 0}</span>
                          </div>
                        </div>

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                  
                  {/* Voice Chat Section */}
                  <div className="mt-3 lg:mt-4">
                    <Link
                      to="/voice-chat"
                      className="group relative flex h-14 sm:h-16 w-full rounded-xl overflow-hidden bg-card border-2 border-violet-500/60 hover:border-violet-500 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.98]"
                    >
                      {/* Gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-40 group-hover:opacity-60 transition-opacity" />
                      
                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-black/30" />
                      
                      {/* Content */}
                      <div className="relative h-full flex items-center gap-3 px-3 sm:px-4">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-sm sm:text-base text-white drop-shadow-lg whitespace-nowrap flex items-center gap-1">
                            <span className="animate-pulse">🎙️</span> Voice Chat
                          </h3>
                          <span className="text-[10px] sm:text-xs text-white/80">Broadcast live to listeners</span>
                        </div>
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                  
                  {/* Dating Section - Fixed at bottom */}
                  <div className="mt-3 lg:mt-4">
                    <Link
                      to="/dating"
                      className="group relative flex h-14 sm:h-16 w-full rounded-xl overflow-hidden bg-card border-2 border-pink-500/60 hover:border-pink-500 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/30 active:scale-[0.98]"
                    >
                      {/* Background image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                        style={{ backgroundImage: `url(${datingBg})` }}
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-30 group-hover:opacity-40 transition-opacity" />
                      
                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-black/30" />
                      
                      {/* Content */}
                      <div className="relative h-full flex items-center gap-3 px-3 sm:px-4">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-sm sm:text-base text-white drop-shadow-lg whitespace-nowrap flex items-center gap-1">
                            <span className="animate-pulse">💕</span> Find Your Match
                          </h3>
                          <span className="text-[10px] sm:text-xs text-white/80">Start connecting today</span>
                        </div>
                      </div>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center - Public Chat Preview */}
          <div className="flex-1 min-w-0">
            {/* Welcome Banner */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-border">
              <img 
                src={welcomeBanner} 
                alt="Welcome to Justachat" 
                className="w-full h-24 sm:h-32 md:h-40 object-cover"
              />
              {/* Welcome text overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Welcome!</h2>
                  <p className="text-xs sm:text-sm md:text-base text-white/90 drop-shadow-md mt-1">This is the main hangout spot.</p>
                </div>
                <Button 
                  onClick={() => {
                    const generalChannel = channels.find(c => c.name === 'general');
                    if (generalChannel) handleJoinRoom(generalChannel);
                  }}
                  className="absolute right-2 sm:right-4 top-2 sm:top-4 jac-gradient-bg hover:opacity-90 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-auto"
                >
                  Join Chat
                </Button>
              </div>
            </div>

            {/* Chat Preview - Smaller on mobile */}
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border h-[50vh] sm:h-[calc(100vh-340px)] flex flex-col overflow-hidden">
              {/* Topic bar */}
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-border bg-primary/5">
                <p className="text-xs sm:text-sm text-primary font-medium">Welcome! This is the main hangout spot.</p>
              </div>
              
              {/* Live Chat Preview */}
              <FakeChatPreview />
            </div>
          </div>
        </div>
        
        {/* Footer - Mobile responsive */}
        <footer className="mt-6 sm:mt-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between">
            {/* Logo and tagline */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold jac-gradient-text">Justachat<sup className="text-[6px] sm:text-[8px]">™</sup></h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Chat. Connect. Chill.</p>
              </div>
            </div>
            
            {/* Mascots - Hidden on very small screens */}
            <div className="hidden xs:flex flex-1 justify-center">
              <img 
                src={footerMascots} 
                alt="Justachat Mascots" 
                className="h-10 sm:h-14 w-auto object-contain"
              />
            </div>
            
            {/* Copyright */}
            <div className="text-center sm:text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                © {new Date().getFullYear()} Justachat™ All rights reserved.
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                <a href="https://justachat.net" className="hover:text-primary transition-colors">justachat.net</a>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;
