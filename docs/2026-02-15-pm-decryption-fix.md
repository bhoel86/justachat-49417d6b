# PM Decryption Fix — February 15, 2026

## Problem Summary

Private messages (PMs) were failing to decrypt on the VPS deployment at `justachat.net`. Messages were being encrypted and stored correctly, but the decryption step silently failed, leaving PM windows blank.

---

## Root Cause Chain

### 1. `supabase.auth.getSession()` Hangs on VPS
The Supabase JS client's `getSession()` method would intermittently hang (never resolve) in the self-hosted Docker environment. This caused any code awaiting it to stall indefinitely.

### 2. Edge Function Receiving Anon Key Instead of User JWT
Because `getSession()` hung, the frontend fell back to sending the **anon key** as the `Bearer` token to the `decrypt-pm` Edge Function. The function then failed with: `Auth error: invalid claim: missing sub claim` — because the anon key has no `sub` (user ID) claim.

### 3. Silent Failure — No Logs in Browser
The decryption failure was silent on the frontend. After fetching 9 messages, the code checked for a token, found `undefined`, and returned early without any visible error to the user.

---

## Debugging Steps

1. **Added debug logging** to the `decrypt-pm` Edge Function to inspect the incoming token prefix.
2. **Checked VPS function logs** (`docker compose logs functions --tail=15`) — confirmed repeated `invalid claim: missing sub claim` errors.
3. **Traced the frontend flow** — confirmed `supabase.auth.getSession()` was the blocker. The `onAuthStateChange` listener also didn't re-fire for already-established sessions on VPS.
4. **Identified the fix**: Use the auth token from React context (`useAuth().session.access_token`) instead of calling `getSession()` directly.

---

## Solution

### Before (Broken)
```typescript
// PrivateChatWindow.tsx — every decrypt/send/upload call did this:
const { data: sessionData } = await supabase.auth.getSession(); // HANGS on VPS
const token = sessionData.session?.access_token;
```

### After (Fixed)
```typescript
// Import auth context
import { useAuth } from "@/hooks/useAuth";

// Inside component
const { session } = useAuth();

// Keep a ref for async callbacks
const tokenRef = useRef<string | undefined>(session?.access_token);
useEffect(() => {
  tokenRef.current = session?.access_token;
}, [session?.access_token]);

// All decrypt/send/upload calls now use:
const token = tokenRef.current; // Always available, never hangs
```

### Files Changed
- **`src/components/chat/PrivateChatWindow.tsx`** — Replaced all 7 instances of `supabase.auth.getSession()` with `tokenRef.current` sourced from `useAuth()`.

---

## Key Lessons

1. **Never call `supabase.auth.getSession()` in components on VPS** — it can hang indefinitely. Always use the token from the `useAuth()` context which is resolved once at app startup.

2. **`onAuthStateChange` doesn't re-fire for existing sessions** — If the session was established before a component mounts, the listener won't emit an initial event. This makes it unreliable as the sole token source.

3. **Use `useRef` for tokens in async callbacks** — React state/context values get stale in closures (polling intervals, Realtime handlers). A ref ensures the latest token is always accessible.

4. **Edge Function auth errors are silent by default** — The `decrypt-pm` function returned 401, but the frontend swallowed the error. Always log decryption failures visibly.

---

## VPS Deployment Steps After Fix

```bash
cd /var/www/justachat
git pull origin main
rm -rf dist node_modules/.vite
npm run build
# Hard-refresh browser, log out, log back in
```

---

## Related Memories / Context

- `PM_MASTER_KEY` must be set in both `.env` and `docker-compose.yml` `functions` service.
- Edge Functions on VPS are mounted from `/home/unix/supabase/docker/volumes/functions/` — code changes need manual copy + container restart.
- The frontend `.env` on VPS gets overwritten by `git pull` with Cloud credentials — always verify `VITE_SUPABASE_URL` points to `https://justachat.net` after syncing.
