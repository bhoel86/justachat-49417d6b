import { useState } from 'react';
import { Hash, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChannelList, { Channel } from './ChannelList';
import FriendsList from '@/components/friends/FriendsList';
import { Badge } from '@/components/ui/badge';

type SidebarTab = 'channels' | 'friends';

interface ChatSidebarProps {
  currentChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  autoSelectFirst?: boolean;
  currentUserId: string;
  onOpenPm: (userId: string, username: string) => void;
  pendingFriendRequestCount?: number;
}

const ChatSidebar = ({
  currentChannelId,
  onChannelSelect,
  autoSelectFirst,
  currentUserId,
  onOpenPm,
  pendingFriendRequestCount = 0,
}: ChatSidebarProps) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('channels');

  return (
    <div className="w-48 h-full bg-card/50 border-r border-border flex flex-col">
      {/* Tab Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('channels')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
            activeTab === 'channels'
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Hash className="h-3.5 w-3.5" />
          <span>Rooms</span>
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative",
            activeTab === 'friends'
              ? "bg-primary/10 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Friends</span>
          {pendingFriendRequestCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[9px]"
            >
              {pendingFriendRequestCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'channels' ? (
          <ChannelList
            currentChannelId={currentChannelId}
            onChannelSelect={onChannelSelect}
            autoSelectFirst={autoSelectFirst}
          />
        ) : (
          <FriendsList
            currentUserId={currentUserId}
            onOpenPm={onOpenPm}
          />
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
