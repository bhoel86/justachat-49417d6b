#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - EDGE FUNCTION & CAPTCHA HEALTH CHECK
# Validates edge function routing, CAPTCHA verification, and required env vars
#
# Usage: bash /var/www/justachat/public/vps-deploy/edge-health-check.sh
#===============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SUPABASE_DIR="/home/unix/supabase/docker"
FUNCTIONS_DIR="$SUPABASE_DIR/volumes/functions"

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILURES=$((FAILURES+1)); }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }

FAILURES=0

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        EDGE FUNCTION & CAPTCHA HEALTH CHECK                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

#-------------------------------------------------------------------------------
# 1. Check required environment variables in container
#-------------------------------------------------------------------------------
echo "=== 1. Container Environment Variables ==="

if docker ps --format '{{.Names}}' | grep -q "^supabase-edge-functions$"; then
  pass "Edge functions container is running"
  
  # Check TURNSTILE_SECRET_KEY
  TURNSTILE_CHECK=$(docker exec supabase-edge-functions printenv TURNSTILE_SECRET_KEY 2>/dev/null || echo "")
  if [ -n "$TURNSTILE_CHECK" ] && [ "$TURNSTILE_CHECK" != '""' ]; then
    pass "TURNSTILE_SECRET_KEY is set (${#TURNSTILE_CHECK} chars)"
  else
    fail "TURNSTILE_SECRET_KEY is NOT set in container"
  fi
  
  # Check SUPABASE_URL
  SUPA_URL_CHECK=$(docker exec supabase-edge-functions printenv SUPABASE_URL 2>/dev/null || echo "")
  if [ -n "$SUPA_URL_CHECK" ]; then
    pass "SUPABASE_URL is set: $SUPA_URL_CHECK"
  else
    fail "SUPABASE_URL is NOT set in container"
  fi
  
  # Check SUPABASE_SERVICE_ROLE_KEY
  SERVICE_KEY_CHECK=$(docker exec supabase-edge-functions printenv SUPABASE_SERVICE_ROLE_KEY 2>/dev/null || echo "")
  if [ -n "$SERVICE_KEY_CHECK" ]; then
    pass "SUPABASE_SERVICE_ROLE_KEY is set (${#SERVICE_KEY_CHECK} chars)"
  else
    fail "SUPABASE_SERVICE_ROLE_KEY is NOT set in container"
  fi
else
  fail "Edge functions container is NOT running"
fi

echo ""

#-------------------------------------------------------------------------------
# 2. Check main router file exists and has correct structure
#-------------------------------------------------------------------------------
echo "=== 2. Edge Function Router (main/index.ts) ==="

MAIN_INDEX="$FUNCTIONS_DIR/main/index.ts"
if [ -f "$MAIN_INDEX" ]; then
  pass "main/index.ts exists"
  
  # Check if it has the dynamic import pattern (router behavior)
  if grep -q "Deno.serve" "$MAIN_INDEX" && grep -q "import(" "$MAIN_INDEX"; then
    pass "Router uses dynamic imports (correct pattern)"
  elif grep -q "healthy" "$MAIN_INDEX" && ! grep -q "import(" "$MAIN_INDEX"; then
    warn "main/index.ts appears to be static health check only - may not route correctly"
  else
    warn "main/index.ts structure unclear - verify manually"
  fi
  
  # Check file ownership
  OWNER=$(stat -c '%U' "$MAIN_INDEX" 2>/dev/null || echo "unknown")
  if [ "$OWNER" = "unix" ] || [ "$OWNER" = "1000" ]; then
    pass "File ownership is correct ($OWNER)"
  else
    warn "File owned by $OWNER - should be unix/1000"
  fi
else
  fail "main/index.ts does NOT exist at $MAIN_INDEX"
fi

echo ""

#-------------------------------------------------------------------------------
# 3. Check verify-captcha function exists
#-------------------------------------------------------------------------------
echo "=== 3. Verify-Captcha Function ==="

CAPTCHA_INDEX="$FUNCTIONS_DIR/verify-captcha/index.ts"
if [ -f "$CAPTCHA_INDEX" ]; then
  pass "verify-captcha/index.ts exists"
  
  # Check for Turnstile verification code
  if grep -q "challenges.cloudflare.com" "$CAPTCHA_INDEX"; then
    pass "Function contains Cloudflare Turnstile verification"
  else
    warn "Function may not have Cloudflare verification code"
  fi
else
  fail "verify-captcha/index.ts does NOT exist"
fi

echo ""

#-------------------------------------------------------------------------------
# 4. Test edge function routing (direct to port 9000)
#-------------------------------------------------------------------------------
echo "=== 4. Direct Edge Runtime Test (Port 9000) ==="

DIRECT_RESPONSE=$(curl -s -X POST "http://127.0.0.1:9000/verify-captcha" \
  -H "Content-Type: application/json" \
  -d '{"token":"health-check-test"}' \
  --max-time 10 2>/dev/null || echo "CURL_FAILED")

if [ "$DIRECT_RESPONSE" = "CURL_FAILED" ]; then
  fail "Could not connect to edge runtime on port 9000"
elif echo "$DIRECT_RESPONSE" | grep -q '"healthy"'; then
  fail "Router returned health check instead of dispatching to verify-captcha"
  info "Response: $DIRECT_RESPONSE"
elif echo "$DIRECT_RESPONSE" | grep -q '"success"'; then
  pass "verify-captcha function responded correctly"
  if echo "$DIRECT_RESPONSE" | grep -q '"invalid-input-response"'; then
    pass "Cloudflare API integration working (expected test failure)"
  elif echo "$DIRECT_RESPONSE" | grep -q '"error":"CAPTCHA verification not configured"'; then
    fail "TURNSTILE_SECRET_KEY not reaching the function"
  fi
  info "Response: $DIRECT_RESPONSE"
else
  warn "Unexpected response from edge runtime"
  info "Response: $DIRECT_RESPONSE"
fi

echo ""

#-------------------------------------------------------------------------------
# 5. Test through Kong gateway (port 8000)
#-------------------------------------------------------------------------------
echo "=== 5. Kong Gateway Test (Port 8000) ==="

if [ -f "$SUPABASE_DIR/.env" ]; then
  ANON_KEY=$(grep '^ANON_KEY=' "$SUPABASE_DIR/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")
  
  if [ -n "$ANON_KEY" ]; then
    KONG_RESPONSE=$(curl -s -X POST "http://127.0.0.1:8000/functions/v1/verify-captcha" \
      -H "Content-Type: application/json" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ANON_KEY" \
      -d '{"token":"health-check-test"}' \
      --max-time 10 2>/dev/null || echo "CURL_FAILED")
    
    if [ "$KONG_RESPONSE" = "CURL_FAILED" ]; then
      fail "Could not connect to Kong gateway on port 8000"
    elif echo "$KONG_RESPONSE" | grep -q '"healthy"'; then
      fail "Kong route returned health check instead of verify-captcha"
    elif echo "$KONG_RESPONSE" | grep -q '"success"'; then
      pass "Kong gateway routing to verify-captcha works"
      info "Response: $KONG_RESPONSE"
    elif echo "$KONG_RESPONSE" | grep -q '"message":"Invalid API key"'; then
      fail "Kong rejected ANON_KEY - keys may be out of sync"
    else
      warn "Unexpected response from Kong"
      info "Response: $KONG_RESPONSE"
    fi
  else
    fail "ANON_KEY not found in .env"
  fi
else
  fail "$SUPABASE_DIR/.env not found"
fi

echo ""

#-------------------------------------------------------------------------------
# 6. Test external HTTPS access (through Nginx)
#-------------------------------------------------------------------------------
echo "=== 6. External HTTPS Test ==="

if [ -n "${ANON_KEY:-}" ]; then
  HTTPS_RESPONSE=$(curl -s -X POST "https://justachat.net/functions/v1/verify-captcha" \
    -H "Content-Type: application/json" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ANON_KEY" \
    -d '{"token":"health-check-test"}' \
    --max-time 15 2>/dev/null || echo "CURL_FAILED")
  
  if [ "$HTTPS_RESPONSE" = "CURL_FAILED" ]; then
    warn "Could not connect via HTTPS (may be network/SSL issue)"
  elif echo "$HTTPS_RESPONSE" | grep -q '"success"'; then
    pass "External HTTPS routing works"
  else
    warn "External access returned unexpected response"
    info "Response: ${HTTPS_RESPONSE:0:200}"
  fi
else
  warn "Skipping HTTPS test (no ANON_KEY)"
fi

echo ""

#-------------------------------------------------------------------------------
# 7. Check docker-compose.yml has correct command
#-------------------------------------------------------------------------------
echo "=== 7. Docker Compose Configuration ==="

COMPOSE_FILE="$SUPABASE_DIR/docker-compose.yml"
if [ -f "$COMPOSE_FILE" ]; then
  if grep -q "\-\-main-service" "$COMPOSE_FILE"; then
    pass "docker-compose.yml has --main-service flag"
  else
    fail "docker-compose.yml missing --main-service flag"
    info "Edge functions may not route correctly after restart"
  fi
else
  fail "docker-compose.yml not found"
fi

echo ""

#-------------------------------------------------------------------------------
# 8. Check functions .env file
#-------------------------------------------------------------------------------
echo "=== 8. Functions Environment File ==="

FUNC_ENV="$FUNCTIONS_DIR/.env"
if [ -f "$FUNC_ENV" ]; then
  pass "Functions .env exists"
  
  if grep -q "TURNSTILE_SECRET_KEY=" "$FUNC_ENV"; then
    TURNSTILE_VALUE=$(grep "TURNSTILE_SECRET_KEY=" "$FUNC_ENV" | cut -d= -f2-)
    if [ -n "$TURNSTILE_VALUE" ] && [ "$TURNSTILE_VALUE" != '""' ]; then
      pass "TURNSTILE_SECRET_KEY defined in functions .env"
    else
      fail "TURNSTILE_SECRET_KEY is empty in functions .env"
    fi
  else
    fail "TURNSTILE_SECRET_KEY not in functions .env"
  fi
else
  fail "Functions .env not found at $FUNC_ENV"
fi

echo ""

#-------------------------------------------------------------------------------
# Summary
#-------------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════════════╗"
if [ $FAILURES -eq 0 ]; then
  echo -e "║  ${GREEN}ALL CHECKS PASSED${NC}                                          ║"
else
  echo -e "║  ${RED}$FAILURES CHECK(S) FAILED${NC}                                          ║"
fi
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ $FAILURES -gt 0 ]; then
  echo "Troubleshooting tips:"
  echo "  1. Restart edge functions: cd ~/supabase/docker && docker compose restart functions"
  echo "  2. Check container logs: docker logs supabase-edge-functions --tail 50"
  echo "  3. Verify .env files have correct values"
  echo "  4. Run full rebuild if issues persist: bash /var/www/justachat/public/vps-deploy/rebuild-vps-v2.sh"
  echo ""
  exit 1
fi

exit 0
