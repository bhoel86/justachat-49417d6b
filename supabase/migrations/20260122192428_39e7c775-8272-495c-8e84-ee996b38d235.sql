-- Create channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_members table for tracking who's in which channel
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Add channel_id to messages table
ALTER TABLE public.messages ADD COLUMN channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;

-- Update channel_settings to reference channels table
ALTER TABLE public.channel_settings ADD COLUMN channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE UNIQUE;

-- Create default general channel
INSERT INTO public.channels (id, name, description, is_private) 
VALUES ('00000000-0000-0000-0000-000000000001', 'general', 'General chat for everyone', false);

-- Update existing channel_settings to reference general channel
UPDATE public.channel_settings 
SET channel_id = '00000000-0000-0000-0000-000000000001'
WHERE channel_name = 'general';

-- Update existing messages to be in general channel
UPDATE public.messages SET channel_id = '00000000-0000-0000-0000-000000000001' WHERE channel_id IS NULL;

-- Make channel_id NOT NULL after migration
ALTER TABLE public.messages ALTER COLUMN channel_id SET NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Channels policies
CREATE POLICY "Anyone can view public channels"
  ON public.channels FOR SELECT
  USING (is_private = false);

CREATE POLICY "Members can view private channels"
  ON public.channels FOR SELECT
  USING (
    is_private = true 
    AND EXISTS (
      SELECT 1 FROM public.channel_members 
      WHERE channel_id = channels.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Channel creators and mods can update channels"
  ON public.channels FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.is_owner(auth.uid())
  );

CREATE POLICY "Mods can delete channels"
  ON public.channels FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.is_owner(auth.uid())
  );

-- Channel members policies
CREATE POLICY "Anyone can view channel members"
  ON public.channel_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join public channels"
  ON public.channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.channels 
      WHERE id = channel_id AND is_private = false
    )
  );

CREATE POLICY "Users can leave channels"
  ON public.channel_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Mods can manage channel members"
  ON public.channel_members FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.is_owner(auth.uid())
  );

-- Update messages policies to include channel context
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Users can send messages to channels they're in"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Public channels: anyone can post
      EXISTS (
        SELECT 1 FROM public.channels 
        WHERE id = channel_id AND is_private = false
      )
      OR
      -- Private channels: only members
      EXISTS (
        SELECT 1 FROM public.channel_members 
        WHERE channel_id = messages.channel_id AND user_id = auth.uid()
      )
    )
  );

-- Enable realtime for channels
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;