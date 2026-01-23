-- Fix anonymous access policies on all public tables
-- Update policies to use TO authenticated instead of allowing anonymous access

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Owners can manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Owners can view audit logs" ON public.audit_logs;

CREATE POLICY "Owners can manage audit logs"
ON public.audit_logs
FOR ALL
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Owners can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

-- BANS
DROP POLICY IF EXISTS "Mods can manage bans" ON public.bans;
DROP POLICY IF EXISTS "Owners and admins can view bans" ON public.bans;

CREATE POLICY "Mods can manage bans"
ON public.bans
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Owners and admins can view bans"
ON public.bans
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()) OR (user_id = auth.uid()));

-- CHANNEL_MEMBERS
DROP POLICY IF EXISTS "Anyone can view channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Mods can manage channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Users can join public channels" ON public.channel_members;
DROP POLICY IF EXISTS "Users can leave channels" ON public.channel_members;

CREATE POLICY "Authenticated users can view channel members"
ON public.channel_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Mods can manage channel members"
ON public.channel_members
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Users can join public channels"
ON public.channel_members
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND (EXISTS ( SELECT 1 FROM channels WHERE ((channels.id = channel_members.channel_id) AND (channels.is_private = false)))));

CREATE POLICY "Users can leave channels"
ON public.channel_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- CHANNEL_SETTINGS
DROP POLICY IF EXISTS "Anyone can view channel settings" ON public.channel_settings;
DROP POLICY IF EXISTS "Mods can update channel settings" ON public.channel_settings;

CREATE POLICY "Authenticated users can view channel settings"
ON public.channel_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Mods can update channel settings"
ON public.channel_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR is_owner(auth.uid()));

-- CHANNELS
DROP POLICY IF EXISTS "Anyone can view public non-hidden channels" ON public.channels;
DROP POLICY IF EXISTS "Channel creators and mods can update channels" ON public.channels;
DROP POLICY IF EXISTS "Members can view private channels" ON public.channels;
DROP POLICY IF EXISTS "Mods can delete channels" ON public.channels;
DROP POLICY IF EXISTS "Authenticated users can create their own channels" ON public.channels;

CREATE POLICY "Authenticated users can view public non-hidden channels"
ON public.channels
FOR SELECT
TO authenticated
USING (((is_private = false) AND (is_hidden = false)) OR has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Channel creators and mods can update channels"
ON public.channels
FOR UPDATE
TO authenticated
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Members can view private channels"
ON public.channels
FOR SELECT
TO authenticated
USING ((is_private = true) AND (EXISTS ( SELECT 1 FROM channel_members WHERE ((channel_members.channel_id = channels.id) AND (channel_members.user_id = auth.uid())))));

CREATE POLICY "Mods can delete channels"
ON public.channels
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Authenticated users can create their own channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- LOGIN_ATTEMPTS (service role only - block all user access)
DROP POLICY IF EXISTS "Service role only" ON public.login_attempts;

CREATE POLICY "Service role only"
ON public.login_attempts
FOR ALL
TO service_role
USING (true);

-- MESSAGES
DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
DROP POLICY IF EXISTS "Anyone authenticated can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to channels they're in" ON public.messages;

CREATE POLICY "Admins can delete any message"
ON public.messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can send messages to channels they're in"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND ((EXISTS ( SELECT 1 FROM channels WHERE ((channels.id = messages.channel_id) AND (channels.is_private = false)))) OR (EXISTS ( SELECT 1 FROM channel_members WHERE ((channel_members.channel_id = messages.channel_id) AND (channel_members.user_id = auth.uid()))))));

-- MUTES
DROP POLICY IF EXISTS "Mods can manage mutes" ON public.mutes;
DROP POLICY IF EXISTS "Owners and admins can view mutes" ON public.mutes;

CREATE POLICY "Mods can manage mutes"
ON public.mutes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Owners and admins can view mutes"
ON public.mutes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()) OR (user_id = auth.uid()));

-- PRIVATE_MESSAGES
DROP POLICY IF EXISTS "Admins can delete any message" ON public.private_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can delete own sent messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.private_messages;

CREATE POLICY "Admins can delete any PM"
ON public.private_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Admins can view all PMs"
ON public.private_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Users can delete own sent messages"
ON public.private_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Users can send messages"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view own messages"
ON public.private_messages
FOR SELECT
TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- PROFILES
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- TRIVIA_SCORES
DROP POLICY IF EXISTS "Anyone can view trivia scores" ON public.trivia_scores;
DROP POLICY IF EXISTS "Users can insert own score" ON public.trivia_scores;
DROP POLICY IF EXISTS "Users can update own score" ON public.trivia_scores;

CREATE POLICY "Authenticated users can view trivia scores"
ON public.trivia_scores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own score"
ON public.trivia_scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own score"
ON public.trivia_scores
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- USER_LOCATIONS
DROP POLICY IF EXISTS "Admins can manage all locations" ON public.user_locations;
DROP POLICY IF EXISTS "Owners can view all locations" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can view own location" ON public.user_locations;

CREATE POLICY "Admins can manage all locations"
ON public.user_locations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

CREATE POLICY "Owners can view all locations"
ON public.user_locations
FOR SELECT
TO authenticated
USING (is_owner(auth.uid()));

CREATE POLICY "Users can insert own location"
ON public.user_locations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
ON public.user_locations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own location"
ON public.user_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can update non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owners can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can update non-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND (role <> ALL (ARRAY['owner'::app_role, 'admin'::app_role])))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND (role <> ALL (ARRAY['owner'::app_role, 'admin'::app_role])));

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can update all roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_owner(auth.uid()) AND (role <> 'owner'::app_role))
WITH CHECK (is_owner(auth.uid()) AND (role <> 'owner'::app_role));

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);