-- Add preferred_theme column to profiles for per-user theme preferences
-- NULL means "use the global site theme"
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_theme text DEFAULT NULL;
