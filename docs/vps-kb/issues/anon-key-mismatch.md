# ISSUE: ANON_KEY / Frontend Key Mismatch (401 Errors)
Date: 2026-02-14

## Problem
Frontend API calls return 401 Unauthorized; Realtime/WebSocket connections refused.

## Symptoms
- REST calls fail with 401
- Realtime "Connection refused" errors
- Login works but nothing loads after

## Root Cause
`VITE_SUPABASE_PUBLISHABLE_KEY` in `/var/www/justachat/.env` doesn't match `ANON_KEY` in `/home/unix/supabase/docker/.env`. The key gets baked into the build, so a mismatch means every API call uses the wrong key.

## Solution
1. Copy the correct ANON_KEY:
```bash
grep ANON_KEY ~/supabase/docker/.env
```

2. Update the frontend .env:
```bash
nano /var/www/justachat/.env
# Set VITE_SUPABASE_PUBLISHABLE_KEY to match ANON_KEY exactly
```

3. Rebuild:
```bash
cd /var/www/justachat
sudo chown -R unix:unix .
rm -rf dist node_modules/.vite
npm run build
```

## Prevention
- After regenerating JWT keys, always sync the frontend .env
- Use `public/vps-deploy/sync-frontend-keys.sh` if available

## Key Format Note
ANON_KEY and SERVICE_ROLE_KEY must be generated with compact JSON (no spaces): `{"alg":"HS256"}` not `{ "alg": "HS256" }`. Use Python `separators=(",",":")`.
