-- Update handle_new_user function to use Google OAuth name or generate a proper default username
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
    -- Use first name from Google, clean it up
    base_username := REGEXP_REPLACE(SPLIT_PART(google_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g');
    IF LENGTH(base_username) < 2 THEN
      base_username := REGEXP_REPLACE(google_name, '[^a-zA-Z0-9]', '', 'g');
    END IF;
  ELSE
    -- Fall back to explicit username from signup form
    base_username := NEW.raw_user_meta_data->>'username';
  END IF;
  
  -- Final fallback to 'User' if still empty
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'User';
  END IF;
  
  -- Truncate to 16 chars to leave room for numbers
  base_username := LEFT(base_username, 16);
  
  -- Ensure uniqueness by adding random suffix if needed
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
    IF counter > 100 THEN
      -- Fallback to UUID suffix if too many collisions
      final_username := base_username || LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 4);
      EXIT;
    END IF;
  END LOOP;
  
  INSERT INTO public.profiles (user_id, username, age, parent_email, is_minor)
  VALUES (
    NEW.id, 
    final_username,
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'parent_email',
    COALESCE((NEW.raw_user_meta_data->>'is_minor')::boolean, false)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;