import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, AtSign, FileText, Lock, Loader2, Check, Eye, EyeOff, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import UserAvatar from "@/components/avatar/UserAvatar";
import { useNavigate } from "react-router-dom";
import { getMaleAvatars, getFemaleAvatars } from "@/lib/defaultAvatars";

const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be less than 20 characters" })
  .regex(/^[a-zA-Z0-9_-]+$/, { 
    message: "Username can only contain letters, numbers, underscores, and hyphens" 
  });

const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(72, { message: "Password must be less than 72 characters" });

const MAX_BIO_LENGTH = 500;

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  onProfileUpdated: () => void;
}

export const ProfileEditModal = ({
  open,
  onOpenChange,
  username: initialUsername,
  avatarUrl: initialAvatarUrl,
  bio: initialBio,
  age: initialAge,
  onProfileUpdated,
}: ProfileEditModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("avatar");
  
  // Avatar state
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Username state
  const [newUsername, setNewUsername] = useState(initialUsername);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  // Bio state
  const [bio, setBio] = useState(initialBio || "");
  
  // Age state
  const [age, setAge] = useState<string>(initialAge?.toString() || "");
  const [ageError, setAgeError] = useState<string | null>(null);
  
  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Saving state
  const [saving, setSaving] = useState(false);
  
  // Delete account state
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      
      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }
      
      toast.success('Your account has been permanently deleted');
      
      // Sign out and redirect
      await supabase.auth.signOut();
      onOpenChange(false);
      navigate('/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');
      formData.append('fileName', `${user.id}/avatar.webp`);

      const response = await supabase.functions.invoke('upload-image', {
        body: formData,
      });

      if (response.error) throw response.error;
      
      const url = response.data?.url;
      if (url) {
        setSelectedAvatar(url);
        toast.success('Avatar uploaded');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const updates: Record<string, any> = {};
      let hasChanges = false;

      // Check avatar changes
      if (selectedAvatar && selectedAvatar !== initialAvatarUrl) {
        updates.avatar_url = selectedAvatar;
        hasChanges = true;
      }

      // Check username changes
      if (newUsername.trim() !== initialUsername) {
        const result = usernameSchema.safeParse(newUsername);
        if (!result.success) {
          setUsernameError(result.error.errors[0].message);
          setSaving(false);
          return;
        }

        // Check if taken
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', newUsername.trim())
          .neq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          setUsernameError("This username is already taken");
          setSaving(false);
          return;
        }

        updates.username = newUsername.trim();
        hasChanges = true;
      }

      // Check bio changes
      const trimmedBio = bio.trim();
      if (trimmedBio !== (initialBio || '')) {
        if (trimmedBio.length > MAX_BIO_LENGTH) {
          toast.error(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
          setSaving(false);
          return;
        }
        updates.bio = trimmedBio || null;
        hasChanges = true;
      }

      // Check age changes
      const ageValue = age.trim() ? parseInt(age.trim(), 10) : null;
      if (ageValue !== initialAge) {
        if (ageValue !== null && (isNaN(ageValue) || ageValue < 13 || ageValue > 120)) {
          setAgeError("Age must be between 13 and 120");
          setSaving(false);
          return;
        }
        updates.age = ageValue;
        hasChanges = true;
      }

      // Save profile updates
      if (hasChanges) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Handle password change
      if (newPassword) {
        const pwResult = passwordSchema.safeParse(newPassword);
        if (!pwResult.success) {
          setPasswordError(pwResult.error.errors[0].message);
          setSaving(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setPasswordError("Passwords don't match");
          setSaving(false);
          return;
        }

        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (pwError) throw pwError;
      }

      toast.success('Profile updated');
      onProfileUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const remainingChars = MAX_BIO_LENGTH - bio.length;
  const displayAvatar = selectedAvatar || initialAvatarUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={displayAvatar}
              username={newUsername || initialUsername}
              size="md"
            />
            <div>
              <p className="text-lg font-semibold">{newUsername || initialUsername}</p>
              <p className="text-sm text-muted-foreground font-normal">Edit your profile</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="avatar" className="text-xs">
              <Camera className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="username" className="text-xs">
              <AtSign className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="bio" className="text-xs">
              <FileText className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="age" className="text-xs">
              <Calendar className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs">
              <Lock className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="delete" className="text-xs text-destructive">
              <Trash2 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="avatar" className="space-y-4 mt-4">
            <div className="flex flex-col items-center gap-4">
              <UserAvatar
                avatarUrl={displayAvatar}
                username={newUsername || initialUsername}
                size="lg"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Male Avatars</p>
              <div className="grid grid-cols-5 gap-2">
                {getMaleAvatars().map((avatar, idx) => (
                  <button
                    key={`male-${idx}`}
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`p-1 rounded-lg border-2 transition-colors ${
                      selectedAvatar === avatar.url ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <UserAvatar avatarUrl={avatar.url} username="" size="sm" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Female Avatars</p>
              <div className="grid grid-cols-5 gap-2">
                {getFemaleAvatars().map((avatar, idx) => (
                  <button
                    key={`female-${idx}`}
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`p-1 rounded-lg border-2 transition-colors ${
                      selectedAvatar === avatar.url ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <UserAvatar avatarUrl={avatar.url} username="" size="sm" />
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="username" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value);
                  setUsernameError(null);
                }}
                placeholder="Enter new username"
                maxLength={20}
                className={usernameError ? "border-destructive" : ""}
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </p>
            </div>
          </TabsContent>

          <TabsContent value="bio" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                placeholder="Write something about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={MAX_BIO_LENGTH + 50}
              />
              <div className={`text-xs text-right ${remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {remainingChars} characters remaining
              </div>
            </div>
          </TabsContent>

          <TabsContent value="age" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="age">Your Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  setAgeError(null);
                }}
                placeholder="Enter your age"
                min={13}
                max={120}
                className={ageError ? "border-destructive" : ""}
              />
              {ageError && (
                <p className="text-sm text-destructive">{ageError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Required to access age-restricted content and image filtering
              </p>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Enter new password"
                  className={passwordError ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError(null);
                }}
                placeholder="Confirm new password"
                className={passwordError ? "border-destructive" : ""}
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Leave blank to keep current password
              </p>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="space-y-4 mt-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    This action is <strong>permanent</strong> and cannot be undone. All your data will be deleted, including:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ml-4 space-y-1">
                    <li>Your profile and avatar</li>
                    <li>All messages you've sent</li>
                    <li>Friends and friend requests</li>
                    <li>Dating profile and matches</li>
                    <li>Support tickets and history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="font-mono"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete My Account Permanently
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Final Confirmation
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you absolutely sure? This will permanently delete your account 
                    and all associated data. This action cannot be reversed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
