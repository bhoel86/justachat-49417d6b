-- VPS Supabase RLS Policies for JustAChat
-- Run this after vps-migration.sql

-- ============================================
-- USER ROLES POLICIES
-- ============================================
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view all roles" ON public.user_roles FOR SELECT USING (is_owner(auth.uid()));
-- Allow all authenticated users to see owner/admin/moderator roles (staff visibility in member list)
CREATE POLICY "Authenticated users can view staff roles" ON public.user_roles FOR SELECT TO authenticated USING (role IN ('owner'::public.app_role, 'admin'::public.app_role, 'moderator'::public.app_role));
CREATE POLICY "Owners can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_owner(auth.uid()) AND role <> 'owner');
CREATE POLICY "Owners can update roles" ON public.user_roles FOR UPDATE USING (is_owner(auth.uid()) AND role <> 'owner') WITH CHECK (is_owner(auth.uid()) AND role <> 'owner');
CREATE POLICY "Admins can insert non-admin roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') AND role IN ('user', 'moderator'));
CREATE POLICY "Admins can update non-admin roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin') AND role IN ('user', 'moderator')) WITH CHECK (has_role(auth.uid(), 'admin') AND role IN ('user', 'moderator'));

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- CHANNELS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view public non-hidden channels" ON public.channels FOR SELECT USING ((is_private = false AND is_hidden = false) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Members can view private channels" ON public.channels FOR SELECT USING (is_private = true AND EXISTS (SELECT 1 FROM channel_members WHERE channel_id = channels.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create their own channels" ON public.channels FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Channel creators and mods can update channels" ON public.channels FOR UPDATE USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));
CREATE POLICY "Mods can delete channels" ON public.channels FOR DELETE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- ============================================
-- MESSAGES POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages to channels they're in" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id AND (EXISTS (SELECT 1 FROM channels WHERE id = messages.channel_id AND is_private = false) OR EXISTS (SELECT 1 FROM channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid())));
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete any message" ON public.messages FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- CHANNEL MEMBERS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view channel members" ON public.channel_members FOR SELECT USING (true);
CREATE POLICY "Users can join public channels" ON public.channel_members FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM channels WHERE id = channel_members.channel_id AND is_private = false));
CREATE POLICY "Users can leave channels" ON public.channel_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Mods can manage channel members" ON public.channel_members FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- ============================================
-- ROOM ADMINS POLICIES
-- ============================================
CREATE POLICY "Users can see room admins" ON public.room_admins FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room owners can manage room admins" ON public.room_admins FOR ALL USING (is_room_owner(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- CHANNEL SETTINGS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view channel settings" ON public.channel_settings FOR SELECT USING (true);
CREATE POLICY "Mods can update channel settings" ON public.channel_settings FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- ============================================
-- CHANNEL REGISTRATIONS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view channel registrations" ON public.channel_registrations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Channel founders can register" ON public.channel_registrations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM channels WHERE id = channel_registrations.channel_id AND created_by = auth.uid()));
CREATE POLICY "Founders can update registration" ON public.channel_registrations FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Founders can delete registration" ON public.channel_registrations FOR DELETE USING (founder_id = auth.uid() OR is_owner(auth.uid()));

-- ============================================
-- CHANNEL ACCESS LIST POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view access lists" ON public.channel_access_list FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Channel owners can manage access" ON public.channel_access_list FOR ALL USING (EXISTS (SELECT 1 FROM channels WHERE id = channel_access_list.channel_id AND created_by = auth.uid()) OR is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ============================================
-- CHANNEL MODERATION SETTINGS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view moderation settings" ON public.channel_moderation_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Room admins can manage moderation settings" ON public.channel_moderation_settings FOR ALL USING (is_room_owner(auth.uid(), channel_id) OR is_room_admin(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- BANS POLICIES
-- ============================================
CREATE POLICY "Owners and admins can view bans" ON public.bans FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Mods can manage bans" ON public.bans FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- ============================================
-- MUTES POLICIES
-- ============================================
CREATE POLICY "Owners and admins can view mutes" ON public.mutes FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Mods can manage mutes" ON public.mutes FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- ============================================
-- ROOM BANS POLICIES
-- ============================================
CREATE POLICY "Users can see if they are banned from a room" ON public.room_bans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Room owners and admins can manage room bans" ON public.room_bans FOR ALL USING (is_room_admin(auth.uid(), channel_id) OR is_room_owner(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- ROOM MUTES POLICIES
-- ============================================
CREATE POLICY "Users can see if they are muted in a room" ON public.room_mutes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Room owners and admins can manage room mutes" ON public.room_mutes FOR ALL USING (is_room_admin(auth.uid(), channel_id) OR is_room_owner(auth.uid(), channel_id) OR has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- KLINES POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view klines" ON public.klines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owners and admins can manage klines" ON public.klines FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- PRIVATE MESSAGES POLICIES
-- ============================================
CREATE POLICY "Users can view own messages" ON public.private_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Admins can view all PMs" ON public.private_messages FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can send messages" ON public.private_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete own sent messages" ON public.private_messages FOR DELETE USING (auth.uid() = sender_id);
CREATE POLICY "Admins can delete any PM" ON public.private_messages FOR DELETE USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- FRIENDS POLICIES
-- ============================================
CREATE POLICY "Users can view their friendships" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their friendships" ON public.friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- FRIEND REQUESTS POLICIES
-- ============================================
CREATE POLICY "Users can view friend requests involving them" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update requests sent to them" ON public.friend_requests FOR UPDATE USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "Users can delete their own requests" ON public.friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ============================================
-- BLOCKED USERS POLICIES
-- ============================================
CREATE POLICY "Users can view their blocks" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================
-- USER LOCATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own location" ON public.user_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view all locations" ON public.user_locations FOR SELECT USING (is_owner(auth.uid()));
CREATE POLICY "Users can insert own location" ON public.user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location" ON public.user_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all locations" ON public.user_locations FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- LOGIN ATTEMPTS POLICIES
-- ============================================
CREATE POLICY "Service role only" ON public.login_attempts FOR ALL USING (true);

-- ============================================
-- REGISTERED NICKS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view registered nicks" ON public.registered_nicks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can register own nick" ON public.registered_nicks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own registration" ON public.registered_nicks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own registration" ON public.registered_nicks FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- USER CHANNEL VISITS POLICIES
-- ============================================
CREATE POLICY "Users can view their own visits" ON public.user_channel_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own visits" ON public.user_channel_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own visits" ON public.user_channel_visits FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- USER CONVERSATION TOPICS POLICIES
-- ============================================
CREATE POLICY "Users can view own conversation topics" ON public.user_conversation_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversation topics" ON public.user_conversation_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversation topics" ON public.user_conversation_topics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage conversation topics" ON public.user_conversation_topics FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DATING PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view all dating profiles" ON public.dating_profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own dating profile" ON public.dating_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dating profile" ON public.dating_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- DATING SWIPES POLICIES
-- ============================================
CREATE POLICY "Users can view own swipes" ON public.dating_swipes FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Users can create own swipes" ON public.dating_swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- ============================================
-- DATING MATCHES POLICIES
-- ============================================
CREATE POLICY "Users can view own matches" ON public.dating_matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Authenticated users can create matches" ON public.dating_matches FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- DONATION SETTINGS POLICIES
-- ============================================
CREATE POLICY "Anyone can view donation settings" ON public.donation_settings FOR SELECT USING (true);
CREATE POLICY "Owners can insert donation settings" ON public.donation_settings FOR INSERT WITH CHECK (is_owner(auth.uid()));
CREATE POLICY "Owners and admins can update donation settings" ON public.donation_settings FOR UPDATE USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- DONATION CLICKS POLICIES
-- ============================================
CREATE POLICY "Users can view own donation click" ON public.donation_clicks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all donation clicks" ON public.donation_clicks FOR SELECT USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));
CREATE POLICY "Users can insert own donation click" ON public.donation_clicks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIVIA SCORES POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view trivia scores" ON public.trivia_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own score" ON public.trivia_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score" ON public.trivia_scores FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- NETWORK STATS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view stats" ON public.network_stats FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert stats" ON public.network_stats FOR INSERT WITH CHECK (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
CREATE POLICY "Owners can view audit logs" ON public.audit_logs FOR SELECT USING (is_owner(auth.uid()));
CREATE POLICY "Owners can manage audit logs" ON public.audit_logs FOR ALL USING (is_owner(auth.uid()));
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- BOT SETTINGS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view bot settings" ON public.bot_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and owners can manage bot settings" ON public.bot_settings FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- BOT PHOTOS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view bot photos" ON public.bot_photos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Service role can manage bot photos" ON public.bot_photos FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ART PIECES POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view art" ON public.art_pieces FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage art" ON public.art_pieces FOR ALL USING (has_role(auth.uid(), 'admin') OR is_owner(auth.uid()));

-- ============================================
-- ART DISCUSSIONS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view discussions" ON public.art_discussions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert discussions" ON public.art_discussions FOR INSERT WITH CHECK (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- ============================================
-- STORAGE POLICIES
-- ============================================
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- REALTIME PUBLICATION
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;

-- ============================================
-- RLS POLICIES COMPLETE!
-- ============================================
