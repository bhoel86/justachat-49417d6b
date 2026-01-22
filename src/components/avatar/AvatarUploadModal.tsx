import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Check, Loader2, Camera, User2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { defaultAvatars, getMaleAvatars, getFemaleAvatars } from "@/lib/defaultAvatars";
import UserAvatar from "./UserAvatar";
import { cn } from "@/lib/utils";

interface AvatarUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  onAvatarChange: (url: string) => void;
}

const AvatarUploadModal = ({
  open,
  onOpenChange,
  currentAvatarUrl,
  onAvatarChange,
}: AvatarUploadModalProps) => {
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setPreviewUrl(urlWithCacheBuster);
      setSelectedAvatar(null);

      toast({
        title: "Image uploaded",
        description: "Click Save to apply your new avatar.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDefaultSelect = (url: string) => {
    setSelectedAvatar(url);
    setPreviewUrl(null);
  };

  const handleSave = async () => {
    if (!user) return;

    const avatarUrl = previewUrl || selectedAvatar;
    if (!avatarUrl) {
      toast({
        title: "No avatar selected",
        description: "Please select or upload an avatar.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Update profile with new avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (error) throw error;

      onAvatarChange(avatarUrl);
      onOpenChange(false);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been changed.",
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save avatar.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const maleAvatars = getMaleAvatars();
  const femaleAvatars = getFemaleAvatars();

  const currentPreview = previewUrl || selectedAvatar || currentAvatarUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User2 className="h-5 w-5 text-primary" />
            Change Profile Picture
          </DialogTitle>
          <DialogDescription>
            Upload a custom photo or choose from our default avatars.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="flex justify-center py-4">
          <div className="relative">
            <UserAvatar
              avatarUrl={currentPreview}
              username="Preview"
              size="xl"
              className="h-24 w-24 text-2xl"
            />
            {(previewUrl || selectedAvatar) && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="male">Male</TabsTrigger>
            <TabsTrigger value="female">Female</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="py-4">
            <div className="flex flex-col items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full max-w-xs h-24 border-dashed border-2"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-6 w-6" />
                    <span>Click to upload photo</span>
                    <span className="text-xs text-muted-foreground">Max 2MB, JPG/PNG</span>
                  </div>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="male" className="py-2">
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-5 gap-3 p-1">
                {maleAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleDefaultSelect(avatar.url)}
                    className={cn(
                      "relative rounded-full p-0.5 transition-all hover:scale-110",
                      selectedAvatar === avatar.url
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:ring-2 hover:ring-muted-foreground/50"
                    )}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="h-12 w-12 rounded-full"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="female" className="py-2">
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-5 gap-3 p-1">
                {femaleAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleDefaultSelect(avatar.url)}
                    className={cn(
                      "relative rounded-full p-0.5 transition-all hover:scale-110",
                      selectedAvatar === avatar.url
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:ring-2 hover:ring-muted-foreground/50"
                    )}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="h-12 w-12 rounded-full"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (!previewUrl && !selectedAvatar)}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Avatar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarUploadModal;