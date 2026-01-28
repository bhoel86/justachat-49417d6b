-- Create a public view for channels that excludes sensitive password fields
CREATE VIEW public.channels_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    name,
    description,
    created_at,
    created_by,
    is_private,
    is_hidden,
    bg_color,
    name_color,
    name_gradient_from,
    name_gradient_to
    -- Excludes: room_password, admin_password
  FROM public.channels;

-- Grant access to the view
GRANT SELECT ON public.channels_public TO authenticated;

-- Create a function to verify room password (server-side only)
CREATE OR REPLACE FUNCTION public.verify_room_password(
  _channel_id uuid,
  _password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id
    AND (room_password IS NULL OR room_password = '' OR room_password = _password)
  );
END;
$$;

-- Create a function to verify admin password (server-side only)
CREATE OR REPLACE FUNCTION public.verify_admin_password(
  _channel_id uuid,
  _password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id
    AND admin_password = _password
  );
END;
$$;

-- Create a function to check if a channel has a password
CREATE OR REPLACE FUNCTION public.channel_has_password(_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id
    AND room_password IS NOT NULL
    AND room_password != ''
  );
$$;

-- Drop the old permissive SELECT policies on channels table
DROP POLICY IF EXISTS "Authenticated users can view public non-hidden channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels" ON public.channels;

-- Create restrictive SELECT policy - only room owner/admins can see full row (including passwords)
CREATE POLICY "Room owners and admins can view full channel data"
  ON public.channels FOR SELECT
  USING (
    created_by = auth.uid() 
    OR has_role(auth.uid(), 'admin') 
    OR is_owner(auth.uid())
    OR is_room_admin(auth.uid(), id)
  );