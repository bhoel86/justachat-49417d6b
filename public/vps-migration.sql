-- VPS Supabase Migration for JustAChat
-- Run this entire file in your VPS Supabase Studio SQL Editor

-- ============================================
-- PART 1: TYPES AND FUNCTIONS
-- ============================================

-- Create role enum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'owner');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table first (functions depend on it)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner') $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================
-- PART 2: CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL,
  avatar_url text,
  bio text,
  age integer,
  ghost_mode boolean DEFAULT false,
  preferred_language text DEFAULT 'en',
  parent_email text,
  parent_consent_token text,
  parent_consent_sent_at timestamptz,
  parent_consent_verified boolean DEFAULT false,
  is_minor boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create public view for profiles (excludes sensitive fields)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id, user_id, username, avatar_url, bio, age,
  ghost_mode, preferred_language, is_minor, created_at, updated_at
FROM public.profiles;

CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_private boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  room_password text,
  admin_password text,
  name_color text,
  name_gradient_from text,
  name_gradient_to text,
  bg_color text
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.room_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.room_admins ENABLE ROW LEVEL SECURITY;

-- Room helper functions
CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id uuid, _channel_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.channels WHERE id = _channel_id AND created_by = _user_id) $$;

CREATE OR REPLACE FUNCTION public.is_room_admin(_user_id uuid, _channel_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.room_admins WHERE channel_id = _channel_id AND user_id = _user_id) OR public.is_room_owner(_user_id, _channel_id) $$;

-- ============================================
-- PART 3: CHANNEL TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.channel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  channel_name text NOT NULL DEFAULT 'general',
  topic text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.channel_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.channel_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE UNIQUE,
  founder_id uuid NOT NULL,
  description text,
  url text,
  registered_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.channel_registrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.channel_access_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_level integer NOT NULL DEFAULT 0,
  granted_by uuid NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.channel_access_list ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.channel_moderation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE UNIQUE,
  profanity_filter_enabled boolean NOT NULL DEFAULT true,
  url_filter_enabled boolean NOT NULL DEFAULT true,
  link_preview_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.channel_moderation_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: MODERATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banned_by uuid,
  reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  muted_by uuid,
  reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.room_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.room_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  muted_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.room_mutes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.klines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_pattern text NOT NULL,
  set_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.klines ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: MESSAGING & SOCIAL
-- ============================================

CREATE TABLE IF NOT EXISTS public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 6: USER DATA
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  latitude double precision,
  longitude double precision,
  city text,
  region text,
  country text,
  country_code text,
  timezone text,
  isp text,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.registered_nicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nickname text NOT NULL UNIQUE,
  email_verified boolean DEFAULT false,
  last_identified timestamptz,
  registered_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.registered_nicks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_channel_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  channel_name text NOT NULL,
  visit_count integer NOT NULL DEFAULT 1,
  first_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_name)
);
ALTER TABLE public.user_channel_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_conversation_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_name text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}',
  interests text[] NOT NULL DEFAULT '{}',
  last_messages jsonb NOT NULL DEFAULT '[]',
  mood text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_name)
);
ALTER TABLE public.user_conversation_topics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 7: DATING MODULE
-- ============================================

CREATE TABLE IF NOT EXISTS public.dating_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  opted_in boolean NOT NULL DEFAULT false,
  gender text,
  looking_for text,
  age integer,
  location text,
  about_me text,
  interests text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  min_age integer DEFAULT 18,
  max_age integer DEFAULT 99,
  max_distance_km integer DEFAULT 100,
  is_verified boolean DEFAULT false,
  profile_complete boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  height_cm integer,
  weight_kg integer,
  body_type text,
  ethnicity text,
  religion text,
  education text,
  occupation text,
  smoking text,
  drinking text,
  has_children boolean DEFAULT false,
  wants_children text,
  pets text,
  languages text[] DEFAULT '{}',
  hobbies text[] DEFAULT '{}',
  ideal_match text,
  relationship_status text,
  looking_for_type text,
  zodiac text,
  seeking text[] DEFAULT '{}'
);
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dating_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id uuid NOT NULL,
  swiped_id uuid NOT NULL,
  direction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(swiper_id, swiped_id)
);
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dating_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  matched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 8: MISC TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.donation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_amount numeric NOT NULL DEFAULT 500,
  current_amount numeric NOT NULL DEFAULT 0,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.donation_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donation_clicks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.trivia_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  total_answers integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.network_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_type text NOT NULL,
  stat_value jsonb NOT NULL DEFAULT '{}',
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.network_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  allowed_channels text[] NOT NULL DEFAULT ARRAY['general'],
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bot_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL,
  photo_url text NOT NULL,
  photo_type text NOT NULL DEFAULT 'selfie',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bot_photos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.art_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  year text,
  period text,
  medium text,
  image_url text NOT NULL,
  description text,
  source text,
  source_id text,
  discussed_at timestamptz,
  discussion_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.art_pieces ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.art_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  art_piece_id uuid NOT NULL REFERENCES public.art_pieces(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  discussion_summary text,
  posted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.art_discussions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 9: CLEANUP FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_locations()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN DELETE FROM public.user_locations WHERE last_seen < NOW() - INTERVAL '90 days'; END; $$;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN DELETE FROM public.login_attempts WHERE last_attempt_at < NOW() - INTERVAL '24 hours'; END; $$;

-- ============================================
-- PART 10: STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- ============================================
-- SCHEMA COMPLETE!
-- Next: Run vps-rls-policies.sql
-- ============================================
