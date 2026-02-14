# ISSUE: Docker Stack 500/502 Errors on Startup
Date: 2026-02-14

## Problem
Supabase stack fails to start cleanly, returning 500/502 errors.

## Symptoms
- Site shows 500 or 502 errors after reboot or restart
- Some containers stuck or won't start
- Port conflicts prevent binding

## Root Cause
1. `supabase-analytics` container causes startup freezes — must be excluded
2. Stale processes hold ports (3000, 5432, 6543, 8000, 8443, 9999)
3. Docker compose needs clean down before up

## Solution
```bash
# Kill stale port holders
for port in 3000 5432 6543 8000 8443 9999; do
  sudo fuser -k ${port}/tcp 2>/dev/null
done

# Clean restart (run as root or via sudo bash -c)
cd /root/supabase/docker
docker compose --env-file .env down --remove-orphans
docker compose --env-file .env up -d
```

**Important:** Exclude `supabase-analytics` from docker-compose.yml profiles or ensure it's not started.

## Prevention
- Always use `down --remove-orphans` before `up -d`
- Kill ports before restart if anything is stuck
