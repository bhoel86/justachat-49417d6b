
-- Fix: channels SELECT policies must be PERMISSIVE (OR logic), not RESTRICTIVE (AND logic)
-- With all RESTRICTIVE policies, PostgreSQL denies all access since no PERMISSIVE policy exists.

-- Drop the existing restrictive SELECT policies
DROP POLICY IF EXISTS "Anyone can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can manage own channels" ON public.channels;

-- Recreate as PERMISSIVE (default) so they OR together
CREATE POLICY "Anyone can view public channels"
  ON public.channels
  FOR SELECT
  USING ((is_private = false) AND (is_hidden = false));

CREATE POLICY "Channel creators can manage own channels"
  ON public.channels
  FOR SELECT
  USING (created_by = auth.uid());
