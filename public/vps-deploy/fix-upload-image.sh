#!/bin/bash
# ============================================
# FIX UPLOAD-IMAGE EDGE FUNCTION ON VPS
# Syncs the upload-image function and restarts
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-upload-image.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "============================================"
echo -e "${CYAN}  FIX UPLOAD-IMAGE EDGE FUNCTION${NC}"
echo "============================================"
echo ""

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"
DOCKER_DIR="${DOCKER_DIR:-/home/unix/supabase/docker}"
FUNCTIONS_VOLUME="$DOCKER_DIR/volumes/functions/main"
FUNC_NAME="upload-image"

# Check source exists
SRC_DIR="$DEPLOY_DIR/supabase/functions/$FUNC_NAME"
if [ ! -d "$SRC_DIR" ]; then
  echo -e "${RED}ERROR: Source not found at $SRC_DIR${NC}"
  echo "Run: cd /var/www/justachat && git pull origin main"
  exit 1
fi

# Check destination exists
if [ ! -d "$FUNCTIONS_VOLUME" ]; then
  echo -e "${RED}ERROR: Functions volume not found at $FUNCTIONS_VOLUME${NC}"
  echo "Docker may not be running or path is wrong"
  exit 1
fi

# Sync function
echo -e "${YELLOW}[1] Syncing $FUNC_NAME to Docker volume...${NC}"
DST_DIR="$FUNCTIONS_VOLUME/$FUNC_NAME"
mkdir -p "$DST_DIR"
cp -v "$SRC_DIR"/* "$DST_DIR"/ 2>/dev/null || true
echo -e "${GREEN}✓ Files synced${NC}"

# Sanity checks
echo ""
echo -e "${YELLOW}[2] Validating function code...${NC}"
TARGET="$DST_DIR/index.ts"

if ! grep -q "multipart/form-data" "$TARGET"; then
  echo -e "${RED}✗ Missing multipart/form-data handling${NC}"
  exit 1
fi

if ! grep -q "req.formData" "$TARGET"; then
  echo -e "${RED}✗ Missing req.formData() call${NC}"
  exit 1
fi

if ! grep -q "mapToPublicUrl\|VPS_PUBLIC_URL\|kong:8000" "$TARGET"; then
  echo -e "${YELLOW}⚠ May be missing VPS URL mapping${NC}"
fi

echo -e "${GREEN}✓ Function code validated${NC}"
echo "  Line count: $(wc -l < "$TARGET")"

# Check environment
echo ""
echo -e "${YELLOW}[3] Checking Docker environment...${NC}"
DOCKER_ENV="$DOCKER_DIR/.env"
if [ -f "$DOCKER_ENV" ]; then
  ANON_KEY=$(grep "^ANON_KEY=" "$DOCKER_ENV" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
  SERVICE_KEY=$(grep "^SERVICE_ROLE_KEY=" "$DOCKER_ENV" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
  
  [ -n "$ANON_KEY" ] && echo -e "${GREEN}✓ ANON_KEY present${NC}" || echo -e "${RED}✗ ANON_KEY missing${NC}"
  [ -n "$SERVICE_KEY" ] && echo -e "${GREEN}✓ SERVICE_ROLE_KEY present${NC}" || echo -e "${YELLOW}⚠ SERVICE_ROLE_KEY missing (fallback disabled)${NC}"
else
  echo -e "${RED}✗ Docker .env not found${NC}"
fi

# Cold restart functions container
echo ""
echo -e "${YELLOW}[4] Cold restarting edge functions...${NC}"
cd "$DOCKER_DIR"
docker compose down functions 2>/dev/null || docker compose stop functions 2>/dev/null || true
sleep 2
docker compose up -d functions
sleep 3

if docker ps | grep -q "supabase-edge-functions"; then
  echo -e "${GREEN}✓ Container running${NC}"
else
  echo -e "${RED}✗ Container failed to start${NC}"
  docker compose logs functions --tail 20
  exit 1
fi

# Test endpoints
echo ""
echo -e "${YELLOW}[5] Testing endpoints...${NC}"
sleep 2

OPTIONS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://127.0.0.1:8000/functions/v1/upload-image 2>/dev/null || echo "000")
POST_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8000/functions/v1/upload-image 2>/dev/null || echo "000")

echo "  OPTIONS: $OPTIONS_CODE (expect 200)"
echo "  POST (no auth): $POST_CODE (expect 401)"

if [ "$OPTIONS_CODE" = "200" ]; then
  echo -e "${GREEN}✓ CORS working${NC}"
else
  echo -e "${YELLOW}⚠ CORS may have issues${NC}"
fi

if [ "$POST_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Auth enforcement working${NC}"
elif [ "$POST_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Function responding${NC}"
else
  echo -e "${YELLOW}⚠ Unexpected POST response${NC}"
fi

# Show recent logs
echo ""
echo -e "${YELLOW}[6] Recent logs:${NC}"
docker compose logs functions --tail 15 2>/dev/null | grep -iE "upload|error|listening" | tail -10 || echo "(no relevant logs)"

echo ""
echo "============================================"
echo -e "${GREEN}  UPLOAD-IMAGE FIX COMPLETE${NC}"
echo "============================================"
echo ""
echo "Test by uploading an image in chat at https://justachat.net"
echo ""
echo "If still failing:"
echo "  docker compose logs functions --tail 50"
echo "  # Check storage bucket 'avatars' exists with public SELECT policy"
echo ""
