# ISSUE: Owner Account Transfer
Date: 2026-02-14

## Problem
Needed to transfer site ownership from bhoel86@gmail.com (Mars) to unix@justachat.net (Unix, UUID: ffa550ea-47a3-4255-9f04-4fb49efd799e).

## Symptoms
Old owner account was the only one with admin/owner access.

## Root Cause
Initial setup used a personal Gmail. Need to use the justachat.net domain email.

## Solution
1. Created new user via edge function using Supabase Auth Admin API (`createUser` with `email_confirm: true`)
2. Inserted owner role: `INSERT INTO public.user_roles (user_id, role) VALUES ('<id>', 'owner')`
3. Cleaned up old account:
   - Nullified references in `bot_settings.updated_by`, `donation_settings.updated_by`, `channel_settings.updated_by`
   - Deleted from `public.profiles`, `public.user_roles`
   - Deleted from `auth.users`

## Prevention
Always use the domain email (unix@justachat.net) for the owner account from the start.
