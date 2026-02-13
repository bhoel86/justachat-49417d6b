#!/bin/bash
# JustAChat VPS - Diagnose & Fix Google OAuth (one-shot)
# Usage: sudo bash /var/www/justachat/public/vps-deploy/fix-google-oauth.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ENV_FILE="/root/supabase/docker/.env"

echo "========================================"
echo -e "${CYAN}  GOOGLE OAUTH DIAGNOSTIC & FIX${NC}"
echo "========================================"
echo ""

# Step 1: Check current state
echo -e "${YELLOW}[1/4] Checking current Google OAuth config...${NC}"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}ERROR: $ENV_FILE not found${NC}"
  exit 1
fi

CURRENT_ENABLED=$(grep -E '^GOTRUE_EXTERNAL_GOOGLE_ENABLED=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "NOT SET")
CURRENT_CLIENT_ID=$(grep -E '^GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "NOT SET")
CURRENT_SECRET=$(grep -E '^GOTRUE_EXTERNAL_GOOGLE_SECRET=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "NOT SET")
CURRENT_REDIRECT=$(grep -E '^GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "NOT SET")

echo "  ENABLED:      ${CURRENT_ENABLED:-NOT SET}"
echo "  CLIENT_ID:    ${CURRENT_CLIENT_ID:0:20}... ($(echo -n "$CURRENT_CLIENT_ID" | wc -c) chars)"
echo "  SECRET:       ${CURRENT_SECRET:0:8}... ($(echo -n "$CURRENT_SECRET" | wc -c) chars)"
echo "  REDIRECT_URI: ${CURRENT_REDIRECT:-NOT SET}"
echo ""

NEEDS_FIX=false

if [ "$CURRENT_ENABLED" != "true" ]; then
  echo -e "${RED}  ✗ Google OAuth is NOT enabled${NC}"
  NEEDS_FIX=true
fi

if [ -z "$CURRENT_CLIENT_ID" ] || [ "$CURRENT_CLIENT_ID" = "NOT SET" ] || [ "$CURRENT_CLIENT_ID" = "your-google-client-id" ]; then
  echo -e "${RED}  ✗ Client ID is missing or placeholder${NC}"
  NEEDS_FIX=true
fi

if [ -z "$CURRENT_SECRET" ] || [ "$CURRENT_SECRET" = "NOT SET" ] || [ "$CURRENT_SECRET" = "your-google-client-secret" ]; then
  echo -e "${RED}  ✗ Client Secret is missing or placeholder${NC}"
  NEEDS_FIX=true
fi

if [ "$CURRENT_REDIRECT" != "https://justachat.net/auth/v1/callback" ]; then
  echo -e "${RED}  ✗ Redirect URI is wrong or missing${NC}"
  NEEDS_FIX=true
fi

if [ "$NEEDS_FIX" = false ]; then
  echo -e "${GREEN}  ✓ All Google OAuth vars look correct${NC}"
  echo ""
  echo -e "${YELLOW}[2/4] Checking GoTrue container logs for OAuth errors...${NC}"
  docker logs --tail 20 supabase-auth 2>&1 | grep -i -E "google|oauth|provider" || echo "  No recent Google OAuth errors in logs"
  echo ""
  echo -e "${GREEN}Config looks good. If still getting errors, restart auth:${NC}"
  echo "  cd /root/supabase/docker && docker compose --env-file .env restart supabase-auth"
  exit 0
fi

# Step 2: Prompt for credentials
echo ""
echo -e "${YELLOW}[2/4] Google OAuth credentials needed${NC}"
echo ""
echo "Get these from: https://console.cloud.google.com/apis/credentials"
echo "  → OAuth 2.0 Client IDs → Web application"
echo "  → Authorized redirect URI must include: https://justachat.net/auth/v1/callback"
echo ""

if [ -z "$CURRENT_CLIENT_ID" ] || [ "$CURRENT_CLIENT_ID" = "NOT SET" ] || [ "$CURRENT_CLIENT_ID" = "your-google-client-id" ]; then
  read -p "Enter Google Client ID: " NEW_CLIENT_ID
else
  echo "  Using existing Client ID: ${CURRENT_CLIENT_ID:0:20}..."
  NEW_CLIENT_ID="$CURRENT_CLIENT_ID"
fi

if [ -z "$CURRENT_SECRET" ] || [ "$CURRENT_SECRET" = "NOT SET" ] || [ "$CURRENT_SECRET" = "your-google-client-secret" ]; then
  read -sp "Enter Google Client Secret: " NEW_SECRET
  echo ""
else
  echo "  Using existing Client Secret"
  NEW_SECRET="$CURRENT_SECRET"
fi

if [ -z "$NEW_CLIENT_ID" ] || [ -z "$NEW_SECRET" ]; then
  echo -e "${RED}ERROR: Client ID and Secret are required${NC}"
  exit 1
fi

# Step 3: Write to .env
echo ""
echo -e "${YELLOW}[3/4] Updating $ENV_FILE...${NC}"

# Remove old entries
sed -i '/^GOTRUE_EXTERNAL_GOOGLE_ENABLED=/d' "$ENV_FILE"
sed -i '/^GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=/d' "$ENV_FILE"
sed -i '/^GOTRUE_EXTERNAL_GOOGLE_SECRET=/d' "$ENV_FILE"
sed -i '/^GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=/d' "$ENV_FILE"

# Append new entries
cat >> "$ENV_FILE" <<EOF

# Google OAuth (added by fix-google-oauth.sh)
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=${NEW_CLIENT_ID}
GOTRUE_EXTERNAL_GOOGLE_SECRET=${NEW_SECRET}
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://justachat.net/auth/v1/callback
EOF

echo -e "${GREEN}  ✓ .env updated${NC}"

# Step 4: Restart auth
echo ""
echo -e "${YELLOW}[4/4] Restarting GoTrue (supabase-auth)...${NC}"
cd /root/supabase/docker
docker compose --env-file .env restart supabase-auth

sleep 3
echo ""

# Verify
if docker ps --format '{{.Names}} {{.Status}}' | grep -q "supabase-auth.*Up"; then
  echo -e "${GREEN}  ✓ supabase-auth is running${NC}"
else
  echo -e "${RED}  ✗ supabase-auth failed to start! Check: docker logs supabase-auth${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}========================================"
echo "  GOOGLE OAUTH FIX COMPLETE"
echo "========================================${NC}"
echo ""
echo "Test it: https://justachat.net/login → Sign in with Google"
echo ""
echo "If it still fails, check logs:"
echo "  docker logs --tail 50 supabase-auth 2>&1 | grep -i google"
