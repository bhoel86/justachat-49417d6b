#!/bin/bash
# VPS PM System Test Script
# Tests encrypt-pm, decrypt-pm, and database operations
# Run: bash /var/www/justachat/public/vps-deploy/test-pm-system.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================"
echo -e "${CYAN}  VPS PM SYSTEM TEST${NC}"
echo "========================================"
echo ""

# Load VPS credentials
cd ~/supabase/docker
ANON_KEY=$(grep "^ANON_KEY=" .env | cut -d'=' -f2 | tr -d '"')
SERVICE_KEY=$(grep "^SERVICE_ROLE_KEY=" .env | cut -d'=' -f2 | tr -d '"')
API_URL="http://127.0.0.1:8000"

if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
  echo -e "${RED}ERROR: Could not load keys from ~/supabase/docker/.env${NC}"
  exit 1
fi

echo -e "${YELLOW}[1/6] Testing API Health...${NC}"
HEALTH=$(curl -s "$API_URL/auth/v1/health" -H "apikey: $ANON_KEY")
if echo "$HEALTH" | grep -q "GoTrue"; then
  echo -e "${GREEN}  ✓ Auth API healthy${NC}"
else
  echo -e "${RED}  ✗ Auth API issue: $HEALTH${NC}"
fi

echo ""
echo -e "${YELLOW}[2/6] Checking PM Master Key...${NC}"
PM_KEY=$(docker exec supabase-edge-functions printenv PM_MASTER_KEY 2>/dev/null || echo "")
if [ -n "$PM_KEY" ] && [ ${#PM_KEY} -ge 16 ]; then
  echo -e "${GREEN}  ✓ PM_MASTER_KEY is set (${#PM_KEY} chars)${NC}"
else
  echo -e "${RED}  ✗ PM_MASTER_KEY missing or too short!${NC}"
  echo "    Add it to ~/supabase/docker/.env and restart edge functions"
fi

echo ""
echo -e "${YELLOW}[3/6] Testing encrypt-pm endpoint...${NC}"
ENCRYPT_RESULT=$(curl -s -X POST "$API_URL/functions/v1/encrypt-pm" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"VPS test message","recipient_id":"00000000-0000-0000-0000-000000000001"}' \
  2>&1)

if echo "$ENCRYPT_RESULT" | grep -q '"success":true'; then
  echo -e "${GREEN}  ✓ encrypt-pm working${NC}"
  echo "    Response: $(echo "$ENCRYPT_RESULT" | head -c 100)..."
elif echo "$ENCRYPT_RESULT" | grep -q "Unauthorized"; then
  echo -e "${YELLOW}  ⚠ encrypt-pm requires real user auth (expected behavior)${NC}"
else
  echo -e "${RED}  ✗ encrypt-pm error: $ENCRYPT_RESULT${NC}"
fi

echo ""
echo -e "${YELLOW}[4/6] Testing decrypt-pm endpoint...${NC}"
DECRYPT_RESULT=$(curl -s -X POST "$API_URL/functions/v1/decrypt-pm" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messageId":"test-id"}' \
  2>&1)

if echo "$DECRYPT_RESULT" | grep -q '"success"'; then
  echo -e "${GREEN}  ✓ decrypt-pm endpoint responding${NC}"
elif echo "$DECRYPT_RESULT" | grep -q "not found\|Unauthorized"; then
  echo -e "${YELLOW}  ⚠ decrypt-pm responding (auth/lookup expected)${NC}"
else
  echo -e "${RED}  ✗ decrypt-pm error: $DECRYPT_RESULT${NC}"
fi

echo ""
echo -e "${YELLOW}[5/6] Checking private_messages table...${NC}"
PM_COUNT=$(curl -s "$API_URL/rest/v1/private_messages?select=count" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact" \
  -I 2>&1 | grep -i "content-range" | grep -oE "[0-9]+" | tail -1)

if [ -n "$PM_COUNT" ]; then
  echo -e "${GREEN}  ✓ private_messages table accessible ($PM_COUNT messages)${NC}"
else
  # Try alternate method
  PM_DATA=$(curl -s "$API_URL/rest/v1/private_messages?limit=1" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY")
  if echo "$PM_DATA" | grep -q "encrypted_content\|^\[\]$"; then
    echo -e "${GREEN}  ✓ private_messages table accessible${NC}"
  else
    echo -e "${RED}  ✗ Cannot access private_messages: $PM_DATA${NC}"
  fi
fi

echo ""
echo -e "${YELLOW}[6/6] Checking edge function logs...${NC}"
RECENT_PM=$(docker logs supabase-edge-functions --tail 30 2>&1 | grep -i "PM stored\|encrypt\|decrypt" | tail -5)
if [ -n "$RECENT_PM" ]; then
  echo -e "${GREEN}  ✓ Recent PM activity in logs:${NC}"
  echo "$RECENT_PM" | while read line; do echo "    $line"; done
else
  echo -e "${YELLOW}  ⚠ No recent PM activity in logs${NC}"
fi

echo ""
echo "========================================"
echo -e "${CYAN}  PM SYSTEM STATUS${NC}"
echo "========================================"
echo ""
echo "API URL: $API_URL"
echo "ANON_KEY: ${ANON_KEY:0:20}..."
echo ""
echo "To test with a real user session:"
echo "  1. Login to https://justachat.net"
echo "  2. Open browser DevTools > Network"
echo "  3. Click on a user to open PM window"
echo "  4. Send a message and check for encrypt-pm call"
echo "  5. Check logs: docker logs supabase-edge-functions --tail 20"
echo ""
