-- ============================================
-- JUSTACHAT FRESH DATABASE SCHEMA
-- Run after rebuild-vps.sh
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user', 'owner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  username text NOT NULL,
  avatar_url text,
  bio text,
  age integer,
  is_minor boolean DEFAULT false,
  parent_email text,
  parent_consent_verified boolean DEFAULT false,
  parent_consent_sent_at timestamptz,
  parent_consent_token text,
  preferred_language text DEFAULT 'en',
  ghost_mode boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role DEFAULT 'user' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Channels
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_by uuid,
  is_private boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  room_password text,
  admin_password text,
  bg_color text,
  name_color text,
  name_gradient_from text,
  name_gradient_to text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Channel Members
CREATE TABLE IF NOT EXISTS public.channel_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(channel_id, user_id)
);

-- Private Messages
CREATE TABLE IF NOT EXISTS public.private_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Bans
CREATE TABLE IF NOT EXISTS public.bans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  banned_by uuid,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Mutes
CREATE TABLE IF NOT EXISTS public.mutes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  muted_by uuid,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Room Bans
CREATE TABLE IF NOT EXISTS public.room_bans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(channel_id, user_id)
);

-- Room Mutes
CREATE TABLE IF NOT EXISTS public.room_mutes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  muted_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(channel_id, user_id)
);

-- Room Admins
CREATE TABLE IF NOT EXISTS public.room_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  granted_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(channel_id, user_id)
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- Friends
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Friend Requests
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(sender_id, recipient_id)
);

-- User Locations
CREATE TABLE IF NOT EXISTS public.user_locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  ip_address text,
  latitude numeric,
  longitude numeric,
  city text,
  region text,
  country text,
  country_code text,
  timezone text,
  isp text,
  last_seen timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Klines (IP bans)
CREATE TABLE IF NOT EXISTS public.klines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_pattern text NOT NULL,
  set_by uuid NOT NULL,
  reason text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Login Attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  attempt_count integer DEFAULT 1 NOT NULL,
  first_attempt_at timestamptz DEFAULT now() NOT NULL,
  last_attempt_at timestamptz DEFAULT now() NOT NULL,
  locked_until timestamptz
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL,
  subject text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'open' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_username text NOT NULL,
  content text NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Bot Settings
CREATE TABLE IF NOT EXISTS public.bot_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean DEFAULT true NOT NULL,
  allowed_channels text[] DEFAULT ARRAY['general'] NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Bot Photos
CREATE TABLE IF NOT EXISTS public.bot_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id text NOT NULL,
  photo_url text NOT NULL,
  photo_type text DEFAULT 'selfie' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Channel Settings
CREATE TABLE IF NOT EXISTS public.channel_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid UNIQUE REFERENCES public.channels(id) ON DELETE CASCADE,
  channel_name text DEFAULT 'general' NOT NULL,
  topic text,
  updated_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Channel Moderation Settings
CREATE TABLE IF NOT EXISTS public.channel_moderation_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL UNIQUE REFERENCES public.channels(id) ON DELETE CASCADE,
  profanity_filter_enabled boolean DEFAULT true NOT NULL,
  url_filter_enabled boolean DEFAULT true NOT NULL,
  link_preview_enabled boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Channel Registrations
CREATE TABLE IF NOT EXISTS public.channel_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL UNIQUE REFERENCES public.channels(id) ON DELETE CASCADE,
  founder_id uuid NOT NULL,
  description text,
  url text,
  registered_at timestamptz DEFAULT now() NOT NULL
);

-- Channel Access List
CREATE TABLE IF NOT EXISTS public.channel_access_list (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_level integer DEFAULT 0 NOT NULL,
  granted_by uuid NOT NULL,
  granted_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(channel_id, user_id)
);

-- Registered Nicks
CREATE TABLE IF NOT EXISTS public.registered_nicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nickname text NOT NULL UNIQUE,
  email_verified boolean DEFAULT false,
  last_identified timestamptz,
  registered_at timestamptz DEFAULT now() NOT NULL
);

-- Donation Settings
CREATE TABLE IF NOT EXISTS public.donation_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  current_amount numeric DEFAULT 0 NOT NULL,
  goal_amount numeric DEFAULT 500 NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Donation Clicks
CREATE TABLE IF NOT EXISTS public.donation_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text,
  clicked_at timestamptz DEFAULT now() NOT NULL
);

-- User Reports
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Network Stats
CREATE TABLE IF NOT EXISTS public.network_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_type text NOT NULL,
  stat_value jsonb DEFAULT '{}' NOT NULL,
  recorded_at timestamptz DEFAULT now() NOT NULL
);

-- User Channel Visits
CREATE TABLE IF NOT EXISTS public.user_channel_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  username text NOT NULL,
  channel_name text NOT NULL,
  visit_count integer DEFAULT 1 NOT NULL,
  first_visit_at timestamptz DEFAULT now() NOT NULL,
  last_visit_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel_name)
);

-- User Conversation Topics
CREATE TABLE IF NOT EXISTS public.user_conversation_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  channel_name text NOT NULL,
  topics text[] DEFAULT '{}' NOT NULL,
  interests text[] DEFAULT '{}' NOT NULL,
  mood text,
  last_messages jsonb DEFAULT '[]' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, channel_name)
);

-- Trivia Scores
CREATE TABLE IF NOT EXISTS public.trivia_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  points integer DEFAULT 0 NOT NULL,
  correct_answers integer DEFAULT 0 NOT NULL,
  total_answers integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Art Pieces
CREATE TABLE IF NOT EXISTS public.art_pieces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL,
  image_url text NOT NULL,
  description text,
  year text,
  medium text,
  period text,
  source text,
  source_id text,
  discussed_at timestamptz,
  discussion_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Art Discussions
CREATE TABLE IF NOT EXISTS public.art_discussions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  art_piece_id uuid NOT NULL REFERENCES public.art_pieces(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  discussion_summary text,
  posted_at timestamptz DEFAULT now() NOT NULL
);

-- Dating Profiles
CREATE TABLE IF NOT EXISTS public.dating_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  opted_in boolean DEFAULT false NOT NULL,
  age integer,
  gender text,
  location text,
  about_me text,
  ideal_match text,
  looking_for text,
  looking_for_type text,
  interests text[] DEFAULT '{}',
  hobbies text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  seeking text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  height_cm integer,
  weight_kg integer,
  body_type text,
  ethnicity text,
  religion text,
  education text,
  occupation text,
  smoking text,
  drinking text,
  pets text,
  has_children boolean DEFAULT false,
  wants_children text,
  relationship_status text,
  zodiac text,
  min_age integer DEFAULT 18,
  max_age integer DEFAULT 99,
  max_distance_km integer DEFAULT 100,
  profile_complete boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Dating Swipes
CREATE TABLE IF NOT EXISTS public.dating_swipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id uuid NOT NULL,
  swiped_id uuid NOT NULL,
  direction text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(swiper_id, swiped_id)
);

-- Dating Matches
CREATE TABLE IF NOT EXISTS public.dating_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  matched_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================
-- PUBLIC VIEWS (for unauthenticated access)
-- ============================================

CREATE OR REPLACE VIEW public.profiles_public 
WITH (security_invoker = on) AS
SELECT 
  id, user_id, username, avatar_url, bio, age, 
  ghost_mode, is_minor, preferred_language,
  created_at, updated_at
FROM public.profiles;

CREATE OR REPLACE VIEW public.channels_public 
WITH (security_invoker = on) AS
SELECT 
  id, name, description, created_by, is_private, is_hidden,
  bg_color, name_color, name_gradient_from, name_gradient_to,
  created_at
FROM public.channels;

CREATE OR REPLACE VIEW public.user_locations_public 
WITH (security_invoker = on) AS
SELECT 
  id, user_id, city, region, country, country_code, 
  timezone, last_seen, created_at
FROM public.user_locations;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id AND created_by = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_room_admin(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_admins
    WHERE channel_id = _channel_id AND user_id = _user_id
  ) OR public.is_room_owner(_user_id, _channel_id)
$$;

CREATE OR REPLACE FUNCTION public.channel_has_password(_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id
    AND room_password IS NOT NULL
    AND room_password != ''
  )
$$;

CREATE OR REPLACE FUNCTION public.verify_room_password(_channel_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id
    AND (room_password IS NULL OR room_password = '' OR room_password = _password)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_password(_channel_id uuid, _password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.channels
    WHERE id = _channel_id
    AND admin_password = _password
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_locations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_locations 
  WHERE last_seen < NOW() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts 
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================
-- AUTH TRIGGER (create profile on signup)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, age, parent_email, is_minor)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'User'),
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'parent_email',
    COALESCE((NEW.raw_user_meta_data->>'is_minor')::boolean, false)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_moderation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_access_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_nicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channel_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversation_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.art_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view own full profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Only owner can manage roles" ON public.user_roles FOR ALL USING (is_owner(auth.uid()));

-- Channels
CREATE POLICY "Authenticated users can view public channels" ON public.channels FOR SELECT USING (auth.uid() IS NOT NULL AND is_hidden = false);
CREATE POLICY "Room owners can view own channels" ON public.channels FOR SELECT USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()) OR is_room_admin(auth.uid(), id));
CREATE POLICY "Authenticated users can create channels" ON public.channels FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Channel creators and mods can update" ON public.channels FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));
CREATE POLICY "Mods can delete channels" ON public.channels FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Messages
CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any message" ON public.messages FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Channel Members
CREATE POLICY "View channel members" ON public.channel_members FOR SELECT USING (true);
CREATE POLICY "Users can join public channels" ON public.channel_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave channels" ON public.channel_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Mods can manage members" ON public.channel_members FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Private Messages
CREATE POLICY "Users can view own messages" ON public.private_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Admins can view all PMs" ON public.private_messages FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can send messages" ON public.private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete own sent" ON public.private_messages FOR DELETE USING (auth.uid() = sender_id);
CREATE POLICY "Admins can delete any PM" ON public.private_messages FOR DELETE USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Bans
CREATE POLICY "View own ban" ON public.bans FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Mods can manage bans" ON public.bans FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Mutes
CREATE POLICY "View own mute" ON public.mutes FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Mods can manage mutes" ON public.mutes FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Room Bans
CREATE POLICY "Users can see own room bans" ON public.room_bans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Room admins can manage bans" ON public.room_bans FOR ALL USING (is_room_admin(auth.uid(), channel_id) OR is_room_owner(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Room Mutes
CREATE POLICY "Users can see own room mutes" ON public.room_mutes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Room admins can manage mutes" ON public.room_mutes FOR ALL USING (is_room_admin(auth.uid(), channel_id) OR is_room_owner(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Room Admins
CREATE POLICY "View room admins" ON public.room_admins FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room owners can manage admins" ON public.room_admins FOR ALL USING (is_room_owner(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Blocked Users
CREATE POLICY "Users can view own blocks" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Friends
CREATE POLICY "Users can view friendships" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete friendships" ON public.friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend Requests
CREATE POLICY "View own requests" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Send requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can update" ON public.friend_requests FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "Delete own requests" ON public.friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- User Locations
CREATE POLICY "Users can view own location" ON public.user_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all locations" ON public.user_locations FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can insert own location" ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location" ON public.user_locations FOR UPDATE USING (auth.uid() = user_id);

-- Klines
CREATE POLICY "View klines" ON public.klines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage klines" ON public.klines FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Audit Logs
CREATE POLICY "Owners can view audit logs" ON public.audit_logs FOR SELECT USING (is_owner(auth.uid()));
CREATE POLICY "Service can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can manage audit logs" ON public.audit_logs FOR ALL USING (is_owner(auth.uid()));

-- Login Attempts
CREATE POLICY "Service role only" ON public.login_attempts FOR ALL USING (true);

-- Support Tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all tickets" ON public.support_tickets FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can update all tickets" ON public.support_tickets FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Support Messages
CREATE POLICY "Users can view own ticket messages" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
CREATE POLICY "Staff can view all messages" ON public.support_messages FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));
CREATE POLICY "Users can send on own tickets" ON public.support_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = support_messages.ticket_id AND support_tickets.user_id = auth.uid()));
CREATE POLICY "Staff can send messages" ON public.support_messages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Bot Settings
CREATE POLICY "View bot settings" ON public.bot_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage bot settings" ON public.bot_settings FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Bot Photos
CREATE POLICY "View bot photos" ON public.bot_photos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service can manage bot photos" ON public.bot_photos FOR ALL USING (true);

-- Channel Settings
CREATE POLICY "View channel settings" ON public.channel_settings FOR SELECT USING (true);
CREATE POLICY "Mods can update channel settings" ON public.channel_settings FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Channel Moderation Settings
CREATE POLICY "View moderation settings" ON public.channel_moderation_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room admins can manage" ON public.channel_moderation_settings FOR ALL USING (is_room_owner(auth.uid(), channel_id) OR is_room_admin(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Channel Registrations
CREATE POLICY "View registrations" ON public.channel_registrations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Founders can register" ON public.channel_registrations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM channels WHERE channels.id = channel_registrations.channel_id AND channels.created_by = auth.uid()));
CREATE POLICY "Founders can update" ON public.channel_registrations FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Founders can delete" ON public.channel_registrations FOR DELETE USING (founder_id = auth.uid() OR is_owner(auth.uid()));

-- Channel Access List
CREATE POLICY "View access lists" ON public.channel_access_list FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Channel owners can manage access" ON public.channel_access_list FOR ALL USING ((EXISTS (SELECT 1 FROM channels WHERE channels.id = channel_access_list.channel_id AND channels.created_by = auth.uid())) OR is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Registered Nicks
CREATE POLICY "View registered nicks" ON public.registered_nicks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Register own nick" ON public.registered_nicks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own registration" ON public.registered_nicks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own registration" ON public.registered_nicks FOR DELETE USING (auth.uid() = user_id);

-- Donation Settings
CREATE POLICY "Anyone can view donation settings" ON public.donation_settings FOR SELECT USING (true);
CREATE POLICY "Owners can insert donation settings" ON public.donation_settings FOR INSERT WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Admins can update donation settings" ON public.donation_settings FOR UPDATE USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Donation Clicks
CREATE POLICY "Users can view own clicks" ON public.donation_clicks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all clicks" ON public.donation_clicks FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can insert own click" ON public.donation_clicks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Reports
CREATE POLICY "Users can view own reports" ON public.user_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.user_reports FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can create reports" ON public.user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can update reports" ON public.user_reports FOR UPDATE USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Network Stats
CREATE POLICY "View stats" ON public.network_stats FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert stats" ON public.network_stats FOR INSERT WITH CHECK (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- User Channel Visits
CREATE POLICY "View own visits" ON public.user_channel_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own visits" ON public.user_channel_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own visits" ON public.user_channel_visits FOR UPDATE USING (auth.uid() = user_id);

-- User Conversation Topics
CREATE POLICY "View own topics" ON public.user_conversation_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own topics" ON public.user_conversation_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own topics" ON public.user_conversation_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can manage topics" ON public.user_conversation_topics FOR ALL USING (true);

-- Trivia Scores
CREATE POLICY "View trivia scores" ON public.trivia_scores FOR SELECT USING (true);
CREATE POLICY "Insert own score" ON public.trivia_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own score" ON public.trivia_scores FOR UPDATE USING (auth.uid() = user_id);

-- Art Pieces
CREATE POLICY "View art" ON public.art_pieces FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage art" ON public.art_pieces FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- Art Discussions
CREATE POLICY "View discussions" ON public.art_discussions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert discussions" ON public.art_discussions FOR INSERT WITH CHECK (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Dating Profiles
CREATE POLICY "View dating profiles" ON public.dating_profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Insert own dating profile" ON public.dating_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own dating profile" ON public.dating_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Dating Swipes
CREATE POLICY "View own swipes" ON public.dating_swipes FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Create own swipes" ON public.dating_swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Dating Matches
CREATE POLICY "View own matches" ON public.dating_matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Create matches" ON public.dating_matches FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;

-- ============================================
-- CREATE DEFAULT CHANNELS
-- ============================================

INSERT INTO public.channels (name, description) VALUES
  ('general', 'General chat for everyone'),
  ('help', 'Get help and support'),
  ('lounge', 'Casual hangout'),
  ('music', 'Music discussion'),
  ('movies', 'Movie lovers unite'),
  ('technology', 'Tech talk'),
  ('sports', 'Sports discussion'),
  ('games', 'Gaming community'),
  ('politics', 'Political discussion'),
  ('adults', 'Adult conversations (18+)'),
  ('dating', 'Dating and relationships'),
  ('trivia', 'Trivia games')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- DONE
-- ============================================
SELECT 'Schema setup complete!' as status;
