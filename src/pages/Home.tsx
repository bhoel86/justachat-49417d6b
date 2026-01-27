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
  Radio, Camera
} from "lucide-react";
import { toast } from "sonner";
import { getVersionString } from "@/lib/version";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FakeChatPreview from "@/components/home/FakeChatPreview";


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
import mascotLeft from "@/assets/mascot-left.png";
import mascotRight from "@/assets/mascot-right.png";
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
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [roomUserCounts, setRoomUserCounts] = useState<RoomUserCounts>({});
  

  // Scroll to top on page load - use requestAnimationFrame to ensure it runs after render
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/home");
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
    window.location.href = '/home';
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
            
            {/* Site Navigation Dropdown - moved next to logo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 border-primary/50 hover:border-primary hover:bg-primary/10">
                  <Menu className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-popover border border-border shadow-lg z-50">
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
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
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

      {/* Donation Banner - Desktop only */}
      {!isMobile && (
        <div className="container mx-auto px-3 sm:px-4 pt-4">
          <DonationBanner />
        </div>
      )}

      {/* MOBILE SIMPLIFIED VIEW */}
      {isMobile ? (
        <main className="flex flex-col h-[calc(100vh-56px)]">
          {/* Welcome Banner - Clickable */}
          <div 
            onClick={() => navigate('/chat/general')}
            className="relative mx-3 mt-3 rounded-xl overflow-hidden border border-border cursor-pointer active:scale-[0.98] transition-transform"
          >
            <img 
              src={welcomeBanner} 
              alt="Welcome to Justachat" 
              className="w-full h-24 object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Welcome!</h2>
                <p className="text-xs text-white/90 drop-shadow-md mt-1">Tap anywhere to join chat</p>
              </div>
            </div>
          </div>
          
          {/* Fake Chat Preview - Clickable - Takes up remaining space */}
          <div 
            onClick={() => navigate('/chat/general')}
            className="flex-1 mx-3 my-3 bg-card rounded-xl border border-border flex flex-col overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
          >
            {/* Topic bar */}
            <div className="px-3 py-1.5 border-b border-border bg-primary/5 flex items-center justify-between">
              <p className="text-xs text-primary font-medium">#General - Tap to join</p>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            
            {/* Live Chat Preview */}
            <FakeChatPreview />
          </div>
        </main>
      ) : (
        /* DESKTOP FULL VIEW */
        <>
          {/* Main Content */}
          <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 sm:gap-6">
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
                      
                      {/* Video Chat Section */}
                      <div className="mt-3 lg:mt-4">
                        <Link
                          to="/video-chat"
                          className="group relative flex h-14 sm:h-16 w-full rounded-xl overflow-hidden bg-card border-2 border-green-500/60 hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98]"
                        >
                          {/* Gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-40 group-hover:opacity-60 transition-opacity" />
                          
                          {/* Dark overlay for readability */}
                          <div className="absolute inset-0 bg-black/30" />
                          
                      {/* Content */}
                          <div className="relative h-full flex items-center gap-3 px-3 sm:px-4">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="flex flex-col">
                              <h3 className="font-bold text-sm sm:text-base text-white drop-shadow-lg whitespace-nowrap flex items-center gap-1">
                                <Camera className="w-4 h-4" /> Cams
                              </h3>
                              <span className="text-[10px] sm:text-xs text-white/80">Broadcast webcam live</span>
                            </div>
                          </div>

                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                      
                      {/* Games Section */}
                      <div className="mt-2 lg:mt-2">
                        <Link
                          to="/games"
                          className="group relative flex h-12 sm:h-14 w-full rounded-xl overflow-hidden bg-card border-2 border-orange-500/60 hover:border-orange-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]"
                        >
                          {/* Gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-yellow-600 opacity-40 group-hover:opacity-60 transition-opacity" />
                          
                          {/* Dark overlay for readability */}
                          <div className="absolute inset-0 bg-black/30" />
                          
                          {/* Content */}
                          <div className="relative h-full flex items-center gap-3 px-3 sm:px-4">
                            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="flex flex-col">
                              <h3 className="font-bold text-xs sm:text-sm text-white drop-shadow-lg whitespace-nowrap flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3" /> Games
                              </h3>
                              <span className="text-[9px] sm:text-[10px] text-white/80">Free arcade games</span>
                            </div>
                          </div>

                          {/* Hover effect overlay */}
                          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <div className="flex-1 min-w-0 flex flex-col">
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

                {/* Chat Preview - Fills remaining height to align with left column */}
                <div className="bg-card rounded-xl sm:rounded-2xl border border-border flex-1 flex flex-col overflow-hidden max-h-[444px] lg:max-h-[584px]">
                  {/* Topic bar */}
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-border bg-primary/5">
                    <p className="text-xs sm:text-sm text-primary font-medium">Welcome! This is the main hangout spot.</p>
                  </div>
                  
                  {/* Live Chat Preview */}
                  <FakeChatPreview />
                </div>
              </div>
            </div>
            
            {/* Footer - Clean and organized */}
            <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
              <div className="flex flex-col gap-4">
                {/* Main footer row */}
                <div className="flex items-center">
                  {/* Logo and tagline - left side */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl jac-gradient-bg flex items-center justify-center shadow-lg">
                      <MessageSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold jac-gradient-text">Justachat<sup className="text-[7px]">™</sup></h3>
                      <p className="text-xs text-muted-foreground">Chat. Connect. Chill.</p>
                    </div>
                  </div>
                  
                  {/* Spacer to push mascots/social to center */}
                  <div className="flex-1" />
                  
                  {/* Center section with mascots and social links */}
                  <div className="flex items-center">
                    {/* Left mascot */}
                    <img 
                      src={mascotLeft} 
                      alt="Mascot" 
                      className="h-14 sm:h-16 w-auto object-contain"
                    />
                    
                    {/* Social Media Links + Copyright centered */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <a 
                          href="#" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                          title="Facebook"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a 
                          href="#" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                          title="Instagram"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                        <a 
                          href="#" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                          title="TikTok"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </a>
                        <a 
                          href="#" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors group"
                          title="X (Twitter)"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      </div>
                      
                      {/* Copyright & Version - directly under social links */}
                      <div className="text-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          © {new Date().getFullYear()} Justachat™ All rights reserved.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <a 
                            href="https://justachat.net" 
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            justachat.net
                          </a>
                          <span className="text-xs text-muted-foreground/50">•</span>
                          <Link 
                            to="/legal" 
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            Legal
                          </Link>
                          <span className="text-xs text-muted-foreground/50">•</span>
                          <span className="text-xs text-muted-foreground/70 font-mono">{getVersionString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right mascot */}
                    <img 
                      src={mascotRight} 
                      alt="Mascot" 
                      className="h-14 sm:h-16 w-auto object-contain"
                    />
                  </div>
                  
                  {/* Spacer on right to balance */}
                  <div className="flex-1" />
                </div>
              </div>
            </footer>
          </main>
        </>
      )}
    </div>
  );
};

export default Home;
