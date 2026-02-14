# JUSTACHAT VPS - SYSTEM ARCHITECTURE

## Infrastructure
- **VPS IP**: 157.245.174.197
- **Domain**: justachat.net
- **OS**: Ubuntu (DigitalOcean)
- **User**: `unix` (non-root, sudo access)
- **Web Root**: `/var/www/justachat`
- **Supabase Docker**: `/root/supabase/docker/`

## Frontend
- **Framework**: React + Vite + TypeScript + Tailwind CSS
- **Build**: `npm run build` → outputs to `dist/`
- **Served by**: Nginx (static files from `dist/`)
- **Key env vars baked at build time**:
  - `VITE_SUPABASE_URL=https://justachat.net`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY>`

## Backend (Self-Hosted Supabase)
- **Docker Compose**: `/root/supabase/docker/docker-compose.yml`
- **Key Containers**:
  - `supabase-db` (PostgreSQL)
  - `supabase-kong` (API Gateway, port 8000)
  - `supabase-auth` (GoTrue)
  - `supabase-rest` (PostgREST)
  - `supabase-realtime`
  - `supabase-storage`
  - `supabase-edge-functions`
- **Env file**: `/root/supabase/docker/.env`
- **Kong config**: `/root/supabase/docker/volumes/api/kong.yml`

## Edge Functions
- **Source**: `/var/www/justachat/supabase/functions/`
- **Runtime location**: `/root/supabase/docker/volumes/functions/main/`
- **Must be mirrored** from source to runtime location after changes
- **Uses**: `Deno.serve()` directly (no std/http imports)
- **VPS uses `chat-bot`**, NOT `chat-bot-cloud`

## Database
- **Access via**: `docker exec supabase-db psql -U supabase_admin -d postgres`
- **ANON_KEY and SERVICE_ROLE_KEY**: Must use compact JSON (no spaces) for JWT generation
- **Roles need explicit GRANT**: `anon` and `authenticated` roles need GRANT permissions on tables in addition to RLS policies

## Nginx
- **Config**: `/etc/nginx/sites-available/justachat` or similar
- **Proxies**: `/auth/`, `/rest/`, `/functions/`, `/storage/`, `/realtime/` → Kong (port 8000)
- **Static**: `/` → `/var/www/justachat/dist/`
- **Cache headers**: `public, max-age=0, must-revalidate`

## Key Scripts
- `public/vps-deploy/vps-update.sh` - Main update script (git pull + build + restart)
- `public/vps-deploy/safe-pull.sh` - Protected git pull
- `public/vps-deploy/validate-before-deploy.sh` - Pre-deploy validation
- `public/vps-deploy/health-check.sh` - Service health check
- `public/vps-deploy/patch-after-pull.sh` - Post-pull fixes

## Owner Account
- **Email**: unix@justachat.net
- **Username**: Unix
- **Role**: owner

---

*Last updated: 2026-02-14*
