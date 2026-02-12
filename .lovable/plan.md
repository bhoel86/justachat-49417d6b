

## Fix Plan: Chat Visibility, Member List Stability, Radio & Bot Issues

### Problems Identified

1. **Chat messages only show locally** — Other users in the same room don't see your messages. The realtime subscription is set up, but the Supabase JS client `insert` may silently fail on VPS, or the realtime publication for `messages` may not be active.

2. **Your name shows in rooms you're not in** — The member list always shows ALL owners/admins in EVERY room (line 264 of MemberList.tsx: `if (targetRole === 'owner' || targetRole === 'admin') return true`). Staff should only appear in rooms they're actually present in, but remain visible (not hidden by ghost mode) when they ARE in the room.

3. **JustaBot showing in rooms it shouldn't** — The bot moderator entry is added to the member list when `moderatorBotsEnabled` is true globally, but it doesn't check if the specific channel is in `allowed_channels`. Bots should only appear in rooms where they're enabled.

4. **Radio causing username bouncing** — Every play/pause and song change triggers a presence `track()` call, which triggers a presence `sync` event, which changes `onlineUserIds`, which triggers `fetchMembers`. This rapid cycle causes the member list to bounce. The "Listening To" status appearing and disappearing is part of this same loop.

5. **Room counts not showing +1 for some rooms** — The lobby already has bot count logic but it depends on `botsAllowedChannels` containing each room name. If a room isn't in that array, it won't get the +1.

---

### Technical Changes

#### 1. Fix Chat Message Visibility (ChatRoom.tsx)

- Replace `supabase.from('messages').insert()` with a direct REST `fetch` call (using `restInsert` or raw fetch with the access token). The Supabase JS client is known to hang/silently fail on VPS.
- Ensure the realtime subscription uses the correct filter and event handling.
- Add a database migration to ensure `messages` is in the `supabase_realtime` publication (if not already).

#### 2. Fix Staff Appearing in All Rooms (MemberList.tsx)

- Remove the blanket "always show staff" logic that fetches ALL owners/admins from `user_roles` and injects them into every room.
- Instead, only ensure staff are not hidden by ghost mode when they ARE in the room (present in `onlineUserIds` or `channel_members`).
- The current user always shows (self-seeding logic stays).

#### 3. Fix Bot Visibility Per Channel (MemberList.tsx)

- Change the `botMember` logic to also check if `channelName` is in `botSettings.allowed_channels`, not just `moderatorBotsEnabled`.
- Currently `botsEnabledForChannel` is calculated but only used elsewhere. Use it for the bot member display too.

#### 4. Stabilize Radio Presence Updates (ChatRoom.tsx)

- Debounce the presence `track()` call for `nowPlaying` changes. Instead of re-tracking on every `isPlaying`/`videoId` change, batch updates with a 2-second debounce.
- This prevents the rapid presence sync -> fetchMembers -> re-render cycle that causes bouncing.
- The "Listening To" display in MemberList already handles the `paused` flag correctly.

#### 5. Verify Room Counts (Home.tsx)

- No code change needed if `allowed_channels` in `bot_settings` is correctly populated. The existing logic at line 766 is correct. The fix in item 3 (ensuring bot visibility matches `allowed_channels`) will align the member list with the lobby counts.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/chat/ChatRoom.tsx` | Replace message insert with REST call; debounce radio presence updates |
| `src/components/chat/MemberList.tsx` | Remove blanket staff injection; gate bot on `allowed_channels`; keep ghost mode bypass for staff who ARE in room |
| Database migration | Ensure `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages` is applied |

