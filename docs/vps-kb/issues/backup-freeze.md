# ISSUE: VPS Backup Command Freezes
Date: 2026-02-14

## Problem
The all-in-one backup command hangs/freezes without completing.

## Symptoms
- Command never returns after running the combined backup
- No output, no error, terminal appears stuck

## Root Cause
The `pg_dumpall` piped through `gzip` on a large database can take time, and combining it with `tar` in one `&&` chain makes it hard to diagnose where it stalls.

## Solution
Split into two steps:

**Step 1 — Dump database:**
```bash
sudo docker exec supabase-db pg_dumpall -U postgres | gzip > ~/backup-$(date +%Y%m%d).sql.gz && echo "✅ DB dump done"
```

**Step 2 — Archive everything:**
```bash
tar -czf ~/justachat-backup-$(date +%Y%m%d).tar.gz \
  ~/backup-$(date +%Y%m%d).sql.gz \
  ~/supabase/docker/.env \
  ~/supabase/docker/docker-compose.yml \
  ~/supabase/docker/volumes/functions/.env \
  -C /opt justachat-email \
  -C /opt jac-deploy \
  -C /etc/nginx/sites-enabled justachat 2>/dev/null && echo "✅ Backup complete"
```

**Download to Windows:**
```powershell
scp unix@24.199.122.60:~/justachat-backup-*.tar.gz C:\Users\dunad\Desktop\
```

## Prevention
- Always run DB dump as separate step so you can see progress
- The collation warning (`template1 collation version mismatch`) is harmless — ignore it
