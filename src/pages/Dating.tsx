/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Heart, X, MessageCircle, ArrowLeft, Settings, 
  MapPin, Sparkles, Users, ChevronLeft, ChevronRight,
  ImagePlus, Check, User, Ruler, Scale, Briefcase, GraduationCap,
  Wine, Cigarette, Baby, Languages, Target, Compass, Star, PawPrint,
  Camera, Trash2, Plus, Edit, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  gender: string | null;
  seeking: string[];
  height_cm: number | null;
  weight_kg: number | null;
  body_type: string | null;
  ethnicity: string | null;
  relationship_status: string | null;
  looking_for_type: string | null;
  has_children: boolean;
  wants_children: string | null;
  education: string | null;
  occupation: string | null;
  smoking: string | null;
  drinking: string | null;
  religion: string | null;
  languages: string[];
  location: string | null;
  max_distance_km: number;
  min_age: number;
  max_age: number;
  about_me: string | null;
  ideal_match: string | null;
  interests: string[];
  hobbies: string[];
  zodiac: string | null;
  pets: string | null;
  photos: string[];
  is_verified: boolean;
  profile_complete: boolean;
  opted_in: boolean;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  profile: DatingProfile;
}

// Option lists
const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus size', 'Muscular'];
const ETHNICITIES = ['Asian', 'Black', 'Hispanic/Latino', 'Middle Eastern', 'Mixed', 'Native American', 'Pacific Islander', 'White', 'Other', 'Prefer not to say'];
const RELATIONSHIP_STATUSES = ['Single', 'Divorced', 'Widowed', 'Separated', 'Its complicated'];
const LOOKING_FOR_TYPES = ['Casual dating', 'Serious relationship', 'Marriage', 'Friendship', 'Not sure yet'];
const WANTS_CHILDREN_OPTIONS = ['Yes', 'No', 'Maybe', 'Already have kids'];
const EDUCATION_LEVELS = ['High school', 'Some college', 'Associates degree', 'Bachelors degree', 'Masters degree', 'Doctorate', 'Trade school', 'Other'];
const SMOKING_OPTIONS = ['Never', 'Occasionally', 'Regularly', 'Trying to quit'];
const DRINKING_OPTIONS = ['Never', 'Socially', 'Regularly', 'Sober'];
const RELIGIONS = ['Agnostic', 'Atheist', 'Buddhist', 'Catholic', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Spiritual', 'Other', 'Prefer not to say'];
const ZODIAC_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PET_OPTIONS = ['Dogs', 'Cats', 'Both', 'Other pets', 'No pets', 'Allergic'];
const INTEREST_OPTIONS = ['Music', 'Movies', 'Gaming', 'Travel', 'Fitness', 'Reading', 'Cooking', 'Art', 'Photography', 'Dancing', 'Sports', 'Hiking', 'Yoga', 'Technology', 'Fashion', 'Food & Drinks', 'Nightlife', 'Outdoors', 'Animals', 'Volunteering'];

const defaultProfile: Partial<DatingProfile> = {
  seeking: [],
  languages: [],
  interests: [],
  hobbies: [],
  photos: [],
  max_distance_km: 100,
  min_age: 18,
  max_age: 99,
  has_children: false,
  is_verified: false,
  profile_complete: false,
  opted_in: false,
};

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
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [myProfile, setMyProfile] = useState<DatingProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  
  // Touch/Drag handling
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/home');
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
        ...defaultProfile,
        id: datingProfile?.id || '',
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        ...datingProfile,
      } as DatingProfile);
    }
  };

  const saveProfile = async (updates: Partial<DatingProfile>) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabaseUntyped
        .from('dating_profiles')
        .upsert({ 
          user_id: user.id, 
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      await fetchMyProfile();
      toast({
        title: "Profile saved",
        description: "Your dating profile has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "Could not update your profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
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
    excludeIds.push(user.id);
    
    // Only fetch dating profiles that have opted in
    const { data: optedInProfiles } = await supabaseUntyped
      .from('dating_profiles')
      .select('user_id')
      .eq('opted_in', true);
    
    const optedInUserIds = optedInProfiles?.map((p: { user_id: string }) => p.user_id) || [];
    
    // Filter to only users who have opted in and haven't been swiped
    const eligibleUserIds = optedInUserIds.filter((id: string) => !excludeIds.includes(id));
    
    if (eligibleUserIds.length === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    
    const { data: profilesData } = await supabaseUntyped
      .from('profiles')
      .select('user_id, username, avatar_url, bio')
      .in('user_id', eligibleUserIds)
      .limit(20);
    
    if (profilesData) {
      const enrichedProfiles: DatingProfile[] = await Promise.all(
        profilesData.map(async (p: { user_id: string; username: string; avatar_url: string | null; bio: string | null }) => {
          const { data: datingData } = await supabaseUntyped
            .from('dating_profiles')
            .select('*')
            .eq('user_id', p.user_id)
            .single();
          
          return {
            ...defaultProfile,
            id: datingData?.id || p.user_id,
            user_id: p.user_id,
            username: p.username,
            avatar_url: p.avatar_url,
            bio: p.bio,
            ...datingData,
            photos: datingData?.photos?.length > 0 ? datingData.photos : (p.avatar_url ? [p.avatar_url] : []),
          } as DatingProfile;
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
              ...defaultProfile,
              id: datingData?.id || otherUserId,
              user_id: otherUserId,
              username: profile?.username || 'Unknown',
              avatar_url: profile?.avatar_url,
              bio: profile?.bio,
              ...datingData,
            } as DatingProfile,
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
    
    await supabaseUntyped
      .from('dating_swipes')
      .insert({
        swiper_id: user.id,
        swiped_id: targetProfile.user_id,
        direction: direction,
      });
    
    if (direction === 'right') {
      const { data: reverseSwipe } = await supabaseUntyped
        .from('dating_swipes')
        .select('*')
        .eq('swiper_id', targetProfile.user_id)
        .eq('swiped_id', user.id)
        .eq('direction', 'right')
        .single();
      
      if (reverseSwipe) {
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
    
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
      setCurrentPhotoIndex(0);
      setDragOffset({ x: 0, y: 0 });
    }, 300);
  };

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

  // Height conversion helper
  const cmToFeetInches = (cm: number) => {
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}"`;
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
              onClick={() => setShowProfileDetail(true)}
            >
              {/* Photo Carousel */}
              <div className="relative h-[65%] bg-muted">
                {currentProfile.photos.length > 0 ? (
                  <>
                    <img
                      src={currentProfile.photos[currentPhotoIndex] || currentProfile.avatar_url || ''}
                      alt={currentProfile.username}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
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
                
                {currentProfile.is_verified && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500 text-white">
                      <Check className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Profile Info */}
              <div className="p-4 h-[35%] overflow-hidden">
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentProfile.username}
                  </h2>
                  {currentProfile.age && (
                    <span className="text-xl text-muted-foreground">{currentProfile.age}</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2 text-sm text-muted-foreground">
                  {currentProfile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {currentProfile.location}
                    </div>
                  )}
                  {currentProfile.height_cm && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {cmToFeetInches(currentProfile.height_cm)}
                    </div>
                  )}
                  {currentProfile.occupation && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {currentProfile.occupation}
                    </div>
                  )}
                </div>
                
                {currentProfile.about_me && (
                  <p className="text-sm text-foreground line-clamp-2 mb-2">
                    {currentProfile.about_me}
                  </p>
                )}
                
                {currentProfile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentProfile.interests.slice(0, 4).map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {currentProfile.interests.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentProfile.interests.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
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

      {/* Profile Detail Modal */}
      <Dialog open={showProfileDetail} onOpenChange={setShowProfileDetail}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
          {currentProfile && (
            <ScrollArea className="h-full max-h-[90vh]">
              <div className="relative">
                <img
                  src={currentProfile.photos[0] || currentProfile.avatar_url || ''}
                  alt={currentProfile.username}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h2 className="text-2xl font-bold text-white">
                    {currentProfile.username}, {currentProfile.age || '?'}
                  </h2>
                  {currentProfile.location && (
                    <p className="text-white/80 flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {currentProfile.location}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {currentProfile.height_cm && (
                    <div className="p-2 bg-muted rounded-lg">
                      <Ruler className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">{cmToFeetInches(currentProfile.height_cm)}</p>
                      <p className="text-xs text-muted-foreground">Height</p>
                    </div>
                  )}
                  {currentProfile.body_type && (
                    <div className="p-2 bg-muted rounded-lg">
                      <User className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">{currentProfile.body_type}</p>
                      <p className="text-xs text-muted-foreground">Body Type</p>
                    </div>
                  )}
                  {currentProfile.zodiac && (
                    <div className="p-2 bg-muted rounded-lg">
                      <Star className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">{currentProfile.zodiac}</p>
                      <p className="text-xs text-muted-foreground">Zodiac</p>
                    </div>
                  )}
                </div>
                
                {/* About */}
                {currentProfile.about_me && (
                  <div>
                    <h3 className="font-semibold mb-2">About Me</h3>
                    <p className="text-sm text-muted-foreground">{currentProfile.about_me}</p>
                  </div>
                )}
                
                {/* Looking for */}
                {currentProfile.looking_for_type && (
                  <div>
                    <h3 className="font-semibold mb-2">Looking For</h3>
                    <Badge variant="secondary">{currentProfile.looking_for_type}</Badge>
                  </div>
                )}
                
                {/* Interests */}
                {currentProfile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-1">
                      {currentProfile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {currentProfile.education && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{currentProfile.education}</span>
                    </div>
                  )}
                  {currentProfile.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{currentProfile.occupation}</span>
                    </div>
                  )}
                  {currentProfile.smoking && (
                    <div className="flex items-center gap-2">
                      <Cigarette className="h-4 w-4 text-muted-foreground" />
                      <span>{currentProfile.smoking}</span>
                    </div>
                  )}
                  {currentProfile.drinking && (
                    <div className="flex items-center gap-2">
                      <Wine className="h-4 w-4 text-muted-foreground" />
                      <span>{currentProfile.drinking}</span>
                    </div>
                  )}
                  {currentProfile.pets && (
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-muted-foreground" />
                      <span>{currentProfile.pets}</span>
                    </div>
                  )}
                  {currentProfile.religion && (
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-muted-foreground" />
                      <span>{currentProfile.religion}</span>
                    </div>
                  )}
                </div>
                
                {/* Ideal match */}
                {currentProfile.ideal_match && (
                  <div>
                    <h3 className="font-semibold mb-2">Ideal Match</h3>
                    <p className="text-sm text-muted-foreground">{currentProfile.ideal_match}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Comprehensive Settings/Profile Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Dating Profile Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="preferences">Match</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            {/* Opt-in Toggle - Must be enabled to appear in dating pool */}
            <div className="mb-4 p-4 rounded-lg border border-pink-500/30 bg-pink-500/5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Join Dating Pool
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this to appear in other users' swipe cards and find matches
                  </p>
                </div>
                <Switch
                  checked={myProfile?.opted_in || false}
                  onCheckedChange={(checked) => {
                    setMyProfile(prev => prev ? {...prev, opted_in: checked} : null);
                    saveProfile({ opted_in: checked });
                  }}
                />
              </div>
              {!myProfile?.opted_in && (
                <p className="text-xs text-amber-500 mt-2">
                  ⚠️ Your profile is hidden. Enable to start matching!
                </p>
              )}
            </div>
            
            <ScrollArea className="h-[50vh]">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input 
                      type="number" 
                      placeholder="Your age"
                      min={18}
                      max={120}
                      value={myProfile?.age || ''}
                      onChange={(e) => setMyProfile(prev => prev ? {...prev, age: parseInt(e.target.value) || null} : null)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select 
                      value={myProfile?.gender || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, gender: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    placeholder="City, Country"
                    value={myProfile?.location || ''}
                    onChange={(e) => setMyProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input 
                      type="number"
                      placeholder="Height in cm"
                      min={100}
                      max={250}
                      value={myProfile?.height_cm || ''}
                      onChange={(e) => setMyProfile(prev => prev ? {...prev, height_cm: parseInt(e.target.value) || null} : null)}
                    />
                    {myProfile?.height_cm && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {cmToFeetInches(myProfile.height_cm)}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input 
                      type="number"
                      placeholder="Weight in kg"
                      min={30}
                      max={300}
                      value={myProfile?.weight_kg || ''}
                      onChange={(e) => setMyProfile(prev => prev ? {...prev, weight_kg: parseInt(e.target.value) || null} : null)}
                    />
                    {myProfile?.weight_kg && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {Math.round(myProfile.weight_kg * 2.205)} lbs
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Body Type</Label>
                    <Select 
                      value={myProfile?.body_type || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, body_type: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_TYPES.map(bt => (
                          <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ethnicity</Label>
                    <Select 
                      value={myProfile?.ethnicity || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, ethnicity: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        {ETHNICITIES.map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input 
                    placeholder="What do you do?"
                    value={myProfile?.occupation || ''}
                    onChange={(e) => setMyProfile(prev => prev ? {...prev, occupation: e.target.value} : null)}
                  />
                </div>
              </TabsContent>
              
              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Relationship Status</Label>
                    <Select 
                      value={myProfile?.relationship_status || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, relationship_status: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_STATUSES.map(rs => (
                          <SelectItem key={rs} value={rs}>{rs}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Looking For</Label>
                    <Select 
                      value={myProfile?.looking_for_type || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, looking_for_type: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="What are you looking for?" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOOKING_FOR_TYPES.map(lf => (
                          <SelectItem key={lf} value={lf}>{lf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Education</Label>
                    <Select 
                      value={myProfile?.education || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, education: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map(ed => (
                          <SelectItem key={ed} value={ed}>{ed}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Religion</Label>
                    <Select 
                      value={myProfile?.religion || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, religion: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELIGIONS.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Smoking</Label>
                    <Select 
                      value={myProfile?.smoking || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, smoking: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Smoking habits" />
                      </SelectTrigger>
                      <SelectContent>
                        {SMOKING_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Drinking</Label>
                    <Select 
                      value={myProfile?.drinking || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, drinking: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Drinking habits" />
                      </SelectTrigger>
                      <SelectContent>
                        {DRINKING_OPTIONS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Children</Label>
                    <Select 
                      value={myProfile?.wants_children || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, wants_children: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Want children?" />
                      </SelectTrigger>
                      <SelectContent>
                        {WANTS_CHILDREN_OPTIONS.map(wc => (
                          <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Pets</Label>
                    <Select 
                      value={myProfile?.pets || ''} 
                      onValueChange={(v) => setMyProfile(prev => prev ? {...prev, pets: v} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pet preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {PET_OPTIONS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Zodiac Sign</Label>
                  <Select 
                    value={myProfile?.zodiac || ''} 
                    onValueChange={(v) => setMyProfile(prev => prev ? {...prev, zodiac: v} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zodiac" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZODIAC_SIGNS.map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              {/* Match Preferences Tab */}
              <TabsContent value="preferences" className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label>I'm interested in</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.filter(g => g !== 'Prefer not to say').map(g => (
                      <Button
                        key={g}
                        type="button"
                        variant={myProfile?.seeking?.includes(g) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = myProfile?.seeking || [];
                          const updated = current.includes(g) 
                            ? current.filter(x => x !== g)
                            : [...current, g];
                          setMyProfile(prev => prev ? {...prev, seeking: updated} : null);
                        }}
                      >
                        {g}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Age Range: {myProfile?.min_age || 18} - {myProfile?.max_age || 99}</Label>
                    <div className="pt-2">
                      <Slider
                        value={[myProfile?.min_age || 18, myProfile?.max_age || 99]}
                        min={18}
                        max={99}
                        step={1}
                        onValueChange={([min, max]) => {
                          setMyProfile(prev => prev ? {...prev, min_age: min, max_age: max} : null);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maximum Distance: {myProfile?.max_distance_km || 100} km</Label>
                    <div className="pt-2">
                      <Slider
                        value={[myProfile?.max_distance_km || 100]}
                        min={1}
                        max={500}
                        step={1}
                        onValueChange={([v]) => {
                          setMyProfile(prev => prev ? {...prev, max_distance_km: v} : null);
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ≈ {Math.round((myProfile?.max_distance_km || 100) * 0.621)} miles
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              {/* About Me Tab */}
              <TabsContent value="about" className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label>About Me</Label>
                  <Textarea 
                    placeholder="Tell others about yourself..."
                    className="min-h-[100px]"
                    value={myProfile?.about_me || ''}
                    onChange={(e) => setMyProfile(prev => prev ? {...prev, about_me: e.target.value} : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>My Ideal Match</Label>
                  <Textarea 
                    placeholder="Describe your ideal partner..."
                    className="min-h-[100px]"
                    value={myProfile?.ideal_match || ''}
                    onChange={(e) => setMyProfile(prev => prev ? {...prev, ideal_match: e.target.value} : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(interest => (
                      <Button
                        key={interest}
                        type="button"
                        variant={myProfile?.interests?.includes(interest) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = myProfile?.interests || [];
                          const updated = current.includes(interest) 
                            ? current.filter(x => x !== interest)
                            : [...current, interest];
                          setMyProfile(prev => prev ? {...prev, interests: updated} : null);
                        }}
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Languages (comma separated)</Label>
                  <Input 
                    placeholder="English, Spanish, French..."
                    value={myProfile?.languages?.join(', ') || ''}
                    onChange={(e) => {
                      const langs = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                      setMyProfile(prev => prev ? {...prev, languages: langs} : null);
                    }}
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (myProfile) {
                  const { id, username, avatar_url, bio, user_id, ...datingFields } = myProfile;
                  saveProfile(datingFields);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dating;
