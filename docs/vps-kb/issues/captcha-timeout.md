# ISSUE: CAPTCHA Verification Freeze/Timeout
Date: 2026-02-14

## Problem
Login CAPTCHA verification hangs indefinitely, freezing the login page.

## Symptoms
- Login form freezes after completing Turnstile CAPTCHA
- No error shown, just infinite spinner
- Happens on VPS production site

## Root Cause
`supabase.functions.invoke()` has no built-in timeout. If the edge function is slow or unreachable, the call hangs forever.

## Solution
Replaced `supabase.functions.invoke()` with direct `fetch()` + `AbortController` (8s timeout) in `src/pages/Auth.tsx`:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);

const res = await fetch(`${supabaseUrl}/functions/v1/verify-captcha`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  },
  body: JSON.stringify({ token }),
  signal: controller.signal,
});
clearTimeout(timeout);
```

## Prevention
- Always use `AbortController` with timeouts for edge function calls
- Never rely on `supabase.functions.invoke()` for user-facing critical paths
