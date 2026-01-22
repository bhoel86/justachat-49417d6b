-- Add preferred_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_language text DEFAULT 'en';

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language for message translation (ISO 639-1 code)';