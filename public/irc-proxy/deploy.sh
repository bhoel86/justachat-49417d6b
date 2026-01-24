#!/bin/bash
# Justachat IRC Proxy - Automated Deployment Script
# Usage: curl -sSL https://justachat.net/irc-proxy/deploy.sh | bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Justachat IRC Proxy - Automated Installer          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

echo -e "${YELLOW}[1/6]${NC} Updating system..."
apt update -qq

echo -e "${YELLOW}[2/6]${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  echo -e "${GREEN}Docker installed${NC}"
else
  echo -e "${GREEN}Docker already installed${NC}"
fi

echo -e "${YELLOW}[3/6]${NC} Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
  apt install -y docker-compose -qq
  echo -e "${GREEN}Docker Compose installed${NC}"
else
  echo -e "${GREEN}Docker Compose already installed${NC}"
fi

echo -e "${YELLOW}[4/6]${NC} Creating proxy directory..."
mkdir -p /opt/justachat-irc
cd /opt/justachat-irc

echo -e "${YELLOW}[5/6]${NC} Downloading proxy files..."
BASE_URL="https://justachat.net/irc-proxy"
curl -sSL -O "$BASE_URL/proxy.js"
curl -sSL -O "$BASE_URL/package.json"
curl -sSL -O "$BASE_URL/docker-compose.yml"
curl -sSL -O "$BASE_URL/Dockerfile"

# Generate random admin token
ADMIN_TOKEN=$(openssl rand -hex 24)

# Create .env file
cat > .env << EOF
# Justachat WebSocket Gateway
GATEWAY_URL=wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway

# IRC Ports
IRC_PORT=6667
IRC_SSL_PORT=6697

# Admin API
ADMIN_PORT=6680
ADMIN_TOKEN=$ADMIN_TOKEN

# SSL (optional)
SSL_CERT=
SSL_KEY=

# GeoIP Blocking (optional)
GEOIP_ENABLED=false
GEOIP_MODE=block
GEOIP_COUNTRIES=

# Logging
LOG_TO_FILE=true
LOG_DIR=/logs
EOF

echo -e "${YELLOW}[6/6]${NC} Starting proxy..."
docker-compose up -d --build

# Configure firewall
if command -v ufw &> /dev/null; then
  echo -e "${YELLOW}Configuring firewall...${NC}"
  ufw allow 6667/tcp >/dev/null 2>&1 || true
  ufw allow 6697/tcp >/dev/null 2>&1 || true
  ufw allow 6680/tcp >/dev/null 2>&1 || true
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Installation Complete!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Your IRC proxy is now running!"
echo ""
echo -e "${YELLOW}mIRC Connection Settings:${NC}"
echo -e "  Server:   ${GREEN}$SERVER_IP${NC}"
echo -e "  Port:     ${GREEN}6667${NC}"
echo -e "  Password: ${GREEN}your-email@example.com:your-password${NC}"
echo ""
echo -e "${YELLOW}Admin Panel Settings:${NC}"
echo -e "  Proxy URL:    ${GREEN}http://$SERVER_IP:6680${NC}"
echo -e "  Admin Token:  ${GREEN}$ADMIN_TOKEN${NC}"
echo ""
echo -e "${RED}IMPORTANT: Save your Admin Token! It won't be shown again.${NC}"
echo ""
echo -e "View logs: ${YELLOW}cd /opt/justachat-irc && docker-compose logs -f${NC}"
echo ""
