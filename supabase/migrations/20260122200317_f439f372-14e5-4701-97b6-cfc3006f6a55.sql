-- Create user_locations table for storing geolocation data
CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  timezone TEXT,
  isp TEXT,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX idx_user_locations_last_seen ON public.user_locations(last_seen DESC);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Users can view all locations (for the map feature)
CREATE POLICY "Authenticated users can view locations"
ON public.user_locations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can insert/update their own location
CREATE POLICY "Users can insert own location"
ON public.user_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
ON public.user_locations
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all and manage
CREATE POLICY "Admins can manage all locations"
ON public.user_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- Enable realtime for user locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;