# Image Upload Fix — VPS Environment

**Date:** 2026-02-15  
**Issue:** Image uploads in main chat stuck at 50% / "You must be signed in" error  
**Status:** ✅ Fixed

## Problem

Image uploads in the main chat (`ChatInput.tsx`) were failing on the VPS (justachat.net) in two ways:

1. **Stuck at 0%/50%:** The original `XMLHttpRequest` (XHR) approach hung indefinitely through the Kong/Nginx proxy on VPS — the request never completed or errored.
2. **"You must be signed in" error:** After switching to `fetch()`, the auth token retrieval via `supabase.auth.getSession()` also hung on VPS, leaving `tokenRef` null.

Meanwhile, **Private Message (PM) image uploads worked fine** because they used a different pattern.

## Root Cause

Two separate VPS-specific issues:

1. **XHR hangs through Kong proxy:** `XMLHttpRequest` with `responseType: "json"` did not properly complete through the Kong 2.8.1 gateway. The server returned a valid response (confirmed via curl), but the browser XHR never fired `onload`.

2. **`supabase.auth.getSession()` hangs on VPS:** This async call can hang indefinitely on the self-hosted Supabase instance, preventing the auth token from being retrieved at upload time. Both direct calls and `onAuthStateChange` listeners were unreliable for seeding the token.

## Fix

Two changes applied to `src/components/chat/ChatInput.tsx`:

### 1. Replace XHR with `fetch()` (same as PM)
```typescript
// BEFORE (broken on VPS):
const xhr = new XMLHttpRequest();
xhr.open("POST", endpoint);
xhr.responseType = "json";
// ... XHR never completed through Kong

// AFTER (working):
const resp = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    ...(apikey ? { "apikey": apikey } : {}),
  },
  body: formData,
  signal: controller.signal,
});
const data = await resp.json();
```

### 2. Pass auth token as prop instead of calling `getSession()` (same as PM)
```typescript
// BEFORE (broken on VPS):
const { data: sessionData } = await supabase.auth.getSession(); // HANGS
const accessToken = sessionData.session?.access_token;

// AFTER (working):
// ChatRoom.tsx passes session token as prop:
<ChatInput accessToken={session?.access_token} ... />

// ChatInput.tsx receives and caches it:
const tokenRef = useRef<string | null>(propToken ?? null);
useEffect(() => {
  if (propToken) tokenRef.current = propToken;
}, [propToken]);
```

## Key Takeaway

**On the VPS, never use `supabase.auth.getSession()` in async upload/action paths.** Always pass the token from the parent component's `useAuth()` context via props or refs. This is the same pattern that fixed PM functionality earlier (see `docs/2026-02-15-pm-decryption-fix.md`).

## Files Changed

- `src/components/chat/ChatInput.tsx` — Replaced XHR with fetch, added `accessToken` prop, removed `getSession()` call
- `src/components/chat/ChatRoom.tsx` — Passes `session?.access_token` to `ChatInput`
