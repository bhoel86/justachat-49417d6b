import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, supabaseUntyped } from "@/hooks/useAuth";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import MemberList from "./MemberList";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    username: string;
  };
}

const ChatRoom = () => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabaseUntyped
        .from('messages')
        .select(`
          id,
          content,
          user_id,
          created_at
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        // Fetch profiles separately
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
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch the profile for the new message
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
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
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

  // Track presence for online users
  useEffect(() => {
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user?.id || 'anonymous'
        }
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: { user_id?: string }) => {
            if (presence.user_id) {
              onlineIds.add(presence.user_id);
            }
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

  const handleSend = async (content: string) => {
    if (!user) return;

    await supabaseUntyped
      .from('messages')
      .insert({
        content,
        user_id: user.id
      });
  };

  const handleDelete = async (messageId: string) => {
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

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        <ChatHeader onlineCount={onlineUserIds.size || 1} />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Be the first to say hello!</p>
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
                canDelete={msg.user_id === user?.id || isAdmin}
                onDelete={handleDelete}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSend={handleSend} />
      </div>

      {/* Member Sidebar */}
      <MemberList onlineUserIds={onlineUserIds} />
    </div>
  );
};

export default ChatRoom;
