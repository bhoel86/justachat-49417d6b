#!/bin/bash
# JustAChat VPS Deploy Script
# Run: curl -sSL https://raw.githubusercontent.com/YOUR_USER/justachat/main/deploy.sh | bash

set -e

echo "🚀 JustAChat VPS Deployment"
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
REPO_URL="${REPO_URL:-https://github.com/bhoel86/justachatfinal.git}"
APP_DIR="/var/www/justachat"
SUPABASE_URL="http://127.0.0.1:8000"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4NjE5MjAwMDB9.ApWkSEYJ7yzNQ_H7yfVE2zyUp--eWrR-h9pj-rUSQEU"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo bash deploy.sh)"
  exit 1
fi

echo -e "${YELLOW}[1/6] Installing dependencies...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y nginx certbot python3-certbot-nginx git -qq

echo -e "${YELLOW}[2/6] Cloning/updating repository...${NC}"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo -e "${YELLOW}[3/6] Creating environment file...${NC}"
cat > .env << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_ANON_KEY
EOF

echo -e "${YELLOW}[4/6] Building application...${NC}"
npm install --legacy-peer-deps
npm run build

echo -e "${YELLOW}[5/6] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/justachat << 'NGINX'
server {
    listen 80;
    server_name justachat.net www.justachat.net _;
    root /var/www/justachat/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Supabase REST API
    location /rest/ {
        proxy_pass http://127.0.0.1:8000/rest/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Supabase Auth
    location /auth/ {
        proxy_pass http://127.0.0.1:8000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy Supabase Realtime (WebSocket)
    location /realtime/ {
        proxy_pass http://127.0.0.1:8000/realtime/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Proxy Supabase Storage
    location /storage/ {
        proxy_pass http://127.0.0.1:8000/storage/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Proxy Edge Functions
    location /functions/ {
        proxy_pass http://127.0.0.1:8000/functions/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/justachat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${YELLOW}[6/6] Setting up SSL...${NC}"
certbot --nginx -d justachat.net -d www.justachat.net --non-interactive --agree-tos --email admin@justachat.net || echo "SSL setup skipped (run manually if needed)"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Your app is now live at: https://justachat.net"
echo ""
echo "To redeploy after changes:"
echo "  cd $APP_DIR && git pull && npm run build"
