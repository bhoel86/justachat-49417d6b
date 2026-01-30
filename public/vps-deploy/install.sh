#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - PRODUCTION INSTALLER
# Single-command install for DigitalOcean Ubuntu 22.04/24.04
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/UnixMint/justachat-unix/main/public/vps-deploy/install.sh | sudo bash
#
# Features:
#   - Idempotent (safe to run multiple times)
#   - Installs Docker, Docker Compose, Node.js 20, Nginx, Certbot
#   - Sets up Supabase stack (NO analytics)
#   - Configures SSL automatically
#   - Creates systemd services for email webhook
#===============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="justachat.net"
PROJECT_DIR="/var/www/justachat"
SUPABASE_DIR="/home/unix/supabase/docker"
GITHUB_REPO="https://github.com/bhoel86/justachat-49417d6b.git"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║       JUSTACHAT VPS PRODUCTION INSTALLER                     ║"
  echo "║       For DigitalOcean Ubuntu 22.04/24.04                    ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
}

check_root() {
  if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo ./install.sh"
    exit 1
  fi
}

#===============================================================================
# STEP 1: Create unix user
#===============================================================================
create_unix_user() {
  log_info "[1/14] Setting up unix user..."
  
  if id "unix" &>/dev/null; then
    log_info "User 'unix' already exists"
  else
    useradd -m -s /bin/bash unix
    log_success "Created user 'unix'"
  fi
  
  usermod -aG sudo unix 2>/dev/null || true
  mkdir -p /etc/sudoers.d
  echo 'unix ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/unix
  chmod 0440 /etc/sudoers.d/unix
  
  log_success "Unix user configured"
}

#===============================================================================
# STEP 2: Install dependencies
#===============================================================================
install_dependencies() {
  log_info "[2/14] Installing system dependencies..."
  
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq \
    apt-transport-https ca-certificates curl gnupg lsb-release \
    git openssl ufw fail2ban htop unzip jq software-properties-common
  
  log_success "Dependencies installed"
}

#===============================================================================
# STEP 3: Install Docker
#===============================================================================
install_docker() {
  log_info "[3/14] Installing Docker..."
  
  if command -v docker &>/dev/null; then
    log_info "Docker already installed"
  else
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi
  
  usermod -aG docker unix 2>/dev/null || true
  systemctl enable docker
  systemctl start docker
  
  log_success "Docker configured"
}

#===============================================================================
# STEP 4: Install Node.js 20
#===============================================================================
install_nodejs() {
  log_info "[4/14] Installing Node.js 20..."
  
  if command -v node &>/dev/null && [[ "$(node -v)" == v20* ]]; then
    log_info "Node.js 20 already installed"
  else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
  fi
  
  log_success "Node.js installed: $(node -v)"
}

#===============================================================================
# STEP 5: Install Nginx & Certbot
#===============================================================================
install_nginx() {
  log_info "[5/14] Installing Nginx & Certbot..."
  
  apt-get install -y -qq nginx certbot python3-certbot-nginx
  systemctl enable nginx
  systemctl start nginx
  
  log_success "Nginx & Certbot installed"
}

#===============================================================================
# STEP 6: Configure firewall
#===============================================================================
configure_firewall() {
  log_info "[6/14] Configuring firewall..."
  
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 8000/tcp
  ufw --force enable
  
  log_success "Firewall configured"
}

#===============================================================================
# STEP 7: Collect API keys
#===============================================================================
collect_api_keys() {
  log_info "[7/14] Collecting API keys..."
  echo ""
  
  read -r -p "RESEND_API_KEY: " RESEND_API_KEY
  read -r -p "OPENAI_API_KEY: " OPENAI_API_KEY
  read -r -p "GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
  read -r -s -p "GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
  echo ""
  
  if [ -z "$RESEND_API_KEY" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    log_error "All API keys are required!"
    exit 1
  fi
  
  export RESEND_API_KEY OPENAI_API_KEY GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
  log_success "API keys collected"
}

#===============================================================================
# STEP 8: Clone frontend
#===============================================================================
setup_frontend() {
  log_info "[8/14] Cloning frontend..."
  
  mkdir -p /var/www
  chown -R unix:unix /var/www
  rm -rf "$PROJECT_DIR"
  
  sudo -u unix git clone "$GITHUB_REPO" "$PROJECT_DIR"
  
  log_success "Frontend cloned"
}

#===============================================================================
# STEP 9: Generate secrets & setup Supabase
#===============================================================================
setup_supabase() {
  log_info "[9/14] Setting up Supabase..."
  
  # Generate secrets
  JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  DASHBOARD_PASSWORD=$(openssl rand -hex 16)
  SECRET_KEY_BASE=$(openssl rand -hex 64)
  VAULT_ENC_KEY=$(openssl rand -base64 32 | tr -d '\n')
  LOGFLARE_API_KEY=$(openssl rand -hex 32)
  
  # Generate JWT tokens
  cat > /tmp/gen-jwt.js << 'JWTSCRIPT'
const crypto = require('crypto');
const secret = process.argv[2];
const role = process.argv[3];
function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
const header = base64url(JSON.stringify({alg:"HS256",typ:"JWT"}));
const payload = base64url(JSON.stringify({role:role,iss:"supabase",iat:1609459200,exp:1893456000}));
const signature = crypto.createHmac('sha256', secret).update(header + '.' + payload).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
console.log(header + '.' + payload + '.' + signature);
JWTSCRIPT

  ANON_KEY=$(node /tmp/gen-jwt.js "$JWT_SECRET" "anon")
  SERVICE_KEY=$(node /tmp/gen-jwt.js "$JWT_SECRET" "service_role")
  rm /tmp/gen-jwt.js
  
  export JWT_SECRET POSTGRES_PASSWORD DASHBOARD_PASSWORD ANON_KEY SERVICE_KEY
  
  # Create directories
  mkdir -p "$SUPABASE_DIR/volumes/db/data"
  mkdir -p "$SUPABASE_DIR/volumes/functions"
  mkdir -p "$SUPABASE_DIR/volumes/storage"
  mkdir -p "$SUPABASE_DIR/volumes/api"
  chown -R unix:unix /home/unix/supabase
  
  # Write .env
  cat > "$SUPABASE_DIR/.env" << ENVFILE
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_KEY}
DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
SECRET_KEY_BASE=${SECRET_KEY_BASE}
VAULT_ENC_KEY=${VAULT_ENC_KEY}
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443
SITE_URL=https://${DOMAIN}
API_EXTERNAL_URL=https://${DOMAIN}
SUPABASE_PUBLIC_URL=https://${DOMAIN}
PGRST_DB_SCHEMAS=public,storage,graphql_public
DASHBOARD_USERNAME=admin
STUDIO_DEFAULT_PROJECT=justachat
STUDIO_DEFAULT_ORGANIZATION=justachat
STUDIO_PG_META_URL=http://meta:8080
SUPABASE_STUDIO_PORT=3000
PG_META_PORT=8080
IMGPROXY_ENABLE_WEBP_DETECTION=true
FUNCTIONS_VERIFY_JWT=false
JWT_EXPIRY=3600
GOTRUE_SITE_URL=https://${DOMAIN}
GOTRUE_URI_ALLOW_LIST=https://${DOMAIN},https://${DOMAIN}/*
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOTRUE_EXTERNAL_GOOGLE_SECRET=${GOOGLE_CLIENT_SECRET}
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://${DOMAIN}/auth/v1/callback
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_SMTP_ADMIN_EMAIL=Unix@${DOMAIN}
GOTRUE_DISABLE_SIGNUP=false
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_ANONYMOUS_USERS=false
GOTRUE_HOOK_SEND_EMAIL_ENABLED=true
GOTRUE_HOOK_SEND_EMAIL_URI=https://${DOMAIN}/hook/email
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_TENANT_ID=justachat
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
OPENAI_API_KEY=${OPENAI_API_KEY}
RESEND_API_KEY=${RESEND_API_KEY}
LOGFLARE_API_KEY=${LOGFLARE_API_KEY}
ENVFILE

  # Copy docker-compose.yml and kong.yml
  cp "$PROJECT_DIR/public/vps-deploy/docker-compose.yml" "$SUPABASE_DIR/docker-compose.yml"
  cp "$PROJECT_DIR/public/vps-deploy/kong.yml" "$SUPABASE_DIR/volumes/api/kong.yml"
  
  chown -R unix:unix /home/unix/supabase
  
  log_success "Supabase configured"
}

#===============================================================================
# STEP 10: Build frontend
#===============================================================================
build_frontend() {
  log_info "[10/14] Building frontend..."
  
  cat > "$PROJECT_DIR/.env" << FRONTENV
VITE_SUPABASE_URL=https://${DOMAIN}
VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
VITE_SUPABASE_PROJECT_ID=justachat-vps
FRONTENV

  chown unix:unix "$PROJECT_DIR/.env"
  
  cd "$PROJECT_DIR"
  sudo -u unix npm install
  sudo -u unix rm -rf dist node_modules/.vite .vite
  sudo -u unix npm run build
  
  log_success "Frontend built"
}

#===============================================================================
# STEP 11: Start Supabase
#===============================================================================
start_supabase() {
  log_info "[11/14] Starting Supabase stack..."
  
  cd "$SUPABASE_DIR"
  docker compose pull 2>/dev/null || true
  
  log_info "  Starting db, imgproxy..."
  docker compose up -d db imgproxy
  sleep 30
  
  log_info "  Starting API services..."
  docker compose up -d meta supavisor auth rest realtime storage functions
  sleep 10
  
  log_info "  Starting kong..."
  docker compose up -d kong --no-deps
  sleep 5
  
  log_info "  Starting studio..."
  docker compose up -d studio --no-deps
  sleep 20
  
  log_success "Supabase stack started"
}

#===============================================================================
# STEP 12: Setup Nginx
#===============================================================================
setup_nginx() {
  log_info "[12/14] Configuring Nginx..."
  
  cat > /etc/nginx/sites-available/justachat << 'NGINXCONF'
server {
    listen 80;
    server_name justachat.net www.justachat.net;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    server_name justachat.net www.justachat.net;
    ssl_certificate /etc/letsencrypt/live/justachat.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/justachat.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
    root /var/www/justachat/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location = /hook/email {
        proxy_pass http://127.0.0.1:3001/hook/email;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location ~ ^/(rest|auth|realtime|storage|functions)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
NGINXCONF

  ln -sf /etc/nginx/sites-available/justachat /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  
  # Get SSL certs
  if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    certbot certonly --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --email "unix@${DOMAIN}" || true
  fi
  
  systemctl restart nginx
  
  log_success "Nginx configured"
}

#===============================================================================
# STEP 13: Setup email service
#===============================================================================
setup_email_service() {
  log_info "[13/14] Setting up email webhook..."
  
  mkdir -p /opt/email-webhook
  chown unix:unix /opt/email-webhook
  
  cat > /opt/email-webhook/server.js << 'EMAILSERVER'
const http = require('http');
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET') { res.writeHead(200); res.end('OK'); return; }
  if (req.method === 'POST' && req.url === '/hook/email') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { user, email_data } = JSON.parse(body);
        if (!user?.email) { res.writeHead(200); res.end('{}'); return; }
        const type = email_data?.email_action_type || 'unknown';
        const token_hash = email_data?.token_hash || '';
        const redirect = email_data?.redirect_to || 'https://justachat.net/home';
        const verifyLink = `https://justachat.net/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirect)}`;
        let subject = 'Justachat', html = `<a href="${verifyLink}">Click here</a>`;
        if (type === 'signup') { subject = 'Welcome to Justachat!'; html = `<h1>Welcome!</h1><a href="${verifyLink}">Confirm Email</a>`; }
        else if (type === 'recovery') { subject = 'Reset Password'; html = `<a href="${verifyLink}">Reset Password</a>`; }
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'Unix <Unix@justachat.net>', to: [user.email], subject, html })
        });
        res.writeHead(200); res.end('{}');
      } catch (e) { res.writeHead(500); res.end(JSON.stringify({error: e.message})); }
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
});
server.listen(3001, '127.0.0.1', () => console.log('Email webhook on :3001'));
EMAILSERVER

  echo "RESEND_API_KEY=${RESEND_API_KEY}" > /opt/email-webhook/.env
  chown -R unix:unix /opt/email-webhook

  cat > /etc/systemd/system/justachat-email.service << SYSTEMD
[Unit]
Description=Justachat Email Webhook
After=network.target
[Service]
Type=simple
User=unix
WorkingDirectory=/opt/email-webhook
EnvironmentFile=/opt/email-webhook/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
SYSTEMD

  systemctl daemon-reload
  systemctl enable justachat-email
  systemctl start justachat-email
  
  log_success "Email service configured"
}

#===============================================================================
# STEP 14: Save credentials & run health check
#===============================================================================
finalize() {
  log_info "[14/14] Finalizing..."
  
  # Sync functions
  rm -rf "$SUPABASE_DIR/volumes/functions"/*
  cp -r "$PROJECT_DIR/supabase/functions"/* "$SUPABASE_DIR/volumes/functions/"
  cat > "$SUPABASE_DIR/volumes/functions/.env" << FUNCENV
SUPABASE_URL=https://${DOMAIN}
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
FUNCENV
  docker restart supabase-edge-functions 2>/dev/null || true
  
  # Apply schema
  if [ -f "$PROJECT_DIR/public/vps-deploy/fresh-schema.sql" ]; then
    docker exec -i supabase-db psql -U postgres -d postgres < "$PROJECT_DIR/public/vps-deploy/fresh-schema.sql" || true
  fi
  
  # Save credentials
  cat > /home/unix/justachat-credentials.txt << CREDS
============================================
JUSTACHAT VPS CREDENTIALS
Generated: $(date)
============================================
DOMAIN: ${DOMAIN}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
JWT_SECRET: ${JWT_SECRET}
ANON_KEY: ${ANON_KEY}
SERVICE_ROLE_KEY: ${SERVICE_KEY}
STUDIO: http://localhost:3000 (SSH tunnel)
STUDIO_USER: admin
STUDIO_PASS: ${DASHBOARD_PASSWORD}
RESEND_API_KEY: ${RESEND_API_KEY}
OPENAI_API_KEY: ${OPENAI_API_KEY}
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
============================================
CREDS
  chmod 600 /home/unix/justachat-credentials.txt
  chown unix:unix /home/unix/justachat-credentials.txt
  
  # Health check
  echo ""
  echo "=== Health Check ==="
  if curl -sf "http://127.0.0.1:8000/auth/v1/health" -H "apikey: ${ANON_KEY}" > /dev/null; then
    log_success "Supabase Auth is healthy"
  else
    log_warn "Auth health check failed"
  fi
  
  if curl -sf "http://127.0.0.1:3001/" > /dev/null; then
    log_success "Email webhook is healthy"
  else
    log_warn "Email webhook health check failed"
  fi
  
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║       INSTALLATION COMPLETE!                                 ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  Website: https://${DOMAIN}"
  echo "  Credentials: /home/unix/justachat-credentials.txt"
  echo "  Health check: bash ${PROJECT_DIR}/public/vps-deploy/health-check.sh"
  echo ""
}

#===============================================================================
# MAIN
#===============================================================================
main() {
  print_banner
  check_root
  
  create_unix_user
  install_dependencies
  install_docker
  install_nodejs
  install_nginx
  configure_firewall
  collect_api_keys
  setup_frontend
  setup_supabase
  build_frontend
  start_supabase
  setup_nginx
  setup_email_service
  finalize
}

main "$@"
