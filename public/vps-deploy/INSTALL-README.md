# JustAChat VPS Installation Guide

Production-ready self-hosted deployment for DigitalOcean Ubuntu 22.04/24.04.

## Prerequisites

- **DigitalOcean Droplet**: Ubuntu 22.04 or 24.04 LTS
- **Minimum specs**: 2GB RAM, 1 vCPU, 25GB SSD
- **Domain**: justachat.net pointing to your droplet IP
- **API Keys** (have these ready):
  - `RESEND_API_KEY` - [resend.com](https://resend.com)
  - `OPENAI_API_KEY` - [platform.openai.com](https://platform.openai.com)
  - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - [Google Cloud Console](https://console.cloud.google.com)

---

## Quick Install (Recommended)

### Option 1: One-liner from GitHub

```bash
curl -sSL https://raw.githubusercontent.com/UnixMint/justachat-unix/main/public/vps-deploy/install.sh | sudo bash
```

### Option 2: Download and run

```bash
wget https://raw.githubusercontent.com/UnixMint/justachat-unix/main/public/vps-deploy/install.sh
chmod +x install.sh
sudo ./install.sh
```

---

## What the installer does

| Step | Action |
|------|--------|
| 1 | Creates `unix` user with sudo access |
| 2 | Installs system dependencies |
| 3 | Installs Docker & Docker Compose |
| 4 | Installs Node.js 20 |
| 5 | Installs Nginx |
| 6 | Installs Certbot (SSL) |
| 7 | Configures UFW firewall |
| 8 | Prompts for API keys |
| 9 | Sets up Supabase stack (NO analytics) |
| 10 | Clones and builds frontend |
| 11 | Configures Nginx reverse proxy |
| 12 | Sets up email webhook service |
| 13 | Starts all Docker containers |
| 14 | Obtains SSL certificates |
| 15 | Applies database schema |
| 16 | Saves credentials |
| 17 | Runs health checks |

---

## Supabase Services Included

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 15 | supabase-db | 5432 |
| Kong API Gateway | supabase-kong | 8000 |
| GoTrue Auth | supabase-auth | 9999 |
| PostgREST | supabase-rest | 3000 |
| Realtime | supabase-realtime | 4000 |
| Storage | supabase-storage | 5000 |
| Edge Functions | supabase-edge-functions | 9000 |
| pg-meta | supabase-meta | 8080 |
| Supavisor Pooler | supabase-supavisor | 6543 |
| Studio Dashboard | supabase-studio | 3000 |
| Image Proxy | supabase-imgproxy | 8080 |

**Note**: Analytics/Logflare is intentionally excluded for stability.

---

## Post-Installation

### Check health

```bash
bash /var/www/justachat/public/vps-deploy/health-check.sh
```

### View credentials

```bash
cat /home/unix/justachat-credentials.txt
```

### Access Studio (SSH tunnel required)

```bash
ssh -L 3000:localhost:3000 unix@YOUR_DROPLET_IP
# Then open http://localhost:3000 in browser
```

---

## Maintenance Commands

### View container status

```bash
cd /home/unix/supabase/docker
sudo docker compose ps
```

### View container logs

```bash
docker logs supabase-auth
docker logs supabase-kong
docker logs supabase-db
```

### Restart a service

```bash
cd /home/unix/supabase/docker
sudo docker compose restart auth
```

### Restart all services

```bash
cd /home/unix/supabase/docker
sudo docker compose restart
```

### Update frontend

```bash
cd /var/www/justachat
git pull
npm install
rm -rf dist node_modules/.vite
npm run build
```

---

## Complete Wipe (Start Fresh)

If you need to completely wipe and reinstall:

```bash
bash /var/www/justachat/public/vps-deploy/wipe-vps.sh
```

This removes:
- All Docker containers and volumes
- Project directories
- Systemd services
- Old credentials

---

## Troubleshooting

### Auth returns 500 errors

```bash
docker logs supabase-auth
# Check for database connection issues
docker exec supabase-db pg_isready -U postgres
```

### Kong returns 502 errors

```bash
# Check if backend services are running
docker logs supabase-kong
docker logs supabase-rest
```

### SSL certificate issues

```bash
# Manually run Certbot
sudo certbot --nginx -d justachat.net -d www.justachat.net
```

### Email not sending

```bash
# Check email service
sudo systemctl status justachat-email
sudo journalctl -u justachat-email -f
```

### Database connection errors

```bash
# Check database health
docker exec supabase-db pg_isready -U postgres

# Connect to database
docker exec -it supabase-db psql -U postgres
```

---

## Directory Structure

```
/var/www/justachat/           # Frontend source
  ├── dist/                   # Built frontend (served by Nginx)
  ├── public/vps-deploy/      # Deployment scripts
  └── supabase/functions/     # Edge function source

/home/unix/supabase/docker/   # Supabase Docker stack
  ├── .env                    # Backend configuration
  ├── docker-compose.yml      # Service definitions
  └── volumes/
      ├── db/data/            # PostgreSQL data
      ├── functions/          # Edge functions (synced from project)
      └── storage/            # File storage

/opt/email-webhook/           # Email webhook service
  ├── server.js
  └── .env

/home/unix/justachat-credentials.txt  # Generated credentials
```

---

## Security Notes

- Root SSH login is disabled after install
- Only ports 22, 80, 443, 8000 are open
- Studio is only accessible via SSH tunnel
- All API keys are stored in environment files (not in code)
- Database is only accessible from localhost

---

## Support

For issues, check:
1. Health check output
2. Container logs
3. Nginx error logs: `/var/log/nginx/error.log`
4. System journal: `journalctl -xe`
