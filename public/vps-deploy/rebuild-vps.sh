#!/bin/bash
set -e

echo "============================================"
echo "JUSTACHAT VPS COMPLETE REBUILD"
echo "Running as: $(whoami)"
echo "Date: $(date)"
echo "============================================"

# Ensure we're running as unix, not root
if [ "$(whoami)" = "root" ]; then
  echo ""
  echo "ERROR: Do not run as root!"
  echo "Switch to unix user first: su - unix"
  echo ""
  exit 1
fi

# =============================================
# COLLECT API KEYS UPFRONT
# =============================================
echo ""
echo "Enter your API keys (press Enter to skip if already saved):"
echo ""
read -p "RESEND_API_KEY: " RESEND_API_KEY
read -p "OPENAI_API_KEY: " OPENAI_API_KEY
read -p "GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
read -p "GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET

if [ -z "$RESEND_API_KEY" ] || [ -z "$OPENAI_API_KEY" ] || [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo ""
  echo "ERROR: All API keys are required!"
  echo ""
  exit 1
fi

# =============================================
# STEP 1: Stop all services
# =============================================
echo ""
echo "[1/9] Stopping services..."
sudo systemctl stop jac-deploy 2>/dev/null || true
sudo systemctl stop justachat-email 2>/dev/null || true
cd ~/supabase/docker 2>/dev/null && sudo docker compose down 2>/dev/null || true

# =============================================
# STEP 2: Clean old installation
# =============================================
echo "[2/9] Cleaning old installation..."
sudo rm -rf /var/www/justachat
sudo rm -rf ~/supabase/docker/volumes/db/data/* 2>/dev/null || true

# =============================================
# STEP 3: Generate fresh JWT keys
# =============================================
echo "[3/9] Generating fresh JWT credentials..."

JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# Generate proper JWTs using Node.js
cat > /tmp/gen-jwt.js << 'JWTSCRIPT'
const crypto = require('crypto');
const secret = process.argv[2];
const role = process.argv[3];

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const header = base64url(JSON.stringify({alg:"HS256",typ:"JWT"}));
const payload = base64url(JSON.stringify({
  role: role,
  iss: "supabase",
  iat: 1609459200,
  exp: 1893456000
}));

const signature = crypto.createHmac('sha256', secret)
  .update(header + '.' + payload)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

console.log(header + '.' + payload + '.' + signature);
JWTSCRIPT

ANON_KEY=$(node /tmp/gen-jwt.js "$JWT_SECRET" "anon")
SERVICE_KEY=$(node /tmp/gen-jwt.js "$JWT_SECRET" "service_role")
rm /tmp/gen-jwt.js

POSTGRES_PASSWORD=$(openssl rand -hex 16)
DASHBOARD_PASSWORD=$(openssl rand -hex 16)
HOOK_SECRET=$(openssl rand -hex 32)

echo "  JWT keys generated successfully"

# =============================================
# STEP 4: Setup Supabase directory structure
# =============================================
echo "[4/9] Setting up Supabase directory..."
mkdir -p ~/supabase/docker/volumes/db/data
mkdir -p ~/supabase/docker/volumes/functions
mkdir -p ~/supabase/docker/volumes/storage

# Generate additional secrets
SECRET_KEY_BASE=$(openssl rand -hex 64)
PG_META_CRYPTO_KEY=$(openssl rand -base64 32 | tr -d '\n')
VAULT_ENC_KEY=$(openssl rand -base64 32 | tr -d '\n')
LOGFLARE_API_KEY=$(openssl rand -hex 32)

# Create Supabase .env with ALL required variables
cat > ~/supabase/docker/.env << ENVFILE
############
# Secrets
############
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_KEY}
DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
SECRET_KEY_BASE=${SECRET_KEY_BASE}
VAULT_ENC_KEY=${VAULT_ENC_KEY}

############
# Database
############
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API Proxy
############
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API
############
SITE_URL=https://justachat.net
API_EXTERNAL_URL=https://justachat.net
SUPABASE_PUBLIC_URL=https://justachat.net
PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Studio
############
DASHBOARD_USERNAME=admin
STUDIO_DEFAULT_PROJECT=justachat
STUDIO_DEFAULT_ORGANIZATION=justachat
STUDIO_PG_META_URL=http://meta:8080
SUPABASE_STUDIO_PORT=3000

############
# PG Meta
############
PG_META_CRYPTO_KEY=${PG_META_CRYPTO_KEY}
PG_META_PORT=8080

############
# Imgproxy
############
IMGPROXY_ENABLE_WEBP_DETECTION=true

############
# Functions
############
FUNCTIONS_VERIFY_JWT=false

############
# Auth
############
JWT_EXPIRY=3600
GOTRUE_SITE_URL=https://justachat.net
GOTRUE_URI_ALLOW_LIST=https://justachat.net,https://justachat.net/*,https://justachat.net/home
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOTRUE_EXTERNAL_GOOGLE_SECRET=${GOOGLE_CLIENT_SECRET}
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://justachat.net/auth/v1/callback
GOTRUE_MAILER_AUTOCONFIRM=true
GOTRUE_SMTP_ADMIN_EMAIL=Unix@justachat.net
GOTRUE_SMTP_PASS=
GOTRUE_DISABLE_SIGNUP=false
DISABLE_SIGNUP=false
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_ANONYMOUS_USERS=false
ADDITIONAL_REDIRECT_URLS=
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify

############
# Email Hook
############
GOTRUE_HOOK_SEND_EMAIL_ENABLED=true
GOTRUE_HOOK_SEND_EMAIL_URI=https://justachat.net/hook/email

############
# Analytics/Logflare (placeholders)
############
LOGFLARE_PUBLIC_ACCESS_TOKEN=${LOGFLARE_API_KEY}
LOGFLARE_PRIVATE_ACCESS_TOKEN=${LOGFLARE_API_KEY}

############
# Pooler (placeholders)
############
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_TENANT_ID=justachat
POOLER_DEFAULT_POOL_SIZE=20
POOLER_DB_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100

############
# Docker
############
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

############
# External APIs
############
OPENAI_API_KEY=${OPENAI_API_KEY}
RESEND_API_KEY=${RESEND_API_KEY}

############
# Misc
############
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false
TURNSTILE_SECRET_KEY=
ENVFILE

echo "  Supabase environment configured"

# =============================================
# STEP 5: Start Supabase stack (staged to avoid analytics blocking)
# =============================================
echo "[5/9] Starting Supabase Docker stack..."
cd ~/supabase/docker

# Pull latest images
sudo docker compose pull 2>/dev/null || true

# Stage 1: Start database first (required by everything)
echo "  Stage 1: Starting database..."
sudo docker compose up -d db
echo "  Waiting for database to initialize (20s)..."
sleep 20

# Stage 2: Wait for DB to be healthy
echo "  Stage 2: Waiting for database health check..."
for i in {1..30}; do
  DB_CID=$(sudo docker compose ps -q db 2>/dev/null || true)
  if [ -n "$DB_CID" ] && sudo docker inspect "$DB_CID" --format='{{.State.Health.Status}}' 2>/dev/null | grep -q healthy; then
    echo "  ✓ Database is healthy"
    break
  fi
  echo "    Waiting for DB... ($i/30)"
  sleep 2
done

# Ensure analytics can connect to DB (match supabase_admin password to POSTGRES_PASSWORD)
echo "  Stage 2b: Syncing supabase_admin password for analytics..."
POSTGRES_PASSWORD_LOCAL=$(grep "^POSTGRES_PASSWORD=" .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' || true)
DB_CID=$(sudo docker compose ps -q db 2>/dev/null || true)
if [ -n "$POSTGRES_PASSWORD_LOCAL" ] && [ -n "$DB_CID" ]; then
  sudo docker exec -i "$DB_CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<SQL
ALTER USER supabase_admin WITH PASSWORD '${POSTGRES_PASSWORD_LOCAL}';
SQL
else
  echo "  ⚠ Could not read POSTGRES_PASSWORD or locate db container; skipping password sync"
fi

# Stage 3: Start analytics in BACKGROUND (don't wait for health)
echo "  Stage 3: Starting analytics in background (non-blocking)..."
sudo docker compose up -d analytics --no-deps &
ANALYTICS_PID=$!

# Stage 4: Start all other services immediately
echo "  Stage 4: Starting remaining services..."
sleep 3
sudo docker compose up -d \
  vector \
  imgproxy \
  meta \
  supavisor \
  auth \
  rest \
  realtime \
  storage \
  functions \
  email-relay

# Start Kong without waiting for analytics health
sudo docker compose up -d kong --no-deps

# Studio is optional; start it last (and don't let analytics block it either)
sudo docker compose up -d studio --no-deps

# Wait for analytics background process to finish (just the command, not health)
wait $ANALYTICS_PID 2>/dev/null || true

echo "  Waiting for services to stabilize (15s)..."
sleep 15

# Quick health verification
echo "  Verifying core services..."
ANON_KEY_CHECK=$(grep "^ANON_KEY=" .env | cut -d'=' -f2- | tr -d '"')
AUTH_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/auth/v1/health" -H "apikey: $ANON_KEY_CHECK" 2>/dev/null || echo "000")
REST_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/rest/v1/" -H "apikey: $ANON_KEY_CHECK" 2>/dev/null || echo "000")

if [ "$AUTH_STATUS" = "200" ] && [ "$REST_STATUS" = "200" ]; then
  echo "  ✓ Auth API: OK"
  echo "  ✓ REST API: OK"
else
  echo "  ⚠ Auth API: $AUTH_STATUS"
  echo "  ⚠ REST API: $REST_STATUS"
  echo "  (Services may still be starting - continuing anyway)"
fi

echo "  Note: Analytics may still be warming up in background - this is normal"

# =============================================
# STEP 6: Clone and build frontend
# =============================================
echo "[6/9] Setting up frontend..."
sudo mkdir -p /var/www/justachat
sudo chown -R unix:unix /var/www/justachat

cd /var/www
rm -rf justachat
git clone https://github.com/UnixMint/justachat-unix.git justachat
cd justachat

# Create frontend .env
cat > .env << FRONTENV
VITE_SUPABASE_URL=https://justachat.net
VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
VITE_SUPABASE_PROJECT_ID=justachat-vps
FRONTENV

# Install and build
npm install
rm -rf dist node_modules/.vite .vite
npm run build

echo "  Frontend built successfully"

# =============================================
# STEP 7: Setup email webhook service
# =============================================
echo "[7/9] Setting up email webhook service..."
sudo mkdir -p /opt/email-webhook
sudo chown unix:unix /opt/email-webhook

cat > /opt/email-webhook/server.js << 'EMAILSERVER'
const http = require('http');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET') {
    res.writeHead(200);
    res.end('Email webhook OK');
    return;
  }

  if (req.method === 'POST' && req.url === '/hook/email') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { user, email_data } = payload;
        
        if (!user?.email) {
          console.log('No email in payload');
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({}));
          return;
        }

        console.log('Email request:', user.email, email_data?.email_action_type);
        
        const type = email_data?.email_action_type || 'unknown';
        const token_hash = email_data?.token_hash || '';
        const redirect = email_data?.redirect_to || 'https://justachat.net/home';
        
        let subject = 'Justachat Notification';
        let html = '';
        
        const verifyLink = `https://justachat.net/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirect)}`;
        
        if (type === 'signup') {
          subject = 'Welcome to Justachat! Confirm your email';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6366f1;">Welcome to Justachat!</h1>
              <p>Thanks for signing up. Click the button below to confirm your email:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Confirm Email
                </a>
              </p>
              <p style="color: #666; font-size: 12px;">If you didn't sign up, you can ignore this email.</p>
            </div>
          `;
        } else if (type === 'recovery') {
          subject = 'Reset your Justachat password';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6366f1;">Password Reset</h1>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </p>
              <p style="color: #666; font-size: 12px;">If you didn't request this, you can ignore this email.</p>
            </div>
          `;
        } else if (type === 'magiclink') {
          subject = 'Your Justachat login link';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6366f1;">Magic Link Login</h1>
              <p>Click the button below to log in:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Log In
                </a>
              </p>
            </div>
          `;
        } else if (type === 'email_change') {
          subject = 'Confirm your new email address';
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6366f1;">Email Change</h1>
              <p>Click the button below to confirm your new email:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Confirm Email
                </a>
              </p>
            </div>
          `;
        } else {
          subject = 'Justachat Notification';
          html = `<p>Action type: ${type}</p><p><a href="${verifyLink}">Click here</a></p>`;
        }
        
        // Send via Resend
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Unix <Unix@justachat.net>',
            to: [user.email],
            subject,
            html
          })
        });
        
        const result = await response.json();
        console.log('Resend response:', response.status, result);
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({}));
      } catch (e) {
        console.error('Error:', e.message);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {message: e.message}}));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3001, '127.0.0.1', () => {
  console.log('Email webhook running on http://127.0.0.1:3001');
});
EMAILSERVER

cat > /opt/email-webhook/.env << EMAILENV
RESEND_API_KEY=${RESEND_API_KEY}
EMAILENV

# Create systemd service
sudo tee /etc/systemd/system/justachat-email.service > /dev/null << SYSTEMD
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

sudo systemctl daemon-reload
sudo systemctl enable justachat-email
sudo systemctl start justachat-email

echo "  Email service started"

# =============================================
# STEP 8: Sync edge functions
# =============================================
echo "[8/9] Syncing edge functions..."
rm -rf ~/supabase/docker/volumes/functions/*
cp -r /var/www/justachat/supabase/functions/* ~/supabase/docker/volumes/functions/

cat > ~/supabase/docker/volumes/functions/.env << FUNCENV
SUPABASE_URL=https://justachat.net
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
FUNCENV

# Restart edge functions container
cd ~/supabase/docker
sudo docker restart supabase-edge-functions 2>/dev/null || true

echo "  Edge functions synced"

# =============================================
# STEP 9: Apply database schema
# =============================================
echo "[9/9] Applying database schema..."
if [ -f /var/www/justachat/public/vps-deploy/fresh-schema.sql ]; then
  sudo docker exec -i supabase-db psql -U postgres -d postgres < /var/www/justachat/public/vps-deploy/fresh-schema.sql
  echo "  Database schema applied"
else
  echo "  WARNING: fresh-schema.sql not found, run manually"
fi

# =============================================
# SAVE CREDENTIALS
# =============================================
cat > ~/justachat-credentials.txt << CREDS
============================================
JUSTACHAT VPS CREDENTIALS
Generated: $(date)
============================================

DATABASE
--------
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

JWT KEYS
--------
JWT_SECRET: ${JWT_SECRET}
ANON_KEY: ${ANON_KEY}
SERVICE_ROLE_KEY: ${SERVICE_KEY}

STUDIO
------
URL: http://localhost:3000 (SSH tunnel required)
Username: admin
Password: ${DASHBOARD_PASSWORD}

API KEYS (your input)
---------------------
RESEND_API_KEY: ${RESEND_API_KEY}
OPENAI_API_KEY: ${OPENAI_API_KEY}
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET: (hidden)

SERVICES
--------
Frontend: https://justachat.net
API: https://justachat.net/rest/v1/
Auth: https://justachat.net/auth/v1/
Email Webhook: http://127.0.0.1:3001

============================================
KEEP THIS FILE SAFE! DELETE AFTER SAVING!
============================================
CREDS

chmod 600 ~/justachat-credentials.txt

# =============================================
# DONE
# =============================================
echo ""
echo "============================================"
echo "REBUILD COMPLETE!"
echo "============================================"
echo ""
echo "Credentials saved to: ~/justachat-credentials.txt"
echo ""
echo "Test the site: https://justachat.net"
echo ""
echo "If anything fails, check logs with:"
echo "  sudo docker logs supabase-auth"
echo "  sudo journalctl -u justachat-email -f"
echo ""
