import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Crown, Star } from "lucide-react";
import UserAvatar from "@/components/avatar/UserAvatar";

interface ProfileViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role?: string;
  onPmClick?: () => void;
}

export const ProfileViewModal = ({
  open,
  onOpenChange,
  username,
  avatarUrl,
  bio,
  role,
  onPmClick,
}: ProfileViewModalProps) => {
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

  return (
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

          {onPmClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPmClick();
                onOpenChange(false);
              }}
              className="mt-2"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileViewModal;
