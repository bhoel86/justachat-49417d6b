#!/bin/bash
# JustAChat VPS - Check Cloud Didn't Overwrite Your Database
# Run: sudo bash /var/www/justachat/public/vps-deploy/check-no-cloud-overwrite.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "========================================"
echo -e "${CYAN}  VPS INTEGRITY CHECK${NC}"
echo "  Did Lovable Cloud overwrite anything?"
echo "========================================"
echo ""

ISSUES=0

# 1. Check frontend .env
echo -e "${YELLOW}[1/6] Frontend .env${NC}"
ENV_FILE="/var/www/justachat/.env"
if [ -f "$ENV_FILE" ]; then
  URL=$(grep 'VITE_SUPABASE_URL' "$ENV_FILE" | head -1)
  KEY=$(grep 'VITE_SUPABASE_PUBLISHABLE_KEY' "$ENV_FILE" | head -1)
  echo "  $URL"
  if echo "$URL" | grep -q "supabase\.co\|lovable"; then
    echo -e "  ${RED}✗ PROBLEM: Points to Cloud, not VPS!${NC}"
    ((ISSUES++))
  else
    echo -e "  ${GREEN}✓ Points to VPS${NC}"
  fi
  if echo "$KEY" | grep -q "hliytlezggzryetekpvo"; then
    echo -e "  ${RED}✗ PROBLEM: Using Lovable Cloud anon key!${NC}"
    ((ISSUES++))
  else
    echo -e "  ${GREEN}✓ Anon key is not Cloud key${NC}"
  fi
else
  echo -e "  ${RED}✗ .env not found!${NC}"
  ((ISSUES++))
fi

# 2. Check backend .env
echo ""
echo -e "${YELLOW}[2/6] Backend .env${NC}"
BACKEND_ENV="/root/supabase/docker/.env"
if [ -f "$BACKEND_ENV" ]; then
  BE_URL=$(grep '^API_EXTERNAL_URL=' "$BACKEND_ENV" | head -1)
  echo "  $BE_URL"
  if echo "$BE_URL" | grep -q "justachat"; then
    echo -e "  ${GREEN}✓ Backend API URL correct${NC}"
  else
    echo -e "  ${YELLOW}⚠ Verify backend URL${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠ Cannot read backend .env (try with sudo)${NC}"
fi

# 3. Check built JS for cloud URLs
echo ""
echo -e "${YELLOW}[3/6] Built JS assets${NC}"
if [ -d "/var/www/justachat/dist/assets" ]; then
  CLOUD_IN_JS=$(grep -l "hliytlezggzryetekpvo\|supabase\.co" /var/www/justachat/dist/assets/*.js 2>/dev/null || true)
  if [ -n "$CLOUD_IN_JS" ]; then
    echo -e "  ${RED}✗ PROBLEM: Built JS contains Cloud URLs!${NC}"
    echo "  Files: $CLOUD_IN_JS"
    echo "  You need to rebuild: npm run build"
    ((ISSUES++))
  else
    echo -e "  ${GREEN}✓ No Cloud URLs in built JS${NC}"
  fi
else
  echo -e "  ${RED}✗ dist/assets not found - site not built${NC}"
  ((ISSUES++))
fi

# 4. Check Docker is running
echo ""
echo -e "${YELLOW}[4/6] Supabase Docker containers${NC}"
DB_RUNNING=$(docker ps --filter "name=supabase-db" --format "{{.Status}}" 2>/dev/null || echo "FAILED")
AUTH_RUNNING=$(docker ps --filter "name=supabase-auth" --format "{{.Status}}" 2>/dev/null || echo "FAILED")
KONG_RUNNING=$(docker ps --filter "name=supabase-kong" --format "{{.Status}}" 2>/dev/null || echo "FAILED")

if [ -n "$DB_RUNNING" ] && [ "$DB_RUNNING" != "FAILED" ]; then
  echo -e "  ${GREEN}✓ supabase-db: $DB_RUNNING${NC}"
else
  echo -e "  ${RED}✗ supabase-db not running!${NC}"
  ((ISSUES++))
fi
if [ -n "$AUTH_RUNNING" ] && [ "$AUTH_RUNNING" != "FAILED" ]; then
  echo -e "  ${GREEN}✓ supabase-auth: $AUTH_RUNNING${NC}"
else
  echo -e "  ${RED}✗ supabase-auth not running!${NC}"
  ((ISSUES++))
fi
if [ -n "$KONG_RUNNING" ] && [ "$KONG_RUNNING" != "FAILED" ]; then
  echo -e "  ${GREEN}✓ supabase-kong: $KONG_RUNNING${NC}"
else
  echo -e "  ${RED}✗ supabase-kong not running!${NC}"
  ((ISSUES++))
fi

# 5. Check YOUR users exist in DB
echo ""
echo -e "${YELLOW}[5/6] VPS User Database${NC}"
USER_LIST=$(docker exec supabase-db psql -U supabase_admin -d postgres -t -c \
  "SELECT username FROM public.profiles ORDER BY created_at LIMIT 20;" 2>/dev/null || echo "QUERY_FAILED")

if [ "$USER_LIST" = "QUERY_FAILED" ]; then
  echo -e "  ${RED}✗ Cannot query database${NC}"
  ((ISSUES++))
else
  USER_COUNT=$(docker exec supabase-db psql -U supabase_admin -d postgres -t -c \
    "SELECT COUNT(*) FROM public.profiles;" 2>/dev/null | tr -d ' ')
  echo -e "  Total profiles: ${CYAN}$USER_COUNT${NC}"
  echo "  First 20 usernames:"
  echo "$USER_LIST" | head -20
  
  # Check for known VPS users
  HAS_UNIX=$(docker exec supabase-db psql -U supabase_admin -d postgres -t -c \
    "SELECT COUNT(*) FROM public.profiles WHERE username = 'Unix';" 2>/dev/null | tr -d ' ')
  if [ "$HAS_UNIX" = "1" ]; then
    echo -e "  ${GREEN}✓ Owner account 'Unix' exists${NC}"
  else
    echo -e "  ${RED}✗ Owner account 'Unix' NOT FOUND - database may be wrong!${NC}"
    ((ISSUES++))
  fi
fi

# 6. Check auth endpoint responds
echo ""
echo -e "${YELLOW}[6/6] Auth endpoint${NC}"
AUTH_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/auth/v1/health 2>/dev/null || echo "FAILED")
if [ "$AUTH_HEALTH" = "200" ]; then
  echo -e "  ${GREEN}✓ Auth endpoint healthy (200)${NC}"
else
  echo -e "  ${RED}✗ Auth endpoint returned: $AUTH_HEALTH${NC}"
  ((ISSUES++))
fi

# Can you actually login?
LOGIN_TEST=$(curl -s -X POST http://127.0.0.1:8000/auth/v1/token?grant_type=password \
  -H "apikey: $(grep '^ANON_KEY=' /root/supabase/docker/.env 2>/dev/null | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"email":"unix@justachat.net","password":"634103258"}' 2>/dev/null || echo '{"error":"curl failed"}')

if echo "$LOGIN_TEST" | grep -q "access_token"; then
  echo -e "  ${GREEN}✓ Login works! Got access token${NC}"
elif echo "$LOGIN_TEST" | grep -q "Invalid login"; then
  echo -e "  ${YELLOW}⚠ Auth works but credentials wrong (expected if password differs)${NC}"
else
  echo -e "  ${RED}✗ Login failed: $(echo "$LOGIN_TEST" | head -c 200)${NC}"
  ((ISSUES++))
fi

# Summary
echo ""
echo "========================================"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}  ✓ ALL CLEAR - VPS is intact, no Cloud overwrite${NC}"
else
  echo -e "${RED}  ✗ FOUND $ISSUES ISSUE(S)${NC}"
  echo ""
  echo "  Common fixes:"
  echo "  1. Fix .env: sed -i 's|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=https://justachat.net|' /var/www/justachat/.env"
  echo "  2. Sync anon key: Copy ANON_KEY from /root/supabase/docker/.env to VITE_SUPABASE_PUBLISHABLE_KEY"
  echo "  3. Rebuild: cd /var/www/justachat && rm -rf dist && npm run build"
  echo "  4. Restart stack: cd /root/supabase/docker && docker compose --env-file .env down --remove-orphans && docker compose --env-file .env up -d"
fi
echo "========================================"
