#!/bin/bash
# ============================================
# JAC IRC Proxy - One-Command VPS Installer
# ============================================
# 
# Usage: curl -fsSL https://justachat.net/irc-proxy/install.sh | bash
#
# This script will:
#   1. Install Docker & Docker Compose if missing
#   2. Create /opt/justachat-irc directory
#   3. Download all required files
#   4. Generate a secure admin token
#   5. Build and start the proxy
#   6. Configure firewall
#   7. Display connection info
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base URL for downloading files
BASE_URL="https://justachat.net/irc-proxy"

# Installation directory
INSTALL_DIR="/opt/justachat-irc"

echo -e "${CYAN}"
echo "============================================"
echo "   JAC IRC Proxy - VPS Installer v2.1"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run as root: sudo bash install.sh${NC}"
  exit 1
fi

echo -e "${BLUE}[1/7] Checking dependencies...${NC}"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}Docker installed successfully${NC}"
else
  echo -e "${GREEN}Docker is already installed${NC}"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}Installing Docker Compose...${NC}"
  curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
  echo -e "${GREEN}Docker Compose is already installed${NC}"
fi

echo -e "${BLUE}[2/7] Setting up installation directory...${NC}"

# Stop and remove existing containers
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}Stopping existing containers...${NC}"
  cd "$INSTALL_DIR"
  docker-compose down 2>/dev/null || true
  cd /
fi

# Clean up old installation
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "${GREEN}Created $INSTALL_DIR${NC}"

echo -e "${BLUE}[3/7] Downloading proxy files...${NC}"

# Download all required files
FILES=("proxy.js" "package.json" "Dockerfile" "docker-compose.yml" ".env.example")

for file in "${FILES[@]}"; do
  echo -e "  Downloading ${file}..."
  if curl -fsSL -o "$file" "${BASE_URL}/${file}"; then
    echo -e "  ${GREEN}✓ ${file}${NC}"
  else
    echo -e "  ${RED}✗ Failed to download ${file}${NC}"
    exit 1
  fi
done

# Verify proxy.js is a file, not a directory
if [ -d "proxy.js" ]; then
  echo -e "${RED}[ERROR] proxy.js is a directory, not a file. Cleaning up...${NC}"
  rm -rf proxy.js
  curl -fsSL -o proxy.js "${BASE_URL}/proxy.js"
fi

# Verify files exist and are not empty
for file in "${FILES[@]}"; do
  if [ ! -s "$file" ]; then
    echo -e "${RED}[ERROR] ${file} is empty or missing${NC}"
    exit 1
  fi
done

echo -e "${GREEN}All files downloaded successfully${NC}"

echo -e "${BLUE}[4/7] Configuring environment...${NC}"

# Generate secure admin token
ADMIN_TOKEN=$(openssl rand -hex 32)

# Get server's public IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "YOUR_SERVER_IP")

# Create .env file
cat > .env << EOF
# JAC IRC Proxy Configuration
# Generated: $(date)

# WebSocket Gateway URL (DO NOT CHANGE)
WS_URL=wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway

# Network Settings
HOST=0.0.0.0
PORT=6667

# SSL Settings (set to false if no certificate)
SSL_ENABLED=false
SSL_PORT=6697

# Admin API Settings
ADMIN_PORT=6680
ADMIN_TOKEN=${ADMIN_TOKEN}

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIR=/logs
LOG_MAX_SIZE_MB=10
LOG_MAX_FILES=5

# Rate Limiting
RATE_CONN_PER_MIN=5
RATE_MSG_PER_SEC=10
RATE_MSG_BURST=20
RATE_AUTO_BAN=3
RATE_BAN_DURATION=60

# GeoIP Filtering (optional)
GEOIP_ENABLED=false
GEOIP_MODE=block
GEOIP_COUNTRIES=
EOF

echo -e "${GREEN}Environment configured${NC}"

echo -e "${BLUE}[5/7] Building Docker image...${NC}"

# Build the Docker image
docker-compose build --no-cache

echo -e "${GREEN}Docker image built successfully${NC}"

echo -e "${BLUE}[6/7] Starting proxy service...${NC}"

# Start the containers (without certbot dependency for now)
# Create a simplified docker-compose for non-SSL
cat > docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  irc-proxy:
    container_name: jac-irc-proxy
    depends_on: []
EOF

docker-compose up -d

# Wait for container to start
sleep 3

# Check if running
if docker ps | grep -q "jac-irc-proxy"; then
  echo -e "${GREEN}Proxy started successfully${NC}"
else
  echo -e "${YELLOW}Checking logs for errors...${NC}"
  docker-compose logs --tail=20
fi

echo -e "${BLUE}[7/7] Configuring firewall...${NC}"

# Configure UFW if available
if command -v ufw &> /dev/null; then
  ufw allow 6667/tcp comment 'IRC Proxy - Plain'
  ufw allow 6697/tcp comment 'IRC Proxy - SSL'
  ufw allow 6680/tcp comment 'IRC Proxy - Admin API'
  echo -e "${GREEN}Firewall configured${NC}"
else
  echo -e "${YELLOW}UFW not found - manually open ports 6667, 6697, 6680${NC}"
fi

# Test the admin API
echo ""
echo -e "${BLUE}Testing admin API...${NC}"
sleep 2
if curl -s http://localhost:6680/status > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Admin API is responding${NC}"
  PROXY_STATUS=$(curl -s http://localhost:6680/status)
  echo -e "${CYAN}Status: ${PROXY_STATUS}${NC}"
else
  echo -e "${YELLOW}Admin API not responding yet - check logs with: docker-compose logs -f${NC}"
fi

# Print summary
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}   Installation Complete!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${YELLOW}Server IP:${NC} ${SERVER_IP}"
echo ""
echo -e "${YELLOW}mIRC Connection Settings:${NC}"
echo -e "  Server:   ${SERVER_IP}"
echo -e "  Port:     6667 (plain) or 6697 (SSL)"
echo -e "  Password: your-email@example.com;your-password"
echo ""
echo -e "${YELLOW}Admin Panel Settings:${NC}"
echo -e "  Proxy URL:   http://${SERVER_IP}:6680"
echo -e "  Admin Token: ${ADMIN_TOKEN}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:     docker-compose logs -f"
echo -e "  Restart:       docker-compose restart"
echo -e "  Stop:          docker-compose down"
echo -e "  Test status:   curl http://localhost:6680/status"
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}Save your Admin Token above!${NC}"
echo -e "${CYAN}============================================${NC}"
