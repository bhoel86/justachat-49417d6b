# ISSUE: Password Reset via SQL Doesn't Work
Date: 2026-02-14

## Problem
Manually hashing passwords in the database with `crypt()` results in "Invalid authentication credentials" errors.

## Symptoms
- User can't log in after admin password reset
- Hash looks valid in `auth.users` but GoTrue rejects it

## Root Cause
GoTrue uses its own internal hashing logic. Manual `crypt()` calls in SQL often produce incompatible hashes.

## Solution
Use the GoTrue Admin API with the SERVICE_ROLE_KEY:

```bash
# Get the user's UUID first
sudo docker exec supabase-db psql -U postgres -c "SELECT id, email FROM auth.users;"

# Reset via API (use Kong gateway on port 8000)
curl -X PUT "http://localhost:8000/auth/v1/admin/users/USER_UUID_HERE" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "NewPassword123"}'
```

## Prevention
- Never update `auth.users.encrypted_password` directly
- Always use GoTrue Admin API for credential changes
