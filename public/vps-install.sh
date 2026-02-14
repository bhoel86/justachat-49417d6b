#!/bin/bash
# ============================================
# JUSTACHAT — FRESH DROPLET INSTALL (2026)
# Run as root on a fresh Ubuntu 24.04 droplet:
#   curl -sSL https://raw.githubusercontent.com/YOUR_REPO/main/public/vps-install.sh | bash
# Or: bash /root/vps-install.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $1"; }
step() { echo -e "\n${BOLD}═══ $1 ═══${NC}\n"; }

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}JUSTACHAT — FRESH DROPLET INSTALLER${NC}          ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  Ubuntu 24.04 · $(date '+%Y-%m-%d')                    ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# ─────────────────────────────────────────────
# STEP 1: System update & essential packages
# ─────────────────────────────────────────────
step "1/10 — System Update"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git nano ufw fail2ban \
  build-essential ca-certificates gnupg lsb-release \
  software-properties-common apt-transport-https \
  jq python3 python3-pip unzip htop tmux \
  certbot python3-certbot-nginx
ok "System packages installed"

# ─────────────────────────────────────────────
# STEP 2: Create unix user (non-root)
# ─────────────────────────────────────────────
step "2/10 — Create unix user"

if id "unix" &>/dev/null; then
  ok "User 'unix' already exists"
else
  adduser --disabled-password --gecos "" unix
  usermod -aG sudo unix
  echo "unix ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/unix
  ok "User 'unix' created with passwordless sudo"
fi

# ─────────────────────────────────────────────
# STEP 3: Install Node.js 22 LTS (latest)
# ─────────────────────────────────────────────
step "3/10 — Node.js 22 LTS"

if command -v node &>/dev/null && node -v | grep -q "v22"; then
  ok "Node.js $(node -v) already installed"
else
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
  ok "Node.js $(node -v) installed"
fi
ok "npm $(npm -v)"

# Install PM2 globally for process management
npm install -g pm2 2>/dev/null
ok "PM2 $(pm2 -v) installed"

# ─────────────────────────────────────────────
# STEP 4: Install Docker Engine (latest stable)
# ─────────────────────────────────────────────
step "4/10 — Docker Engine"

if command -v docker &>/dev/null; then
  ok "Docker $(docker --version | awk '{print $3}') already installed"
else
  # Official Docker install
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  ok "Docker $(docker --version | awk '{print $3}') installed"
fi

# Add unix to docker group
usermod -aG docker unix 2>/dev/null || true
ok "unix added to docker group"

# ─────────────────────────────────────────────
# STEP 5: Install Nginx (latest mainline)
# ─────────────────────────────────────────────
step "5/10 — Nginx"

if command -v nginx &>/dev/null; then
  ok "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}') already installed"
else
  apt-get install -y -qq nginx
  ok "Nginx installed"
fi
systemctl enable nginx
systemctl start nginx

# ─────────────────────────────────────────────
# STEP 6: Firewall (UFW)
# ─────────────────────────────────────────────
step "6/10 — Firewall"

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 6669/tcp  # IRC
ufw --force enable
ok "UFW enabled — ports 22, 80, 443, 6669 open"

# ─────────────────────────────────────────────
# STEP 7: Clone repo & set up directories
# ─────────────────────────────────────────────
step "7/10 — Clone Repository"

PROJECT_DIR="/var/www/justachat"
SUPABASE_DIR="/home/unix/supabase/docker"

if [ -d "$PROJECT_DIR/.git" ]; then
  cd "$PROJECT_DIR"
  git fetch origin main
  git reset --hard origin/main
  ok "Repository updated"
else
  mkdir -p /var/www
  git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git "$PROJECT_DIR"
  ok "Repository cloned"
fi

chown -R unix:unix "$PROJECT_DIR"

# ─────────────────────────────────────────────
# STEP 8: Set up Supabase Docker stack
# ─────────────────────────────────────────────
step "8/10 — Supabase Docker Stack"

if [ -d "$SUPABASE_DIR" ]; then
  ok "Supabase directory exists"
else
  info "Cloning Supabase Docker setup..."
  mkdir -p /home/unix/supabase
  git clone --depth 1 https://github.com/supabase/supabase.git /tmp/supabase-src
  cp -r /tmp/supabase-src/docker "$SUPABASE_DIR"
  rm -rf /tmp/supabase-src
  ok "Supabase Docker stack cloned"
fi

chown -R unix:unix /home/unix/supabase

# Generate fresh keys if .env doesn't exist
if [ ! -f "$SUPABASE_DIR/.env" ]; then
  info "Generating fresh JWT keys..."
  
  JWT_SECRET=$(openssl rand -hex 32)
  
  # Generate compact ANON_KEY
  HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
  IAT=$(date +%s)
  EXP=$((IAT + 315360000))  # 10 years
  ANON_PAYLOAD=$(echo -n "{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":${IAT},\"exp\":${EXP}}" | base64 -w0 | tr '+/' '-_' | tr -d '=')
  ANON_SIG=$(echo -n "${HEADER}.${ANON_PAYLOAD}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
  ANON_KEY="${HEADER}.${ANON_PAYLOAD}.${ANON_SIG}"
  
  SERVICE_PAYLOAD=$(echo -n "{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":${IAT},\"exp\":${EXP}}" | base64 -w0 | tr '+/' '-_' | tr -d '=')
  SERVICE_SIG=$(echo -n "${HEADER}.${SERVICE_PAYLOAD}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
  SERVICE_ROLE_KEY="${HEADER}.${SERVICE_PAYLOAD}.${SERVICE_SIG}"
  
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  DASHBOARD_PASSWORD=$(openssl rand -hex 16)
  PM_MASTER_KEY=$(openssl rand -base64 32)
  
  # Copy example env and patch it
  if [ -f "$SUPABASE_DIR/.env.example" ]; then
    cp "$SUPABASE_DIR/.env.example" "$SUPABASE_DIR/.env"
  fi
  
  # Write the .env
  cat > "$SUPABASE_DIR/.env" << ENVEOF
############
# Secrets - DO NOT COMMIT
############

POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API
############
SITE_URL=https://justachat.net
API_EXTERNAL_URL=https://justachat.net
SUPABASE_PUBLIC_URL=https://justachat.net

############
# Auth
############
GOTRUE_SITE_URL=https://justachat.net
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SMTP_ADMIN_EMAIL=admin@justachat.net
GOTRUE_EXTERNAL_GOOGLE_ENABLED=false
GOTRUE_JWT_EXPIRY=3600
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated

############
# Edge Functions
############
PM_MASTER_KEY=$PM_MASTER_KEY
OPENAI_API_KEY=

############
# Studio
############
STUDIO_DEFAULT_ORGANIZATION=JustAChat
STUDIO_DEFAULT_PROJECT=JustAChat
STUDIO_PORT=3000

############
# Misc
############
LOGFLARE_LOGGER_BACKEND_API_KEY=your-super-secret-and-long-logflare-key
ENVEOF

  chown unix:unix "$SUPABASE_DIR/.env"
  chmod 600 "$SUPABASE_DIR/.env"
  
  ok "Fresh .env generated with new keys"
  echo ""
  echo -e "${YELLOW}  ANON_KEY: ...${ANON_KEY: -12}${NC}"
  echo -e "${YELLOW}  SERVICE_ROLE_KEY: ...${SERVICE_ROLE_KEY: -12}${NC}"
  echo -e "${YELLOW}  JWT_SECRET: ...${JWT_SECRET: -12}${NC}"
  echo ""
else
  ok "Supabase .env already exists — keeping existing keys"
fi

# ─────────────────────────────────────────────
# STEP 9: Build frontend
# ─────────────────────────────────────────────
step "9/10 — Build Frontend"

cd "$PROJECT_DIR"

# Read keys from Docker .env
ANON_KEY=$(grep -E '^ANON_KEY=' "$SUPABASE_DIR/.env" | head -1 | cut -d'=' -f2-)

# Write frontend .env
cat > "$PROJECT_DIR/.env" << ENVEOF
VITE_SUPABASE_URL=https://justachat.net
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
ENVEOF

chown unix:unix "$PROJECT_DIR/.env"

# Install deps and build as unix user
sudo -u unix bash -c "cd $PROJECT_DIR && npm install --legacy-peer-deps && npm run build"

if [ -d "$PROJECT_DIR/dist" ]; then
  ok "Frontend built successfully"
else
  warn "Frontend build failed — run manually after fixing"
fi

# ─────────────────────────────────────────────
# STEP 10: Configure Nginx
# ─────────────────────────────────────────────
step "10/10 — Nginx Configuration"

cat > /etc/nginx/sites-available/justachat << 'NGINXCONF'
server {
    listen 80;
    server_name justachat.net www.justachat.net;

    root /var/www/justachat/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://justachat.net wss://justachat.net https://challenges.cloudflare.com https://api.giphy.com https://tenor.googleapis.com https://www.youtube.com https://youtube.com; frame-src https://challenges.cloudflare.com https://www.youtube.com; media-src 'self' blob: https://www.youtube.com https://youtube.com https://ytimg.com;" always;

    # Cache control — no stale assets
    add_header Cache-Control "public, max-age=0, must-revalidate" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Supabase API proxy
    location /rest/v1/ {
        proxy_pass http://127.0.0.1:8000/rest/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/v1/ {
        proxy_pass http://127.0.0.1:8000/auth/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /storage/v1/ {
        proxy_pass http://127.0.0.1:8000/storage/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /functions/v1/ {
        proxy_pass http://127.0.0.1:8000/functions/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Realtime WebSocket
    location /realtime/v1/ {
        proxy_pass http://127.0.0.1:8000/realtime/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/justachat /etc/nginx/sites-enabled/justachat
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
ok "Nginx configured"

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}INSTALLATION COMPLETE${NC}                        ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo "  Installed versions:"
echo "    OS:      $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "    Node:    $(node -v)"
echo "    npm:     $(npm -v)"
echo "    Docker:  $(docker --version | awk '{print $3}' | tr -d ',')"
echo "    Nginx:   $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo ""
echo "  1. Update the git clone URL in this script (line ~175)"
echo "  2. Point DNS: justachat.net → $(curl -s ifconfig.me)"
echo "  3. Start Supabase:"
echo "     cd /home/unix/supabase/docker"
echo "     sudo docker compose --env-file .env up -d"
echo ""
echo "  4. Set up SSL:"
echo "     sudo certbot --nginx -d justachat.net -d www.justachat.net"
echo ""
echo "  5. Sync edge functions:"
echo "     sudo cp -r /var/www/justachat/supabase/functions/* /home/unix/supabase/docker/volumes/functions/"
echo "     sudo docker restart supabase-edge-functions"
echo ""
echo "  6. Restore database (if migrating):"
echo "     cat backup.sql | sudo docker exec -i supabase-db psql -U supabase_admin -d postgres"
echo ""
echo "  7. Set OPENAI_API_KEY in /home/unix/supabase/docker/.env"
echo ""
echo "  Visit: http://justachat.net (HTTP until SSL is set up)"
echo ""
