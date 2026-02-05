 # JustAChat™ System Architecture Reference
 **Snapshot Date:** February 5, 2026
 **Purpose:** Reference document to compare against future changes
 
 ---
 
 ## 🔐 Authentication System
 
 ### Files
 - `src/hooks/useAuth.tsx` - Main auth hook
 - `src/pages/Auth.tsx` - Login/signup page
 - `src/components/auth/TurnstileCaptcha.tsx` - Bot protection
 
 ### Features
 - Email/password registration (18+ only, no minors)
 - Google OAuth with manual hash parsing for VPS (`#access_token`, `#refresh_token`)
 - `detectSessionInUrl: true` insufficient for self-hosted - uses `supabase.auth.setSession()`
 - OAuth processing state with 4-second timeout fallback
 - 5-second safety timeout in `initializeAuth` to prevent black screens
 - Role hierarchy: `owner > admin > moderator > user`
 - Admin role stability: loading state held until role fetched
 - Turnstile CAPTCHA verification via `verify-captcha` edge function
 
 ### Database
 - `profiles` table with `user_id`, `username`, `avatar_url`, `bio`, `age`, `ghost_mode`
 - `user_roles` table with `app_role` enum
 - `handle_new_user()` trigger creates profile on signup
 - Google OAuth extracts name from `raw_user_meta_data`
 
 ---
 
 ## 💬 Public Chat System
 
 ### Files
 - `src/components/chat/ChatRoom.tsx` - Main chat container
 - `src/components/chat/ChatInput.tsx` - Unified input with commands
 - `src/components/chat/MessageBubble.tsx` - Message rendering
 - `src/components/chat/MemberList.tsx` - Online users
 - `src/components/chat/ChannelList.tsx` - Room list
 
 ### Features
 - Ephemeral sessions (no history saved/loaded)
 - Real-time via Supabase Realtime (`postgres_changes`)
 - Command autocomplete (`/me`, `/join`, `/nick`, etc.)
 - Input history (Up/Down arrows)
 - @mentions with autocomplete
 - Image uploads inline `[img:URL]` format
 - Emoji/GIF picker via Klipy API
 - Mobile auto-send on image selection
 - `shrink-0` input container, `min-h-0` scroll area for layout stability
 
 ### Channels
 - Public and private rooms
 - Room passwords (`room_password`) and admin passwords (`admin_password`)
 - Room-level bans, mutes, access lists
 - Channel moderation settings (profanity filter, URL filter, link previews)
 - Room admins table for delegated moderation
 
 ---
 
 ## 📩 Private Message (PM) System
 
 ### Files
 - `src/hooks/usePrivateChats.ts` - PM state management
 - `src/components/chat/PrivateChatWindow.tsx` - Floating PM windows
 - `src/components/chat/PMTray.tsx` - PM tray UI
 - `supabase/functions/encrypt-pm/index.ts` - Server-side encryption
 - `supabase/functions/decrypt-pm/index.ts` - Server-side decryption
 
 ### Features
 - End-to-end encryption via `PM_MASTER_KEY` secret
 - Optimistic UI: messages added immediately with temp IDs
 - Dual realtime subscriptions (incoming/outgoing)
 - Parallel decryption via `Promise.all`
 - Deduplication via `processedIdsRef`
 - Draggable/resizable floating windows
 - Bot PM support
 - Admin audit logging in encrypt/decrypt functions
 - VPS: cold restart required after syncing functions
 
 ### Database
 - `private_messages` table: `encrypted_content`, `iv`, `sender_id`, `recipient_id`
 
 ---
 
 ## 🤖 Bot System
 
 ### Files
 - `src/lib/chatBots.ts` - Bot definitions and personalities
 - `src/hooks/useChatBots.ts` - Bot interaction hook
 - `src/hooks/useBotChats.ts` - Bot PM conversations
 - `src/components/chat/BotTray.tsx` - Bot list UI
 - `src/components/chat/BotChatWindow.tsx` - Bot chat modal
 - `supabase/functions/chat-bot/index.ts` - VPS bot endpoint
 - `supabase/functions/chat-bot-cloud/index.ts` - Cloud bot endpoint
 
 ### Features
 - Unified architecture: all bots use OpenAI `gpt-4o-mini`
 - `getChatBotFunctionName()` selects endpoint by environment
 - Bot message synchronization via Realtime (`room:${channelId}:bots`)
 - Bots appear in /NAMES for IRC clients
 - Bot voice calls with speech recognition
 - Text fallback for non-HTTPS browsers
 
 ### Database
 - `bot_settings` table: `enabled`, `chat_speed`, `allowed_channels`, `moderator_bots_enabled`
 - `bot_photos` table: custom bot avatars
 
 ---
 
 ## 🖼️ Image Upload System
 
 ### Files
 - `supabase/functions/upload-image/index.ts` - Upload handler
 - `src/components/chat/ChatInput.tsx` - Upload trigger
 
 ### Features
 - Rate limiting: 5 uploads/minute per user
 - AI content moderation via GPT-4o-mini
 - Multipart form-data and raw binary support
 - VPS URL mapping: `http://kong:8000` → `https://justachat.net`
 - Service role fallback for RLS bypass
 - 10MB max file size
 - Allowed types: JPEG, PNG, GIF, WebP
 
 ### Storage
 - `avatars` bucket (public)
 - `chat-images` bucket (public)
 - Kong `storage-v1-public` route for unauthenticated access to `/storage/v1/object/public/`
 
 ---
 
 ## 🎥 Voice & Video Chat
 
 ### Files
 - `src/pages/VoiceChat.tsx` - Voice room
 - `src/pages/VideoChat.tsx` - Video room
 - `src/hooks/useVoiceBroadcast.ts` - Voice streaming
 - `src/hooks/useVideoBroadcast.ts` - Video streaming
 - `src/hooks/usePrivateCall.ts` - 1-on-1 calls
 - `src/components/voice/AudioVisualizerRing.tsx` - Audio visualization
 
 ### Features
 - Works on Cloud and VPS
 - Real-time audio visualization
 - Bot interaction in voice (speech recognition + TTS)
 - Text input fallback for unsupported browsers
 - Private calls between users
 
 ---
 
 ## 🔌 IRC Gateway
 
 ### Files
 - `supabase/functions/irc-gateway/index.ts` - IRC protocol handler
 
 ### Features
 - Edge Function in Deno runtime (not standalone Node.js)
 - External mIRC clients connect via Nginx (port 443) → Kong → Edge Function
 - Standard commands: `/join`, `/part`, `/msg`, `/nick`
 - Role-based name coloring
 - Simulated bots in /NAMES
 - Auth via `PASS email;password`
 - Port 8000 blocked externally; port 6667 prohibited
 
 ---
 
 ## 🛡️ Moderation System
 
 ### Files
 - `src/lib/contentModeration.ts` - Client-side filters
 - `supabase/functions/ai-moderator/index.ts` - AI moderation
 - `supabase/functions/execute-moderation/index.ts` - Action executor
 - `src/components/chat/RoomSettingsModal.tsx` - Channel settings
 
 ### Features
 - Channel-specific settings: profanity filter, URL filter, link previews
 - Common abbreviations whitelisted (prevents false positives)
 - Non-adult channels apply filters; adult channels exempt
 - Tiered tools by role (owner > admin > moderator)
 - Room-level bans/mutes with expiration
 - Network-wide bans, mutes, K-lines
 - Audit logs via `audit-log` edge function
 
 ### Database
 - `bans`, `mutes`, `klines` tables
 - `room_bans`, `room_mutes` tables
 - `channel_moderation_settings` table
 - `audit_logs` table
 
 ---
 
 ## 👥 Friends & Social
 
 ### Files
 - `src/hooks/useFriends.ts` - Friend management
 - `src/components/friends/FriendsList.tsx` - Friend list UI
 - `src/components/friends/FriendsTray.tsx` - Tray component
 - `src/components/friends/FriendRequestPopup.tsx` - Request modal
 
 ### Features
 - Friend requests with accept/decline
 - Real-time notifications (audible + popup)
 - `friend_requests` table in `supabase_realtime` publication
 - Block users functionality
 
 ### Database
 - `friends` table
 - `friend_requests` table
 - `blocked_users` table
 
 ---
 
 ## 🎨 Theme System
 
 ### Files
 - `src/contexts/ThemeContext.tsx` - Theme provider
 - `src/components/theme/ThemeSelector.tsx` - Theme picker
 - `src/components/theme/LoginThemeSelector.tsx` - Login page themes
 
 ### Features
 - Multiple themes: OG, Retro, Matrix, Vapor, Jungle, Valentines, St Patricks
 - Theme-specific mascots, watermarks, animations
 - Login preview uses sessionStorage (`jac_local_theme_preview`) to avoid RLS errors
 - ThemeContext prioritizes local state over DB themes in preview
 
 ---
 
 ## 🌍 Location & Analytics
 
 ### Files
 - `src/hooks/useAutoLocation.ts` - IP geolocation
 - `supabase/functions/geolocate/index.ts` - Geolocation API
 - `src/pages/MapView.tsx` - User map
 
 ### Features
 - Automatic background IP-based geolocation
 - SHA-256 IP hashing for privacy
 - ~1km coordinate precision
 - 90-day cleanup for old locations
 
 ### Database
 - `user_locations` table with public view `user_locations_public` (hides IP/ISP)
 
 ---
 
 ## 📧 Email System
 
 ### Files
 - `supabase/functions/send-auth-email/index.ts` - Auth emails via Resend
 
 ### Secrets
 - `RESEND_API_KEY`
 - `SEND_EMAIL_HOOK_SECRET`
 
 ---
 
 ## 🗄️ Edge Functions Summary
 
 | Function | Purpose |
 |----------|---------|
 | `admin-list-users` | List auth users (admin only) |
 | `admin-reset-password` | Reset user password (admin) |
 | `ai-moderator` | AI content analysis |
 | `art-curator` | Art discussion bot |
 | `audit-log` | Security audit logging |
 | `chat-bot` | VPS bot endpoint |
 | `chat-bot-cloud` | Cloud bot endpoint |
 | `check-rate-limit` | Rate limiting |
 | `decrypt-pm` | PM decryption |
 | `delete-account` | Account deletion |
 | `encrypt-pm` | PM encryption |
 | `execute-moderation` | Ban/mute/kick actions |
 | `geolocate` | IP geolocation |
 | `gif-search` | GIF search API |
 | `image-to-irc` | Image to ASCII art |
 | `irc-gateway` | IRC protocol handler |
 | `oper-auth` | IRC operator auth |
 | `pm-monitor` | PM monitoring (admin) |
 | `send-auth-email` | Email via Resend |
 | `translate-message` | Message translation |
 | `upload-image` | Image upload + moderation |
 | `verify-captcha` | Turnstile verification |
 | `vps-test` | VPS health check |
 
 ---
 
 ## 🔑 Secrets Reference
 
 | Secret | Purpose |
 |--------|---------|
 | `OPENAI_API_KEY` | AI bots + moderation |
 | `PM_MASTER_KEY` | PM encryption |
 | `KLIPY_API_KEY` | Emoji/GIF picker |
 | `RESEND_API_KEY` | Email sending |
 | `TURNSTILE_SECRET_KEY` | CAPTCHA verification |
 | `GOOGLE_MAPS_API_KEY` | Map features |
 | `OPER_PASSWORD` | IRC operator auth |
 | `VPS_DEPLOY_TOKEN` | Deployment auth |
 | `GITHUB_PAT` | GitHub integration |
 | `SUPABASE_*` | Database access |
 
 ---
 
 ## 🖥️ VPS Infrastructure
 
 ### Network
 - Port 80/443: Nginx (public)
 - Port 3001: Node API (Docker only)
 - Port 3002: WebSockets (Docker only)
 - Port 6669: IRC (Docker only)
 - Port 8000: Kong Gateway (blocked externally)
 
 ### Key Scripts
 - `update-vps.sh` - Git pull + env protection
 - `vps-health-check.sh` - System diagnostics
 - `fix-kong-public-storage.sh` - Kong public storage route
 - `sync-rebuild.sh` - Key synchronization
 - `safe-pull.sh` - Patches frontend for VPS endpoints
 
 ### Docker Services
 - `db` - PostgreSQL
 - `auth` - GoTrue
 - `rest` - PostgREST
 - `storage` - Storage API
 - `realtime` - Realtime server
 - `functions` - Edge Functions (Deno)
 - `kong` - API Gateway
 
 ---
 
 ## 📋 Database Tables Summary
 
 ### Core
 - `profiles`, `user_roles`, `registered_nicks`
 
 ### Chat
 - `channels`, `channel_members`, `messages`
 - `channel_settings`, `channel_moderation_settings`
 - `channel_registrations`, `channel_access_list`
 
 ### Moderation
 - `bans`, `mutes`, `klines`
 - `room_bans`, `room_mutes`, `room_admins`
 - `user_reports`, `audit_logs`
 
 ### Social
 - `friends`, `friend_requests`, `blocked_users`
 - `private_messages`
 
 ### Features
 - `user_locations`, `user_channel_visits`
 - `dating_profiles`, `dating_swipes`, `dating_matches`
 - `trivia_scores`, `art_pieces`, `art_discussions`
 - `bot_settings`, `bot_photos`
 - `donation_settings`, `donation_clicks`
 - `support_tickets`, `support_messages`
 - `site_settings`, `network_stats`, `login_attempts`
 
 ---
 
 **End of snapshot**