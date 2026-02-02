-- Add missing parent_email column to profiles table for parental consent feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Also add other potentially missing columns for the full parental consent feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_consent_verified BOOLEAN DEFAULT false;