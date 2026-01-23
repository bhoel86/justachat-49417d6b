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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl jac-gradient-bg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold brand jac-gradient-text">Justachat<sup className="text-xs">™</sup></h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin Dropdown - Owner/Admin Only - Placed LEFT of Welcome */}
            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                    <Shield className="w-4 h-4" />
                    Admin Panel
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
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">Welcome back!</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Choose a Room</h2>
          <p className="text-muted-foreground text-lg">Select a chat room to join the conversation</p>
        </div>

        {loadingChannels ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleJoinRoom(channel)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
              >
                {/* Background image */}
                {roomBackgrounds[channel.name] && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity"
                    style={{ backgroundImage: `url(${roomBackgrounds[channel.name]})` }}
                  />
                )}
                
                {/* Gradient overlay - lighter for darker themed rooms */}
                <div className={`absolute inset-0 bg-gradient-to-br ${roomColors[channel.name] || 'from-primary to-accent'} ${
                  ['lounge', 'politics', 'adults-21-plus'].includes(channel.name) 
                    ? 'opacity-30 group-hover:opacity-40' 
                    : 'opacity-20 group-hover:opacity-30'
                } transition-opacity`} />
                
                {/* Dark overlay for readability - lighter for brown/dark themed rooms */}
                <div className={`absolute inset-0 ${
                  ['lounge', 'politics', 'adults-21-plus'].includes(channel.name)
                    ? 'bg-black/15'
                    : 'bg-black/30'
                }`} />
                
                {/* Vignette effect */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
                  }}
                />
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                  <div className={`mb-3 p-4 rounded-full bg-gradient-to-br ${roomColors[channel.name] || 'from-primary to-accent'} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {roomIcons[channel.name] || <Hash className="w-8 h-8" />}
                  </div>
                  <h3 className="font-semibold text-lg mb-1 text-white drop-shadow-md">
                    #{formatRoomName(channel.name)}
                  </h3>
                  {channel.description && (
                    <p className="text-xs text-white/80 line-clamp-2 drop-shadow">
                      {channel.description}
                    </p>
                  )}
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}

        {/* Footer hint */}
        <div className="text-center mt-12 text-muted-foreground text-sm">
          <p>Click any room to join • Create your own rooms inside the chat</p>
        </div>
        
        {/* Official Footer */}
        <footer className="text-center mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Justachat™. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <a href="https://justachat.net" className="hover:text-primary transition-colors">justachat.net</a>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
