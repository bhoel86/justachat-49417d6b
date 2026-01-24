-- Add opt-in field to dating_profiles table
ALTER TABLE public.dating_profiles 
ADD COLUMN IF NOT EXISTS opted_in boolean NOT NULL DEFAULT false;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_dating_profiles_opted_in ON public.dating_profiles(opted_in) WHERE opted_in = true;