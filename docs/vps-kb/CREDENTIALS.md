# VPS CREDENTIALS REFERENCE
**Last Updated: 2026-02-14**

> ⚠️ SENSITIVE — Do not commit to public repos

## SSH Access
- **IP:** 24.199.122.60
- **User:** unix
- **Password:** Khoel15$$

## Supabase Config Location
- **Backend .env:** /home/unix/supabase/docker/.env (symlink to /root/supabase/docker/.env)
- **Frontend .env:** /var/www/justachat/.env

## Key Variables (in backend .env)
- `POSTGRES_PASSWORD` — DB admin password
- `JWT_SECRET` — Signs all auth tokens (DO NOT truncate trailing `=`)
- `ANON_KEY` — Public API key (must match `VITE_SUPABASE_PUBLISHABLE_KEY` in frontend)
- `SERVICE_ROLE_KEY` — Admin key (bypasses RLS, NEVER expose publicly)
- `DASHBOARD_PASSWORD` — Supabase Studio access

## Oper Password
- **Password:** Lady2026$$
- **Secret name:** OPER_PASSWORD
- **Used by:** /oper and /deoper chat commands

## Email Service (Resend)
- **Location:** /opt/justachat-email/.env
- **API Key:** re_8Qpt6Lvi_MpZ8okghH4it34WNo6jBU16Y
- **Console:** https://resend.com/api-keys

## Deploy Service
- **Location:** /opt/jac-deploy/.env
- **Variable:** DEPLOY_TOKEN

## External Services
- **Cloudflare:** bhoel86@gmail.com (DNS, SSL, CDN)
- **DigitalOcean:** VPS hosting
- **Zoho Mail:** justachat.net email → forwards to bhoel86@gmail.com

## Google OAuth
- **Console:** https://console.cloud.google.com/apis/credentials
- **Redirect URI:** https://justachat.net/auth/v1/callback
- **Config in:** ~/supabase/docker/.env (`GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` / `GOTRUE_EXTERNAL_GOOGLE_SECRET`)

## How to View Current Secrets on VPS
```bash
cat ~/supabase/docker/.env | grep -E "PASSWORD|SECRET|KEY|ANON|SERVICE"
cat /opt/justachat-email/.env
cat /opt/jac-deploy/.env
```
