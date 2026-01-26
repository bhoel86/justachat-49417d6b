-- Create table for channel-specific moderation settings
CREATE TABLE public.channel_moderation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  url_filter_enabled BOOLEAN NOT NULL DEFAULT true,
  profanity_filter_enabled BOOLEAN NOT NULL DEFAULT true,
  link_preview_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id)
);

-- Enable RLS
ALTER TABLE public.channel_moderation_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view moderation settings
CREATE POLICY "Authenticated users can view moderation settings"
ON public.channel_moderation_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Room owners, room admins, and global admins can manage settings
CREATE POLICY "Room admins can manage moderation settings"
ON public.channel_moderation_settings
FOR ALL
USING (
  is_room_owner(auth.uid(), channel_id) OR 
  is_room_admin(auth.uid(), channel_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  is_owner(auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_channel_moderation_settings_updated_at
BEFORE UPDATE ON public.channel_moderation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();