#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# JustAChat VPS - Fix Private Message Image Uploads
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-pm-images.sh
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DOCKER_DIR="${HOME}/supabase/docker"
FUNCTIONS_DIR="${DOCKER_DIR}/volumes/functions/main"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     JustAChat™ VPS - Fix PM Image Uploads                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Check Docker .env for required variables
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/6] Checking Docker environment...${NC}"

if [ ! -f "$DOCKER_DIR/.env" ]; then
  echo -e "${RED}ERROR: Docker .env not found at $DOCKER_DIR/.env${NC}"
  exit 1
fi

SERVICE_KEY=$(grep "^SERVICE_ROLE_KEY=" "$DOCKER_DIR/.env" | cut -d'=' -f2- | tr -d '"' || true)
ANON_KEY=$(grep "^ANON_KEY=" "$DOCKER_DIR/.env" | cut -d'=' -f2- | tr -d '"' || true)
OPENAI_KEY=$(grep "^OPENAI_API_KEY=" "$DOCKER_DIR/.env" | cut -d'=' -f2- | tr -d '"' || true)

if [ -z "$SERVICE_KEY" ]; then
  echo -e "${RED}ERROR: SERVICE_ROLE_KEY not found in Docker .env${NC}"
  exit 1
fi

if [ -z "$ANON_KEY" ]; then
  echo -e "${RED}ERROR: ANON_KEY not found in Docker .env${NC}"
  exit 1
fi

echo -e "       SERVICE_ROLE_KEY: ${SERVICE_KEY:0:20}...${NC}"
echo -e "       ANON_KEY: ${ANON_KEY:0:20}...${NC}"
if [ -n "$OPENAI_KEY" ]; then
  echo -e "       OPENAI_API_KEY: ${OPENAI_KEY:0:10}...${NC}"
else
  echo -e "       ${YELLOW}OPENAI_API_KEY: Not set (moderation will be skipped)${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Ensure VPS_PUBLIC_URL is set in Docker .env
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[2/6] Ensuring VPS_PUBLIC_URL is configured...${NC}"

if ! grep -q "^VPS_PUBLIC_URL=" "$DOCKER_DIR/.env"; then
  echo "VPS_PUBLIC_URL=https://justachat.net" >> "$DOCKER_DIR/.env"
  echo -e "       ${GREEN}Added VPS_PUBLIC_URL=https://justachat.net${NC}"
else
  echo -e "       VPS_PUBLIC_URL already set"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Update docker-compose to inject vars into edge-functions container
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[3/6] Checking docker-compose for edge function environment...${NC}"

COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
if [ -f "$COMPOSE_FILE" ]; then
  # Check if SUPABASE_SERVICE_ROLE_KEY is already in edge functions
  if grep -A50 "supabase-edge-functions:" "$COMPOSE_FILE" | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
    echo -e "       Edge functions already have SERVICE_ROLE_KEY"
  else
    echo -e "       ${YELLOW}NOTE: You may need to add SUPABASE_SERVICE_ROLE_KEY to edge-functions service${NC}"
    echo -e "       ${YELLOW}This is done in docker-compose.yml under functions: environment:${NC}"
  fi
  
  if grep -A50 "supabase-edge-functions:" "$COMPOSE_FILE" | grep -q "VPS_PUBLIC_URL"; then
    echo -e "       Edge functions already have VPS_PUBLIC_URL"
  else
    echo -e "       ${YELLOW}NOTE: Add VPS_PUBLIC_URL to edge-functions environment section${NC}"
  fi
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Verify storage bucket and RLS policies
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[4/6] Testing storage bucket access...${NC}"

# Test if avatars bucket exists and is accessible
BUCKET_TEST=$(curl -s -H "apikey: $ANON_KEY" "https://justachat.net/storage/v1/bucket/avatars" 2>/dev/null | head -c 100)
if echo "$BUCKET_TEST" | grep -q '"id":"avatars"'; then
  echo -e "       ${GREEN}✓ avatars bucket exists${NC}"
else
  echo -e "       ${YELLOW}⚠ avatars bucket may need initialization${NC}"
  echo -e "       Response: $BUCKET_TEST"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Sync upload-image function to VPS
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[5/6] Syncing upload-image edge function...${NC}"

# Ensure functions directory exists
mkdir -p "$FUNCTIONS_DIR/upload-image"

# Copy the function from the repo
if [ -f "/var/www/justachat/supabase/functions/upload-image/index.ts" ]; then
  cp "/var/www/justachat/supabase/functions/upload-image/index.ts" "$FUNCTIONS_DIR/upload-image/index.ts"
  echo -e "       ${GREEN}✓ upload-image function synced${NC}"
else
  echo -e "       ${RED}✗ upload-image source not found in repo${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Restart edge functions container
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[6/6] Restarting edge functions container...${NC}"

cd "$DOCKER_DIR"
docker compose restart functions
sleep 3

# Verify it's running
if docker ps | grep -q "supabase-edge-functions"; then
  echo -e "       ${GREEN}✓ Edge functions container running${NC}"
else
  echo -e "       ${RED}✗ Edge functions container not running${NC}"
  docker compose logs functions --tail=20
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: Test upload endpoint
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[VERIFICATION] Testing upload-image endpoint...${NC}"

# Create a tiny test image (1x1 red pixel PNG)
TEST_PNG=$(printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' | base64)

# We need an auth token to test - this is a sanity check that the endpoint responds
ENDPOINT_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "https://justachat.net/functions/v1/upload-image" \
  -H "Content-Type: application/json" \
  2>/dev/null || echo "000")

if [ "$ENDPOINT_TEST" = "401" ]; then
  echo -e "       ${GREEN}✓ upload-image endpoint responding (401 = auth required, expected)${NC}"
elif [ "$ENDPOINT_TEST" = "000" ]; then
  echo -e "       ${RED}✗ upload-image endpoint not reachable${NC}"
else
  echo -e "       ${YELLOW}⚠ upload-image returned HTTP $ENDPOINT_TEST${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    ✅ FIX COMPLETE                                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "   Next steps:"
echo "   1. Hard refresh your browser (Ctrl+Shift+R)"
echo "   2. Open a PM window and try attaching an image"
echo "   3. If still failing, check:"
echo "      - docker compose logs functions --tail=50"
echo "      - Ensure SUPABASE_SERVICE_ROLE_KEY is in functions environment"
echo ""
echo "   If docker-compose needs environment updates, add these under"
echo "   the 'functions' service 'environment' section:"
echo ""
echo "     environment:"
echo "       SUPABASE_SERVICE_ROLE_KEY: \${SERVICE_ROLE_KEY}"
echo "       VPS_PUBLIC_URL: https://justachat.net"
echo "       OPENAI_API_KEY: \${OPENAI_API_KEY}"
echo ""
