-- Add color customization columns to channels table
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS name_color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS name_gradient_from TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS name_gradient_to TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT NULL;