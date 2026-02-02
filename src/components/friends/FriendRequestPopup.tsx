import { useEffect, useState } from 'react';
import { X, UserPlus, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playPMNotificationSound } from '@/lib/notificationSound';
import { cn } from '@/lib/utils';

interface FriendRequestPopupProps {
  senderUsername: string;
  senderAvatarUrl?: string | null;
  requestId: string;
  onAccept: (requestId: string) => Promise<boolean>;
  onDecline: (requestId: string) => Promise<boolean>;
  onClose: () => void;
}

const FriendRequestPopup = ({
  senderUsername,
  senderAvatarUrl,
  requestId,
  onAccept,
  onDecline,
  onClose,
}: FriendRequestPopupProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Play notification sound when popup appears
  useEffect(() => {
    playPMNotificationSound();
    // Play a second tone for emphasis
    const timer = setTimeout(() => {
      playPMNotificationSound();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = async () => {
    setIsProcessing(true);
    await onAccept(requestId);
    onClose();
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    await onDecline(requestId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            {senderAvatarUrl ? (
              <img
                src={senderAvatarUrl}
                alt={senderUsername}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <UserPlus className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">Friend Request</h3>
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-primary">{senderUsername}</span> wants to be your friend!
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="flex-1 gap-2"
            disabled={isProcessing}
          >
            <XCircle className="h-4 w-4" />
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 gap-2"
            variant="default"
            disabled={isProcessing}
          >
            <Check className="h-4 w-4" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestPopup;
