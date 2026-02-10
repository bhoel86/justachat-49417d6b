#!/bin/bash
# ============================================
# JUSTACHAT VPS UPDATE — THE ONLY SCRIPT YOU NEED
# Usage: bash /var/www/justachat/public/vps-deploy/vps-update.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="/var/www/justachat"
DOCKER_DIR="$HOME/supabase/docker"
DOCKER_ENV="$DOCKER_DIR/.env"
FUNCTIONS_DIR="$DOCKER_DIR/volumes/functions/main"
KONG_DIR="$DOCKER_DIR/volumes/api"

ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }
step() { echo -e "\n${BOLD}── $1 ──${NC}\n"; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}JUSTACHAT VPS UPDATE${NC}  $(date '+%Y-%m-%d %H:%M')   ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────────
# STEP 0: Read ALL keys from Docker .env (source of truth)
# ─────────────────────────────────────────────
step "Reading keys from Docker"

if [ ! -f "$DOCKER_ENV" ]; then
  err "Docker .env not found at $DOCKER_ENV — cannot continue"
  exit 1
fi

ANON_KEY=$(grep -E '^ANON_KEY=' "$DOCKER_ENV" | head -1 | cut -d'=' -f2-)
SERVICE_ROLE_KEY=$(grep -E '^SERVICE_ROLE_KEY=' "$DOCKER_ENV" | head -1 | cut -d'=' -f2-)
JWT_SECRET=$(grep -E '^JWT_SECRET=' "$DOCKER_ENV" | head -1 | cut -d'=' -f2-)

if [ -z "$ANON_KEY" ]; then
  err "ANON_KEY not found in Docker .env"
  exit 1
fi
ok "ANON_KEY: ...${ANON_KEY: -8} (${#ANON_KEY} chars)"

if [ -z "$SERVICE_ROLE_KEY" ]; then
  warn "SERVICE_ROLE_KEY not found"
else
  ok "SERVICE_ROLE_KEY: ...${SERVICE_ROLE_KEY: -8} (${#SERVICE_ROLE_KEY} chars)"
fi

if [ -z "$JWT_SECRET" ]; then
  warn "JWT_SECRET not found"
else
  ok "JWT_SECRET: ...${JWT_SECRET: -8} (${#JWT_SECRET} chars)"
fi

# ─────────────────────────────────────────────
# STEP 1: Git pull
# ─────────────────────────────────────────────
step "Git pull"

cd "$PROJECT_DIR"
git fetch origin main
git reset --hard origin/main
ok "Code updated from GitHub"

# ─────────────────────────────────────────────
# STEP 2: Write frontend .env (from Docker keys)
# ─────────────────────────────────────────────
step "Write frontend .env"

cat > .env << EOF
VITE_SUPABASE_URL=https://justachat.net
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
EOF
ok "Frontend .env written with correct ANON_KEY"

# ─────────────────────────────────────────────
# STEP 3: Verify Kong config uses env vars (not hardcoded)
# ─────────────────────────────────────────────
step "Verify Kong"

KONG_YML="$KONG_DIR/kong.yml"
if [ -f "$KONG_YML" ]; then
  if grep -q 'SUPABASE_ANON_KEY' "$KONG_YML"; then
    ok "Kong uses \$SUPABASE_ANON_KEY env var"
  else
    warn "Kong may have hardcoded keys — check $KONG_YML"
  fi
else
  # Sync kong.yml from repo if it doesn't exist
  if [ -f "$PROJECT_DIR/public/vps-deploy/kong.yml" ]; then
    mkdir -p "$KONG_DIR"
    cp "$PROJECT_DIR/public/vps-deploy/kong.yml" "$KONG_YML"
    ok "Kong config synced from repo"
  else
    warn "No Kong config found"
  fi
fi

# ─────────────────────────────────────────────
# STEP 4: Patch edge functions for VPS (remove std/http)
# ─────────────────────────────────────────────
step "Patch edge functions"

PATCHED=0
for func_dir in supabase/functions/*/; do
  func_file="${func_dir}index.ts"
  if [ -f "$func_file" ]; then
    if grep -q "std/http/server" "$func_file" 2>/dev/null; then
      sed -i 's|import.*from.*"https://deno.land/std.*/http/server.*"||g' "$func_file"
      PATCHED=$((PATCHED + 1))
    fi
  fi
done
if [ $PATCHED -gt 0 ]; then
  ok "Patched $PATCHED edge functions (removed std/http)"
else
  ok "All edge functions VPS-compatible"
fi

# ─────────────────────────────────────────────
# STEP 5: Install & build
# ─────────────────────────────────────────────
step "Install & build"

npm install --legacy-peer-deps --silent
rm -rf dist node_modules/.vite .vite 2>/dev/null || true
npm run build

if [ -d "dist" ]; then
  ok "Frontend built"
else
  err "Build failed — dist folder not created"
  exit 1
fi

# ─────────────────────────────────────────────
# STEP 6: Sync edge functions to Docker
# ─────────────────────────────────────────────
step "Sync edge functions to Docker"

if [ -d "$FUNCTIONS_DIR" ]; then
  SYNCED=0
  for func_dir in supabase/functions/*/; do
    func_name=$(basename "$func_dir")
    if [ "$func_name" != "_shared" ] && [ -f "${func_dir}index.ts" ]; then
      mkdir -p "$FUNCTIONS_DIR/$func_name"
      cp -r "${func_dir}"* "$FUNCTIONS_DIR/$func_name/" 2>/dev/null || true
      SYNCED=$((SYNCED + 1))
    fi
  done
  ok "Synced $SYNCED edge functions"
else
  warn "Functions dir not found at $FUNCTIONS_DIR"
fi

# ─────────────────────────────────────────────
# STEP 7: Sync Nginx config
# ─────────────────────────────────────────────
step "Sync Nginx"

NGINX_SRC="$PROJECT_DIR/dist/nginx-justachat.conf"
NGINX_DEST="/etc/nginx/sites-enabled/justachat"

if [ -f "$NGINX_SRC" ]; then
  sudo cp "$NGINX_DEST" "${NGINX_DEST}.bak" 2>/dev/null || true
  sudo cp "$NGINX_SRC" "$NGINX_DEST"
  ok "Nginx config synced"
else
  warn "No nginx config in dist — using existing"
fi

# ─────────────────────────────────────────────
# STEP 8: Restart services
# ─────────────────────────────────────────────
step "Restart services"

cd "$DOCKER_DIR"
docker compose stop functions 2>/dev/null || docker-compose stop functions 2>/dev/null || true
sleep 2
docker compose up -d functions 2>/dev/null || docker-compose up -d functions 2>/dev/null || true
ok "Edge functions restarted"

cd "$PROJECT_DIR"
sudo nginx -t 2>&1 | grep -q "syntax is ok" && sudo systemctl reload nginx && ok "Nginx reloaded" || warn "Nginx test failed — not reloaded"

# ─────────────────────────────────────────────
# STEP 9: Health checks
# ─────────────────────────────────────────────
step "Health checks"

HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/ 2>/dev/null || echo "000")
[ "$HTTP" == "200" ] && ok "Frontend: HTTP $HTTP" || warn "Frontend: HTTP $HTTP"

API=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/rest/v1/ 2>/dev/null || echo "000")
[ "$API" == "200" ] || [ "$API" == "401" ] && ok "REST API: HTTP $API" || warn "REST API: HTTP $API"

AUTH=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/auth/v1/health 2>/dev/null || echo "000")
[ "$AUTH" == "200" ] && ok "Auth: HTTP $AUTH" || warn "Auth: HTTP $AUTH"

# Quick edge function test
VPS_TEST=$(curl -s -X POST https://justachat.net/functions/v1/vps-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY" \
  -d '{}' 2>/dev/null | head -c 100)
echo "$VPS_TEST" | grep -qi 'success\|Set\|Connected' && ok "Edge functions: Working" || warn "Edge functions: $VPS_TEST"

# ─────────────────────────────────────────────
# STEP 10: Verify .env matches Docker (final sanity check)
# ─────────────────────────────────────────────
step "Final verification"

BUILT_KEY=$(grep 'VITE_SUPABASE_PUBLISHABLE_KEY' .env 2>/dev/null | cut -d'=' -f2-)
if [ "$BUILT_KEY" == "$ANON_KEY" ]; then
  ok "Frontend ANON_KEY matches Docker ✓"
else
  err "KEY MISMATCH! Frontend has different key than Docker"
  err "Frontend: ...${BUILT_KEY: -8}"
  err "Docker:   ...${ANON_KEY: -8}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}UPDATE COMPLETE${NC}                          ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "  Visit: https://justachat.net"
echo ""
