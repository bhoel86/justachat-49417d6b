import { useState, useEffect } from 'react';
import { Users, UserPlus, UserX, MessageCircle, Ban, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFriends, Friend, FriendRequest, BlockedUser } from '@/hooks/useFriends';
import { cn } from '@/lib/utils';

interface FriendsListProps {
  currentUserId: string;
  onOpenPm: (userId: string, username: string) => void;
  onCountsChange?: (counts: { total: number; online: number; pending: number }) => void;
}

const FriendsList = ({ currentUserId, onOpenPm, onCountsChange }: FriendsListProps) => {
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    loading,
    onlineFriendIds,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    unblockUser,
  } = useFriends(currentUserId);

  const [showRequests, setShowRequests] = useState(true);
  const [showBlocked, setShowBlocked] = useState(false);

  // Sort friends: online first
  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = onlineFriendIds.has(a.friendId);
    const bOnline = onlineFriendIds.has(b.friendId);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.username.localeCompare(b.username);
  });

  const onlineFriendsCount = friends.filter(f => onlineFriendIds.has(f.friendId)).length;
  const pendingCount = incomingRequests.length;

  // Report counts to parent component
  useEffect(() => {
    onCountsChange?.({
      total: friends.length,
      online: onlineFriendsCount,
      pending: pendingCount,
    });
  }, [friends.length, onlineFriendsCount, pendingCount, onCountsChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Friends</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {friends.length}
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0 ml-auto">
              {pendingCount} new
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {onlineFriendsCount} online
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Pending Requests Section */}
          {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
            <Collapsible open={showRequests} onOpenChange={setShowRequests}>
              <CollapsibleTrigger className="flex items-center gap-1 w-full px-2 py-1 rounded hover:bg-muted/50 text-xs font-medium text-muted-foreground">
                {showRequests ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Clock className="h-3 w-3" />
                <span>Requests</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">
                  {incomingRequests.length + outgoingRequests.length}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {/* Incoming requests */}
                {incomingRequests.map((request) => (
                  <FriendRequestItem
                    key={request.id}
                    request={request}
                    onAccept={() => acceptFriendRequest(request.id)}
                    onDecline={() => declineFriendRequest(request.id)}
                  />
                ))}
                {/* Outgoing requests */}
                {outgoingRequests.map((request) => (
                  <OutgoingRequestItem
                    key={request.id}
                    request={request}
                    onCancel={() => cancelFriendRequest(request.id)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Friends List */}
          <div className="space-y-0.5">
            {sortedFriends.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No friends yet</p>
                <p className="text-[10px] mt-1">Click a username to send a friend request</p>
              </div>
            ) : (
              sortedFriends.map((friend) => (
                <FriendItem
                  key={friend.id}
                  friend={friend}
                  isOnline={onlineFriendIds.has(friend.friendId)}
                  onMessage={() => onOpenPm(friend.friendId, friend.username)}
                  onRemove={() => removeFriend(friend.id, friend.friendId)}
                />
              ))
            )}
          </div>

          {/* Blocked Users Section */}
          {blockedUsers.length > 0 && (
            <Collapsible open={showBlocked} onOpenChange={setShowBlocked}>
              <CollapsibleTrigger className="flex items-center gap-1 w-full px-2 py-1 rounded hover:bg-muted/50 text-xs font-medium text-muted-foreground mt-2">
                {showBlocked ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <Ban className="h-3 w-3" />
                <span>Blocked</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">
                  {blockedUsers.length}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {blockedUsers.map((blocked) => (
                  <BlockedUserItem
                    key={blocked.id}
                    blocked={blocked}
                    onUnblock={() => unblockUser(blocked.id)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Friend item component
const FriendItem = ({
  friend,
  isOnline,
  onMessage,
  onRemove,
}: {
  friend: Friend;
  isOnline: boolean;
  onMessage: () => void;
  onRemove: () => void;
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-primary-foreground text-xs font-bold overflow-hidden">
          {friend.avatarUrl ? (
            <img src={friend.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            friend.username.charAt(0).toUpperCase()
          )}
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
            isOnline ? "bg-green-500" : "bg-muted"
          )}
        />
      </div>

      {/* Username */}
      <span className="flex-1 text-xs font-medium truncate">{friend.username}</span>

      {/* Actions */}
      <div className={cn("flex items-center gap-0.5 transition-opacity", showActions ? "opacity-100" : "opacity-0")}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded hover:bg-primary/20 hover:text-primary"
          onClick={onMessage}
          title="Send message"
        >
          <MessageCircle className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded hover:bg-destructive/20 hover:text-destructive"
          onClick={onRemove}
          title="Remove friend"
        >
          <UserX className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Incoming friend request item
const FriendRequestItem = ({
  request,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-primary-foreground text-[10px] font-bold overflow-hidden shrink-0">
      {request.senderAvatarUrl ? (
        <img src={request.senderAvatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        request.senderUsername.charAt(0).toUpperCase()
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate">{request.senderUsername}</p>
      <p className="text-[10px] text-muted-foreground">wants to be friends</p>
    </div>
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded bg-green-500/10 hover:bg-green-500/20 text-green-500"
        onClick={onAccept}
        title="Accept"
      >
        <UserPlus className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded hover:bg-destructive/20 hover:text-destructive"
        onClick={onDecline}
        title="Decline"
      >
        <UserX className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

// Outgoing friend request item
const OutgoingRequestItem = ({
  request,
  onCancel,
}: {
  request: FriendRequest;
  onCancel: () => void;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center text-muted-foreground text-[10px] font-bold overflow-hidden shrink-0">
      {request.recipientAvatarUrl ? (
        <img src={request.recipientAvatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        request.recipientUsername.charAt(0).toUpperCase()
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium truncate text-muted-foreground">{request.recipientUsername}</p>
      <p className="text-[10px] text-muted-foreground">request pending...</p>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded hover:bg-destructive/20 hover:text-destructive shrink-0"
      onClick={onCancel}
      title="Cancel request"
    >
      <UserX className="h-3 w-3" />
    </Button>
  </div>
);

// Blocked user item
const BlockedUserItem = ({
  blocked,
  onUnblock,
}: {
  blocked: BlockedUser;
  onUnblock: () => void;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-destructive/5">
    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-destructive/30 to-destructive/50 flex items-center justify-center text-destructive text-[10px] font-bold overflow-hidden shrink-0">
      {blocked.avatarUrl ? (
        <img src={blocked.avatarUrl} alt="" className="h-full w-full object-cover grayscale" />
      ) : (
        blocked.username.charAt(0).toUpperCase()
      )}
    </div>
    <span className="flex-1 text-xs text-muted-foreground truncate">{blocked.username}</span>
    <Button
      variant="ghost"
      size="sm"
      className="h-6 text-[10px] rounded hover:bg-background"
      onClick={onUnblock}
    >
      Unblock
    </Button>
  </div>
);

export default FriendsList;
