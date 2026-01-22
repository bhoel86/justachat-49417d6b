-- Create table to track login attempts for rate limiting
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  first_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_until timestamp with time zone
);

-- Create index for fast lookups
CREATE INDEX idx_login_attempts_identifier ON public.login_attempts(identifier);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only edge functions with service role can access this table
CREATE POLICY "Service role only" ON public.login_attempts
FOR ALL USING (false);

-- Function to clean up old attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.login_attempts 
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours';
END;
$$;