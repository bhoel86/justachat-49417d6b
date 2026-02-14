#!/bin/bash
# JAC IRC Bridge Setup Script
# Run: sudo bash /var/www/justachat/public/vps-deploy/setup-irc-bridge.sh
#
# This script:
# 1. Copies the irc-gateway edge function to the correct location
# 2. Installs and starts the IRC-to-HTTP bridge on port 6667
# 3. Opens firewall ports
# 4. Sets up pm2 for auto-restart

set -e

echo "============================================"
echo "  JAC IRC Bridge Setup"
echo "  $(date)"
echo "============================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="/var/www/justachat"
DOCKER_DIR="/root/supabase/docker"
FUNC_DIR="$DOCKER_DIR/volumes/functions"

# ============================================
# 1. Fix IRC Gateway Edge Function Location
# ============================================
echo -e "${YELLOW}[1/6] Fixing IRC Gateway Edge Function location...${NC}"

if [ -d "$FUNC_DIR/irc-gateway" ]; then
  echo "  Found irc-gateway at: $FUNC_DIR/irc-gateway"
  
  # Copy to main/ service directory (required by VPS router)
  mkdir -p "$FUNC_DIR/main/irc-gateway"
  cp -f "$FUNC_DIR/irc-gateway/index.ts" "$FUNC_DIR/main/irc-gateway/index.ts"
  echo -e "  ${GREEN}✓ Copied to $FUNC_DIR/main/irc-gateway/index.ts${NC}"
elif [ -f "$APP_DIR/supabase/functions/irc-gateway/index.ts" ]; then
  echo "  Found irc-gateway in app source"
  mkdir -p "$FUNC_DIR/main/irc-gateway"
  cp -f "$APP_DIR/supabase/functions/irc-gateway/index.ts" "$FUNC_DIR/main/irc-gateway/index.ts"
  echo -e "  ${GREEN}✓ Copied from app source to functions volume${NC}"
else
  echo -e "  ${RED}✗ Cannot find irc-gateway/index.ts anywhere!${NC}"
  echo "  Make sure the edge function exists in the codebase"
fi

# ============================================
# 2. Patch the function for VPS compatibility
# ============================================
echo ""
echo -e "${YELLOW}[2/6] Patching irc-gateway for VPS Deno router...${NC}"

GATEWAY_FILE="$FUNC_DIR/main/irc-gateway/index.ts"
if [ -f "$GATEWAY_FILE" ]; then
  # Remove std/http/server imports (breaks VPS router)
  sed -i 's|import.*from.*"https://deno.land/std.*/http/server.*";||g' "$GATEWAY_FILE"
  echo -e "  ${GREEN}✓ Patched imports${NC}"
else
  echo -e "  ${RED}✗ Gateway file not found for patching${NC}"
fi

# ============================================
# 3. Restart Edge Functions container
# ============================================
echo ""
echo -e "${YELLOW}[3/6] Cold-restarting Edge Functions container...${NC}"

cd "$DOCKER_DIR"
docker compose stop functions 2>/dev/null || docker-compose stop functions 2>/dev/null
docker compose up -d functions 2>/dev/null || docker-compose up -d functions 2>/dev/null
sleep 3

FUNC_STATUS=$(docker ps --format "{{.Names}}\t{{.Status}}" | grep -i "functions")
if [ -n "$FUNC_STATUS" ]; then
  echo -e "  ${GREEN}✓ Functions container: $FUNC_STATUS${NC}"
else
  echo -e "  ${RED}✗ Functions container failed to start!${NC}"
fi

# ============================================
# 4. Test Edge Function is responding
# ============================================
echo ""
echo -e "${YELLOW}[4/6] Testing Edge Function endpoint...${NC}"

ANON_KEY=$(grep "^ANON_KEY=" "$DOCKER_DIR/.env" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
if [ -z "$ANON_KEY" ]; then
  ANON_KEY=$(grep "^SUPABASE_ANON_KEY=" "$DOCKER_DIR/.env" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
fi
if [ -z "$ANON_KEY" ]; then
  ANON_KEY=$(grep "^VITE_SUPABASE_PUBLISHABLE_KEY=" "$APP_DIR/.env" 2>/dev/null | cut -d'=' -f2 | tr -d '"')
fi

if [ -n "$ANON_KEY" ]; then
  sleep 2
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "apikey: $ANON_KEY" \
    -d '{"command":"PING","args":"test"}' \
    "http://127.0.0.1:8000/functions/v1/irc-gateway" 2>&1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ Edge Function responding (HTTP 200)${NC}"
  else
    echo -e "  ${RED}✗ Edge Function returned HTTP $HTTP_CODE${NC}"
    echo "  ANON_KEY starts with: ${ANON_KEY:0:20}..."
    echo "  Check if the key matches between Docker .env and app .env"
  fi
else
  echo -e "  ${RED}✗ Could not find ANON_KEY in any .env file${NC}"
fi

# ============================================
# 5. Install and start IRC Bridge
# ============================================
echo ""
echo -e "${YELLOW}[5/6] Setting up IRC Bridge (TCP port 6667 → Edge Function)...${NC}"

# Kill anything on port 6667
if ss -tlnp | grep -q ':6667'; then
  echo "  Killing existing process on port 6667..."
  fuser -k 6667/tcp 2>/dev/null || true
  sleep 1
fi

# Install pm2 if needed
if ! command -v pm2 &>/dev/null; then
  echo "  Installing pm2..."
  npm install -g pm2
fi

# Stop existing bridge if running
pm2 stop jac-irc-bridge 2>/dev/null || true
pm2 delete jac-irc-bridge 2>/dev/null || true

# Export the ANON_KEY for the bridge
BRIDGE_SCRIPT="$APP_DIR/public/vps-deploy/irc-bridge.js"

if [ -f "$BRIDGE_SCRIPT" ]; then
  echo "  Starting IRC bridge with pm2..."
  ANON_KEY="$ANON_KEY" pm2 start "$BRIDGE_SCRIPT" \
    --name jac-irc-bridge \
    --env production \
    -- 2>&1 | tail -5
  
  pm2 save 2>/dev/null || true
  
  sleep 2
  
  if pm2 list | grep -q "jac-irc-bridge.*online"; then
    echo -e "  ${GREEN}✓ IRC Bridge running on port 6667${NC}"
  else
    echo -e "  ${RED}✗ IRC Bridge failed to start${NC}"
    echo "  Checking logs..."
    pm2 logs jac-irc-bridge --lines 10 --nostream
  fi
else
  echo -e "  ${RED}✗ Bridge script not found at $BRIDGE_SCRIPT${NC}"
  echo "  Run: cd $APP_DIR && git pull origin main"
fi

# ============================================
# 6. Open firewall ports
# ============================================
echo ""
echo -e "${YELLOW}[6/6] Configuring firewall...${NC}"

if command -v ufw &>/dev/null; then
  ufw allow 6667/tcp comment "JAC IRC" 2>/dev/null || true
  ufw allow 6697/tcp comment "JAC IRC SSL" 2>/dev/null || true
  echo -e "  ${GREEN}✓ Firewall rules added for ports 6667 and 6697${NC}"
else
  echo "  UFW not installed, checking iptables..."
  iptables -I INPUT -p tcp --dport 6667 -j ACCEPT 2>/dev/null || true
  iptables -I INPUT -p tcp --dport 6697 -j ACCEPT 2>/dev/null || true
  echo -e "  ${GREEN}✓ iptables rules added${NC}"
fi

# ============================================
# Final verification
# ============================================
echo ""
echo "============================================"
echo -e "  ${GREEN}SETUP COMPLETE${NC}"
echo "============================================"
echo ""

# Quick port check
if ss -tlnp | grep -q ':6667'; then
  echo -e "${GREEN}✓ Port 6667 is now LISTENING${NC}"
  ss -tlnp | grep ':6667'
else
  echo -e "${RED}✗ Port 6667 still not listening - check pm2 logs:${NC}"
  echo "  pm2 logs jac-irc-bridge --lines 20"
fi

echo ""
echo "mIRC Connection Settings:"
echo "  Address: 24.199.122.60"
echo "  Port:    6667"
echo "  Password: youremail@example.com;yourpassword"
echo ""
echo "Useful commands:"
echo "  pm2 logs jac-irc-bridge         - View bridge logs"
echo "  pm2 restart jac-irc-bridge      - Restart bridge"
echo "  pm2 stop jac-irc-bridge         - Stop bridge"
echo "  sudo bash $APP_DIR/public/vps-deploy/diagnose-irc-gateway.sh - Run diagnostics again"
echo ""
