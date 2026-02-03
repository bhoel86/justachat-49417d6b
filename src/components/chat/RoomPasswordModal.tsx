/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState } from "react";
import { Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface RoomPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  onPasswordSubmit: (password: string) => void;
}

const RoomPasswordModal = ({ open, onOpenChange, roomName, onPasswordSubmit }: RoomPasswordModalProps) => {
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({ variant: "destructive", title: "Password required" });
      return;
    }
    onPasswordSubmit(password);
    setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            #{roomName} is password protected. Enter the password to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter room password"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="jac" className="flex-1">
              Join Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomPasswordModal;
