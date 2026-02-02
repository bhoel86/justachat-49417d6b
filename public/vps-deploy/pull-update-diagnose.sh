#!/bin/bash
# JustAChat VPS - Pull, Update & Diagnose
# Usage: bash /var/www/justachat/public/vps-deploy/pull-update-diagnose.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/var/www/justachat"

echo "============================================"
echo "  JUSTACHAT - PULL, UPDATE & DIAGNOSE"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

cd "$PROJECT_DIR"

# Stage 1: Git Pull
echo -e "${CYAN}[1/5] Pulling latest from GitHub...${NC}"
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}✓ Git pull complete${NC}"
echo ""

# Stage 2: Run Update Script
echo -e "${CYAN}[2/5] Running update script...${NC}"
if [ -f "public/vps-deploy/update-vps.sh" ]; then
  bash public/vps-deploy/update-vps.sh
else
  echo -e "${YELLOW}⚠ update-vps.sh not found, running manual build${NC}"
  npm install --legacy-peer-deps
  rm -rf dist node_modules/.vite .vite 2>/dev/null || true
  npm run build
fi
echo ""

# Stage 3: Validation Check
echo -e "${CYAN}[3/5] Running validator...${NC}"
if [ -f "public/vps-deploy/validate-before-deploy.sh" ]; then
  bash public/vps-deploy/validate-before-deploy.sh || true
fi
echo ""

# Stage 4: Service Health Checks
echo -e "${CYAN}[4/5] Checking services...${NC}"
echo ""

echo "Frontend (HTTPS):"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" == "200" ]; then
  echo -e "  ${GREEN}✓ https://justachat.net - HTTP $HTTP_CODE${NC}"
else
  echo -e "  ${RED}✗ https://justachat.net - HTTP $HTTP_CODE${NC}"
fi

echo ""
echo "Supabase API:"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/rest/v1/ 2>/dev/null || echo "000")
if [ "$API_CODE" == "200" ] || [ "$API_CODE" == "401" ]; then
  echo -e "  ${GREEN}✓ REST API - HTTP $API_CODE${NC}"
else
  echo -e "  ${RED}✗ REST API - HTTP $API_CODE${NC}"
fi

echo ""
echo "Edge Functions:"

# Test chat-bot
CHAT_BOT=$(curl -s -X POST https://justachat.net/functions/v1/chat-bot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY ~/supabase/docker/.env 2>/dev/null | cut -d'=' -f2 || echo '')" \
  -d '{"message":"test","botId":"test","channelName":"test"}' 2>/dev/null | head -c 100)
if echo "$CHAT_BOT" | grep -q '"reply"'; then
  echo -e "  ${GREEN}✓ chat-bot - Working${NC}"
elif echo "$CHAT_BOT" | grep -q 'error\|Error\|missing'; then
  echo -e "  ${YELLOW}⚠ chat-bot - $CHAT_BOT${NC}"
else
  echo -e "  ${RED}✗ chat-bot - No response${NC}"
fi

# Test ai-moderator
AI_MOD=$(curl -s -X POST https://justachat.net/functions/v1/ai-moderator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY ~/supabase/docker/.env 2>/dev/null | cut -d'=' -f2 || echo '')" \
  -d '{"message":"hello world","username":"test"}' 2>/dev/null | head -c 100)
if echo "$AI_MOD" | grep -q '"safe"'; then
  echo -e "  ${GREEN}✓ ai-moderator - Working${NC}"
elif echo "$AI_MOD" | grep -q 'error\|Error'; then
  echo -e "  ${YELLOW}⚠ ai-moderator - $AI_MOD${NC}"
else
  echo -e "  ${RED}✗ ai-moderator - No response${NC}"
fi

# Test translate-message
TRANSLATE=$(curl -s -X POST https://justachat.net/functions/v1/translate-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(grep SUPABASE_ANON_KEY ~/supabase/docker/.env 2>/dev/null | cut -d'=' -f2 || echo '')" \
  -d '{"text":"hello","targetLanguage":"es"}' 2>/dev/null | head -c 100)
if echo "$TRANSLATE" | grep -q '"translatedText"'; then
  echo -e "  ${GREEN}✓ translate-message - Working${NC}"
elif echo "$TRANSLATE" | grep -q 'error\|Error'; then
  echo -e "  ${YELLOW}⚠ translate-message - $TRANSLATE${NC}"
else
  echo -e "  ${RED}✗ translate-message - No response${NC}"
fi

echo ""

# Stage 5: Environment Check
echo -e "${CYAN}[5/5] Environment configuration...${NC}"
echo ""
if [ -f "$PROJECT_DIR/.env" ]; then
  echo ".env contents:"
  cat "$PROJECT_DIR/.env" | sed 's/\(KEY=\).*/\1[HIDDEN]/'
else
  echo -e "${RED}✗ No .env file found${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}  DIAGNOSIS COMPLETE${NC}"
echo "============================================"
echo ""
echo "Visit: https://justachat.net"
echo ""
