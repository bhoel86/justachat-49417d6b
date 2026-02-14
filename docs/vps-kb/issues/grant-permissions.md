# ISSUE: Tables Need Explicit GRANT Permissions
Date: 2026-02-14

## Problem
RLS policies alone are not enough. PostgreSQL also requires explicit GRANT permissions for the `anon` and `authenticated` roles.

## Symptoms
- "Failed to load rooms" error
- Empty user lists in admin panel
- Queries return 0 rows despite data existing

## Root Cause
PostgreSQL checks role-level permissions BEFORE evaluating RLS policies. Without `GRANT SELECT` (etc.) on a table for `anon`/`authenticated`, the query is denied at the role level and returns empty.

## Solution
```sql
GRANT SELECT ON public.channels TO anon, authenticated;
GRANT SELECT ON public.channels_public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;
GRANT ALL ON public.channel_members TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
```

Run via:
```bash
sudo bash -c 'cd /root/supabase/docker && docker exec supabase-db psql -U supabase_admin -d postgres -c "GRANT SELECT ON public.channels TO anon, authenticated;"'
```

## Prevention
Every time a new table is created, always add GRANT statements alongside RLS policies.
