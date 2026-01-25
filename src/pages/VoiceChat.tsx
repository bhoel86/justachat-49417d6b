import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Headphones, MessageSquare } from 'lucide-react';
import VoiceRoom from '@/components/voice/VoiceRoom';
import VoiceChannelList from '@/components/voice/VoiceChannelList';

export default function VoiceChat() {
  const { user, loading } = useAuth();
  const [currentChannel, setCurrentChannel] = useState<{ id: string; name: string } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 rounded-xl jac-gradient-bg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Headphones className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Sign in Required</h1>
          <p className="text-muted-foreground">Please sign in to use voice chat</p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Voice Chat
              </h1>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Chat
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Channel List */}
          <div className="space-y-4">
            <VoiceChannelList
              onJoinChannel={(id, name) => setCurrentChannel({ id, name })}
              currentChannelId={currentChannel?.id}
            />
            
            <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">Voice Chat Tips</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to talk</li>
                <li>Click settings for video effects</li>
                <li>Green screen requires green background</li>
              </ul>
            </div>
          </div>

          {/* Voice Room */}
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 min-h-[500px]">
            {currentChannel ? (
              <VoiceRoom
                roomId={currentChannel.id}
                roomName={currentChannel.name}
                onLeave={() => setCurrentChannel(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <Headphones className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <h2 className="text-xl font-semibold">Select a Voice Channel</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Choose a voice channel from the list to start chatting with others in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
