-- Fix the permissive RLS policy for channel creation
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;

CREATE POLICY "Authenticated users can create their own channels"
  ON public.channels FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());