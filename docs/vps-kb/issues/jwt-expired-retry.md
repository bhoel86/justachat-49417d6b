# JWT Expired Token Auto-Retry

## Date: 2026-02-14

## Problem
All REST API calls (`restSelect`, `restInsert`, `restUpdate`, `restDelete`) used a cached JWT token that was never refreshed when expired. On VPS, the `onAuthStateChange` auto-refresh doesn't always fire, causing 401 errors across:
- Chat messages
- Friends list
- Lobby member count
- Member list visibility

## Solution
Added automatic 401 retry logic to all REST helpers in `src/lib/supabaseRest.ts`:

1. When a REST call returns HTTP 401, the helper calls `supabase.auth.refreshSession()`
2. If refresh succeeds, the cached token is updated and the request is retried once
3. If the caller explicitly passed an `accessToken`, no retry is attempted (caller manages their own tokens)

### Helper: `tryRefreshToken()`
- Calls `supabase.auth.refreshSession()`
- Updates `_cachedAccessToken` on success
- Returns fresh token or `null`

## Files Changed
- `src/lib/supabaseRest.ts` — all 4 REST helpers + new `tryRefreshToken()` function

## Impact
Fixes Issues #2 (chat), #4 (friends), #5 (lobby count), #7 (user visibility)

## VPS Deploy
```bash
cd /var/www/justachat && git pull origin main && npm run build && sudo cp -r dist/* /var/www/justachat/dist/
```
