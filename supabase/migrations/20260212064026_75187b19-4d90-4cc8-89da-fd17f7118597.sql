
-- Make channels SELECT policies available to both anon and authenticated
DROP POLICY IF EXISTS "Anyone can view public channels" ON public.channels;
CREATE POLICY "Anyone can view public channels" ON public.channels FOR SELECT TO anon, authenticated USING ((is_private = false) AND (is_hidden = false));
