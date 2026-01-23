import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LogOut, Users, MessageSquare, Shield, Music, Gamepad2, Vote, Tv, 
  Dumbbell, Cpu, Heart, Coffee, HelpCircle, Hash, Settings, FileText,
  Ban, Key, MapPin, UserCog, ChevronDown, Mail, VolumeX
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

interface Channel {
  id: string;
  name: string;
  description: string | null;
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

  const handleJoinRoom = (channel: Channel) => {
    navigate(`/chat/${channel.id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold brand jac-gradient-text">Justachat<sup className="text-[8px] sm:text-xs">™</sup></h1>
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
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {isOwner ? 'Owner Controls' : 'Admin Controls'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {isOwner && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <FileText className="w-4 h-4 text-primary" />
                        <div>
                          <span>Audit Logs</span>
                          <p className="text-xs text-muted-foreground">View access history</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
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
                    <Link to="/map" className="flex items-center gap-2 cursor-pointer">
                      <MapPin className="w-4 h-4 text-primary" />
                      <div>
                        <span>User Locations</span>
                        <p className="text-xs text-muted-foreground">View user map</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
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
                    <Link to="/admin/messages" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <div>
                        <span>Messages</span>
                        <p className="text-xs text-muted-foreground">View & moderate</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
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

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Room Cards - Horizontal scroll on mobile */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="mb-3 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Chat Rooms</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Select a room to join</p>
            </div>

            {loadingChannels ? (
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 min-w-[140px] lg:min-w-0 rounded-lg bg-card animate-pulse flex-shrink-0 lg:flex-shrink" />
                ))}
              </div>
            ) : (
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto pb-2 lg:pb-0 lg:pr-2 scrollbar-thin snap-x lg:snap-none">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleJoinRoom(channel)}
                    className="group relative h-12 min-w-[140px] lg:min-w-0 flex-shrink-0 lg:flex-shrink rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/20 snap-start active:scale-95"
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
                    
                    {/* Content */}
                    <div className="relative h-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${roomColors[channel.name] || 'from-primary to-accent'} text-white shadow-md group-hover:scale-105 transition-transform`}>
                        {roomIcons[channel.name] ? (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
                            {roomIcons[channel.name]}
                          </div>
                        ) : (
                          <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <h3 className="font-semibold text-xs sm:text-sm text-white drop-shadow-md whitespace-nowrap">
                        #{formatRoomName(channel.name)}
                      </h3>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
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
