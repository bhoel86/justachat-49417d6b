#!/bin/bash
# VPS Cloud Contamination Check
# Verifies NO Lovable Cloud / supabase.co references exist
# Run: bash /var/www/justachat/public/vps-deploy/verify-no-cloud.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"
ISSUES=0

echo "========================================"
echo -e "${CYAN}  VPS CLOUD CONTAMINATION CHECK${NC}"
echo "========================================"
echo ""

cd "$DEPLOY_DIR"

# === 1. Check built frontend for supabase.co ===
echo -e "${YELLOW}[1/7] Checking built frontend for supabase.co...${NC}"
if [ -d "dist/assets" ]; then
  CLOUD_REFS=$(grep -l "supabase\.co" dist/assets/*.js 2>/dev/null || true)
  if [ -n "$CLOUD_REFS" ]; then
    echo -e "${RED}  ✗ FOUND supabase.co in built JS:${NC}"
    grep -o "https://[^\"']*supabase\.co[^\"']*" dist/assets/*.js 2>/dev/null | head -5
    ((ISSUES++))
  else
    echo -e "${GREEN}  ✓ No supabase.co in built assets${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠ dist/assets not found - run npm run build first${NC}"
fi

# === 2. Check for LOVABLE_API_KEY references ===
echo ""
echo -e "${YELLOW}[2/7] Checking for LOVABLE_API_KEY references...${NC}"
LOVABLE_KEY=$(grep -r "LOVABLE_API_KEY" src/ supabase/functions/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules || true)
if [ -n "$LOVABLE_KEY" ]; then
  echo -e "${RED}  ✗ FOUND LOVABLE_API_KEY references:${NC}"
  echo "$LOVABLE_KEY" | head -5
  ((ISSUES++))
else
  echo -e "${GREEN}  ✓ No LOVABLE_API_KEY references${NC}"
fi

# === 3. Check for chat-bot-cloud function calls ===
echo ""
echo -e "${YELLOW}[3/7] Checking for chat-bot-cloud function calls...${NC}"
BOT_CLOUD=$(grep -r "chat-bot-cloud" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "environment.ts" || true)
if [ -n "$BOT_CLOUD" ]; then
  echo -e "${RED}  ✗ FOUND chat-bot-cloud references:${NC}"
  echo "$BOT_CLOUD" | head -5
  ((ISSUES++))
else
  echo -e "${GREEN}  ✓ No hardcoded chat-bot-cloud calls${NC}"
fi

# === 4. Check frontend .env for cloud URLs ===
echo ""
echo -e "${YELLOW}[4/7] Checking frontend .env...${NC}"
if [ -f ".env" ]; then
  VITE_URL=$(grep "VITE_SUPABASE_URL" .env | head -1)
  echo "  $VITE_URL"
  if echo "$VITE_URL" | grep -q "supabase\.co"; then
    echo -e "${RED}  ✗ VITE_SUPABASE_URL points to supabase.co!${NC}"
    ((ISSUES++))
  elif echo "$VITE_URL" | grep -q "127.0.0.1\|localhost\|justachat"; then
    echo -e "${GREEN}  ✓ VITE_SUPABASE_URL points to local/VPS${NC}"
  else
    echo -e "${YELLOW}  ⚠ Verify URL is correct${NC}"
  fi
else
  echo -e "${RED}  ✗ .env file not found!${NC}"
  ((ISSUES++))
fi

# === 5. Check edge functions for cloud patterns ===
echo ""
echo -e "${YELLOW}[5/7] Checking edge functions source...${NC}"
EDGE_CLOUD=$(grep -r "supabase\.co\|lovable\.app" supabase/functions/ --include="*.ts" 2>/dev/null | grep -v "// comment" || true)
if [ -n "$EDGE_CLOUD" ]; then
  echo -e "${RED}  ✗ FOUND cloud URLs in edge functions:${NC}"
  echo "$EDGE_CLOUD" | head -5
  ((ISSUES++))
else
  echo -e "${GREEN}  ✓ No cloud URLs in edge functions source${NC}"
fi

# === 6. Check deployed edge functions (Docker volumes) ===
echo ""
echo -e "${YELLOW}[6/7] Checking deployed edge functions...${NC}"
FUNCTIONS_DIR="$HOME/supabase/docker/volumes/functions/main"
if [ -d "$FUNCTIONS_DIR" ]; then
  DEPLOYED_CLOUD=$(grep -r "supabase\.co" "$FUNCTIONS_DIR" --include="*.ts" 2>/dev/null || true)
  if [ -n "$DEPLOYED_CLOUD" ]; then
    echo -e "${RED}  ✗ FOUND supabase.co in deployed functions:${NC}"
    echo "$DEPLOYED_CLOUD" | head -5
    ((ISSUES++))
  else
    echo -e "${GREEN}  ✓ No cloud URLs in deployed functions${NC}"
  fi
  
  # Check chat-bot uses OpenAI not Lovable AI
  CHATBOT_FILE="$FUNCTIONS_DIR/chat-bot/index.ts"
  if [ -f "$CHATBOT_FILE" ]; then
    if grep -q "openai\.com\|api\.openai" "$CHATBOT_FILE"; then
      echo -e "${GREEN}  ✓ chat-bot uses OpenAI API${NC}"
    elif grep -q "LOVABLE_API_KEY\|lovable" "$CHATBOT_FILE"; then
      echo -e "${RED}  ✗ chat-bot still uses Lovable AI!${NC}"
      ((ISSUES++))
    fi
  fi
else
  echo -e "${YELLOW}  ⚠ Functions directory not found at $FUNCTIONS_DIR${NC}"
fi

# === 7. Verify VPS API endpoints are working ===
echo ""
echo -e "${YELLOW}[7/7] Testing VPS API health...${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/auth/v1/health 2>/dev/null || echo "FAILED")
if [ "$HEALTH" = "200" ]; then
  echo -e "${GREEN}  ✓ VPS Supabase API responding (port 8000)${NC}"
else
  echo -e "${RED}  ✗ VPS API not responding (got: $HEALTH)${NC}"
  ((ISSUES++))
fi

# === Summary ===
echo ""
echo "========================================"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}  ✓ VPS IS CLEAN - NO CLOUD CONTAMINATION${NC}"
  echo "========================================"
  echo ""
  echo "Your VPS is fully self-contained and not calling"
  echo "any Lovable Cloud or supabase.co services."
else
  echo -e "${RED}  ✗ FOUND $ISSUES ISSUE(S) - ACTION REQUIRED${NC}"
  echo "========================================"
  echo ""
  echo "To fix contamination issues:"
  echo "  1. Run: bash $DEPLOY_DIR/public/vps-deploy/safe-pull.sh"
  echo "  2. Rebuild: npm run build"
  echo "  3. Re-run this script to verify"
fi
echo ""
