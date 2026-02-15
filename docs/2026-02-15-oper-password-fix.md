# OPER Password Fix - 2026-02-15

## Summary
Fixed the `/oper` and `/deoper` commands to work on both web and IRC (mIRC) with the new password `2106598140`.

## Changes Made

### 1. OPER_PASSWORD Secret Updated
- Updated the `OPER_PASSWORD` secret in Lovable Cloud to `2106598140`.
- Added `OPER_PASSWORD=2106598140` to the VPS `.env` file at `/home/unix/supabase/docker/.env`.

### 2. VPS Docker Environment Variable Mapping
- **Problem:** The `OPER_PASSWORD` was in the `.env` file but was NOT being passed to the `supabase-edge-functions` container because it wasn't listed in `docker-compose.yml`.
- **Fix:** Added the following to the `functions` service `environment` block in `docker-compose.yml` (after `PM_MASTER_KEY`):
  ```yaml
  OPER_PASSWORD: ${OPER_PASSWORD}
  OPENAI_API_KEY: ${OPENAI_API_KEY}
  GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
  KLIPY_API_KEY: ${KLIPY_API_KEY}
  ```
- **Verification:** `docker compose exec functions env | grep OPER_PASSWORD` confirms the variable is available.

### 3. IRC Gateway - Service Client for Role Upsert
- **Problem:** The `handleOPER` function in `irc-gateway/index.ts` was using `session.supabase` (the user's token) to upsert the role in `user_roles`. RLS policies blocked this because normal users can't modify their own roles.
- **Fix:** Changed to use a service role client (`createClient` with `SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS when granting the admin role.

### 4. IRC Gateway - Delete-then-Insert for Role Change
- **Problem:** The `user_roles` table has a composite unique constraint on `(user_id, role)`, not just `user_id`. The `upsert` with `onConflict: 'user_id'` was silently failing because there's no unique constraint on `user_id` alone.
- **Fix:** Changed from `upsert` to a delete-then-insert pattern:
  ```typescript
  await operServiceClient.from("user_roles").delete().eq("user_id", session.userId);
  await operServiceClient.from("user_roles").insert({ user_id: session.userId, role: 'admin' });
  ```

### 5. Debug Logging in oper-auth Edge Function
- Added temporary debug logging to the `oper-auth` edge function to diagnose password comparison issues (logs password existence, length, and match status).

### 6. Frontend Rebuild
- Rebuilt the frontend (`npm run build`) to ensure the correct `VITE_SUPABASE_URL=https://justachat.net` was baked into production assets.
- Verified with `grep -c 'supabase.co'` and `grep -c 'justachat.net'` on `dist/assets/*.js`.

## VPS Deployment Commands Used
```bash
# Add OPER_PASSWORD to .env
echo 'OPER_PASSWORD=2106598140' >> /home/unix/supabase/docker/.env

# Add env var mapping to docker-compose.yml (line after PM_MASTER_KEY)
sed -i '/PM_MASTER_KEY: ${PM_MASTER_KEY}/a\      OPER_PASSWORD: ${OPER_PASSWORD}' docker-compose.yml

# Deploy updated edge functions
cd /var/www/justachat && git pull && cp supabase/functions/irc-gateway/index.ts /home/unix/supabase/docker/volumes/functions/irc-gateway/index.ts && cd /home/unix/supabase/docker && docker compose down functions && docker compose up -d functions

# Rebuild frontend
cd /var/www/justachat && rm -rf dist node_modules/.vite /tmp/vite-* && npm run build

# Verify
docker compose exec functions env | grep OPER_PASSWORD
```

## Usage
- **Web:** `/oper <username> 2106598140` and `/deoper <username> 2106598140`
- **mIRC:** `/oper <username> 2106598140`

## Key Lessons
1. VPS Docker containers only receive env vars explicitly listed in `docker-compose.yml` `environment` block.
2. The `user_roles` table uses a composite unique constraint `(user_id, role)` — standard `upsert` with `onConflict: 'user_id'` silently fails.
3. Role changes on the IRC gateway require a service role client to bypass RLS policies.
4. Always verify env vars inside the container with `docker compose exec functions env | grep VAR_NAME`.
