
-- Drop all existing channel SELECT policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can manage own channels" ON public.channels;

-- Recreate as PERMISSIVE (default) so at least one can grant access
CREATE POLICY "Anyone can view public channels"
  ON public.channels FOR SELECT
  USING ((is_private = false) AND (is_hidden = false));

CREATE POLICY "Channel creators can manage own channels"
  ON public.channels FOR SELECT
  USING (created_by = auth.uid());
