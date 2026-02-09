# JustAChat System Architecture Snapshot — 2026-02-09

## Status: ✅ ALL SYSTEMS FUNCTIONAL

---

## IRC Gateway (Web↔IRC Relay) — WORKING

- **Deploy ID:** `2026-02-09-bridge-poll-v2`
- **Bridge:** `public/vps-deploy/irc-bridge.js` (Node.js, PM2 managed as `jac-irc-bridge`)
- **Edge Function:** `supabase/functions/irc-gateway/index.ts` (v2.1, `JAC-IRC-2.1`)
- **Architecture:** HTTP bridge polling pattern
  - Bridge creates TCP server on port 6667 for mIRC clients
  - Translates IRC protocol to HTTP POST calls to Edge Function
  - Bridge sessions are **persisted** in the Edge Function's `sessions` Map with `isBridge: true`
  - Pending messages (web→IRC) queued in `session.pendingMessages[]`
  - Bridge polls every 2 seconds via `POLL` command to retrieve queued messages
  - Realtime subscription on `messages` table relays web chat to IRC sessions
- **Auth:** `email;password` format in IRC server password field → Supabase `signInWithPassword`
- **Key fix:** Bridge sessions must be stored in global `sessions` map so Realtime relay can find subscribers
- **Key fix:** `ws.close()` guarded with `!s.isBridge` check in KILL/QUIT handlers

### Deployment Commands (VPS)
```bash
# Copy updated gateway to BOTH volume paths
sudo cp /var/www/justachat/supabase/functions/irc-gateway/index.ts ~/supabase/docker/volumes/functions/irc-gateway/index.ts
sudo cp /var/www/justachat/supabase/functions/irc-gateway/index.ts ~/supabase/docker/volumes/functions/main/irc-gateway/index.ts

# Hard restart edge functions (clears Deno cache)
cd ~/supabase/docker && docker compose stop functions && docker compose rm -f functions && docker compose up -d functions

# Restart IRC bridge with ANON_KEY
pm2 delete jac-irc-bridge 2>/dev/null
cd /var/www/justachat && ANON_KEY=$(grep -E "^ANON_KEY=|^SUPABASE_ANON_KEY=" ~/supabase/docker/.env | head -1 | cut -d= -f2 | tr -d '"') pm2 start public/vps-deploy/irc-bridge.js --name jac-irc-bridge -f
```

### Critical: Two Volume Paths
The VPS edge-runtime reads from `/home/deno/functions/irc-gateway/` (host: `~/supabase/docker/volumes/functions/irc-gateway/`). The router also imports from `main/irc-gateway/`. **Both must be updated** when deploying changes.

---

## Authentication — WORKING
- Email/password signup with email verification (Supabase Auth)
- Google OAuth (configured)
- IRC auth via `email;password` in server password field
- Profile auto-creation via `handle_new_user()` trigger

## Chat System — WORKING
- 12 channels: general, music, games, technology, sports, politics, movies-tv, dating, adults-21-plus, trivia, help, lounge
- Real-time messaging via Supabase Realtime (`messages` table in `supabase_realtime` publication)
- E2EE private messages via `encrypt-pm` / `decrypt-pm` edge functions
- Bot system: 10 bots per channel, powered by OpenAI `gpt-4o-mini`
- Bot messages synchronized via dedicated Realtime channel (`room:${channelId}:bots`)

## Realtime Publication Tables
bans, blocked_users, bot_settings, channel_members, channel_settings, channels, friend_requests, friends, messages, mutes, private_messages, profiles, room_admins, room_bans, room_mutes, site_settings, user_roles

## Infrastructure — WORKING
- **VPS:** 157.245.174.197 (DigitalOcean)
- **Domain:** justachat.net
- **Stack:** Self-hosted Supabase Docker + Nginx reverse proxy
- **Edge Functions:** Routed via `main/index.ts` router (monkey-patches `Deno.serve`)
- **Frontend:** React/Vite/Tailwind, built to `/var/www/justachat/dist/`
- **Maintenance:** `master-update.sh` handles git pull, build, nginx sync, function sync, health checks
- **Nginx:** Forces `127.0.0.1:8000` (not IPv6) for Kong proxy

## Key Files
| Component | File |
|-----------|------|
| IRC Bridge | `public/vps-deploy/irc-bridge.js` |
| IRC Gateway Edge Function | `supabase/functions/irc-gateway/index.ts` |
| Master Update Script | `public/vps-deploy/master-update.sh` |
| Relay Diagnostic | `public/vps-deploy/diagnose-relay.sh` |
| Bot Configuration | `src/lib/chatBots.ts` |
| VPS Server | `public/vps-deploy/server.js` |
| Nginx Config | `public/nginx-justachat.conf` |
