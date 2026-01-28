-- Create a public view for profiles that excludes sensitive fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  username,
  avatar_url,
  bio,
  age,
  ghost_mode,
  preferred_language,
  is_minor,
  created_at,
  updated_at
FROM public.profiles;
-- Excludes: parent_email, parent_consent_token, parent_consent_sent_at, parent_consent_verified

-- Drop the old permissive SELECT policy that exposed all columns
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a new restrictive policy - regular users can only see their own full profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins/owners retain full access (already exists but let's ensure it's there)
-- The existing "Admins can view all profiles for management" policy already covers this