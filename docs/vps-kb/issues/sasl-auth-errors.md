# ISSUE: SASL Authentication Errors (SQLSTATE 28P01)
Date: 2026-02-14

## Problem
Supabase services (auth, rest, storage) fail with SASL/password authentication errors.

## Symptoms
- `FATAL: password authentication failed for user "authenticator"` in logs
- Auth service won't start or returns errors
- SQLSTATE 28P01 in container logs

## Root Cause
Internal Postgres role passwords don't match the `POSTGRES_PASSWORD` in `.env`. This happens after password changes or fresh deployments.

## Solution
Reset all role passwords inside the `supabase-db` container using the `postgres` superuser:

```bash
sudo docker exec -it supabase-db psql -U postgres -c "
SET password_encryption = 'scram-sha-256';
ALTER USER authenticator WITH PASSWORD 'YOUR_POSTGRES_PASSWORD';
ALTER USER supabase_auth_admin WITH PASSWORD 'YOUR_POSTGRES_PASSWORD';
ALTER USER supabase_storage_admin WITH PASSWORD 'YOUR_POSTGRES_PASSWORD';
ALTER USER supabase_admin WITH PASSWORD 'YOUR_POSTGRES_PASSWORD';
"
```

Then restart the stack:
```bash
sudo bash -c 'cd /root/supabase/docker && docker compose --env-file .env restart'
```

## Prevention
- After changing POSTGRES_PASSWORD in .env, always reset role passwords to match
- Use the same password for all internal roles
