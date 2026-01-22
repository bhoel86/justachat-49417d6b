-- Add is_hidden column to channels table for admin visibility control
ALTER TABLE public.channels ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Update RLS policy to hide hidden channels from non-admins
DROP POLICY IF EXISTS "Anyone can view public channels" ON public.channels;

CREATE POLICY "Anyone can view public non-hidden channels" 
ON public.channels 
FOR SELECT 
USING (
  (is_private = false AND is_hidden = false) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR is_owner(auth.uid())
);

-- Admins can update channels (including hiding)
DROP POLICY IF EXISTS "Channel creators and mods can update channels" ON public.channels;

CREATE POLICY "Channel creators and mods can update channels" 
ON public.channels 
FOR UPDATE 
USING (
  (created_by = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role) 
  OR is_owner(auth.uid())
);