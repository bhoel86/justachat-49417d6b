#!/bin/bash
# JustAChat VPS Deep Clean & Diagnostic Script
# Fixes: duplicate files, nginx issues, listener conflicts, PM system, image uploads
# Run: sudo bash /var/www/justachat/public/vps-deploy/deep-clean-vps.sh

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     JUSTACHAT VPS DEEP CLEAN & DIAGNOSTIC SCRIPT          ║"
echo "║     Date: $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

DEPLOY_DIR="/var/www/justachat"
DOCKER_DIR="$HOME/supabase/docker"
FUNCTIONS_VOLUME="$DOCKER_DIR/volumes/functions/main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_ok() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_fail() { echo -e "${RED}✗${NC} $1"; }
log_info() { echo -e "  → $1"; }

# =====================================================
# PHASE 1: SYSTEM PORT & LISTENER CHECK
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 1] PORT & LISTENER CONFLICT CHECK"
echo "═══════════════════════════════════════════════════════════"

# Check for port conflicts
check_port() {
  local port=$1
  local service=$2
  local listeners=$(ss -tlnp 2>/dev/null | grep ":$port " | wc -l)
  if [ "$listeners" -gt 1 ]; then
    log_fail "Port $port ($service) has MULTIPLE listeners ($listeners)"
    ss -tlnp 2>/dev/null | grep ":$port " | head -5
    return 1
  elif [ "$listeners" -eq 1 ]; then
    log_ok "Port $port ($service) - single listener"
  else
    log_warn "Port $port ($service) - no listener found"
  fi
  return 0
}

PORTS_OK=true
check_port 80 "HTTP/Nginx" || PORTS_OK=false
check_port 443 "HTTPS/Nginx" || PORTS_OK=false
check_port 3001 "Email Webhook" || PORTS_OK=false
check_port 6680 "Deploy Service" || PORTS_OK=false
check_port 8000 "Kong Gateway" || PORTS_OK=false

if [ "$PORTS_OK" = false ]; then
  log_warn "Port conflicts detected - killing duplicate processes..."
  # Kill any duplicate node processes on common ports
  pkill -f "node.*:3001" 2>/dev/null || true
  pkill -f "node.*:6680" 2>/dev/null || true
  sleep 2
fi

# =====================================================
# PHASE 2: NGINX DEEP CLEANUP & VALIDATION
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 2] NGINX DEEP CLEANUP & VALIDATION"
echo "═══════════════════════════════════════════════════════════"

NGINX_CONF="/etc/nginx/sites-available/justachat"
NGINX_SNIPPET="/etc/nginx/snippets/storage-public.conf"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

# --- Step 1: Remove ALL backup files from nginx directories ---
log_info "Cleaning backup files from nginx directories..."
NGINX_DIRS="/etc/nginx /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/snippets /etc/nginx/conf.d"
BACKUP_TOTAL=0
for dir in $NGINX_DIRS; do
  if [ -d "$dir" ]; then
    BACKUP_COUNT=$(find "$dir" -maxdepth 1 \( -name "*.bak*" -o -name "*.backup*" -o -name "*.old" -o -name "*~" -o -name "*.save" -o -name "*.orig" -o -name "*.dpkg-*" \) 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
      find "$dir" -maxdepth 1 \( -name "*.bak*" -o -name "*.backup*" -o -name "*.old" -o -name "*~" -o -name "*.save" -o -name "*.orig" -o -name "*.dpkg-*" \) -exec rm -v {} \; 2>/dev/null
      BACKUP_TOTAL=$((BACKUP_TOTAL + BACKUP_COUNT))
    fi
  fi
done
if [ "$BACKUP_TOTAL" -gt 0 ]; then
  log_ok "Removed $BACKUP_TOTAL backup files"
else
  log_ok "No backup files found"
fi

# --- Step 2: Clean sites-enabled - ensure single config per domain ---
log_info "Cleaning sites-enabled (single config per domain)..."
if [ -d "$SITES_ENABLED" ]; then
  for f in "$SITES_ENABLED"/*; do
    [ -e "$f" ] || continue
    fname=$(basename "$f")
    # Remove any justachat duplicates/variants (keep only 'justachat')
    if [[ "$fname" == *"justachat"* ]] && [[ "$fname" != "justachat" ]]; then
      log_warn "Removing duplicate: $fname"
      rm -f "$f"
    fi
    # Remove default if justachat exists
    if [[ "$fname" == "default" ]] && [ -e "$SITES_ENABLED/justachat" ]; then
      log_info "Removing default (justachat is primary)"
      rm -f "$f"
    fi
  done
  ENABLED_COUNT=$(ls -1 "$SITES_ENABLED" 2>/dev/null | wc -l)
  log_ok "Sites enabled: $ENABLED_COUNT"
fi

# --- Step 3: Clean sites-available of backup files ---
log_info "Cleaning sites-available..."
if [ -d "$SITES_AVAILABLE" ]; then
  for f in "$SITES_AVAILABLE"/*; do
    [ -e "$f" ] || continue
    fname=$(basename "$f")
    if [[ "$fname" == *".bak"* ]] || [[ "$fname" == *".backup"* ]] || [[ "$fname" == *".old"* ]] || [[ "$fname" == *"~"* ]] || [[ "$fname" == *".save"* ]]; then
      log_warn "Removing: $fname"
      rm -f "$f"
    fi
  done
fi

# --- Step 4: Validate nginx.conf structure (no server blocks outside http) ---
log_info "Validating nginx.conf structure..."
NGINX_MAIN="/etc/nginx/nginx.conf"
if [ -f "$NGINX_MAIN" ]; then
  # Check if there's a server block directly in nginx.conf (outside http context)
  if grep -E "^\s*server\s*\{" "$NGINX_MAIN" 2>/dev/null; then
    log_fail "Found 'server' block in nginx.conf - should be in sites-enabled only!"
  else
    log_ok "nginx.conf structure correct (no stray server blocks)"
  fi
fi

# --- Step 5: Ensure symlink is correct ---
log_info "Validating sites-enabled symlink..."
if [ -L "$SITES_ENABLED/justachat" ]; then
  TARGET=$(readlink -f "$SITES_ENABLED/justachat")
  if [ "$TARGET" = "$SITES_AVAILABLE/justachat" ]; then
    log_ok "Symlink correct"
  else
    log_warn "Symlink points to: $TARGET"
  fi
elif [ -f "$SITES_ENABLED/justachat" ]; then
  log_ok "justachat is a file (not symlink - OK)"
else
  log_warn "justachat not found in sites-enabled"
  if [ -f "$SITES_AVAILABLE/justachat" ]; then
    ln -s "$SITES_AVAILABLE/justachat" "$SITES_ENABLED/justachat"
    log_ok "Created symlink"
  fi
fi

# --- Step 6: Check storage snippet ---
if [ -f "$NGINX_SNIPPET" ]; then
  log_ok "Storage snippet exists"
  if grep -q "include.*storage-public.conf" "$NGINX_CONF" 2>/dev/null; then
    log_ok "Storage snippet included in config"
  else
    log_warn "Storage snippet NOT included - run fix-storage-public-access.sh"
  fi
else
  log_warn "Storage snippet missing - run fix-storage-public-access.sh"
fi

# --- Step 7: Check for duplicate location blocks ---
if [ -f "$NGINX_CONF" ]; then
  STORAGE_LOCATIONS=$(grep -c "location.*storage/v1" "$NGINX_CONF" 2>/dev/null || echo "0")
  if [ "$STORAGE_LOCATIONS" -gt 1 ]; then
    log_fail "DUPLICATE storage location blocks ($STORAGE_LOCATIONS found)"
  else
    log_ok "No duplicate location blocks"
  fi
  
  # Check for buffering settings
  if grep -q "proxy_buffering off" "$NGINX_CONF"; then
    log_ok "Proxy buffering disabled for realtime"
  else
    log_warn "Proxy buffering may cause realtime issues"
  fi
fi

# --- Step 8: Test nginx config ---
log_info "Testing nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
  log_ok "Nginx configuration syntax OK"
else
  log_fail "Nginx configuration has errors:"
  nginx -t 2>&1 | head -10
fi

# =====================================================
# PHASE 3: DUPLICATE FILE CLEANUP
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 3] DUPLICATE & JUNK FILE CLEANUP"
echo "═══════════════════════════════════════════════════════════"

cd "$DEPLOY_DIR"

# Find and list junk files in git tracking
JUNK_FILES=$(git ls-files 2>/dev/null | grep -E "^[A-Z][a-z]+$|^e API|^erver|\.bak$|\.backup$|~$" || true)
if [ -n "$JUNK_FILES" ]; then
  log_warn "Found junk files in git tracking:"
  echo "$JUNK_FILES" | head -10
  log_info "Removing from git..."
  echo "$JUNK_FILES" | while read f; do
    if [ -f "$f" ]; then
      git rm --cached "$f" 2>/dev/null || true
      rm -f "$f" 2>/dev/null || true
    fi
  done
  log_ok "Junk files cleaned"
else
  log_ok "No junk files in git tracking"
fi

# Remove any stray build artifacts
rm -rf "$DEPLOY_DIR/.vite" 2>/dev/null || true
rm -rf "$DEPLOY_DIR/.cache" 2>/dev/null || true
find "$DEPLOY_DIR" -name "*.map" -type f -delete 2>/dev/null || true
log_ok "Build caches cleared"

# =====================================================
# PHASE 4: EDGE FUNCTION SYNC & FIX
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 4] EDGE FUNCTION SYNC"
echo "═══════════════════════════════════════════════════════════"

if [ -d "$FUNCTIONS_VOLUME" ]; then
  # List of critical functions to sync
  FUNCTIONS="encrypt-pm decrypt-pm upload-image chat-bot"
  
  for func in $FUNCTIONS; do
    SRC="$DEPLOY_DIR/supabase/functions/$func"
    DST="$FUNCTIONS_VOLUME/$func"
    
    if [ -d "$SRC" ]; then
      mkdir -p "$DST"
      cp -r "$SRC"/* "$DST"/ 2>/dev/null || true
      log_ok "Synced $func to Docker volume"
    else
      log_warn "$func source not found"
    fi
  done
  
  # Patch functions to use native Deno.serve (remove std/http/server imports)
  find "$FUNCTIONS_VOLUME" -name "index.ts" -type f | while read f; do
    if grep -q "std/http/server" "$f" 2>/dev/null; then
      log_info "Patching $(dirname "$f" | xargs basename) to use native Deno.serve"
      sed -i 's/import.*from.*std\/http\/server.*;//g' "$f"
    fi
  done
  
  log_ok "Edge functions synced and patched"
else
  log_warn "Functions volume not found at $FUNCTIONS_VOLUME"
fi

# =====================================================
# PHASE 5: DOCKER HEALTH CHECK
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 5] DOCKER CONTAINER HEALTH"
echo "═══════════════════════════════════════════════════════════"

cd "$DOCKER_DIR"

REQUIRED_CONTAINERS="supabase-auth supabase-rest supabase-realtime supabase-storage supabase-kong supabase-db supabase-edge-functions"

for container in $REQUIRED_CONTAINERS; do
  if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
      log_ok "$container: running"
    else
      log_fail "$container: $STATUS"
    fi
  else
    log_fail "$container: NOT FOUND"
  fi
done

# Check for unhealthy containers
UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
if [ -n "$UNHEALTHY" ]; then
  log_warn "Unhealthy containers detected:"
  echo "$UNHEALTHY"
  log_info "Restarting unhealthy containers..."
  for c in $UNHEALTHY; do
    docker restart "$c" 2>/dev/null || true
  done
fi

# =====================================================
# PHASE 6: COLD RESTART EDGE FUNCTIONS
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 6] COLD RESTART EDGE FUNCTIONS"
echo "═══════════════════════════════════════════════════════════"

log_info "Stopping edge functions container..."
docker compose down functions 2>/dev/null || docker compose stop functions 2>/dev/null || true
sleep 2

log_info "Starting edge functions container..."
docker compose up -d functions 2>/dev/null || true
sleep 3

if docker ps | grep -q "supabase-edge-functions"; then
  log_ok "Edge functions container restarted"
else
  log_fail "Edge functions container failed to start"
  docker compose logs functions --tail 20
fi

# =====================================================
# PHASE 7: SYSTEMD SERVICES CHECK
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 7] SYSTEMD SERVICES"
echo "═══════════════════════════════════════════════════════════"

SERVICES="jac-deploy justachat-email nginx"

for svc in $SERVICES; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    log_ok "$svc: active"
  elif systemctl is-enabled --quiet "$svc" 2>/dev/null; then
    log_warn "$svc: enabled but not running"
    log_info "Starting $svc..."
    systemctl start "$svc" 2>/dev/null || true
  else
    log_warn "$svc: not found or not enabled"
  fi
done

# =====================================================
# PHASE 8: ENV VALIDATION
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 8] ENVIRONMENT VALIDATION"
echo "═══════════════════════════════════════════════════════════"

# Check frontend .env points to VPS
FRONTEND_ENV="$DEPLOY_DIR/.env"
if [ -f "$FRONTEND_ENV" ]; then
  if grep -q "supabase.co" "$FRONTEND_ENV"; then
    log_fail "Frontend .env points to Lovable Cloud - should point to VPS!"
    log_info "Current VITE_SUPABASE_URL:"
    grep "VITE_SUPABASE_URL" "$FRONTEND_ENV"
  else
    log_ok "Frontend .env points to local VPS"
  fi
else
  log_warn "Frontend .env not found"
fi

# Check Docker .env has required vars
DOCKER_ENV="$DOCKER_DIR/.env"
if [ -f "$DOCKER_ENV" ]; then
  MISSING_VARS=""
  for var in ANON_KEY SERVICE_ROLE_KEY JWT_SECRET POSTGRES_PASSWORD; do
    if ! grep -q "^$var=" "$DOCKER_ENV"; then
      MISSING_VARS="$MISSING_VARS $var"
    fi
  done
  
  if [ -n "$MISSING_VARS" ]; then
    log_fail "Missing Docker .env vars:$MISSING_VARS"
  else
    log_ok "Docker .env has required variables"
  fi
  
  # Check ANON_KEY is valid JWT
  ANON=$(grep "^ANON_KEY=" "$DOCKER_ENV" | cut -d'=' -f2 | tr -d '"')
  if [[ "$ANON" == ey* ]]; then
    log_ok "ANON_KEY is valid JWT format"
  else
    log_fail "ANON_KEY does not look like a JWT!"
  fi
else
  log_fail "Docker .env not found"
fi

# =====================================================
# PHASE 9: API ENDPOINT TESTS
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 9] API ENDPOINT TESTS"
echo "═══════════════════════════════════════════════════════════"

# Test Kong gateway
KONG_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/rest/v1/ 2>/dev/null || echo "000")
if [ "$KONG_TEST" = "200" ] || [ "$KONG_TEST" = "401" ]; then
  log_ok "Kong gateway responding ($KONG_TEST)"
else
  log_fail "Kong gateway not responding ($KONG_TEST)"
fi

# Test auth endpoint
AUTH_TEST=$(curl -s http://127.0.0.1:8000/auth/v1/health 2>/dev/null | grep -c "true" || echo "0")
if [ "$AUTH_TEST" -gt 0 ]; then
  log_ok "Auth service healthy"
else
  log_warn "Auth service not responding properly"
fi

# Test storage endpoint
STORAGE_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/storage/v1/bucket 2>/dev/null || echo "000")
if [ "$STORAGE_TEST" = "200" ] || [ "$STORAGE_TEST" = "401" ]; then
  log_ok "Storage service responding ($STORAGE_TEST)"
else
  log_warn "Storage service not responding ($STORAGE_TEST)"
fi

# Test edge functions
EDGE_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/functions/v1/upload-image -X OPTIONS 2>/dev/null || echo "000")
if [ "$EDGE_TEST" = "200" ] || [ "$EDGE_TEST" = "204" ]; then
  log_ok "Edge functions responding ($EDGE_TEST)"
else
  log_warn "Edge functions not responding ($EDGE_TEST)"
fi

# =====================================================
# PHASE 10: NGINX RELOAD
# =====================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "[PHASE 10] FINAL NGINX RELOAD"
echo "═══════════════════════════════════════════════════════════"

if nginx -t 2>&1 | grep -q "successful"; then
  systemctl reload nginx
  log_ok "Nginx reloaded successfully"
else
  log_fail "Nginx config test failed - not reloading"
fi

# =====================================================
# SUMMARY
# =====================================================
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    DEEP CLEAN COMPLETE                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Test PM system: Open a private chat and send a message"
echo "  2. Test image upload: Try sending an image in chat"
echo "  3. Check logs: docker compose logs -f functions"
echo ""
echo "If issues persist, run:"
echo "  docker compose logs functions --tail 100 | grep -i error"
echo "  docker compose logs auth --tail 50"
echo ""
