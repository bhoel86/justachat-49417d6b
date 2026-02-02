#!/bin/bash
# VPS File Validator - Prevents Lovable Cloud files from overwriting VPS config
# Run: bash /var/www/justachat/public/vps-deploy/validate-before-deploy.sh
# Auto-runs before any git pull or deploy operation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"
VIOLATIONS=0
WARNINGS=0

echo "========================================"
echo "  VPS FILE VALIDATOR - Pre-Deploy Check"
echo "========================================"
echo ""

# Files that should NEVER be overwritten from git
PROTECTED_FILES=(
  ".env"
  ".env.local"
  "supabase/functions/chat-bot/index.ts"
)

# Patterns that indicate Lovable Cloud (should NOT be in VPS builds)
LOVABLE_PATTERNS=(
  "supabase\.co"
  "chat-bot-cloud"
  "LOVABLE_API_KEY"
  "lovable\.app"
  "hliytlezggzryetekpvo"
)

# Check for Lovable Cloud patterns in source files
# WHITELIST: Files that legitimately reference cloud patterns for detection/documentation
WHITELIST_FILES=(
  "src/lib/environment.ts"           # Environment detection logic - needs to check for supabase.co
  "src/pages/CookiePolicy.tsx"       # Documentation link to Supabase privacy policy
  "src/pages/Legal.tsx"              # Documentation links
  "public/vps-deploy/"               # VPS deploy scripts reference patterns to detect
)

echo -e "${YELLOW}[1/4] Scanning for Lovable Cloud patterns...${NC}"
for pattern in "${LOVABLE_PATTERNS[@]}"; do
  # Build grep exclude pattern for whitelisted files
  EXCLUDE_ARGS=""
  for wl in "${WHITELIST_FILES[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude-dir=node_modules --exclude-dir=.git"
  done
  
  matches=$(grep -r "$pattern" "$DEPLOY_DIR/src" "$DEPLOY_DIR/supabase/functions" 2>/dev/null | \
    grep -v node_modules | grep -v ".git" | \
    grep -v "environment.ts" | \
    grep -v "CookiePolicy.tsx" | \
    grep -v "Legal.tsx" | \
    grep -v "vps-deploy" | \
    head -20 || true)
  
  if [ -n "$matches" ]; then
    echo -e "${RED}❌ Found Lovable Cloud pattern: $pattern${NC}"
    echo "$matches" | head -5
    ((VIOLATIONS++))
  fi
done

if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✓ No Lovable Cloud patterns found in source${NC}"
fi

# Check .env points to VPS, not Cloud
echo ""
echo -e "${YELLOW}[2/4] Validating environment configuration...${NC}"
if [ -f "$DEPLOY_DIR/.env" ]; then
  if grep -q "supabase\.co" "$DEPLOY_DIR/.env"; then
    echo -e "${RED}❌ .env contains supabase.co URL - should be justachat.net${NC}"
    ((VIOLATIONS++))
  elif grep -q "justachat\.net\|127\.0\.0\.1\|localhost" "$DEPLOY_DIR/.env"; then
    echo -e "${GREEN}✓ .env correctly points to VPS${NC}"
  else
    echo -e "${YELLOW}⚠ .env URL unclear - please verify manually${NC}"
    ((WARNINGS++))
  fi
else
  echo -e "${YELLOW}⚠ No .env file found${NC}"
  ((WARNINGS++))
fi

# Check that VPS bot uses OpenAI, not Lovable gateway
echo ""
echo -e "${YELLOW}[3/4] Validating VPS chat-bot function...${NC}"
BOT_FILE="$DEPLOY_DIR/supabase/functions/chat-bot/index.ts"
if [ -f "$BOT_FILE" ]; then
  if grep -q "LOVABLE_API_KEY" "$BOT_FILE"; then
    echo -e "${RED}❌ chat-bot/index.ts uses LOVABLE_API_KEY - VPS should use OPENAI_API_KEY${NC}"
    ((VIOLATIONS++))
  elif grep -q "OPENAI_API_KEY" "$BOT_FILE"; then
    echo -e "${GREEN}✓ chat-bot correctly uses OpenAI for VPS${NC}"
  else
    echo -e "${YELLOW}⚠ chat-bot API key configuration unclear${NC}"
    ((WARNINGS++))
  fi
  
  if grep -q "chat-bot-cloud" "$BOT_FILE"; then
    echo -e "${RED}❌ chat-bot references chat-bot-cloud - possible contamination${NC}"
    ((VIOLATIONS++))
  fi
else
  echo -e "${YELLOW}⚠ chat-bot/index.ts not found${NC}"
  ((WARNINGS++))
fi

# Check frontend doesn't call cloud-only functions
echo ""
echo -e "${YELLOW}[4/4] Validating frontend function calls...${NC}"
CLOUD_CALLS=$(grep -r "chat-bot-cloud" "$DEPLOY_DIR/src" 2>/dev/null | grep -v node_modules || true)
if [ -n "$CLOUD_CALLS" ]; then
  echo -e "${RED}❌ Frontend calls chat-bot-cloud - VPS should call chat-bot${NC}"
  echo "$CLOUD_CALLS" | head -3
  ((VIOLATIONS++))
else
  echo -e "${GREEN}✓ Frontend uses correct VPS function endpoints${NC}"
fi

# Summary
echo ""
echo "========================================"
if [ $VIOLATIONS -gt 0 ]; then
  echo -e "${RED}❌ VALIDATION FAILED: $VIOLATIONS violation(s), $WARNINGS warning(s)${NC}"
  echo ""
  echo "Files contain Lovable Cloud references that would break VPS."
  echo "DO NOT deploy until these are fixed!"
  echo ""
  echo "Common fixes:"
  echo "  1. Revert chat-bot/index.ts to OpenAI version"
  echo "  2. Update useChatBots.ts to call 'chat-bot' not 'chat-bot-cloud'"
  echo "  3. Ensure .env uses https://justachat.net"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠ VALIDATION PASSED WITH WARNINGS: $WARNINGS warning(s)${NC}"
  echo "Review warnings above before deploying."
  exit 0
else
  echo -e "${GREEN}✓ VALIDATION PASSED - Safe to deploy${NC}"
  exit 0
fi
