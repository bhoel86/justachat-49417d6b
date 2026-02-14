import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AtSign } from "lucide-react";
import { restSelect, restUpdate } from "@/lib/supabaseRest";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be less than 20 characters" })
  .regex(/^[a-zA-Z0-9_-]+$/, { 
    message: "Username can only contain letters, numbers, underscores, and hyphens" 
  });

interface UsernameChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  onUsernameChange: (newUsername: string) => void;
}

const UsernameChangeModal = ({
  open,
  onOpenChange,
  currentUsername,
  onUsernameChange,
}: UsernameChangeModalProps) => {
  const { user, session } = useAuth();
  const token = session?.access_token;
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;

    // Validate username
    const result = usernameSchema.safeParse(newUsername);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    // Check if username is the same
    if (newUsername.trim() === currentUsername) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Check if username is already taken via REST
      const existing = await restSelect('profiles', `select=id&username=eq.${encodeURIComponent(newUsername.trim())}&user_id=neq.${user.id}`, token);

      if (existing.length > 0) {
        setError("This username is already taken");
        setSaving(false);
        return;
      }

      // Update username via REST
      const ok = await restUpdate('profiles', `user_id=eq.${user.id}`, { username: newUsername.trim() }, token);
      if (!ok) throw new Error('Failed to update username');

      // Sync registered_nicks (NickServ)
      try {
        await restUpdate('registered_nicks', `user_id=eq.${user.id}`, { nickname: newUsername.trim() }, token);
      } catch {
        // Non-fatal
      }

      onUsernameChange(newUsername.trim());
      onOpenChange(false);

      toast({
        title: "Username updated",
        description: `Your username is now "${newUsername.trim()}"`,
      });
    } catch (err: any) {
      console.error('Username update error:', err);
      setError(err.message || "Failed to update username");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewUsername(value);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AtSign className="h-5 w-5 text-primary" />
            Change Username
          </DialogTitle>
          <DialogDescription>
            Choose a unique username. It can contain letters, numbers, underscores, and hyphens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">New Username</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter new username"
              maxLength={20}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !newUsername.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Username
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameChangeModal;