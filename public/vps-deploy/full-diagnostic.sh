#!/bin/bash
#===============================================================================
# JUSTACHAT VPS FULL DIAGNOSTIC
# Step-by-step verification of entire infrastructure
# Run as: sudo bash /var/www/justachat/public/vps-deploy/full-diagnostic.sh
#===============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS="${GREEN}[✓ PASS]${NC}"
FAIL="${RED}[✗ FAIL]${NC}"
WARN="${YELLOW}[! WARN]${NC}"
INFO="${BLUE}[INFO]${NC}"

ERRORS=0
WARNINGS=0

check_pass() { echo -e "$PASS $1"; }
check_fail() { echo -e "$FAIL $1"; ERRORS=$((ERRORS+1)); }
check_warn() { echo -e "$WARN $1"; WARNINGS=$((WARNINGS+1)); }
check_info() { echo -e "$INFO $1"; }

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       JUSTACHAT VPS FULL DIAGNOSTIC                          ║"
echo "║       $(date -u '+%Y-%m-%d %H:%M:%S UTC')                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

#===============================================================================
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 1: SYSTEM & USER VERIFICATION"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================

echo ""
echo "Hostname: $(hostname)"
echo "IP: $(curl -s ifconfig.me 2>/dev/null || echo 'unknown')"
echo "User: $(whoami)"
echo ""

# Check unix user exists
if id "unix" &>/dev/null; then
  check_pass "User 'unix' exists"
else
  check_fail "User 'unix' does NOT exist"
fi

# Check unix has sudo
if groups unix 2>/dev/null | grep -q sudo; then
  check_pass "User 'unix' has sudo access"
else
  check_fail "User 'unix' missing sudo access"
fi

# Check project directory ownership
if [ -d "/var/www/justachat" ]; then
  OWNER=$(stat -c '%U' /var/www/justachat)
  if [ "$OWNER" = "unix" ]; then
    check_pass "/var/www/justachat owned by unix"
  else
    check_fail "/var/www/justachat owned by $OWNER (should be unix)"
  fi
else
  check_fail "/var/www/justachat directory does NOT exist"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 2: DOCKER STATUS"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

if command -v docker &>/dev/null; then
  check_pass "Docker installed: $(docker --version | head -c 50)"
else
  check_fail "Docker NOT installed"
fi

if systemctl is-active --quiet docker; then
  check_pass "Docker service running"
else
  check_fail "Docker service NOT running"
fi

echo ""
echo "--- Docker Containers Status ---"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null | (head -n 1; grep -E 'supabase|kong' || echo "No Supabase containers found")
echo ""

# Check critical containers
REQUIRED_CONTAINERS="supabase-db supabase-kong supabase-auth supabase-rest supabase-realtime supabase-storage supabase-edge-functions"
for container in $REQUIRED_CONTAINERS; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
      check_pass "Container $container: running"
    else
      check_fail "Container $container: $STATUS"
    fi
  else
    check_fail "Container $container: NOT FOUND"
  fi
done

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 3: SUPABASE CONFIGURATION FILES"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

SUPABASE_DIR="/home/unix/supabase/docker"

if [ -f "$SUPABASE_DIR/.env" ]; then
  check_pass "$SUPABASE_DIR/.env exists"
  
  # Check key variables
  for var in POSTGRES_PASSWORD JWT_SECRET ANON_KEY SERVICE_ROLE_KEY; do
    if grep -q "^${var}=" "$SUPABASE_DIR/.env" 2>/dev/null; then
      check_pass "  $var is set"
    else
      check_fail "  $var is MISSING"
    fi
  done
else
  check_fail "$SUPABASE_DIR/.env does NOT exist"
fi

if [ -f "$SUPABASE_DIR/docker-compose.yml" ]; then
  check_pass "$SUPABASE_DIR/docker-compose.yml exists"
else
  check_fail "$SUPABASE_DIR/docker-compose.yml does NOT exist"
fi

if [ -f "$SUPABASE_DIR/volumes/api/kong.yml" ]; then
  check_pass "$SUPABASE_DIR/volumes/api/kong.yml exists"
else
  check_fail "$SUPABASE_DIR/volumes/api/kong.yml does NOT exist"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 4: FRONTEND CONFIGURATION"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

PROJECT_DIR="/var/www/justachat"

if [ -d "$PROJECT_DIR" ]; then
  check_pass "$PROJECT_DIR exists"
else
  check_fail "$PROJECT_DIR does NOT exist"
fi

if [ -f "$PROJECT_DIR/.env" ]; then
  check_pass "$PROJECT_DIR/.env exists"
  
  if grep -q "VITE_SUPABASE_URL=https://justachat.net" "$PROJECT_DIR/.env" 2>/dev/null; then
    check_pass "  VITE_SUPABASE_URL points to justachat.net"
  else
    CURRENT=$(grep "VITE_SUPABASE_URL" "$PROJECT_DIR/.env" 2>/dev/null || echo "NOT SET")
    check_fail "  VITE_SUPABASE_URL wrong: $CURRENT"
  fi
  
  if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY=" "$PROJECT_DIR/.env" 2>/dev/null; then
    check_pass "  VITE_SUPABASE_PUBLISHABLE_KEY is set"
  else
    check_fail "  VITE_SUPABASE_PUBLISHABLE_KEY is MISSING"
  fi
else
  check_fail "$PROJECT_DIR/.env does NOT exist"
fi

if [ -d "$PROJECT_DIR/dist" ]; then
  check_pass "$PROJECT_DIR/dist exists (frontend built)"
  FILE_COUNT=$(find "$PROJECT_DIR/dist" -type f | wc -l)
  check_info "  $FILE_COUNT files in dist/"
else
  check_fail "$PROJECT_DIR/dist does NOT exist (frontend not built!)"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 5: NGINX CONFIGURATION"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

if systemctl is-active --quiet nginx; then
  check_pass "Nginx service running"
else
  check_fail "Nginx service NOT running"
fi

if [ -f "/etc/nginx/sites-enabled/justachat" ]; then
  check_pass "/etc/nginx/sites-enabled/justachat exists"
else
  check_fail "/etc/nginx/sites-enabled/justachat does NOT exist"
fi

# Test nginx config
if nginx -t 2>&1 | grep -q "syntax is ok"; then
  check_pass "Nginx config syntax OK"
else
  check_fail "Nginx config has errors"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 6: SSL CERTIFICATES"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

if [ -d "/etc/letsencrypt/live/justachat.net" ]; then
  check_pass "SSL certificates exist"
  
  EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/justachat.net/fullchain.pem 2>/dev/null | cut -d= -f2)
  check_info "  Expires: $EXPIRY"
else
  check_warn "SSL certificates NOT found (may need certbot)"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 7: EDGE FUNCTIONS"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

FUNC_DIR="$SUPABASE_DIR/volumes/functions"

if [ -d "$FUNC_DIR" ]; then
  check_pass "Edge functions directory exists"
  
  # Check ownership
  FUNC_OWNER=$(stat -c '%u' "$FUNC_DIR")
  if [ "$FUNC_OWNER" = "1000" ]; then
    check_pass "  Functions owned by UID 1000 (deno)"
  else
    check_fail "  Functions owned by UID $FUNC_OWNER (should be 1000)"
  fi
  
  # Check main router
  if [ -f "$FUNC_DIR/main/index.ts" ]; then
    check_pass "  Main router exists: main/index.ts"
    
    if grep -q "import(" "$FUNC_DIR/main/index.ts" 2>/dev/null; then
      check_pass "  Router has dynamic imports"
    else
      check_warn "  Router may be missing dynamic imports"
    fi
  else
    check_fail "  Main router MISSING: main/index.ts"
  fi
  
  # List functions
  echo ""
  check_info "  Functions found:"
  ls -la "$FUNC_DIR" 2>/dev/null | grep "^d" | awk '{print "    " $NF}' | grep -v "^\." || echo "    (none)"
else
  check_fail "Edge functions directory does NOT exist"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 8: DATABASE STATUS"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

if docker exec supabase-db pg_isready -U postgres 2>/dev/null | grep -q "accepting"; then
  check_pass "PostgreSQL accepting connections"
else
  check_fail "PostgreSQL NOT accepting connections"
fi

# Check tables exist
echo ""
check_info "Core tables check:"
CORE_TABLES="profiles user_roles channels messages channel_members private_messages bans mutes"
for table in $CORE_TABLES; do
  EXISTS=$(docker exec supabase-db psql -U postgres -d postgres -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null | tr -d ' ')
  if [ "$EXISTS" = "t" ]; then
    check_pass "  Table: $table"
  else
    check_fail "  Table: $table MISSING"
  fi
done

# Check channels
echo ""
check_info "Channels in database:"
docker exec supabase-db psql -U postgres -d postgres -t -c "SELECT count(*) FROM public.channels;" 2>/dev/null | tr -d ' ' | while read count; do
  echo "    Total channels: $count"
done

docker exec supabase-db psql -U postgres -d postgres -t -c "SELECT name FROM public.channels ORDER BY name LIMIT 20;" 2>/dev/null | while read name; do
  [ -n "$name" ] && echo "    - $name"
done

# Check users
echo ""
check_info "Users in database:"
docker exec supabase-db psql -U postgres -d postgres -t -c "SELECT count(*) FROM auth.users;" 2>/dev/null | tr -d ' ' | while read count; do
  echo "    Total users: $count"
done

# Check owners
echo ""
check_info "Owner accounts:"
docker exec supabase-db psql -U postgres -d postgres -t -c "SELECT u.email, ur.role FROM auth.users u JOIN public.user_roles ur ON u.id = ur.user_id WHERE ur.role = 'owner';" 2>/dev/null | while read line; do
  [ -n "$line" ] && echo "    $line"
done

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 9: SYSTEMD SERVICES"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

SERVICES="nginx justachat-email jac-deploy"
for svc in $SERVICES; do
  if systemctl is-enabled --quiet "$svc" 2>/dev/null; then
    STATUS=$(systemctl is-active "$svc" 2>/dev/null)
    if [ "$STATUS" = "active" ]; then
      check_pass "Service $svc: enabled + running"
    else
      check_warn "Service $svc: enabled but $STATUS"
    fi
  else
    check_warn "Service $svc: not enabled (may be optional)"
  fi
done

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 10: API ENDPOINT HEALTH"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

check_info "Testing local endpoints..."

# Kong/API
KONG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/ 2>/dev/null || echo "000")
if [ "$KONG_STATUS" = "200" ] || [ "$KONG_STATUS" = "404" ]; then
  check_pass "Kong API (8000): responding ($KONG_STATUS)"
else
  check_fail "Kong API (8000): NOT responding ($KONG_STATUS)"
fi

# Auth
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/auth/v1/health 2>/dev/null || echo "000")
if [ "$AUTH_STATUS" = "200" ]; then
  check_pass "GoTrue Auth: healthy"
else
  check_warn "GoTrue Auth: status $AUTH_STATUS"
fi

# REST
REST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/rest/v1/ 2>/dev/null || echo "000")
if [ "$REST_STATUS" = "200" ]; then
  check_pass "PostgREST: responding"
else
  check_warn "PostgREST: status $REST_STATUS"
fi

# Edge Functions
EDGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/ 2>/dev/null || echo "000")
if [ "$EDGE_STATUS" = "200" ]; then
  check_pass "Edge Functions (9000): responding"
else
  check_fail "Edge Functions (9000): NOT responding ($EDGE_STATUS)"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 11: BACKUP STATUS"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

check_info "Searching for backup files (last 7 days)..."

BACKUP_DIRS="/var/backups /home/unix /home/unix/backups /root /root/backups /opt/backups"
FOUND_BACKUPS=0

for d in $BACKUP_DIRS; do
  if [ -d "$d" ]; then
    BACKUPS=$(find "$d" -maxdepth 3 -type f \( -iname "*.sql" -o -iname "*.sql.gz" -o -iname "*.tar.gz" -o -iname "*backup*" \) -mtime -7 2>/dev/null | head -10)
    if [ -n "$BACKUPS" ]; then
      echo "  In $d:"
      echo "$BACKUPS" | while read f; do
        SIZE=$(ls -lh "$f" 2>/dev/null | awk '{print $5}')
        DATE=$(stat -c '%y' "$f" 2>/dev/null | cut -d' ' -f1)
        echo "    $DATE  $SIZE  $(basename "$f")"
        FOUND_BACKUPS=$((FOUND_BACKUPS+1))
      done
    fi
  fi
done

if [ $FOUND_BACKUPS -eq 0 ]; then
  check_warn "No recent backups found (within 7 days)"
else
  check_pass "Found backup files"
fi

#===============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
#===============================================================================
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ALL CHECKS PASSED - VPS IS HEALTHY                          ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  $WARNINGS WARNINGS - Review items above                           ║${NC}"
  echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  $ERRORS ERRORS, $WARNINGS WARNINGS - Action required!                    ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo "Diagnostic saved to: /tmp/full-diagnostic.log"
echo ""
