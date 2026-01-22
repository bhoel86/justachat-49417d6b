import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import MemberList from "./MemberList";
import ChannelList, { Channel } from "./ChannelList";
import { parseCommand, executeCommand, isCommand, CommandContext } from "@/lib/commands";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  channel_id: string;
  isSystem?: boolean;
  profile?: {
    username: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabaseUntyped
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setUsername(data.username);
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
            .select('user_id, username')
            .in('user_id', userIds);
          profileMap = new Map(profiles?.map((p: { user_id: string; username: string }) => [p.user_id, p]) || []);
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
            .select('username')
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

  const addSystemMessage = (content: string) => {
    if (!currentChannel) return;
    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      content,
      user_id: 'system',
      channel_id: currentChannel.id,
      created_at: new Date().toISOString(),
      isSystem: true,
      profile: { username: 'System' }
    };
    setMessages(prev => [...prev, systemMsg]);
  };

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
                timestamp={new Date(msg.created_at)}
                isOwn={msg.user_id === user?.id}
                isSystem={msg.isSystem || msg.user_id === 'system'}
                canDelete={msg.user_id === user?.id || isAdmin}
                onDelete={handleDelete}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSend={handleSend} isMuted={isMuted} />
      </div>

      {/* Member Sidebar */}
      <MemberList onlineUserIds={onlineUserIds} />
    </div>
  );
};

export default ChatRoom;
