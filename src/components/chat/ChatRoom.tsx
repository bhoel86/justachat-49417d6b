import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useTriviaGame } from "@/hooks/useTriviaGame";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import MemberList from "./MemberList";
import ChannelList, { Channel } from "./ChannelList";
import PrivateMessageModal from "./PrivateMessageModal";
import LanguageSettingsModal from "@/components/profile/LanguageSettingsModal";
import { useRadioOptional } from "@/contexts/RadioContext";
import { parseCommand, executeCommand, isCommand, CommandContext } from "@/lib/commands";
import { getModerator, getWelcomeMessage, getRandomTip } from "@/lib/roomConfig";

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
  initialChannelId?: string;
}

const ChatRoom = ({ initialChannelId }: ChatRoomProps) => {
  const { user, isAdmin, isOwner, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [topic, setTopic] = useState('Welcome to JAC!');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [username, setUsername] = useState('');
  const [pmTarget, setPmTarget] = useState<{ userId: string; username: string } | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [translations, setTranslations] = useState<Record<string, { text: string; lang: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const radio = useRadioOptional();
  
  const { translateMessage, isTranslating, getCachedTranslation } = useTranslation(preferredLanguage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial channel from URL parameter
  useEffect(() => {
    if (!initialChannelId) return;
    
    const loadInitialChannel = async () => {
      const { data } = await supabaseUntyped
        .from('channels')
        .select('*')
        .eq('id', initialChannelId)
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
  }, [initialChannelId, navigate, toast]);

  // Fetch user profile and language preference
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabaseUntyped
        .from('profiles')
        .select('username, preferred_language')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username);
        if (data.preferred_language) {
          setPreferredLanguage(data.preferred_language);
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

  // Fetch messages for current channel
  useEffect(() => {
    if (!currentChannel) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabaseUntyped
        .from('messages')
        .select(`id, content, user_id, created_at, channel_id`)
        .eq('channel_id', currentChannel.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        const userIds = [...new Set(data.map((msg: Message) => msg.user_id))];
        let profileMap = new Map();
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabaseUntyped
            .from('profiles')
            .select('user_id, username, avatar_url')
            .in('user_id', userIds);
          profileMap = new Map(profiles?.map((p: { user_id: string; username: string; avatar_url?: string | null }) => [p.user_id, p]) || []);
        }

        setMessages(data.map((msg: Message) => ({
          ...msg,
          profile: profileMap.get(msg.user_id) as { username: string } | undefined
        })));
      }
      setLoading(false);
    };
    fetchMessages();
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

  // Track presence
  useEffect(() => {
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: user?.id || 'anonymous' } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: { user_id?: string }) => {
            if (presence.user_id) onlineIds.add(presence.user_id);
          });
        });
        setOnlineUserIds(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user?.id });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id]);

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

  // Show welcome message and tip when entering a channel
  useEffect(() => {
    if (!currentChannel || loading) return;
    
    // Add welcome message from moderator
    const welcomeMsg = getWelcomeMessage(currentChannel.name);
    const tipMsg = getRandomTip(currentChannel.name);
    
    // Small delay to let messages load first
    const timer = setTimeout(() => {
      addModeratorMessage(welcomeMsg, currentChannel.name, currentChannel.id);
      // Add tip after a brief moment
      setTimeout(() => {
        addModeratorMessage(tipMsg, currentChannel.name, currentChannel.id);
      }, 1500);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentChannel?.id, loading]);

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

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setMessages([]); // Clear messages, will refetch
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
        setPmTarget({ userId: targetUserId, username: targetUsername });
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

    if (isMuted) {
      toast({
        variant: "destructive",
        title: "You are muted",
        description: "You cannot send messages while muted."
      });
      return;
    }

    await supabaseUntyped
      .from('messages')
      .insert({
        content,
        user_id: user.id,
        channel_id: currentChannel.id
      });

    // Check if this is a trivia answer (only in trivia channel with active question)
    if (triviaGame.isTriviaChannel && triviaGame.gameState.currentQuestion) {
      const wasCorrect = await triviaGame.checkTriviaAnswer(content, username);
      if (wasCorrect) {
        // Answer was correct, trivia hook handles the response
        return;
      }
    }

    // Check if moderator should respond
    if (shouldModeratorRespond(content)) {
      triggerModeratorResponse(content);
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
  const handlePmClick = (userId: string, username: string) => {
    setPmTarget({ userId, username });
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

  return (
    <div className="flex h-screen bg-background">
      {/* Channel Sidebar */}
      <ChannelList 
        currentChannelId={currentChannel?.id} 
        onChannelSelect={handleChannelSelect}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <ChatHeader 
          onlineCount={onlineUserIds.size || 1} 
          topic={topic}
          channelName={currentChannel?.name || 'general'}
          onLanguageClick={() => setShowLanguageModal(true)}
          currentLanguage={preferredLanguage}
        />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 rounded-xl jac-gradient-bg animate-pulse" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No messages in #{currentChannel?.name || 'general'} yet.</p>
              <p className="text-sm mt-2">Be the first to say hello! Type /help for commands.</p>
            </div>
          ) : (
            messages.map((msg) => (
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSend={handleSend} isMuted={isMuted} />
      </div>

      {/* Member Sidebar */}
      <MemberList onlineUserIds={onlineUserIds} channelName={currentChannel?.name} />

      {/* Private Message Modal */}
      {pmTarget && user && (
        <PrivateMessageModal
          isOpen={!!pmTarget}
          onClose={() => setPmTarget(null)}
          targetUserId={pmTarget.userId}
          targetUsername={pmTarget.username}
          currentUserId={user.id}
          currentUsername={username}
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
    </div>
  );
};

export default ChatRoom;
