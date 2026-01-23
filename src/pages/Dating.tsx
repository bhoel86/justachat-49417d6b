import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Heart, X, MessageCircle, ArrowLeft, Settings, 
  Camera, MapPin, Sparkles, Users, Filter, ChevronLeft, ChevronRight,
  ImagePlus, Trash2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/avatar/UserAvatar";

interface DatingProfile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  looking_for: string | null;
  interests: string[];
  photos: string[];
  location: string | null;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  profile: DatingProfile;
}

const Dating = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [myProfile, setMyProfile] = useState<DatingProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Touch/Drag handling
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchMatches();
      fetchMyProfile();
    }
  }, [user]);

  const fetchMyProfile = async () => {
    if (!user) return;
    
    const { data: profile } = await supabaseUntyped
      .from('profiles')
      .select('user_id, username, avatar_url, bio')
      .eq('user_id', user.id)
      .single();
    
    const { data: datingProfile } = await supabaseUntyped
      .from('dating_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profile) {
      setMyProfile({
        id: datingProfile?.id || '',
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        age: datingProfile?.age || null,
        looking_for: datingProfile?.looking_for || null,
        interests: datingProfile?.interests || [],
        photos: datingProfile?.photos || [],
        location: datingProfile?.location || null,
      });
    }
  };

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);
    
    // Get profiles that user hasn't swiped on yet
    const { data: swipedIds } = await supabaseUntyped
      .from('dating_swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id);
    
    const excludeIds = swipedIds?.map((s: { swiped_id: string }) => s.swiped_id) || [];
    excludeIds.push(user.id); // Exclude self
    
    let query = supabaseUntyped
      .from('profiles')
      .select('user_id, username, avatar_url, bio');
    
    if (excludeIds.length > 0) {
      query = query.not('user_id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data: profilesData } = await query.limit(20);
    
    if (profilesData) {
      // Enrich with dating profile data
      const enrichedProfiles: DatingProfile[] = await Promise.all(
        profilesData.map(async (p: { user_id: string; username: string; avatar_url: string | null; bio: string | null }) => {
          const { data: datingData } = await supabaseUntyped
            .from('dating_profiles')
            .select('*')
            .eq('user_id', p.user_id)
            .single();
          
          return {
            id: datingData?.id || p.user_id,
            user_id: p.user_id,
            username: p.username,
            avatar_url: p.avatar_url,
            bio: p.bio,
            age: datingData?.age || null,
            looking_for: datingData?.looking_for || null,
            interests: datingData?.interests || [],
            photos: datingData?.photos || [p.avatar_url].filter(Boolean) as string[],
            location: datingData?.location || null,
          };
        })
      );
      
      setProfiles(enrichedProfiles);
    }
    
    setLoading(false);
  };

  const fetchMatches = async () => {
    if (!user) return;
    
    const { data: matchesData } = await supabaseUntyped
      .from('dating_matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    
    if (matchesData) {
      const enrichedMatches: Match[] = await Promise.all(
        matchesData.map(async (m: { id: string; user1_id: string; user2_id: string; matched_at: string }) => {
          const otherUserId = m.user1_id === user.id ? m.user2_id : m.user1_id;
          
          const { data: profile } = await supabaseUntyped
            .from('profiles')
            .select('user_id, username, avatar_url, bio')
            .eq('user_id', otherUserId)
            .single();
          
          const { data: datingData } = await supabaseUntyped
            .from('dating_profiles')
            .select('*')
            .eq('user_id', otherUserId)
            .single();
          
          return {
            id: m.id,
            user1_id: m.user1_id,
            user2_id: m.user2_id,
            matched_at: m.matched_at,
            profile: {
              id: datingData?.id || otherUserId,
              user_id: otherUserId,
              username: profile?.username || 'Unknown',
              avatar_url: profile?.avatar_url,
              bio: profile?.bio,
              age: datingData?.age || null,
              looking_for: datingData?.looking_for || null,
              interests: datingData?.interests || [],
              photos: datingData?.photos || [],
              location: datingData?.location || null,
            },
          };
        })
      );
      
      setMatches(enrichedMatches);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || profiles.length === 0 || currentIndex >= profiles.length) return;
    
    const targetProfile = profiles[currentIndex];
    setSwipeDirection(direction);
    
    // Record the swipe
    await supabaseUntyped
      .from('dating_swipes')
      .insert({
        swiper_id: user.id,
        swiped_id: targetProfile.user_id,
        direction: direction,
      });
    
    // If liked, check for match
    if (direction === 'right') {
      const { data: reverseSwipe } = await supabaseUntyped
        .from('dating_swipes')
        .select('*')
        .eq('swiper_id', targetProfile.user_id)
        .eq('swiped_id', user.id)
        .eq('direction', 'right')
        .single();
      
      if (reverseSwipe) {
        // It's a match!
        await supabaseUntyped
          .from('dating_matches')
          .insert({
            user1_id: user.id,
            user2_id: targetProfile.user_id,
          });
        
        toast({
          title: "It's a Match! 🎉",
          description: `You and ${targetProfile.username} liked each other!`,
        });
        
        fetchMatches();
      }
    }
    
    // Move to next profile after animation
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
      setCurrentPhotoIndex(0);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

  // Touch handlers for swiping
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (dragOffset.x > threshold) {
      handleSwipe('right');
    } else if (dragOffset.x < -threshold) {
      handleSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const currentProfile = profiles[currentIndex];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-full jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            Dating
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowMatches(true)}
            className="relative"
          >
            <MessageCircle className="h-5 w-5" />
            {matches.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {matches.length}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content - Swipe Cards */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentProfile ? (
          <div className="relative w-full max-w-sm h-[70vh] max-h-[600px]">
            {/* Card */}
            <div
              ref={cardRef}
              className={cn(
                "absolute inset-0 bg-card rounded-2xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing transition-transform",
                swipeDirection === 'left' && "-translate-x-[150%] rotate-[-30deg]",
                swipeDirection === 'right' && "translate-x-[150%] rotate-[30deg]"
              )}
              style={{
                transform: isDragging 
                  ? `translateX(${dragOffset.x}px) rotate(${dragOffset.x * 0.1}deg)`
                  : undefined,
              }}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              {/* Photo Carousel */}
              <div className="relative h-[70%] bg-muted">
                {currentProfile.photos.length > 0 ? (
                  <>
                    <img
                      src={currentProfile.photos[currentPhotoIndex] || currentProfile.avatar_url || ''}
                      alt={currentProfile.username}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    {/* Photo indicators */}
                    {currentProfile.photos.length > 1 && (
                      <div className="absolute top-2 left-2 right-2 flex gap-1">
                        {currentProfile.photos.map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex-1 h-1 rounded-full transition-colors",
                              idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {/* Photo navigation */}
                    <button
                      className="absolute left-0 top-0 bottom-0 w-1/2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(prev => Math.max(0, prev - 1));
                      }}
                    />
                    <button
                      className="absolute right-0 top-0 bottom-0 w-1/2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(prev => 
                          Math.min(currentProfile.photos.length - 1, prev + 1)
                        );
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserAvatar
                      avatarUrl={currentProfile.avatar_url}
                      username={currentProfile.username}
                      size="lg"
                    />
                  </div>
                )}
                
                {/* Swipe indicators */}
                <div 
                  className={cn(
                    "absolute top-4 left-4 px-4 py-2 rounded-lg border-4 font-bold text-2xl rotate-[-20deg] transition-opacity",
                    dragOffset.x > 50 ? "opacity-100" : "opacity-0",
                    "border-green-500 text-green-500"
                  )}
                >
                  LIKE
                </div>
                <div 
                  className={cn(
                    "absolute top-4 right-4 px-4 py-2 rounded-lg border-4 font-bold text-2xl rotate-[20deg] transition-opacity",
                    dragOffset.x < -50 ? "opacity-100" : "opacity-0",
                    "border-red-500 text-red-500"
                  )}
                >
                  NOPE
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="p-4 h-[30%] overflow-hidden">
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentProfile.username}
                  </h2>
                  {currentProfile.age && (
                    <span className="text-xl text-muted-foreground">{currentProfile.age}</span>
                  )}
                </div>
                
                {currentProfile.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    {currentProfile.location}
                  </div>
                )}
                
                {currentProfile.bio && (
                  <p className="text-sm text-foreground line-clamp-2 mb-2">
                    {currentProfile.bio}
                  </p>
                )}
                
                {currentProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentProfile.interests.slice(0, 4).map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={() => handleSwipe('left')}
              >
                <X className="h-7 w-7" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={() => handleSwipe('right')}
              >
                <Heart className="h-8 w-8" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="h-24 w-24 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No more profiles</h2>
            <p className="text-muted-foreground">Check back later for more people!</p>
            <Button onClick={fetchProfiles} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Matches Drawer */}
      <Dialog open={showMatches} onOpenChange={setShowMatches}>
        <DialogContent className="max-w-md h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Matches
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match) => (
                  <Card 
                    key={match.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      // Navigate to PM with this user
                      setShowMatches(false);
                      toast({
                        title: "Opening chat...",
                        description: `Start chatting with ${match.profile.username}!`,
                      });
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={match.profile.avatar_url}
                        username={match.profile.username}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {match.profile.username}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Matched {new Date(match.matched_at).toLocaleDateString()}
                        </p>
                      </div>
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No matches yet. Keep swiping!</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Settings/Profile Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dating Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Age</Label>
              <Input 
                type="number" 
                placeholder="Your age" 
                value={myProfile?.age || ''}
                onChange={async (e) => {
                  if (!user) return;
                  const age = parseInt(e.target.value) || null;
                  await supabaseUntyped
                    .from('dating_profiles')
                    .upsert({ user_id: user.id, age }, { onConflict: 'user_id' });
                  fetchMyProfile();
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                placeholder="City, Country" 
                value={myProfile?.location || ''}
                onChange={async (e) => {
                  if (!user) return;
                  await supabaseUntyped
                    .from('dating_profiles')
                    .upsert({ user_id: user.id, location: e.target.value }, { onConflict: 'user_id' });
                  fetchMyProfile();
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Looking For</Label>
              <Input 
                placeholder="What are you looking for?" 
                value={myProfile?.looking_for || ''}
                onChange={async (e) => {
                  if (!user) return;
                  await supabaseUntyped
                    .from('dating_profiles')
                    .upsert({ user_id: user.id, looking_for: e.target.value }, { onConflict: 'user_id' });
                  fetchMyProfile();
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Interests (comma separated)</Label>
              <Input 
                placeholder="Music, Gaming, Travel..." 
                value={myProfile?.interests?.join(', ') || ''}
                onChange={async (e) => {
                  if (!user) return;
                  const interests = e.target.value.split(',').map(i => i.trim()).filter(Boolean);
                  await supabaseUntyped
                    .from('dating_profiles')
                    .upsert({ user_id: user.id, interests }, { onConflict: 'user_id' });
                  fetchMyProfile();
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dating;
