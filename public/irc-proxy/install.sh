#!/bin/bash
# ============================================
# JAC IRC Proxy - One-Command VPS Installer
# ============================================
# 
#+#+#+#+########################################################
# Usage:
#   curl -fsSL https://justachat.net/irc-proxy/install.sh | bash
#
# With HTTPS Admin API (recommended):
#   curl -fsSL https://justachat.net/irc-proxy/install.sh | bash -s -- --https-admin ircadmin.yourdomain.com
#
# If your domain isn't live yet, use the fallback host:
#   curl -fsSL https://justachat.lovable.app/irc-proxy/install.sh | bash
#
# This script will:
#   1. Install Docker & Docker Compose if missing
#   2. Create /opt/justachat-irc directory
#   3. Download all required files
#   4. Generate a secure admin token
#   5. Build and start the proxy
#   6. Configure firewall
#   7. (Optional) Set up HTTPS for Admin API with Caddy
#   8. Display connection info
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PRIMARY_BASE_URL="https://justachat.net/irc-proxy"
# IMPORTANT: The published lovable.app domain may redirect to the custom domain if the
# custom domain is set as Primary. Use the preview host as a reliable fallback.
FALLBACK_BASE_URL="https://id-preview--3468328b-9f6a-4d30-ad57-93742355db43.lovable.app/irc-proxy"

# Parse arguments
HTTPS_ADMIN_DOMAIN=""
HTTPS_METHOD="caddy"  # Default to Caddy (simpler, auto-HTTPS)

while [[ $# -gt 0 ]]; do
  case $1 in
    --https-admin)
      HTTPS_ADMIN_DOMAIN="$2"
      shift 2
      ;;
    --https-method)
      HTTPS_METHOD="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

pick_base_url() {
  # Allow manual override: BASE_URL=https://.../irc-proxy curl ... | bash
  if [ -n "${BASE_URL:-}" ]; then
    echo "$BASE_URL"
    return 0
  fi

  # Prefer justachat.net when it is live (silently check, no error output)
  if curl -fsIL --connect-timeout 3 --max-time 5 "${PRIMARY_BASE_URL}/proxy.js" >/dev/null 2>/dev/null; then
    echo "$PRIMARY_BASE_URL"
    return 0
  fi

  echo "$FALLBACK_BASE_URL"
}

# Base URL for downloading files
BASE_URL="$(pick_base_url)"

# Installation directory
INSTALL_DIR="/opt/justachat-irc"

echo -e "${CYAN}"
echo "============================================"
echo "   JAC IRC Proxy - VPS Installer v2.2"
echo "============================================"
echo -e "${NC}"

if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
  echo -e "${GREEN}HTTPS Admin API will be configured for: ${HTTPS_ADMIN_DOMAIN}${NC}"
  echo ""
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run as root: sudo bash install.sh${NC}"
  exit 1
fi

TOTAL_STEPS=7
if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
  TOTAL_STEPS=8
fi

echo -e "${BLUE}[1/${TOTAL_STEPS}] Checking dependencies...${NC}"

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

echo -e "${BLUE}[2/${TOTAL_STEPS}] Setting up installation directory...${NC}"

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

echo -e "${BLUE}[3/${TOTAL_STEPS}] Downloading proxy files...${NC}"

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

echo -e "${BLUE}[4/${TOTAL_STEPS}] Configuring environment...${NC}"

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

echo -e "${BLUE}[5/${TOTAL_STEPS}] Building Docker image...${NC}"

# Build the Docker image
docker-compose build --no-cache

echo -e "${GREEN}Docker image built successfully${NC}"

echo -e "${BLUE}[6/${TOTAL_STEPS}] Starting proxy service...${NC}"

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

echo -e "${BLUE}[7/${TOTAL_STEPS}] Configuring firewall...${NC}"

# Configure UFW if available
if command -v ufw &> /dev/null; then
  ufw allow 6667/tcp comment 'IRC Proxy - Plain'
  ufw allow 6697/tcp comment 'IRC Proxy - SSL'
  ufw allow 6680/tcp comment 'IRC Proxy - Admin API'
  
  # If setting up HTTPS admin, also allow 80 and 443
  if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
    ufw allow 80/tcp comment 'HTTP - Certbot'
    ufw allow 443/tcp comment 'HTTPS - Admin API'
  fi
  
  ufw reload 2>/dev/null || true
  echo -e "${GREEN}Firewall configured${NC}"
else
  echo -e "${YELLOW}UFW not found - manually open ports 6667, 6697, 6680${NC}"
  if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
    echo -e "${YELLOW}Also open ports 80 and 443 for HTTPS${NC}"
  fi
fi

# HTTPS Admin API Setup
ADMIN_URL="http://${SERVER_IP}:6680"

if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
  echo -e "${BLUE}[8/${TOTAL_STEPS}] Setting up HTTPS Admin API...${NC}"
  
  # Check DNS first
  echo -e "${YELLOW}Checking DNS for ${HTTPS_ADMIN_DOMAIN}...${NC}"
  if host "$HTTPS_ADMIN_DOMAIN" > /dev/null 2>&1; then
    RESOLVED_IP=$(host "$HTTPS_ADMIN_DOMAIN" | grep "has address" | head -1 | awk '{print $NF}')
    if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
      echo -e "${GREEN}✓ DNS correctly points to this server${NC}"
    else
      echo -e "${YELLOW}Warning: DNS points to ${RESOLVED_IP}, expected ${SERVER_IP}${NC}"
      echo -e "${YELLOW}Continuing anyway - make sure DNS is configured correctly${NC}"
    fi
  else
    echo -e "${YELLOW}Warning: DNS lookup failed for ${HTTPS_ADMIN_DOMAIN}${NC}"
    echo -e "${YELLOW}Make sure to add an A record pointing to ${SERVER_IP}${NC}"
  fi
  
  if [ "$HTTPS_METHOD" = "caddy" ]; then
    # Install Caddy
    echo -e "${YELLOW}Installing Caddy...${NC}"
    apt-get update -qq
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl > /dev/null 2>&1
    
    if [ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]; then
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null
    fi
    
    echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq caddy > /dev/null 2>&1
    
    echo -e "${GREEN}Caddy installed${NC}"
    
    # Configure Caddy
    echo -e "${YELLOW}Configuring Caddy for ${HTTPS_ADMIN_DOMAIN}...${NC}"
    
    # Backup existing config
    if [ -f /etc/caddy/Caddyfile ]; then
      cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%s) 2>/dev/null || true
    fi
    
    cat > /etc/caddy/Caddyfile << CADDYEOF
${HTTPS_ADMIN_DOMAIN} {
    reverse_proxy localhost:6680
    
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type, X-Admin-Token"
    }
    
    @options method OPTIONS
    handle @options {
        respond 204
    }
}
CADDYEOF
    
    # Start Caddy
    systemctl enable caddy > /dev/null 2>&1
    systemctl restart caddy
    
    echo -e "${GREEN}Caddy configured and started${NC}"
    
    # Wait for certificate provisioning
    echo -e "${YELLOW}Waiting for SSL certificate provisioning...${NC}"
    sleep 5
    
    # Verify HTTPS is working
    if curl -sI "https://${HTTPS_ADMIN_DOMAIN}/status" 2>/dev/null | grep -q "200\|401"; then
      echo -e "${GREEN}✓ HTTPS Admin API is live!${NC}"
      ADMIN_URL="https://${HTTPS_ADMIN_DOMAIN}"
    else
      echo -e "${YELLOW}HTTPS not responding yet - may take a minute for SSL provisioning${NC}"
      echo -e "${YELLOW}Check with: curl -I https://${HTTPS_ADMIN_DOMAIN}/status${NC}"
      ADMIN_URL="https://${HTTPS_ADMIN_DOMAIN}"
    fi
    
  elif [ "$HTTPS_METHOD" = "nginx" ]; then
    # Install Nginx and Certbot
    echo -e "${YELLOW}Installing Nginx and Certbot...${NC}"
    apt-get update -qq
    apt-get install -y -qq nginx certbot python3-certbot-nginx > /dev/null 2>&1
    
    echo -e "${GREEN}Nginx and Certbot installed${NC}"
    
    # Get certificate
    echo -e "${YELLOW}Obtaining SSL certificate...${NC}"
    certbot certonly --standalone --non-interactive --agree-tos --register-unsafely-without-email -d "${HTTPS_ADMIN_DOMAIN}" 2>/dev/null || {
      echo -e "${YELLOW}Standalone failed, trying with Nginx...${NC}"
      systemctl start nginx
      certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email -d "${HTTPS_ADMIN_DOMAIN}" 2>/dev/null
    }
    
    # Configure Nginx
    cat > /etc/nginx/sites-available/irc-admin << NGINXEOF
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${HTTPS_ADMIN_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${HTTPS_ADMIN_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${HTTPS_ADMIN_DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Admin-Token" always;

    if (\$request_method = 'OPTIONS') {
        return 204;
    }

    location / {
        proxy_pass http://127.0.0.1:6680;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${HTTPS_ADMIN_DOMAIN};
    return 301 https://\$server_name\$request_uri;
}
NGINXEOF
    
    ln -sf /etc/nginx/sites-available/irc-admin /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    nginx -t && systemctl restart nginx
    
    echo -e "${GREEN}Nginx configured${NC}"
    ADMIN_URL="https://${HTTPS_ADMIN_DOMAIN}"
  fi
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
echo -e "  Proxy URL:   ${ADMIN_URL}"
echo -e "  Admin Token: ${ADMIN_TOKEN}"

if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
  echo ""
  echo -e "${GREEN}✓ HTTPS Admin API enabled${NC}"
  echo -e "  The web Admin Panel can now connect securely"
fi

echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:     cd ${INSTALL_DIR} && docker-compose logs -f"
echo -e "  Restart:       cd ${INSTALL_DIR} && docker-compose restart"
echo -e "  Stop:          cd ${INSTALL_DIR} && docker-compose down"
echo -e "  Test status:   curl http://localhost:6680/status"

if [ -n "$HTTPS_ADMIN_DOMAIN" ]; then
  echo -e "  Test HTTPS:    curl https://${HTTPS_ADMIN_DOMAIN}/status"
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}Save your Admin Token above!${NC}"
echo -e "${CYAN}============================================${NC}"
