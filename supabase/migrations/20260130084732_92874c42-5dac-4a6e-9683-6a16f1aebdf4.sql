-- Add chat_speed column to bot_settings (in seconds, default 5)
ALTER TABLE public.bot_settings 
ADD COLUMN IF NOT EXISTS chat_speed integer NOT NULL DEFAULT 5;

-- Add comment for documentation
COMMENT ON COLUMN public.bot_settings.chat_speed IS 'Delay in seconds between bot responses (1-60)';