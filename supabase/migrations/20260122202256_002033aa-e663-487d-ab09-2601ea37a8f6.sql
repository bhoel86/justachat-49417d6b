-- Fix bans table: restrict SELECT to owners and admins only
DROP POLICY IF EXISTS "Anyone can view bans" ON public.bans;
CREATE POLICY "Owners and admins can view bans"
  ON public.bans FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_owner(auth.uid())
    OR user_id = auth.uid()  -- Users can see their own ban
  );

-- Fix mutes table: restrict SELECT to owners and admins only
DROP POLICY IF EXISTS "Anyone can view mutes" ON public.mutes;
CREATE POLICY "Owners and admins can view mutes"
  ON public.mutes FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR is_owner(auth.uid())
    OR user_id = auth.uid()  -- Users can see their own mute
  );