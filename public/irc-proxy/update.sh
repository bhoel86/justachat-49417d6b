#!/bin/bash
# ============================================
# JAC IRC Proxy - Update Script
# ============================================
#
# Usage: curl -fsSL https://justachat.net/irc-proxy/update.sh | bash
#
# This script will:
#   1. Backup current configuration
#   2. Download latest proxy files
#   3. Rebuild and restart the proxy
#   4. Preserve your .env settings and admin token
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_URL="https://justachat.net/irc-proxy"
INSTALL_DIR="/opt/justachat-irc"

echo -e "${CYAN}"
echo "============================================"
echo "   JAC IRC Proxy - Updater v1.0"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run as root: sudo bash update.sh${NC}"
  exit 1
fi

# Check if installation exists
if [ ! -d "$INSTALL_DIR" ]; then
  echo -e "${RED}[ERROR] No installation found at $INSTALL_DIR${NC}"
  echo -e "${YELLOW}Run the installer first:${NC}"
  echo -e "  curl -fsSL https://justachat.net/irc-proxy/install.sh | bash"
  exit 1
fi

cd "$INSTALL_DIR"

echo -e "${BLUE}[1/5] Backing up configuration...${NC}"

# Backup .env file
if [ -f ".env" ]; then
  cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
  echo -e "${GREEN}✓ Configuration backed up${NC}"
  
  # Extract current admin token for display later
  ADMIN_TOKEN=$(grep "^ADMIN_TOKEN=" .env | cut -d'=' -f2)
else
  echo -e "${YELLOW}No .env file found - will create new one${NC}"
fi

echo -e "${BLUE}[2/5] Stopping proxy...${NC}"

docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Proxy stopped${NC}"

echo -e "${BLUE}[3/5] Downloading latest files...${NC}"

# Files to update (excluding .env which we preserve)
UPDATE_FILES=("proxy.js" "package.json" "Dockerfile" "docker-compose.yml")

for file in "${UPDATE_FILES[@]}"; do
  # Backup existing file
  if [ -f "$file" ]; then
    mv "$file" "${file}.old" 2>/dev/null || true
  fi
  
  # Download new version
  echo -e "  Updating ${file}..."
  if curl -fsSL -o "$file" "${BASE_URL}/${file}"; then
    echo -e "  ${GREEN}✓ ${file}${NC}"
    rm -f "${file}.old" 2>/dev/null || true
  else
    echo -e "  ${RED}✗ Failed to download ${file}${NC}"
    # Restore old file
    if [ -f "${file}.old" ]; then
      mv "${file}.old" "$file"
      echo -e "  ${YELLOW}Restored previous ${file}${NC}"
    fi
  fi
done

# Verify proxy.js is a file
if [ -d "proxy.js" ]; then
  rm -rf proxy.js
  curl -fsSL -o proxy.js "${BASE_URL}/proxy.js"
fi

echo -e "${GREEN}✓ Files updated${NC}"

echo -e "${BLUE}[4/5] Rebuilding Docker image...${NC}"

# Remove old image to force rebuild
docker-compose build --no-cache
echo -e "${GREEN}✓ Image rebuilt${NC}"

echo -e "${BLUE}[5/5] Starting proxy...${NC}"

docker-compose up -d

# Wait for startup
sleep 3

# Verify it's running
if docker ps | grep -q "jac-irc-proxy\|justachat-irc"; then
  echo -e "${GREEN}✓ Proxy started successfully${NC}"
else
  echo -e "${YELLOW}Container may still be starting...${NC}"
  docker-compose logs --tail=10
fi

# Test admin API
echo ""
echo -e "${BLUE}Testing admin API...${NC}"
sleep 2

if curl -s http://localhost:6680/status > /dev/null 2>&1; then
  STATUS=$(curl -s http://localhost:6680/status)
  VERSION=$(echo "$STATUS" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Proxy is running - Version: ${VERSION:-unknown}${NC}"
else
  echo -e "${YELLOW}Admin API not responding yet${NC}"
  echo -e "Check logs: docker-compose logs -f"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}   Update Complete!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${YELLOW}Your settings have been preserved:${NC}"
echo -e "  Proxy URL:   http://${SERVER_IP}:6680"
if [ -n "$ADMIN_TOKEN" ]; then
  echo -e "  Admin Token: ${ADMIN_TOKEN}"
fi
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:   docker-compose logs -f"
echo -e "  Restart:     docker-compose restart"
echo -e "  Status:      curl http://localhost:6680/status"
echo ""
echo -e "${CYAN}============================================${NC}"
