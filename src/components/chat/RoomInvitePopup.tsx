/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Hash, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoomInvite {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  roomName: string;
  roomId: string;
  timestamp: number;
}

interface RoomInvitePopupProps {
  userId: string;
  currentRoomName?: string;
}

const RoomInvitePopup = ({ userId, currentRoomName }: RoomInvitePopupProps) => {
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const navigate = useNavigate();

  // Subscribe to invite broadcasts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`room-invites:${userId}`)
      .on('broadcast', { event: 'room_invite' }, (payload) => {
        const invite = payload.payload as RoomInvite;
        
        // Don't show invite if already in that room
        if (invite.roomName === currentRoomName) {
          return;
        }
        
        // Add to invites list
        setInvites(prev => {
          // Prevent duplicates
          if (prev.some(i => i.id === invite.id)) return prev;
          return [...prev, invite];
        });

        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentRoomName]);

  // Auto-dismiss invites after 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setInvites(prev => prev.filter(invite => now - invite.timestamp < 30000));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAccept = (invite: RoomInvite) => {
    toast.success(`Joining #${invite.roomName}...`);
    setInvites(prev => prev.filter(i => i.id !== invite.id));
    navigate(`/chat/${invite.roomName}`);
  };

  const handleDismiss = (inviteId: string) => {
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  if (invites.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className={cn(
            "bg-card border border-primary/50 rounded-xl shadow-xl",
            "animate-in slide-in-from-right-5 fade-in duration-300",
            "p-4"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Room Invite</p>
                <p className="text-xs text-muted-foreground">
                  from <span className="text-primary font-medium">{invite.fromUsername}</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={() => handleDismiss(invite.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Room info */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 mb-3">
            <Hash className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{invite.roomName}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleDismiss(invite.id)}
            >
              Decline
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1 jac-gradient-bg"
              onClick={() => handleAccept(invite)}
            >
              Accept
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomInvitePopup;

// Helper function to send an invite
export const sendRoomInvite = async (
  fromUserId: string,
  fromUsername: string,
  toUserId: string,
  roomName: string,
  roomId: string
): Promise<boolean> => {
  const invite: RoomInvite = {
    id: `invite-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fromUserId,
    fromUsername,
    toUserId,
    roomName,
    roomId,
    timestamp: Date.now(),
  };

  // Broadcast to the target user's invite channel
  const channel = supabase.channel(`room-invites:${toUserId}`);
  
  await channel.subscribe();
  
  const result = await channel.send({
    type: 'broadcast',
    event: 'room_invite',
    payload: invite,
  });

  // Clean up the channel after sending
  setTimeout(() => {
    supabase.removeChannel(channel);
  }, 1000);

  return result === 'ok';
};
