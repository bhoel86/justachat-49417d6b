

# Fix Plan: 7 Issues Step-by-Step

## Issue 1: Image Uploads Not Working

**Root Cause:** The upload endpoint URL is built from `VITE_SUPABASE_URL` which points to Lovable Cloud (`supabase.co`), not the VPS. On the VPS, the upload-image edge function runs locally but the frontend might be hitting the wrong endpoint. Additionally, the edge function logs need checking.

**Fix:**
- Test the upload-image edge function directly to confirm it works on Cloud
- Check edge function logs for errors
- The VPS already has `mapToPublicUrl()` logic — the issue is likely that on VPS the function itself errors out (storage RLS, missing bucket policies, or service role key issues)
- Add better error logging in ChatInput.tsx so we can see exactly what response comes back
- Ensure the `chat-images` bucket has proper INSERT policies for authenticated users

**VPS Diagnostic:**
```bash
# Test upload endpoint
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://127.0.0.1:8000/functions/v1/upload-image
curl -s -X POST http://127.0.0.1:8000/functions/v1/upload-image -w "%{http_code}"
docker compose logs functions --tail 30 | grep -i "upload\|error"
```

---

## Issue 2: 3-Dot Menu Options Disappear Too Fast

**Root Cause:** In `MemberList.tsx` (line 1128-1136), the 3-dot DropdownMenuTrigger button has `opacity-0 group-hover:opacity-100`. The dropdown content opens but when the mouse leaves the trigger area, the group-hover state changes and causes layout shifts. The menu itself may also close due to focus/pointer interaction conflicts.

**Fix:**
- Change the trigger button from `opacity-0 group-hover:opacity-100` to always visible (or at least `opacity-50 group-hover:opacity-100`) so the hover state doesn't fight with the dropdown open state
- Add `onCloseAutoFocus={(e) => e.preventDefault()}` to `DropdownMenuContent` to prevent focus stealing

---

## Issue 3: Friends List Not Working

**Root Cause:** The `useFriends` hook (line 68) uses `supabase.from('friends').select('*')` — the standard Supabase JS client. Per the project memory, all data-heavy components should use REST helpers (`restSelect`) instead of `supabase.from()` because the JS client can hang on the VPS.

**Fix:**
- Convert `useFriends.ts` data fetching from `supabase.from()` to use `restSelect` / direct fetch calls
- Also convert friend request fetching and blocked users fetching
- Ensure the online presence tracking for friends uses the `global-online-users` channel correctly

---

## Issue 4: Remove "Now Playing" Feature Under Users

**Root Cause:** The `currentlyPlaying` display in `MemberList.tsx` (lines 1114-1122) shows music info under each user. This data comes from presence metadata (`nowPlaying`). It also causes presence metadata updates that trigger unnecessary re-renders.

**Fix:**
- Remove the `currentlyPlaying` prop and its rendering from `MemberItem` component (lines 1114-1122)
- Remove `listeningUsers` tracking from `ChatRoom.tsx` presence sync handler
- Stop broadcasting `nowPlaying` in the presence `track()` call (line 501)
- Remove the `listeningUsers` prop from `MemberList` component entirely
- This also eliminates metadata-only presence updates that cause bouncing

---

## Issue 5: Member List Bouncing — Users/Admins Appear Then Disappear

**Root Cause:** The `fetchMembers` function fetches ALL staff IDs globally (line 199), but then only shows them if they're in `presenceIds`. The problem is timing — presence sync fires, staff are seen briefly, then the next sync might miss them if their presence heartbeat is slightly delayed. The 10-second polling interval re-fetches and may get different results.

**Fix:**
- Remove the global staff fetch entirely — staff should appear only via normal presence + channel_members, same as everyone else
- The previous fix of fetching all staff IDs was overcomplicating things and causing the bouncing
- Simplify `fetchMembers` back to: presence IDs + channel_members IDs + current user = the complete member list
- Staff are already in presence when they're in the room, so they'll show up naturally
- Keep the 10-second polling fallback but remove the special staff logic

---

## Issue 6: Room Counts Not Syncing

**Root Cause:** Related to Issue 5. Room counts in the lobby/sidebar derive from `channel_members` table. The delete-then-insert pattern in ChatRoom.tsx (lines 506-513) can cause brief count drops. Also, the `visibilitychange` handler (line 549-553) deletes the member when the tab goes to background on mobile, which drops the count.

**Fix:**
- Change `visibilitychange` to only cleanup on `hidden` if the page is actually being closed (use `document.hidden` check with a delay)
- Ensure the delete-then-insert is atomic (wrap in a small delay so the delete and insert happen close together)

---

## Issue 7: VPS Diagnostics — Realtime and Kong Health Check

**Fix:** Create a simple diagnostic script section. After applying all code fixes, provide VPS commands:

```bash
# 1. Update code
cd /var/www/justachat && sudo chown -R unix:unix . && git pull origin main

# 2. Check Kong health
curl -s http://127.0.0.1:8000/ | head -5
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/auth/v1/health

# 3. Check Realtime
docker ps | grep realtime
docker compose logs realtime --tail 10

# 4. Check Edge Functions
docker ps | grep functions
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://127.0.0.1:8000/functions/v1/upload-image

# 5. Test chat message sending
# Send a test message via REST API to confirm messages table INSERT works

# 6. Build and deploy
bash /var/www/justachat/public/vps-deploy/vps-update.sh
```

---

## Technical Summary of File Changes

| File | Changes |
|------|---------|
| `src/components/chat/MemberList.tsx` | Remove `currentlyPlaying` prop/render, remove `listeningUsers` prop, make 3-dot button always visible, simplify `fetchMembers` to remove global staff fetch |
| `src/components/chat/ChatRoom.tsx` | Remove `nowPlaying` from presence `track()`, remove `listeningUsers` state, fix `visibilitychange` handler timing |
| `src/hooks/useFriends.ts` | Convert from `supabase.from()` to `restSelect` / direct fetch for all data queries |
| `src/components/chat/ChatInput.tsx` | Add console.error for upload response debugging |

## Implementation Order

1. Fix MemberList (3-dot menu + remove nowPlaying + simplify staff logic)
2. Fix ChatRoom (stop broadcasting nowPlaying, fix visibility handler)
3. Fix useFriends (convert to REST helpers)
4. Test upload-image edge function and add debugging
5. Provide VPS diagnostic commands

