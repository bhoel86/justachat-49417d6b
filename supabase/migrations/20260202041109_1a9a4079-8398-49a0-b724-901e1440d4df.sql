-- First drop the dependent view
DROP VIEW IF EXISTS public.profiles_public CASCADE;

-- Remove parental consent columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS parent_email,
  DROP COLUMN IF EXISTS parent_consent_token,
  DROP COLUMN IF EXISTS parent_consent_sent_at,
  DROP COLUMN IF EXISTS parent_consent_verified,
  DROP COLUMN IF EXISTS is_minor;

-- Update the handle_new_user function to remove parent-related logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  final_username TEXT;
  google_name TEXT;
  base_username TEXT;
  counter INT := 0;
BEGIN
  -- Check for Google OAuth name first (from raw_user_meta_data)
  google_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'username'
  );
  
  -- Determine base username
  IF google_name IS NOT NULL AND google_name != '' THEN
    base_username := REGEXP_REPLACE(SPLIT_PART(google_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g');
    IF LENGTH(base_username) < 2 THEN
      base_username := REGEXP_REPLACE(google_name, '[^a-zA-Z0-9]', '', 'g');
    END IF;
  ELSE
    base_username := NEW.raw_user_meta_data->>'username';
  END IF;
  
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'User';
  END IF;
  
  base_username := LEFT(base_username, 16);
  
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
    IF counter > 100 THEN
      final_username := base_username || LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 4);
      EXIT;
    END IF;
  END LOOP;
  
  INSERT INTO public.profiles (user_id, username, age)
  VALUES (
    NEW.id, 
    final_username,
    (NEW.raw_user_meta_data->>'age')::integer
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Recreate profiles_public view without consent-related columns
CREATE VIEW public.profiles_public
WITH (security_invoker = on)
AS SELECT
  id,
  user_id,
  username,
  avatar_url,
  bio,
  age,
  ghost_mode,
  preferred_language,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

COMMENT ON VIEW public.profiles_public IS 'Public view of user profiles without sensitive data.';