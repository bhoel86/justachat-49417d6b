
-- Fix channels SELECT policies: change from RESTRICTIVE to PERMISSIVE
-- Currently both are RESTRICTIVE, meaning BOTH must pass (broken).
-- They should be PERMISSIVE so ANY one passing grants access.

DROP POLICY IF EXISTS "Anyone can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can manage own channels" ON public.channels;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Anyone can view public channels"
  ON public.channels FOR SELECT
  USING (is_private = false AND is_hidden = false);

CREATE POLICY "Channel creators can manage own channels"
  ON public.channels FOR SELECT
  USING (created_by = auth.uid());
