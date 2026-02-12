
-- Drop RESTRICTIVE SELECT policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view public channels" ON public.channels;
CREATE POLICY "Anyone can view public channels" ON public.channels FOR SELECT TO authenticated USING ((is_private = false) AND (is_hidden = false));

DROP POLICY IF EXISTS "Channel creators can manage own channels" ON public.channels;
CREATE POLICY "Channel creators can manage own channels" ON public.channels FOR SELECT TO authenticated USING (created_by = auth.uid());
