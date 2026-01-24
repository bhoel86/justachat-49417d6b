-- Create table to store bot generated photos for consistency
CREATE TABLE public.bot_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'selfie',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, photo_type)
);

-- Enable RLS
ALTER TABLE public.bot_photos ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage photos (service role)
CREATE POLICY "Service role can manage bot photos"
ON public.bot_photos
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view bot photos
CREATE POLICY "Authenticated users can view bot photos"
ON public.bot_photos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add index for faster lookups
CREATE INDEX idx_bot_photos_bot_id ON public.bot_photos(bot_id);