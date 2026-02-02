#!/bin/bash
#===============================================================================
# FIX GOOGLE OAUTH EMAIL LINKING
#
# This script updates the handle_new_user trigger to:
# 1. Check if a profile already exists for the Google email
# 2. If found, use that existing username instead of generating a new one
# 3. Prevents duplicate accounts for the same email
#
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-google-email-linking.sh
#===============================================================================

set -euo pipefail

echo "============================================"
echo "FIX GOOGLE OAUTH EMAIL LINKING"
echo "============================================"

cd ~/supabase/docker || { echo "ERROR: ~/supabase/docker not found"; exit 1; }
source .env

echo ""
echo "[1/3] Checking current profiles with emails..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U postgres -d postgres << 'SQLEOF'
-- Show existing users and their emails for reference
SELECT 
  p.username, 
  u.email,
  u.raw_user_meta_data->>'provider' as provider,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;
SQLEOF

echo ""
echo "[2/3] Updating handle_new_user trigger for Google email linking..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U postgres -d postgres << 'SQLEOF'
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
  existing_profile RECORD;
  counter INT := 0;
BEGIN
  -- FIRST: Check if a profile already exists for this email
  -- This handles Google OAuth linking to existing email/password accounts
  SELECT p.* INTO existing_profile
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = NEW.email
  LIMIT 1;
  
  IF existing_profile IS NOT NULL THEN
    -- Profile exists for this email - use the SAME username
    -- This links the Google account to the existing profile
    RAISE NOTICE 'Found existing profile for email %, using username: %', NEW.email, existing_profile.username;
    
    -- Update the existing profile's user_id to point to this new auth user
    -- OR create a new profile entry with the same username
    -- We'll create a new entry but use the existing username
    final_username := existing_profile.username;
    
    INSERT INTO public.profiles (user_id, username, age, parent_email, is_minor, avatar_url, bio)
    VALUES (
      NEW.id, 
      final_username,
      COALESCE((NEW.raw_user_meta_data->>'age')::integer, existing_profile.age),
      COALESCE(NEW.raw_user_meta_data->>'parent_email', existing_profile.parent_email),
      COALESCE((NEW.raw_user_meta_data->>'is_minor')::boolean, existing_profile.is_minor, false),
      existing_profile.avatar_url,
      existing_profile.bio
    );
    
    -- Copy the role from existing account
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.id, ur.role
    FROM public.user_roles ur
    WHERE ur.user_id = existing_profile.user_id
    ON CONFLICT DO NOTHING;
    
    -- If no roles found, add default user role
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- No existing profile for this email - create new one
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
  
  -- Try email prefix as fallback
  IF (base_username IS NULL OR base_username = '') AND NEW.email IS NOT NULL THEN
    base_username := SPLIT_PART(NEW.email, '@', 1);
    base_username := REGEXP_REPLACE(base_username, '[^a-zA-Z0-9]', '', 'g');
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
SQLEOF

echo ""
echo "[3/3] Verifying trigger was updated..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user' 
LIMIT 1;
" | head -30

echo ""
echo "============================================"
echo "✓ DONE!"
echo ""
echo "Now when a user signs in with Google:"
echo "  1. If their email matches an existing account → uses that username"
echo "  2. If no match → creates new username from Google name or email"
echo ""
echo "To test: Sign in with Google using an email that already has an account"
echo "============================================"
