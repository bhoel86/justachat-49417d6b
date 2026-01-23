-- Create art_pieces table to store curated art for the art room
CREATE TABLE public.art_pieces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year TEXT,
  period TEXT,
  medium TEXT,
  image_url TEXT NOT NULL,
  description TEXT,
  source TEXT,
  source_id TEXT,
  discussed_at TIMESTAMP WITH TIME ZONE,
  discussion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source, source_id)
);

-- Enable RLS on art_pieces
ALTER TABLE public.art_pieces ENABLE ROW LEVEL SECURITY;

-- Everyone can view art pieces
CREATE POLICY "Authenticated users can view art"
ON public.art_pieces
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins/owners can manage art pieces
CREATE POLICY "Admins can manage art"
ON public.art_pieces
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- Create art_discussions table to track what's been discussed
CREATE TABLE public.art_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  art_piece_id UUID NOT NULL REFERENCES public.art_pieces(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discussion_summary TEXT
);

-- Enable RLS on art_discussions
ALTER TABLE public.art_discussions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view discussions
CREATE POLICY "Authenticated users can view discussions"
ON public.art_discussions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- System can insert discussions (via edge function)
CREATE POLICY "System can insert discussions"
ON public.art_discussions
FOR INSERT
WITH CHECK (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));