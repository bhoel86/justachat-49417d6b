

# Fix Plan: Radio, Ghost Members, IRC Relay, and Banner Styling

## Issue 1: Radio Not Working on VPS

**Root Cause:** The Content-Security-Policy (CSP) header currently served by Nginx on the VPS does not include YouTube domains. The master-update output shows the live CSP is missing `youtube.com`, `ytimg.com` entries in `script-src`, `frame-src`, `connect-src`, and `media-src`. The correct CSP exists in `public/nginx-justachat.conf` in the repo, but it appears the VPS's actual Nginx config file (`/etc/nginx/sites-available/justachat.net` or similar) is stale and was never synced.

**Fix:** Update `master-update.sh` to automatically sync the Nginx config from the repo during deploy. Add a stage that copies `dist/nginx-justachat.conf` to `/etc/nginx/sites-available/justachat.net` (or wherever the live config lives) before reloading Nginx. This ensures the CSP always matches the repo.

**Technical Details:**
- Add a new stage in `public/vps-deploy/master-update.sh` between "Sync Edge Functions" and "Restart Services"
- The stage will copy `dist/nginx-justachat.conf` to the correct Nginx path
- Backup the old config first for safety
- The CSP in the repo file already has the correct YouTube entries

---

## Issue 2: Users/Admins Showing in Rooms They Did Not Join

**Root Cause:** Two problems converge:

1. **IRC disconnect does not clean up `channel_members`:** When an IRC user disconnects (`socket.onclose` at line 3199), the code removes them from the in-memory `channelSubscriptions` but **never deletes their `channel_members` rows** from the database. These stale rows cause users to appear in rooms indefinitely.

2. **Web user cleanup is best-effort:** The web client (`ChatRoom.tsx` line 511-517) attempts to delete `channel_members` on unmount, but if the browser tab is closed abruptly (or the network drops), the cleanup never runs, leaving stale entries.

**Fix:**
- **IRC Gateway (`socket.onclose`):** Add database cleanup to delete all `channel_members` rows for the disconnecting user across all their joined channels.
- **Periodic cleanup:** Add a lightweight cleanup mechanism. When the member list fetches members, cross-reference `channel_members` entries against current presence state. Members in `channel_members` who are NOT in the presence state and NOT connected via IRC should be pruned.

**Technical Details (IRC Gateway):**
```
socket.onclose:
  - For each channelId in session.channels:
    - Delete from channel_members where channel_id = channelId AND user_id = session.userId
  - Remove from channelSubscriptions (already done)
  - Delete from sessions (already done)
```

This uses the `realtimeClient` (service role) since the session's authenticated client may already be invalid at disconnect time.

---

## Issue 3: IRC Cannot See Web Chat

**Root Cause:** The Realtime message relay (line 3234-3365) subscribes to `postgres_changes` on the `messages` table using a service-role client. This subscription works for relaying web messages to IRC. However, the relay depends on a successful Realtime connection.

Looking at the VPS logs, there are repeated `Connection refused` errors for `[::1]:8000` (IPv6). The Nginx config proxies to `localhost:8000` but Kong is listening on IPv4 only (`127.0.0.1:8000`). When the edge function's Realtime client connects, it goes through the same path and may hit this IPv6 issue, causing the relay subscription to fail silently.

Additionally, the edge function container is cold-restarted during every deploy, which means the Realtime subscription has to re-establish. If the subscription enters `CHANNEL_ERROR` or `TIMED_OUT`, there's a 5-second retry, but it may keep failing if the underlying connection is broken.

**Fix:**
1. **Nginx IPv6 fix:** Update the Nginx proxy config to explicitly use `127.0.0.1:8000` instead of `localhost:8000` to prevent IPv6 resolution issues.
2. **Verify Realtime relay:** The relay code already has retry logic (line 3357-3364). The IPv6 fix should resolve the underlying issue.

**Technical Details:**
- In `public/nginx-justachat.conf`, change `proxy_pass http://localhost:8000` to `proxy_pass http://127.0.0.1:8000` in the Supabase API proxy block.

---

## Issue 4: Make IRC Banners Cooler

**Current State:** The ASCII art banners are plain `#`-character block letters that look functional but boring now that spacing is correct.

**Fix:** Replace the basic hash-character ASCII art with more visually appealing designs using dots, slashes, backslashes, and pipe characters for a cleaner, more stylized look. Add decorative borders and themed accents around each banner.

**Technical Details:**
- Redesign each room's ASCII art in `ROOM_ASCII_ART_RAW` (lines 348-440 in `irc-gateway/index.ts`)
- Use a mix of `/`, `\`, `|`, `_`, `.`, and other ASCII chars (0x20-0x7E only per the standard) 
- Add decorative top/bottom borders using `=`, `-`, `~` characters with room-specific accent characters
- Enhance the welcome section formatting around the ASCII art with better dividers and spacing
- Add a "powered by" footer line with the JAC brand

Example style upgrade for "GENERAL":
```
     ___  ____  _  _  ____  ____   __   __
    / __)(  __)( \( )(  __)(  _ \ / _\ (  )
   ( (_ \ ) _) )  (  ) _)  )   //    \/ (_/\
    \___/(____)(_)\_)(____)(__ _)\_/\_/\____/
```

Each room gets its own unique style treatment while maintaining the 50-character width standard and pure ASCII requirement.

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `supabase/functions/irc-gateway/index.ts` | Fix `socket.onclose` cleanup, redesign ASCII banners |
| `public/nginx-justachat.conf` | Fix IPv6 proxy_pass, ensure CSP has YouTube |
| `public/vps-deploy/master-update.sh` | Add Nginx config sync stage |

## Implementation Order

1. Fix Nginx config (IPv6 + CSP sync) -- resolves radio and IRC relay
2. Fix `channel_members` cleanup in IRC gateway `onclose` -- resolves ghost members
3. Redesign ASCII art banners -- visual improvement
4. Deploy and verify

