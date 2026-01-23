-- Add room password columns to channels
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS room_password TEXT DEFAULT NULL;

-- Create room-specific bans table
CREATE TABLE public.room_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room-specific mutes table  
CREATE TABLE public.room_mutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  muted_by UUID NOT NULL,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room admins table (users who have the admin password)
CREATE TABLE public.room_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_admins ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is room owner
CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id UUID, _channel_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id AND created_by = _user_id
  )
$$;

-- Create helper function to check if user is room admin
CREATE OR REPLACE FUNCTION public.is_room_admin(_user_id UUID, _channel_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_admins
    WHERE channel_id = _channel_id AND user_id = _user_id
  ) OR public.is_room_owner(_user_id, _channel_id)
$$;

-- RLS for room_bans
CREATE POLICY "Room owners and admins can manage room bans"
ON public.room_bans FOR ALL
USING (
  public.is_room_admin(auth.uid(), channel_id) OR 
  public.is_room_owner(auth.uid(), channel_id) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  is_owner(auth.uid())
);

CREATE POLICY "Users can see if they are banned from a room"
ON public.room_bans FOR SELECT
USING (user_id = auth.uid());

-- RLS for room_mutes
CREATE POLICY "Room owners and admins can manage room mutes"
ON public.room_mutes FOR ALL
USING (
  public.is_room_admin(auth.uid(), channel_id) OR 
  public.is_room_owner(auth.uid(), channel_id) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  is_owner(auth.uid())
);

CREATE POLICY "Users can see if they are muted in a room"
ON public.room_mutes FOR SELECT
USING (user_id = auth.uid());

-- RLS for room_admins
CREATE POLICY "Room owners can manage room admins"
ON public.room_admins FOR ALL
USING (
  public.is_room_owner(auth.uid(), channel_id) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  is_owner(auth.uid())
);

CREATE POLICY "Users can see room admins"
ON public.room_admins FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Enable realtime for room moderation tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_bans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_mutes;