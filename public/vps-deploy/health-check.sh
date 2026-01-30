#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - HEALTH CHECK
# Verifies all services are running correctly
#
# Usage: bash /var/www/justachat/public/vps-deploy/health-check.sh
#===============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SUPABASE_DIR="/home/unix/supabase/docker"
DOMAIN="justachat.net"

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              JUSTACHAT HEALTH CHECK                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Get ANON_KEY from env
if [ -f "$SUPABASE_DIR/.env" ]; then
  ANON_KEY=$(grep '^ANON_KEY=' "$SUPABASE_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
else
  ANON_KEY=""
  warn "Cannot find $SUPABASE_DIR/.env"
fi

echo "=== Docker Containers ==="
CONTAINERS=(
  "supabase-db"
  "supabase-kong"
  "supabase-auth"
  "supabase-rest"
  "supabase-realtime"
  "supabase-storage"
  "supabase-edge-functions"
  "supabase-meta"
  "supabase-supavisor"
  "supabase-studio"
  "supabase-imgproxy"
)

for container in "${CONTAINERS[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "running")
    if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "running" ]; then
      pass "$container ($STATUS)"
    else
      warn "$container ($STATUS)"
    fi
  else
    fail "$container (not running)"
  fi
done

echo ""
echo "=== Supabase API Endpoints ==="

# Auth health
if [ -n "$ANON_KEY" ]; then
  if curl -sf "http://127.0.0.1:8000/auth/v1/health" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
    pass "Auth API (http://127.0.0.1:8000/auth/v1/health)"
  else
    fail "Auth API"
  fi
else
  warn "Auth API (skipped - no ANON_KEY)"
fi

# REST health
if [ -n "$ANON_KEY" ]; then
  if curl -sf "http://127.0.0.1:8000/rest/v1/" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
    pass "REST API (http://127.0.0.1:8000/rest/v1/)"
  else
    fail "REST API"
  fi
else
  warn "REST API (skipped - no ANON_KEY)"
fi

# Storage health
if [ -n "$ANON_KEY" ]; then
  if curl -sf "http://127.0.0.1:8000/storage/v1/status" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
    pass "Storage API"
  else
    # Try alternate endpoint
    if curl -sf "http://127.0.0.1:8000/storage/v1/" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
      pass "Storage API"
    else
      warn "Storage API (may still be initializing)"
    fi
  fi
else
  warn "Storage API (skipped - no ANON_KEY)"
fi

echo ""
echo "=== System Services ==="

# Nginx
if systemctl is-active --quiet nginx; then
  pass "Nginx"
else
  fail "Nginx"
fi

# Email webhook
if systemctl is-active --quiet justachat-email; then
  pass "Email webhook service"
else
  fail "Email webhook service"
fi

# Email webhook port
if curl -sf "http://127.0.0.1:3001/" > /dev/null 2>&1; then
  pass "Email webhook (port 3001)"
else
  fail "Email webhook (port 3001)"
fi

echo ""
echo "=== External Access ==="

# HTTPS
if curl -sf "https://${DOMAIN}/" > /dev/null 2>&1; then
  pass "HTTPS (https://${DOMAIN})"
else
  warn "HTTPS (https://${DOMAIN}) - may need SSL setup"
fi

# Auth via domain
if [ -n "$ANON_KEY" ]; then
  if curl -sf "https://${DOMAIN}/auth/v1/health" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
    pass "Auth via domain (https://${DOMAIN}/auth/v1/health)"
  else
    warn "Auth via domain - may need Nginx config"
  fi
fi

echo ""
echo "=== Database ==="

# PostgreSQL connection
if docker exec supabase-db pg_isready -U postgres > /dev/null 2>&1; then
  pass "PostgreSQL (via pg_isready)"
else
  fail "PostgreSQL"
fi

echo ""
echo "=== Summary ==="
echo ""
echo "If all checks pass, your installation is healthy!"
echo "If any checks fail, review the logs:"
echo ""
echo "  Docker logs:       docker logs <container-name>"
echo "  Nginx logs:        sudo tail -f /var/log/nginx/error.log"
echo "  Email service:     sudo journalctl -u justachat-email -f"
echo ""
