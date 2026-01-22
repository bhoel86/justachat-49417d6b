-- Create bans table for permanent bans
CREATE TABLE public.bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Create mutes table for temporary silencing
CREATE TABLE public.mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  muted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Create channel settings table for topic
CREATE TABLE public.channel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name TEXT NOT NULL DEFAULT 'general' UNIQUE,
  topic TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default channel
INSERT INTO public.channel_settings (channel_name, topic) 
VALUES ('general', 'Welcome to JAC! Type /help for commands.');

-- Enable RLS
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_settings ENABLE ROW LEVEL SECURITY;

-- Bans policies
CREATE POLICY "Anyone can view bans"
  ON public.bans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mods can manage bans"
  ON public.bans FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
    OR public.is_owner(auth.uid())
  );

-- Mutes policies
CREATE POLICY "Anyone can view mutes"
  ON public.mutes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mods can manage mutes"
  ON public.mutes FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
    OR public.is_owner(auth.uid())
  );

-- Channel settings policies
CREATE POLICY "Anyone can view channel settings"
  ON public.channel_settings FOR SELECT
  USING (true);

CREATE POLICY "Mods can update channel settings"
  ON public.channel_settings FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'moderator')
    OR public.is_owner(auth.uid())
  );

-- Enable realtime for channel settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_settings;