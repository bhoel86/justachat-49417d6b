-- Allow authenticated users to view public profile fields via profiles_public view
-- (Without this, regular users only see their own profile and staff won't show in member list.)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);