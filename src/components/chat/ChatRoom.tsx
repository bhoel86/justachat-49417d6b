import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import MemberList from "./MemberList";
import { parseCommand, executeCommand, isCommand, CommandContext } from "@/lib/commands";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  isSystem?: boolean;
  profile?: {
    username: string;
  };
}

const ChatRoom = () => {
  const { user, isAdmin, isOwner, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('Welcome to JAC!');
  const [isBanned, setIsBanned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const fetchTopic = async () => {
      const { data } = await supabaseUntyped
        .from('channel_settings')
        .select('topic')
        .eq('channel_name', 'general')
        .maybeSingle();
      if (data?.topic) setTopic(data.topic);
    };
    fetchTopic();

    // Subscribe to topic changes
    const channel = supabase
      .channel('topic-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channel_settings' },
        (payload) => {
          const newTopic = (payload.new as { topic: string }).topic;
          if (newTopic) setTopic(newTopic);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabaseUntyped
        .from('messages')
        .select(`id, content, user_id, created_at`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        const userIds = [...new Set(data.map((msg: Message) => msg.user_id))];
        const { data: profiles } = await supabaseUntyped
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map((p: { user_id: string; username: string }) => [p.user_id, p]) || []);

        setMessages(data.map((msg: Message) => ({
          ...msg,
          profile: profileMap.get(msg.user_id) as { username: string } | undefined
        })));
      }
      setLoading(false);
    };
    fetchMessages();
  }, []);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
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
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    const systemMsg: Message = {
      id: `system-${Date.now()}`,
      content,
      user_id: 'system',
      created_at: new Date().toISOString(),
      isSystem: true,
      profile: { username: 'System' }
    };
    setMessages(prev => [...prev, systemMsg]);
  };

  const handleSend = async (content: string) => {
    if (!user || !role) return;

    // Check if banned
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
        const onlineList = Array.from(onlineUserIds).join(', ') || 'No users online';
        addSystemMessage(`**Online Users (${onlineUserIds.size}):** Check the member list on the right.`);
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
        // Local-only system message
        addSystemMessage(result.message);
      } else if (result.broadcast) {
        // Broadcast as a message (e.g., /me or moderation actions)
        await supabaseUntyped
          .from('messages')
          .insert({
            content: result.message,
            user_id: user.id
          });
      }
      return;
    }

    // Check if muted
    if (isMuted) {
      toast({
        variant: "destructive",
        title: "You are muted",
        description: "You cannot send messages while muted."
      });
      return;
    }

    // Regular message
    await supabaseUntyped
      .from('messages')
      .insert({
        content,
        user_id: user.id
      });
  };

  const handleDelete = async (messageId: string) => {
    // Don't delete system messages
    if (messageId.startsWith('system-')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return;
    }
    
    await supabaseUntyped
      .from('messages')
      .delete()
      .eq('id', messageId);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

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
      <div className="flex flex-col flex-1">
        <ChatHeader onlineCount={onlineUserIds.size || 1} topic={topic} />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Be the first to say hello!</p>
              <p className="text-sm mt-2">Type /help for available commands</p>
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

      <MemberList onlineUserIds={onlineUserIds} />
    </div>
  );
};

export default ChatRoom;
