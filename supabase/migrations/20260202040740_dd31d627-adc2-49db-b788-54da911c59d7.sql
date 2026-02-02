-- Fix user_locations_public view to use security_invoker
-- This ensures RLS policies from underlying table are enforced

DROP VIEW IF EXISTS public.user_locations_public;

CREATE VIEW public.user_locations_public
WITH (security_invoker = on)
AS SELECT
  id,
  user_id,
  city,
  region,
  country,
  country_code,
  timezone,
  last_seen,
  created_at
FROM public.user_locations;

-- Grant access to authenticated users only
GRANT SELECT ON public.user_locations_public TO authenticated;

COMMENT ON VIEW public.user_locations_public IS 'Public view of user locations with sensitive data (IP, coordinates, ISP) masked. Uses security_invoker to enforce RLS from underlying table.';