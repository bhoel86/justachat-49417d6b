import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, Users, Plus, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChannel {
  id: string;
  name: string;
  userCount: number;
}

interface VoiceChannelListProps {
  onJoinChannel: (channelId: string, channelName: string) => void;
  currentChannelId?: string;
}

const DEFAULT_VOICE_CHANNELS: VoiceChannel[] = [
  { id: 'voice-lounge', name: 'Voice Lounge', userCount: 0 },
  { id: 'voice-gaming', name: 'Gaming Chat', userCount: 0 },
  { id: 'voice-music', name: 'Music Room', userCount: 0 },
  { id: 'voice-chill', name: 'Chill Zone', userCount: 0 },
];

export default function VoiceChannelList({ onJoinChannel, currentChannelId }: VoiceChannelListProps) {
  const [channels, setChannels] = useState<VoiceChannel[]>(DEFAULT_VOICE_CHANNELS);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  // Subscribe to presence for each channel
  useEffect(() => {
    const subscriptions: ReturnType<typeof supabase.channel>[] = [];

    channels.forEach(channel => {
      const sub = supabase.channel(`voice:${channel.id}`)
        .on('presence', { event: 'sync' }, () => {
          const state = sub.presenceState();
          setUserCounts(prev => ({
            ...prev,
            [channel.id]: Object.keys(state).length,
          }));
        })
        .subscribe();
      
      subscriptions.push(sub);
    });

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, [channels]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Headphones className="h-5 w-5 text-primary" />
          Voice Channels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {channels.map(channel => {
          const count = userCounts[channel.id] || 0;
          const isActive = currentChannelId === channel.id;
          
          return (
            <button
              key={channel.id}
              onClick={() => !isActive && onJoinChannel(channel.id, channel.name)}
              className={cn(
                "w-full p-3 rounded-lg flex items-center gap-3 transition-all",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 ring-1 ring-primary/50"
              )}
            >
              <div className={cn(
                "p-2 rounded-full",
                count > 0 ? "bg-green-500/20" : "bg-muted"
              )}>
                <Volume2 className={cn(
                  "h-4 w-4",
                  count > 0 ? "text-green-500" : "text-muted-foreground"
                )} />
              </div>
              
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{channel.name}</div>
                {count > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {count} {count === 1 ? 'user' : 'users'}
                  </div>
                )}
              </div>
              
              {isActive && (
                <div className="px-2 py-0.5 bg-green-500 rounded text-xs text-white font-medium">
                  Connected
                </div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
