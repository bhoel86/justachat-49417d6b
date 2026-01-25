-- Add age column to profiles table for image filtering access
ALTER TABLE public.profiles ADD COLUMN age integer;

-- Add a check constraint to ensure age is reasonable (13-120)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_check CHECK (age IS NULL OR (age >= 13 AND age <= 120));