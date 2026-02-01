-- Fix: Channel passwords should never be readable via SELECT
-- The channels_public view already excludes password columns
-- We need to restrict direct table access to prevent password theft

-- 1. Drop the policy that exposes passwords to room owners/admins
DROP POLICY IF EXISTS "Room owners and admins can view full channel data" ON public.channels;

-- 2. Create a restricted SELECT policy for the base table
-- Only allow reading for the specific purpose of management (not exposing passwords to clients)
-- The channels_public view should be used for normal reads
CREATE POLICY "Channel creators can manage own channels"
ON public.channels
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- 3. Create a function to check if a channel has an admin password (without revealing it)
CREATE OR REPLACE FUNCTION public.channel_has_admin_password(_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (admin_password IS NOT NULL AND admin_password != '')
  FROM public.channels
  WHERE id = _channel_id
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.channel_has_admin_password(uuid) TO authenticated;

-- 5. Ensure channels_public view is accessible (it excludes password columns)
GRANT SELECT ON public.channels_public TO authenticated;
GRANT SELECT ON public.channels_public TO anon;

-- Note: The existing verify_room_password and verify_admin_password functions
-- already use SECURITY DEFINER to safely verify passwords without exposing them
-- Application code should use channels_public view for reads and the verify functions for auth