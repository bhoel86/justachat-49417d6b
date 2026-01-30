#!/usr/bin/env bash
# JustAChat VPS - Sync Backend Keys + Rebuild Frontend + Reload Nginx
# Run: sudo bash /var/www/justachat/public/vps-deploy/sync-rebuild.sh
#
# This script:
# 1. Reads ANON_KEY from the Supabase backend .env
# 2. Writes the frontend .env with correct VPS URLs
# 3. Cleans build cache and rebuilds
# 4. Reloads Nginx to clear any cached responses
# 5. Masks all sensitive output

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────
APP_DIR="/var/www/justachat"
BACKEND_ENV="/home/unix/supabase/docker/.env"
SITE_URL="https://justachat.net"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# Helper: mask a string (show first 10 and last 6 chars)
# ─────────────────────────────────────────────────────────────────────────────
mask_key() {
  local key="$1"
  if [ ${#key} -gt 20 ]; then
    echo "${key:0:10}...${key: -6}"
  else
    echo "****"
  fi
}

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   JUSTACHAT VPS - SYNC + REBUILD${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Validate environment
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Validating environment...${NC}"

if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}ERROR: App directory not found: $APP_DIR${NC}"
  exit 1
fi

if [ ! -f "$BACKEND_ENV" ]; then
  echo -e "${RED}ERROR: Backend .env not found: $BACKEND_ENV${NC}"
  exit 1
fi

cd "$APP_DIR"
echo "       Working directory: $APP_DIR"
echo "       Backend env: $BACKEND_ENV"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Extract keys from backend
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/5] Reading backend keys...${NC}"

ANON_KEY="$(grep -E "^ANON_KEY=" "$BACKEND_ENV" | cut -d= -f2- | tr -d '\"' || true)"
SERVICE_KEY="$(grep -E "^SERVICE_ROLE_KEY=" "$BACKEND_ENV" | cut -d= -f2- | tr -d '\"' || true)"

if [ -z "${ANON_KEY:-}" ]; then
  echo -e "${RED}ERROR: ANON_KEY not found in $BACKEND_ENV${NC}"
  exit 1
fi

echo "       ANON_KEY: $(mask_key "$ANON_KEY")"
if [ -n "${SERVICE_KEY:-}" ]; then
  echo "       SERVICE_ROLE_KEY: $(mask_key "$SERVICE_KEY") (not used in frontend)"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Write frontend .env
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/5] Writing frontend .env...${NC}"

cat > "$APP_DIR/.env" <<EOF
VITE_SUPABASE_URL=$SITE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
EOF

echo "       VITE_SUPABASE_URL=$SITE_URL"
echo "       VITE_SUPABASE_PUBLISHABLE_KEY=$(mask_key "$ANON_KEY")"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Clean rebuild
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Clean rebuild (this may take 30-60 seconds)...${NC}"

# Remove build caches
rm -rf dist node_modules/.vite .vite 2>/dev/null || true

# Build
npm run build --silent 2>&1 | tail -n 5

# Verify build
if [ ! -f "dist/index.html" ]; then
  echo -e "${RED}ERROR: Build failed - dist/index.html not found${NC}"
  exit 1
fi

BUILD_TIME=$(stat -c '%y' dist/index.html 2>/dev/null | cut -d'.' -f1 || date)
echo ""
echo "       Build complete: $BUILD_TIME"

# Verify OAuth fix is present
if grep -q "detectSessionInUrl" dist/assets/*.js 2>/dev/null; then
  echo -e "       OAuth fix: ${GREEN}PRESENT${NC}"
else
  echo -e "       OAuth fix: ${RED}MISSING${NC}"
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Reload Nginx
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Reloading Nginx...${NC}"

if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo -e "       Nginx: ${GREEN}RELOADED${NC}"
else
  echo -e "       Nginx: ${RED}CONFIG ERROR - not reloaded${NC}"
  nginx -t
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ SYNC + REBUILD COMPLETE${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "   Site URL:    $SITE_URL"
echo "   Build time:  $BUILD_TIME"
echo "   Git commit:  $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo ""
echo "   Next: Test Google Sign-In at $SITE_URL (use incognito)"
echo ""
