/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BioEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentBio: string | null;
  onBioUpdated: (newBio: string) => void;
}

const MAX_BIO_LENGTH = 500;

export const BioEditModal = ({
  open,
  onOpenChange,
  userId,
  currentBio,
  onBioUpdated,
}: BioEditModalProps) => {
  const [bio, setBio] = useState(currentBio || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const trimmedBio = bio.trim();
    
    if (trimmedBio.length > MAX_BIO_LENGTH) {
      toast.error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio: trimmedBio || null })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Bio updated successfully");
      onBioUpdated(trimmedBio);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating bio:", error);
      toast.error("Failed to update bio");
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = MAX_BIO_LENGTH - bio.length;
  const isOverLimit = remainingChars < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription>
            Tell others a bit about yourself. This will be visible on your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Your Bio</Label>
            <Textarea
              id="bio"
              placeholder="Write something about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={MAX_BIO_LENGTH + 50} // Allow some overflow for UX
            />
            <div className={`text-xs text-right ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars} characters remaining
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || isOverLimit}>
            {loading ? "Saving..." : "Save Bio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
