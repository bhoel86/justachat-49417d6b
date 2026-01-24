#!/bin/bash
# JAC IRC Proxy - Quick Setup Script
# Run this on your VPS to set up the IRC proxy with auto-SSL

set -e

echo "========================================"
echo "JAC IRC Proxy - Auto-SSL Setup"
echo "========================================"
echo ""

# Check for required tools
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. You may need to log out and back in."
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Installing..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# Get domain from user
echo ""
read -p "Enter your domain (e.g., irc.example.com): " DOMAIN
read -p "Enter your email for SSL notifications: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Domain and email are required!"
    exit 1
fi

# Create .env file
cat > .env << EOF
DOMAIN=$DOMAIN
ACME_EMAIL=$EMAIL
SSL_ENABLED=true
LOG_LEVEL=info
EOF

echo ""
echo "✅ Configuration saved to .env"
echo ""

# Check DNS
echo "Checking DNS for $DOMAIN..."
IP=$(dig +short $DOMAIN)
MY_IP=$(curl -s ifconfig.me)

if [ "$IP" != "$MY_IP" ]; then
    echo ""
    echo "⚠️  WARNING: DNS may not be configured correctly!"
    echo "   Domain resolves to: $IP"
    echo "   This server's IP:   $MY_IP"
    echo ""
    echo "Make sure your domain's A record points to $MY_IP"
    echo ""
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
else
    echo "✅ DNS configured correctly ($IP)"
fi

echo ""
echo "========================================"
echo "Getting SSL Certificate..."
echo "========================================"
echo ""

# Get initial certificate
docker compose --profile init up certbot-init

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificate obtained!"
    echo ""
    echo "========================================"
    echo "Starting IRC Proxy..."
    echo "========================================"
    echo ""
    
    # Start the proxy
    docker compose up -d irc-proxy certbot
    
    echo ""
    echo "========================================"
    echo "✅ SETUP COMPLETE!"
    echo "========================================"
    echo ""
    echo "Your IRC proxy is now running!"
    echo ""
    echo "mIRC Settings:"
    echo "  Server: $DOMAIN"
    echo "  Port: 6667 (plain) or 6697 (SSL)"
    echo "  Password: email@example.com:password"
    echo "  SSL: Enable for port 6697"
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker compose logs -f irc-proxy"
    echo "  Stop:         docker compose down"
    echo "  Restart:      docker compose restart"
    echo "  Renew cert:   docker compose run --rm certbot renew"
    echo ""
else
    echo ""
    echo "❌ Failed to obtain SSL certificate."
    echo ""
    echo "Common issues:"
    echo "  - Port 80 is blocked by firewall"
    echo "  - DNS not pointing to this server"
    echo "  - Domain doesn't exist"
    echo ""
    echo "You can still run without SSL:"
    echo "  SSL_ENABLED=false docker compose up -d irc-proxy"
fi
