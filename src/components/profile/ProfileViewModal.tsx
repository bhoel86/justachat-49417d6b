import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Crown, Star, UserPlus, UserMinus, Ban, Check, Clock, Loader2 } from "lucide-react";
import UserAvatar from "@/components/avatar/UserAvatar";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role?: string;
  targetUserId?: string;
  onPmClick?: () => void;
}

export const ProfileViewModal = ({
  open,
  onOpenChange,
  username,
  avatarUrl,
  bio,
  role,
  targetUserId,
  onPmClick,
}: ProfileViewModalProps) => {
  const { user } = useAuth();
  const {
    friends,
    pendingRequests,
    blockedUsers,
    sendFriendRequest,
    removeFriend,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    blockUser,
    unblockUser,
    isFriend,
    isUserBlocked,
  } = useFriends(user?.id || '');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showRemoveFriendConfirm, setShowRemoveFriendConfirm] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'owner':
        return (
          <Badge variant="default" className="bg-amber-500 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="default" className="bg-red-500 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge variant="default" className="bg-blue-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return null;
    }
  };

  // Check friend/request status
  const isCurrentUserFriend = targetUserId ? isFriend(targetUserId) : false;
  const isBlocked = targetUserId ? isUserBlocked(targetUserId) : false;
  const friendshipRecord = targetUserId ? friends.find(f => f.friendId === targetUserId) : null;
  const pendingRequest = targetUserId 
    ? pendingRequests.find(r => 
        (r.senderId === targetUserId || r.recipientId === targetUserId) && r.status === 'pending'
      )
    : null;
  const hasSentRequest = pendingRequest && pendingRequest.senderId === user?.id;
  const hasReceivedRequest = pendingRequest && pendingRequest.recipientId === user?.id;
  const blockedRecord = targetUserId ? blockedUsers.find(b => b.blockedId === targetUserId) : null;

  const handleAddFriend = async () => {
    if (!targetUserId) return;
    setActionLoading(true);
    await sendFriendRequest(targetUserId);
    setActionLoading(false);
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;
    setActionLoading(true);
    await cancelFriendRequest(pendingRequest.id);
    setActionLoading(false);
  };

  const handleRemoveFriend = async () => {
    if (!friendshipRecord || !targetUserId) return;
    setActionLoading(true);
    await removeFriend(friendshipRecord.id, targetUserId);
    setActionLoading(false);
    setShowRemoveFriendConfirm(false);
  };

  const handleBlock = async () => {
    if (!targetUserId) return;
    setActionLoading(true);
    await blockUser(targetUserId);
    setActionLoading(false);
    setShowBlockConfirm(false);
    onOpenChange(false);
  };

  const handleUnblock = async () => {
    if (!blockedRecord) return;
    setActionLoading(true);
    await unblockUser(blockedRecord.id);
    setActionLoading(false);
  };

  const showFriendActions = targetUserId && user?.id && targetUserId !== user.id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">View Profile</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <UserAvatar
              avatarUrl={avatarUrl}
              username={username}
              size="lg"
            />
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">{username}</h2>
              {getRoleBadge()}
              {isCurrentUserFriend && (
                <Badge variant="outline" className="border-green-500 text-green-500 ml-2">
                  <Check className="h-3 w-3 mr-1" />
                  Friend
                </Badge>
              )}
            </div>

            {bio && (
              <div className="w-full px-4">
                <p className="text-sm text-muted-foreground text-center italic">
                  "{bio}"
                </p>
              </div>
            )}

            {!bio && (
              <p className="text-sm text-muted-foreground italic">
                No bio set
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {/* PM button */}
              {onPmClick && !isBlocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onPmClick();
                    onOpenChange(false);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}

              {/* Friend actions */}
              {showFriendActions && !isBlocked && (
                <>
                  {isCurrentUserFriend ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRemoveFriendConfirm(true)}
                      disabled={actionLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserMinus className="h-4 w-4 mr-2" />}
                      Unfriend
                    </Button>
                  ) : hasSentRequest ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
                      Pending
                    </Button>
                  ) : hasReceivedRequest ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          if (!pendingRequest) return;
                          setActionLoading(true);
                          await acceptFriendRequest(pendingRequest.id);
                          setActionLoading(false);
                        }}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!pendingRequest) return;
                          setActionLoading(true);
                          await declineFriendRequest(pendingRequest.id);
                          setActionLoading(false);
                        }}
                        disabled={actionLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddFriend}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Add Friend
                    </Button>
                  )}
                </>
              )}

              {/* Block/Unblock */}
              {showFriendActions && (
                isBlocked ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnblock}
                    disabled={actionLoading}
                    className="text-muted-foreground"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                    Unblock
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBlockConfirm(true)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Block
                  </Button>
                )
              )}
            </div>

            {isBlocked && (
              <p className="text-xs text-destructive mt-2">
                You have blocked this user
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block confirmation */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from your friends list and prevent them from messaging you. They won't be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground">
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove friend confirmation */}
      <AlertDialog open={showRemoveFriendConfirm} onOpenChange={setShowRemoveFriendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {username} as friend?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be notified that you removed them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend}>
              Remove Friend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileViewModal;
