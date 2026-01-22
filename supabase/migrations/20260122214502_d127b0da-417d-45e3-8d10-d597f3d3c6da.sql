-- Add bio column to profiles table
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Add length constraint for bio (max 500 characters)
ALTER TABLE public.profiles ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500);