-- Create a scheduled function to clean up old location data (90-day retention)
-- This creates a cron job that runs daily at midnight UTC

-- First, enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_locations 
  WHERE last_seen < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleaned up location records older than 90 days';
END;
$$;

-- Schedule the cleanup to run daily at midnight UTC
SELECT cron.schedule(
  'cleanup-old-locations',
  '0 0 * * *',
  'SELECT public.cleanup_old_locations()'
);