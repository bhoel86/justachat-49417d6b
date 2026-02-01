import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useTriviaGame } from "@/hooks/useTriviaGame";
import { useArtCurator } from "@/hooks/useArtCurator";
import { useChatBots } from "@/hooks/useChatBots";
import { useBotMigration } from "@/hooks/useBotMigration";
import { useAutoLocation } from "@/hooks/useAutoLocation";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import MemberList from "./MemberList";
import ChatSidebar from "./ChatSidebar";
import ChannelList, { Channel } from "./ChannelList";
import PrivateChatWindow from "./PrivateChatWindow";
import BotChatWindow from "./BotChatWindow";
import PMTray from "./PMTray";
import BotTray from "./BotTray";
import FriendsTray from "@/components/friends/FriendsTray";
import { usePrivateChats } from "@/hooks/usePrivateChats";
import { useBotChats } from "@/hooks/useBotChats";
import LanguageSettingsModal from "@/components/profile/LanguageSettingsModal";
import RoomSettingsModal from "./RoomSettingsModal";
import RoomPasswordModal from "./RoomPasswordModal";
import ArtDisplay from "./ArtDisplay";
import MinorRestrictionBanner from "./MinorRestrictionBanner";
import RoomInvitePopup, { sendRoomInvite } from "./RoomInvitePopup";
import { useRadioOptional } from "@/contexts/RadioContext";
import { parseCommand, executeCommand, isCommand, CommandContext } from "@/lib/commands";
import { getModerator, getWelcomeMessage, getRandomTip, isAdultChannel } from "@/lib/roomConfig";
import { moderateContent, shouldBlockMessage } from "@/lib/contentModeration";
import { useChannelModerationSettings } from "@/hooks/useChannelModerationSettings";
import { useSkipVote } from "@/hooks/useSkipVote";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Users, X, Hash, BellOff, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { RetroWatermark } from "@/components/theme/RetroWatermark";
import { ValentinesWatermark } from "@/components/theme/ValentinesWatermark";
import { StPatricksWatermark } from "@/components/theme/StPatricksWatermark";
import { MatrixWatermark } from "@/components/theme/MatrixWatermark";
import { ValentinesFloatingHearts } from "@/components/theme/ValentinesFloatingHearts";
import { StPatricksFloatingIcons } from "@/components/theme/StPatricksFloatingIcons";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  channel_id: string;
  isSystem?: boolean;
  isModerator?: boolean;
  profile?: {
    username: string;
    avatar_url?: string | null;
  };
}

interface ChatRoomProps {
  initialChannelName?: string;
}

const ChatRoom = ({ initialChannelName }: ChatRoomProps) => {
  const { user, isAdmin, isOwner, role, refreshRole, isMinor, hasParentConsent } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<{ username: string; avatarUrl?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [topic, setTopic] = useState('Welcome to JAC!');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRoomBanned, setIsRoomBanned] = useState(false);
  const [isRoomMuted, setIsRoomMuted] = useState(false);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [isRoomAdmin, setIsRoomAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [parentEmail, setParentEmail] = useState<string | null>(null);
  // Private chats hook - moved pmTarget to hook-based system
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);
  const [translations, setTranslations] = useState<Record<string, { text: string; lang: string }>>({});
  // Mobile sidebar state
  const [showChannelSidebar, setShowChannelSidebar] = useState(false);
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const [showRoomSheet, setShowRoomSheet] = useState(false);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isRetro = theme === 'retro80s';
  const isStPatricks = theme === 'stpatricks';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const radio = useRadioOptional();
  
  // Auto-track user location via IP
  useAutoLocation();
  
  const { translateMessage, isTranslating, getCachedTranslation } = useTranslation(preferredLanguage);
  
  // Private chats system
  const privateChats = usePrivateChats(user?.id || '', username);
  
  // Bot chats system (draggable windows for moderator bots)
  const botChats = useBotChats();
  
  // Minor restriction check helper
  const canAccessPrivateMessaging = !isMinor || hasParentConsent;
  
  const handleOpenPm = (userId: string, targetUsername: string) => {
    if (!canAccessPrivateMessaging) {
      toast({
        variant: "destructive",
        title: "Feature Restricted",
        description: "Private messaging requires parental consent for users under 18. Please ask your parent/guardian to verify their email.",
      });
      return;
    }
    privateChats.openChat(userId, targetUsername);
  };
  
  const handleOpenBotPm = (moderator: Parameters<typeof botChats.openChat>[0], channelName: string) => {
    botChats.openChat(moderator, channelName);
  };
  
  // Channel moderation settings
  const { settings: moderationSettings } = useChannelModerationSettings(currentChannel?.id || null);

  // Enable radio when entering chat room, disable when leaving
  // Also clear messages on unmount (user closes/leaves chat)
  useEffect(() => {
    if (radio?.enableRadio) {
      radio.enableRadio();
    }
    
    return () => {
      // Clear messages when leaving chat - ephemeral for user
      setMessages([]);
      if (radio?.disableRadio) {
        radio.disableRadio();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial channel from URL parameter (by name)
  useEffect(() => {
    if (!initialChannelName) return;
    
    const loadInitialChannel = async () => {
      // Check if minor without consent is trying to join adult channel
      if (isMinor && !hasParentConsent && isAdultChannel(initialChannelName)) {
        toast({
          variant: "destructive",
          title: "Access Restricted",
          description: "Adult chat rooms require parental consent for users under 18. Please ask your parent/guardian to verify their email.",
        });
        navigate('/chat/general');
        return;
      }
      
      const { data } = await supabaseUntyped
        .from('channels')
        .select('*')
        .eq('name', initialChannelName)
        .maybeSingle();
      
      if (data) {
        setCurrentChannel(data);
      } else {
        // Channel not found, redirect to home
        toast({
          variant: "destructive",
          title: "Channel not found",
          description: "Redirecting to lobby..."
        });
        navigate('/');
      }
    };
    
    loadInitialChannel();
  }, [initialChannelName, navigate, toast, isMinor, hasParentConsent]);

  // Fetch user profile and language preference
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabaseUntyped
        .from('profiles')
        .select('username, preferred_language, parent_email')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username);
        if (data.preferred_language) {
          setPreferredLanguage(data.preferred_language);
        }
        if (data.parent_email) {
          setParentEmail(data.parent_email);
        }
      }
    };
    fetchProfile();
  }, [user]);

  // Check ban/mute status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      const { data: ban } = await supabaseUntyped
        .from('bans')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      const { data: mute } = await supabaseUntyped
        .from('mutes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsBanned(!!ban);
      setIsMuted(!!mute);
    };
    checkStatus();
  }, [user]);

  // Check room-specific ban/mute status and ownership
  useEffect(() => {
    const checkRoomStatus = async () => {
      if (!user || !currentChannel) {
        setIsRoomBanned(false);
        setIsRoomMuted(false);
        setIsRoomOwner(false);
        setIsRoomAdmin(false);
        return;
      }
      
      // Check room ban
      const { data: roomBan } = await supabaseUntyped
        .from('room_bans')
        .select('*')
        .eq('channel_id', currentChannel.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Check room mute (including expired)
      const { data: roomMute } = await supabaseUntyped
        .from('room_mutes')
        .select('*')
        .eq('channel_id', currentChannel.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Check if room mute is expired
      const isExpiredMute = roomMute?.expires_at && new Date(roomMute.expires_at) < new Date();
      
      // Check if user is room admin
      const { data: roomAdmin } = await supabaseUntyped
        .from('room_admins')
        .select('*')
        .eq('channel_id', currentChannel.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsRoomBanned(!!roomBan);
      setIsRoomMuted(!!roomMute && !isExpiredMute);
      setIsRoomOwner(currentChannel.created_by === user.id);
      setIsRoomAdmin(!!roomAdmin || currentChannel.created_by === user.id);
    };
    checkRoomStatus();
  }, [user, currentChannel]);

  // State for room settings - can be any channel the user has access to
  const [settingsChannel, setSettingsChannel] = useState<Channel | null>(null);

  // Listen for room settings event
  useEffect(() => {
    const handleOpenRoomSettings = (e: CustomEvent<Channel>) => {
      if (e.detail) {
        // Store the channel being edited and show the modal
        setSettingsChannel(e.detail);
        setShowRoomSettings(true);
      }
    };
    
    window.addEventListener('openRoomSettings', handleOpenRoomSettings as EventListener);
    return () => {
      window.removeEventListener('openRoomSettings', handleOpenRoomSettings as EventListener);
    };
  }, []);

  // Fetch channel topic
  useEffect(() => {
    if (!currentChannel) return;

    const fetchTopic = async () => {
      const { data } = await supabaseUntyped
        .from('channel_settings')
        .select('topic')
        .eq('channel_id', currentChannel.id)
        .maybeSingle();
      setTopic(data?.topic || currentChannel.description || `Welcome to #${currentChannel.name}`);
    };
    fetchTopic();

    const channel = supabase
      .channel(`topic-${currentChannel.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channel_settings', filter: `channel_id=eq.${currentChannel.id}` },
        (payload) => {
          const newTopic = (payload.new as { topic: string }).topic;
          if (newTopic) setTopic(newTopic);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannel]);

  // Clear messages when switching channels - don't load history (ephemeral chat for users)
  useEffect(() => {
    if (!currentChannel) return;
    
    // Clear any existing messages and start fresh - chat is ephemeral for users
    setMessages([]);
    setLoading(false);
  }, [currentChannel]);

  // Subscribe to real-time messages for current channel
  useEffect(() => {
    if (!currentChannel) return;

    const channel = supabase
      .channel(`messages-${currentChannel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${currentChannel.id}` },
        async (payload) => {
          const newMessage = payload.new as Message;
          const { data: profile } = await supabaseUntyped
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();
          setMessages(prev => [...prev, { ...newMessage, profile: profile || undefined }]);
          
          // Broadcast to lobby mirror if this is #general
          if (currentChannel.name === 'general' && profile) {
            supabase.channel('general-lobby-mirror').send({
              type: 'broadcast',
              event: 'user-message',
              payload: { 
                username: profile.username, 
                content: newMessage.content, 
                avatarUrl: profile.avatar_url 
              }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${currentChannel.id}` },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChannel]);

  // Track which users are listening to radio
  const [listeningUsers, setListeningUsers] = useState<Map<string, { title: string; artist: string }>>(new Map());

  // Track presence
  useEffect(() => {
    // Don't track presence until user is loaded
    if (!user?.id) return;
    
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, async () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        const listening = new Map<string, { title: string; artist: string }>();
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: { user_id?: string; nowPlaying?: { title: string; artist: string } }) => {
            if (presence.user_id) {
              onlineIds.add(presence.user_id);
              if (presence.nowPlaying) {
                listening.set(presence.user_id, presence.nowPlaying);
              }
            }
          });
        });
        setOnlineUserIds(onlineIds);
        setListeningUsers(listening);
        
        // Fetch usernames for online users
        if (onlineIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('username')
            .in('user_id', Array.from(onlineIds));
          if (profiles) {
            setOnlineUsers(profiles.map(p => ({ username: p.username })));
          }
        } else {
          setOnlineUsers([]);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user?.id) {
          const nowPlaying = radio?.isPlaying && radio?.currentSong 
            ? { title: radio.currentSong.title, artist: radio.currentSong.artist }
            : undefined;
          await presenceChannel.track({ user_id: user.id, nowPlaying });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id]);

  // Update presence when radio state changes
  useEffect(() => {
    if (!user?.id) return;
    
    const updatePresence = async () => {
      const presenceChannel = supabase.channel('online-users');
      const nowPlaying = radio?.isPlaying && radio?.currentSong 
        ? { title: radio.currentSong.title, artist: radio.currentSong.artist }
        : undefined;
      await presenceChannel.track({ user_id: user.id, nowPlaying });
    };
    
    updatePresence();
  }, [user?.id, radio?.isPlaying, radio?.currentSong?.videoId]);

  const addSystemMessage = useCallback((content: string, channelId?: string) => {
    const targetChannelId = channelId || currentChannel?.id;
    if (!targetChannelId) return;
    const systemMsg: Message = {
      id: `system-${Date.now()}-${Math.random()}`,
      content,
      user_id: 'system',
      channel_id: targetChannelId,
      created_at: new Date().toISOString(),
      isSystem: true,
      profile: { username: 'System' }
    };
    setMessages(prev => [...prev, systemMsg]);
  }, [currentChannel?.id]);

  const addModeratorMessage = useCallback((content: string, channelName: string, channelId?: string) => {
    const targetChannelId = channelId || currentChannel?.id;
    if (!targetChannelId) return;
    const moderator = getModerator(channelName);
    const modMsg: Message = {
      id: `mod-${Date.now()}-${Math.random()}`,
      content,
      user_id: 'moderator',
      channel_id: targetChannelId,
      created_at: new Date().toISOString(),
      isModerator: true,
      profile: { username: `${moderator.avatar} ${moderator.name}` }
    };
    setMessages(prev => [...prev, modMsg]);
  }, [currentChannel?.id]);

  // Initialize trivia game hook
  const triviaGame = useTriviaGame(
    user?.id,
    username,
    currentChannel?.name,
    addModeratorMessage,
    addSystemMessage
  );

  // Art room hook
  const artCurator = useArtCurator();

  // Function to add simulated user messages (they look like real users)
  // Also broadcasts to lobby mirror if in #general
  const addBotMessage = useCallback((content: string, botUsername: string, avatarUrl?: string) => {
    if (!currentChannel?.id) return;
    const userMsg: Message = {
      id: `sim-${Date.now()}-${Math.random()}`,
      content,
      user_id: `sim-${botUsername}`,
      channel_id: currentChannel.id,
      created_at: new Date().toISOString(),
      profile: { 
        username: botUsername,
        avatar_url: avatarUrl || null
      }
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Broadcast to lobby mirror if this is #general
    if (currentChannel.name === 'general') {
      supabase.channel('general-lobby-mirror').send({
        type: 'broadcast',
        event: 'bot-message',
        payload: { username: botUsername, content, avatarUrl }
      });
    }
  }, [currentChannel?.id, currentChannel?.name]);

  // Chat bots - enabled per admin settings (allowed_channels in bot_settings)
  const chatBots = useChatBots({
    channelId: currentChannel?.id || null,
    channelName: currentChannel?.name || 'general',
    messages,
    addBotMessage,
    enabled: true, // Let useChatBots check allowed_channels from DB
  });

  // Bot migration system - bots randomly move between rooms
  const botMigration = useBotMigration({
    channelName: currentChannel?.name || 'general',
    addBotMessage,
    enabled: !!currentChannel,
  });

  // Skip vote system for radio
  const skipVote = useSkipVote({
    onSkip: () => {
      if (radio) {
        radio.skip();
      }
    },
    addBotMessage,
  });

  // Show personalized welcome message when entering a channel
  useEffect(() => {
    if (!currentChannel || loading || !user || !username) return;
    
    const handleWelcome = async () => {
      // Check if user has visited this channel before
      const { data: existingVisit } = await supabaseUntyped
        .from('user_channel_visits')
        .select('visit_count, last_visit_at')
        .eq('user_id', user.id)
        .eq('channel_name', currentChannel.name)
        .maybeSingle();
      
      const moderator = getModerator(currentChannel.name);
      let welcomeMsg: string;
      
      if (existingVisit) {
        // Returning user - personalized greeting
        const visitCount = existingVisit.visit_count;
        const lastVisit = new Date(existingVisit.last_visit_at);
        const now = new Date();
        const hoursSince = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60));
        
        // Generate personalized welcome back message
        const greetings = [
          `welcome back ${username}! how u been?`,
          `yo ${username}! good to see u again`,
          `hey ${username}! missed u, how r u?`,
          `${username}! ur back, whats good?`,
          `ayy ${username} welcome back! hows it going?`,
        ];
        
        const frequentGreetings = [
          `${username} my fav regular! whats up?`,
          `yo ${username}! u basically live here now lol`,
          `${username}! back for more i see 😏`,
        ];
        
        const longTimeGreetings = [
          `${username}!! where u been? missed u fr`,
          `omg ${username} its been forever! how u doing?`,
          `yo ${username} long time no see! everything good?`,
        ];
        
        if (hoursSince > 48) {
          welcomeMsg = longTimeGreetings[Math.floor(Math.random() * longTimeGreetings.length)];
        } else if (visitCount > 10) {
          welcomeMsg = frequentGreetings[Math.floor(Math.random() * frequentGreetings.length)];
        } else {
          welcomeMsg = greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // Update visit count
        await supabaseUntyped
          .from('user_channel_visits')
          .update({ 
            visit_count: visitCount + 1, 
            last_visit_at: new Date().toISOString(),
            username: username
          })
          .eq('user_id', user.id)
          .eq('channel_name', currentChannel.name);
      } else {
        // First time visitor
        welcomeMsg = getWelcomeMessage(currentChannel.name);
        
        // Record first visit
        await supabaseUntyped
          .from('user_channel_visits')
          .insert({
            user_id: user.id,
            channel_name: currentChannel.name,
            username: username
          });
      }
      
      const tipMsg = getRandomTip(currentChannel.name);
      
      // Small delay to let messages load first
      setTimeout(() => {
        addModeratorMessage(welcomeMsg, currentChannel.name, currentChannel.id);
        // Add tip after a brief moment
        setTimeout(() => {
          addModeratorMessage(tipMsg, currentChannel.name, currentChannel.id);
        }, 1500);
        
        // If this is the art room, fetch and display featured art
        if (currentChannel.name === 'art') {
          setTimeout(async () => {
            const featured = await artCurator.fetchFeaturedArt();
            if (featured) {
              // Add art message with special formatting
              const moderator = getModerator('art');
              const artMsg: Message = {
                id: `art-${Date.now()}`,
                content: `ART_DISPLAY:${JSON.stringify({
                  imageUrl: featured.image_url,
                  title: featured.piece.title,
                  artist: featured.piece.artist,
                  year: featured.piece.year,
                  period: featured.piece.period,
                  medium: featured.piece.medium,
                  commentary: featured.commentary
                })}`,
                user_id: 'moderator',
                channel_id: currentChannel.id,
                created_at: new Date().toISOString(),
                isModerator: true,
                profile: { username: `🎨 ${moderator.name}` }
              };
              setMessages(prev => [...prev, artMsg]);
            }
          }, 3000);
        }
      }, 500);
    };

    handleWelcome();
  }, [currentChannel?.id, loading, user?.id, username]);

  // Auto-translate messages from other users
  useEffect(() => {
    if (preferredLanguage === 'en') return; // Skip if user prefers English
    
    messages.forEach(async (msg) => {
      // Skip own messages, system messages, moderator messages, and already translated
      if (
        msg.user_id === user?.id || 
        msg.isSystem || 
        msg.isModerator || 
        msg.user_id === 'system' || 
        msg.user_id === 'moderator' ||
        translations[msg.id]
      ) return;
      
      // Check cache first
      const cached = getCachedTranslation(msg.id);
      if (cached) {
        setTranslations(prev => ({ 
          ...prev, 
          [msg.id]: { text: cached.translatedText, lang: cached.detectedLanguageName } 
        }));
        return;
      }
      
      // Translate the message
      const result = await translateMessage(msg.id, msg.content);
      if (result) {
        setTranslations(prev => ({ 
          ...prev, 
          [msg.id]: { text: result.translatedText, lang: result.detectedLanguageName } 
        }));
      }
    });
  }, [messages, preferredLanguage, user?.id, translateMessage, getCachedTranslation, translations]);

  // AI Moderator response logic - check if moderator should respond
  const shouldModeratorRespond = useCallback((message: string): boolean => {
    const lowerMsg = message.toLowerCase();
    const moderator = currentChannel ? getModerator(currentChannel.name) : null;
    const modName = moderator?.name.toLowerCase() || '';
    
    // Respond if mentioned by name or if it's a question
    if (lowerMsg.includes(modName) || lowerMsg.includes('@mod')) return true;
    if (lowerMsg.endsWith('?')) return Math.random() < 0.3; // 30% chance on questions
    return Math.random() < 0.05; // 5% chance on regular messages
  }, [currentChannel]);

  const triggerModeratorResponse = useCallback(async (userMessage: string) => {
    if (!currentChannel) return;
    
    try {
      const recentMsgs = messages.slice(-5).map(m => ({
        role: m.user_id === 'moderator' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await supabase.functions.invoke('ai-moderator', {
        body: {
          channelName: currentChannel.name,
          userMessage,
          recentMessages: recentMsgs
        }
      });

      if (response.error) {
        console.error('Moderator error:', response.error);
        return;
      }

      if (response.data?.response) {
        // Add slight delay to seem more natural
        setTimeout(() => {
          addModeratorMessage(response.data.response, currentChannel.name);
        }, 1000 + Math.random() * 2000);
      }
    } catch (error) {
      console.error('Failed to get moderator response:', error);
    }
  }, [currentChannel, messages, addModeratorMessage]);

  const handleChannelSelect = async (channel: Channel) => {
    // Check if minor without consent is trying to join adult channel
    if (isMinor && !hasParentConsent && isAdultChannel(channel.name)) {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Adult chat rooms require parental consent for users under 18. Please ask your parent/guardian to verify their email.",
      });
      return;
    }
    
    // Check if room has a password and user is not room owner
    if (channel.created_by !== user?.id && !isAdmin && !isOwner) {
      // Use secure server-side function to check if room has password
      const { data: hasPassword } = await supabaseUntyped
        .rpc('channel_has_password', { _channel_id: channel.id });
      
      if (hasPassword) {
        setPendingChannel(channel);
        setShowPasswordModal(true);
        return;
      }
    }
    
    setCurrentChannel(channel);
    setMessages([]); // Clear messages, will refetch
    navigate(`/chat/${channel.name}`);
  };

  const handleSend = async (content: string) => {
    if (!user || !role || !currentChannel) return;

    if (isBanned) {
      toast({
        variant: "destructive",
        title: "You are banned",
        description: "You cannot send messages while banned."
      });
      return;
    }

    // Handle commands
    if (isCommand(content)) {
      const parsed = parseCommand(content);
      if (!parsed) return;

      // Handle /clear locally
      if (parsed.command === 'clear') {
        setMessages([]);
        return;
      }

      // Handle /users locally
      if (parsed.command === 'users') {
        addSystemMessage(`**Online Users (${onlineUserIds.size}):** Check the member list on the right.`);
        return;
      }

      // Handle /join command
      if (parsed.command === 'join') {
        const channelName = parsed.args[0]?.replace('#', '');
        if (!channelName) {
          toast({ variant: "destructive", title: "Usage", description: "/join #channel-name" });
          return;
        }
        const { data: targetChannel } = await supabaseUntyped
          .from('channels')
          .select('*')
          .eq('name', channelName)
          .maybeSingle();
        if (targetChannel) {
          handleChannelSelect(targetChannel);
          toast({ title: "Switched channel", description: `Now in #${channelName}` });
        } else {
          toast({ variant: "destructive", title: "Channel not found", description: `#${channelName} doesn't exist.` });
        }
        return;
      }

      // Handle /part command
      if (parsed.command === 'part') {
        const { data: generalChannel } = await supabaseUntyped
          .from('channels')
          .select('*')
          .eq('name', 'general')
          .single();
        if (generalChannel) {
          handleChannelSelect(generalChannel);
          toast({ title: "Left channel", description: "Returned to #general" });
        }
        return;
      }

      const context: CommandContext = {
        userId: user.id,
        username,
        role: role as CommandContext['role'],
        isAdmin,
        isOwner,
        channelId: currentChannel?.id,
        channelOwnerId: currentChannel?.created_by || undefined,
        isRoomOwner,
        isRoomAdmin,
        onlineUserCount: onlineUserIds.size,
      };

      const result = await executeCommand(parsed.command, parsed.args, context);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Command failed",
          description: result.message
        });
        return;
      }

      // Check if this is a PM request
      if (result.message.startsWith('PM_REQUEST:')) {
        const parts = result.message.split(':');
        const targetUserId = parts[1];
        const targetUsername = parts[2];
        privateChats.openChat(targetUserId, targetUsername);
        return;
      }

      // Check if this is an invite command
      if (result.message.startsWith('INVITE_COMMAND:')) {
        const parts = result.message.split(':');
        const targetUserId = parts[1];
        const targetUsername = parts[2];
        
        const success = await sendRoomInvite(
          user.id,
          username,
          targetUserId,
          currentChannel.name,
          currentChannel.id
        );
        
        if (success) {
          addSystemMessage(`📨 Invite sent to ${targetUsername} for #${currentChannel.name}`);
        } else {
          toast({ variant: "destructive", title: "Failed to send invite" });
        }
        return;
      }

      // Handle radio commands
      if (result.message.startsWith('RADIO_COMMAND:')) {
        const action = result.message.split(':')[1];
        if (radio) {
          switch (action) {
            case 'toggle':
              radio.toggle();
              break;
            case 'play':
              radio.play();
              break;
            case 'pause':
              radio.pause();
              break;
            case 'skip':
              radio.skip();
              break;
            case 'nowplaying':
              const song = radio.currentSong;
              if (song && radio.isPlaying) {
                addSystemMessage(`🎵 Now playing: **${song.title}** by ${song.artist}`);
              } else {
                addSystemMessage(`📻 Radio is not playing. Type /radio to start.`);
              }
              break;
          }
        } else {
          addSystemMessage(`📻 Radio is not available.`);
        }
        return;
      }

      // Handle skip vote command (user-initiated vote to skip)
      if (result.message.startsWith('SKIP_VOTE_COMMAND:')) {
        const parts = result.message.split(':');
        const initiatorId = parts[1];
        const initiatorUsername = parts[2];
        
        if (!radio?.isPlaying) {
          addSystemMessage('📻 Radio is not playing. Nothing to skip!');
          return;
        }
        
        const voteResult = skipVote.initiateVote(initiatorId, initiatorUsername);
        if (!voteResult.success) {
          addSystemMessage(voteResult.message);
        }
        return;
      }

      // Handle trivia commands
      if (result.message.startsWith('TRIVIA_COMMAND:')) {
        const action = result.message.split(':')[1];
        switch (action) {
          case 'start':
            triviaGame.startTrivia();
            break;
          case 'score':
            triviaGame.showScore();
            break;
          case 'leaderboard':
            triviaGame.showLeaderboard();
            break;
          case 'skip':
            triviaGame.skipQuestion();
            break;
        }
        return;
      }

      // Handle art commands
      if (result.message.startsWith('ART_COMMAND:')) {
        if (currentChannel?.name !== 'art') {
          addSystemMessage('Art commands only work in the #art channel.');
          return;
        }
        const action = result.message.split(':')[1];
        if (action === 'new') {
          addSystemMessage('Fetching a new masterpiece...');
          const featured = await artCurator.fetchFeaturedArt();
          if (featured) {
            const moderator = getModerator('art');
            const artMsg: Message = {
              id: `art-${Date.now()}`,
              content: `ART_DISPLAY:${JSON.stringify({
                imageUrl: featured.image_url,
                title: featured.piece.title,
                artist: featured.piece.artist,
                year: featured.piece.year,
                period: featured.piece.period,
                medium: featured.piece.medium,
                commentary: featured.commentary
              })}`,
              user_id: 'moderator',
              channel_id: currentChannel.id,
              created_at: new Date().toISOString(),
              isModerator: true,
              profile: { username: `🎨 ${moderator.name}` }
            };
            setMessages(prev => [...prev, artMsg]);
          } else {
            addSystemMessage('No art pieces available at the moment. Try again later!');
          }
        }
        return;
      }

      // Handle role refresh after oper command
      if (result.refreshRole) {
        await refreshRole();
      }

      if (result.isSystemMessage && !result.broadcast) {
        addSystemMessage(result.message);
      } else if (result.broadcast) {
        await supabaseUntyped
          .from('messages')
          .insert({
            content: result.message,
            user_id: user.id,
            channel_id: currentChannel.id
          });
      }
      return;
    }

    // Check if this is a vote for the skip vote system
    if (skipVote.isVoteActive) {
      const wasVote = skipVote.castVote(user.id, username, content);
      if (wasVote) {
        // Don't send "yes" as a regular message if it was a vote
        return;
      }
    }

    if (isMuted || isRoomMuted) {
      toast({
        variant: "destructive",
        title: "You are muted",
        description: "You cannot send messages while muted."
      });
      return;
    }

    // Content moderation for non-18+ users
    let finalContent = content;
    const channelName = currentChannel.name || 'general';
    const isInAdultChannel = isAdultChannel(channelName);
    
    if (!isInAdultChannel) {
      // Check if message should be blocked entirely
      if (shouldBlockMessage(content)) {
        toast({
          variant: "destructive",
          title: "Message blocked",
          description: "Your message contains inappropriate content."
        });
        return;
      }
      
      // Moderate content (filter URLs and profanity) with channel-specific settings
      const modResult = moderateContent(content, channelName, false, moderationSettings);
      finalContent = modResult.filteredMessage;
      
      // Show warning if content was filtered
      if (modResult.warnings.length > 0) {
        toast({
          title: "Content filtered",
          description: modResult.warnings.join('. '),
          variant: "default"
        });
      }
    }

    await supabaseUntyped
      .from('messages')
      .insert({
        content: finalContent,
        user_id: user.id,
        channel_id: currentChannel.id
      });

    // Check if this is a trivia answer (only in trivia channel with active question)
    if (triviaGame.isTriviaChannel && triviaGame.gameState.currentQuestion) {
      const wasCorrect = await triviaGame.checkTriviaAnswer(finalContent, username);
      if (wasCorrect) {
        // Answer was correct, trivia hook handles the response
        return;
      }
    }

    // Check if moderator should respond
    if (shouldModeratorRespond(finalContent)) {
      triggerModeratorResponse(finalContent);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (messageId.startsWith('system-')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return;
    }
    await supabaseUntyped
      .from('messages')
      .delete()
      .eq('id', messageId);
  };

  // User action handlers for MessageBubble dropdown
  const handlePmClick = (userId: string, targetUsername: string) => {
    privateChats.openChat(userId, targetUsername);
  };

  const handleBlockClick = (userId: string, username: string) => {
    // For now, just show a toast - could implement actual blocking later
    toast({
      title: "User blocked",
      description: `${username} has been blocked. You won't see their messages.`
    });
  };

  const handleReportClick = (userId: string, username: string) => {
    toast({
      title: "User reported",
      description: `${username} has been reported to moderators.`
    });
  };

  const handleInfoClick = async (userId: string, username: string) => {
    // Fetch user info and display
    const { data: roleData } = await supabaseUntyped
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    const userRole = roleData?.role || 'user';
    addSystemMessage(`**User Info: ${username}**\nRole: ${userRole}`);
  };

  if (isBanned) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center text-center p-6">
        <div className="h-16 w-16 rounded-xl bg-destructive/20 flex items-center justify-center mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">You are banned</h1>
        <p className="text-muted-foreground">Contact an administrator if you believe this is a mistake.</p>
      </div>
    );
  }

  if (isRoomBanned && currentChannel) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden lg:block">
          <ChannelList 
            currentChannelId={currentChannel?.id} 
            onChannelSelect={handleChannelSelect}
            autoSelectFirst={false}
          />
        </div>
        <div className="flex flex-col flex-1 items-center justify-center text-center p-4 sm:p-6">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-destructive/20 flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">🚪</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Banned from #{currentChannel.name}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">You have been banned from this room by the room owner.</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Select a different channel to continue chatting.</p>
          <Button 
            variant="outline" 
            className="mt-4 lg:hidden"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Mobile overlay when sidebar is open */}
      {(showChannelSidebar || showMemberSidebar) && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => {
            setShowChannelSidebar(false);
            setShowMemberSidebar(false);
          }}
        />
      )}

      {/* Channel Sidebar - Hidden on mobile unless toggled */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-40 transition-transform duration-300 lg:transition-none",
        showChannelSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <ChatSidebar
          currentChannelId={currentChannel?.id} 
          onChannelSelect={(channel) => {
            handleChannelSelect(channel);
            setShowChannelSidebar(false);
          }}
          autoSelectFirst={false}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-border bg-card lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChannelSidebar(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">#{currentChannel?.name || 'general'}</p>
          </div>
          {/* DND Toggle for Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={privateChats.toggleDoNotDisturb}
            className={cn(
              "h-9 w-9",
              privateChats.doNotDisturb && "bg-amber-500/20 text-amber-500"
            )}
          >
            {privateChats.doNotDisturb ? (
              <BellOff className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMemberSidebar(true)}
            className="h-9 w-9"
          >
            <Users className="h-5 w-5" />
            <span className="sr-only">Members</span>
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <ChatHeader 
            onlineCount={onlineUserIds.size || 1}
            topic={topic}
            channelName={currentChannel?.name || 'general'}
            onLanguageClick={() => setShowLanguageModal(true)}
            currentLanguage={preferredLanguage}
            doNotDisturb={privateChats.doNotDisturb}
            onToggleDND={privateChats.toggleDoNotDisturb}
          />
        </div>

        {/* Minor Restriction Banner */}
        {isMinor && !hasParentConsent && (
          <MinorRestrictionBanner parentEmail={parentEmail} />
        )}
        
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col relative">
          {/* Transparent logo watermark - theme aware */}
          {theme === 'retro80s' ? (
            <RetroWatermark />
          ) : theme === 'valentines' ? (
            <ValentinesWatermark />
          ) : theme === 'stpatricks' ? (
            <StPatricksWatermark />
          ) : theme === 'matrix' ? (
            <MatrixWatermark />
          ) : (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{
                backgroundImage: 'url(/justachat-logo-google-ads.png)',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '300px',
                opacity: 0.15
              }}
            />
          )}
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="h-8 w-8 rounded-xl jac-gradient-bg animate-pulse" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <p>No messages in #{currentChannel?.name || 'general'} yet.</p>
              <p className="text-sm mt-2">Be the first to say hello! Type /help for commands.</p>
            </div>
          ) : (
            <div className="mt-auto space-y-2 sm:space-y-3">
              {messages.map((msg) => {
                // Check if this is an art display message
                if (msg.content.startsWith('ART_DISPLAY:')) {
                  try {
                    const artData = JSON.parse(msg.content.replace('ART_DISPLAY:', ''));
                    return (
                      <div key={msg.id} className="flex justify-start animate-message-in">
                        <ArtDisplay
                          imageUrl={artData.imageUrl}
                          title={artData.title}
                          artist={artData.artist}
                          year={artData.year}
                          period={artData.period}
                          medium={artData.medium}
                          commentary={artData.commentary}
                        />
                      </div>
                    );
                  } catch {
                    // If parsing fails, render as normal message
                  }
                }
                
                return (
                  <MessageBubble
                    key={msg.id}
                    id={msg.id}
                    message={msg.content}
                    sender={msg.profile?.username || 'Unknown'}
                    senderId={msg.user_id}
                    senderAvatarUrl={msg.profile?.avatar_url}
                    timestamp={new Date(msg.created_at)}
                    isOwn={msg.user_id === user?.id}
                    isSystem={msg.isSystem || msg.user_id === 'system'}
                    isModerator={msg.isModerator || msg.user_id === 'moderator'}
                    canDelete={(msg.user_id === user?.id || isAdmin) && !msg.isModerator && msg.user_id !== 'moderator'}
                    onDelete={handleDelete}
                    onPmClick={handlePmClick}
                    onBlockClick={handleBlockClick}
                    onReportClick={handleReportClick}
                    onInfoClick={handleInfoClick}
                    translatedMessage={translations[msg.id]?.text}
                    detectedLanguage={translations[msg.id]?.lang}
                    isTranslating={isTranslating(msg.id)}
                  />
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Floating Room Switcher Button for Mobile */}
        {isMobile && (
          <Sheet open={showRoomSheet} onOpenChange={setShowRoomSheet}>
            <SheetTrigger asChild>
              <Button
                variant="jac"
                size="icon"
                className="fixed bottom-24 right-4 h-12 w-12 rounded-full shadow-lg z-30"
              >
                <Hash className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-left">Switch Room</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-60px)] overflow-hidden">
                <ChannelList 
                  currentChannelId={currentChannel?.id} 
                  onChannelSelect={(channel) => {
                    handleChannelSelect(channel);
                    setShowRoomSheet(false);
                  }}
                  autoSelectFirst={false}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <ChatInput 
          onSend={handleSend} 
          isMuted={isMuted || isRoomMuted} 
          canControlRadio={isAdmin || isOwner} 
          onlineUsers={onlineUsers}
          radioListenerCount={listeningUsers.size}
        />
      </div>

      {/* Member Sidebar - Hidden on mobile unless toggled */}
      <div className={cn(
        "fixed lg:relative inset-y-0 right-0 z-40 transition-transform duration-300 lg:transition-none",
        showMemberSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMemberSidebar(false)}
          className="absolute top-2 right-2 h-8 w-8 lg:hidden z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        <MemberList 
          onlineUserIds={onlineUserIds} 
          listeningUsers={listeningUsers}
          channelName={currentChannel?.name} 
          onOpenPm={handleOpenPm}
          onOpenBotPm={handleOpenBotPm}
          onAction={(targetUsername, actionMessage) => handleSend(actionMessage)}
        />
      </div>


      {/* Private Chat Windows - Only active (non-minimized) */}
      {privateChats.activeChats.map(chat => (
        <PrivateChatWindow
          key={chat.id}
          targetUserId={chat.targetUserId}
          targetUsername={chat.targetUsername}
          currentUserId={privateChats.currentUserId}
          currentUsername={privateChats.currentUsername}
          onClose={() => privateChats.closeChat(chat.id)}
          onMinimize={() => privateChats.minimizeChat(chat.id)}
          onNewMessage={() => privateChats.setUnread(chat.id)}
          initialPosition={chat.position}
          zIndex={chat.zIndex}
          onFocus={() => privateChats.bringToFront(chat.id)}
        />
      ))}

      {/* Bot Chat Windows - Draggable moderator conversations */}
      {botChats.activeChats.map(chat => (
        <BotChatWindow
          key={chat.id}
          moderator={chat.moderator}
          channelName={chat.channelName}
          currentUsername={username}
          onClose={() => botChats.closeChat(chat.id)}
          onMinimize={() => botChats.minimizeChat(chat.id)}
          initialPosition={chat.position}
          zIndex={chat.zIndex}
          onFocus={() => botChats.bringToFront(chat.id)}
        />
      ))}

      {/* PM Minimize Tray - DND toggle moved to header/sidebar */}
      <PMTray
        minimizedChats={privateChats.minimizedChats}
        onRestore={(chatId) => privateChats.restoreChat(chatId)}
        onClose={(chatId) => privateChats.closeChat(chatId)}
        onReorder={(fromIndex, toIndex) => privateChats.reorderChats(fromIndex, toIndex)}
      />

      {/* Bot Chat Minimize Tray */}
      <BotTray
        minimizedChats={botChats.minimizedChats}
        onRestore={(chatId) => botChats.restoreChat(chatId)}
        onClose={(chatId) => botChats.closeChat(chatId)}
      />

      {/* Friends Tray - floating minimizable friends list */}
      {user && (
        <FriendsTray
          currentUserId={user.id}
          onOpenPm={handleOpenPm}
        />
      )}

      {/* Room Invite Popup */}
      {user && (
        <RoomInvitePopup 
          userId={user.id} 
          currentRoomName={currentChannel?.name}
        />
      )}

      {/* Language Settings Modal */}
      {user && (
        <LanguageSettingsModal
          open={showLanguageModal}
          onOpenChange={setShowLanguageModal}
          userId={user.id}
          currentLanguage={preferredLanguage}
          onLanguageChange={setPreferredLanguage}
        />
      )}
      
      {/* Room Settings Modal - can be opened for any channel the user owns or is admin of */}
      {user && settingsChannel && (
        <RoomSettingsModal
          open={showRoomSettings}
          onOpenChange={(open) => {
            setShowRoomSettings(open);
            if (!open) setSettingsChannel(null);
          }}
          channel={settingsChannel}
          userId={user.id}
        />
      )}
      
      {/* Room Password Modal */}
      {pendingChannel && (
        <RoomPasswordModal
          open={showPasswordModal}
          onOpenChange={(open) => {
            setShowPasswordModal(open);
            if (!open) setPendingChannel(null);
          }}
          roomName={pendingChannel.name}
          onPasswordSubmit={async (password) => {
            // Verify password server-side (no password exposure)
            const { data: isValid } = await supabaseUntyped
              .rpc('verify_room_password', { 
                _channel_id: pendingChannel.id, 
                _password: password 
              });
            
            if (isValid) {
              setShowPasswordModal(false);
              setCurrentChannel(pendingChannel);
              navigate(`/chat/${pendingChannel.name}`);
              setPendingChannel(null);
            } else {
              toast({ variant: "destructive", title: "Incorrect password" });
            }
          }}
        />
      )}
    </div>
  );
};

export default ChatRoom;
