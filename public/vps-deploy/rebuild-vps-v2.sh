#!/bin/bash
# JustAChat VPS - Full rebuild (v2)
# - Runs as unix user (never root)
# - Staged startup so analytics never blocks Kong
# - Fixes analytics DB login (supabase_admin password)
# - Optionally disables root login (SSH)
#
# Run: bash /var/www/justachat/public/vps-deploy/rebuild-vps-v2.sh

set -euo pipefail

echo "============================================"
echo "JUSTACHAT VPS COMPLETE REBUILD (v2)"
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$HOME/supabase/docker"

require_service() {
  local svc="$1"
  if ! sudo docker compose config --services 2>/dev/null | grep -qx "$svc"; then
    return 1
  fi
  return 0
}

compose_up_if_exists() {
  local svcs=()
  for s in "$@"; do
    if require_service "$s"; then
      svcs+=("$s")
    fi
  done
  if [ ${#svcs[@]} -gt 0 ]; then
    sudo docker compose up -d "${svcs[@]}"
  fi
}

compose_up_no_deps_if_exists() {
  local svc="$1"
  if require_service "$svc"; then
    sudo docker compose up -d "$svc" --no-deps
  fi
}

db_container_id() {
  sudo docker compose ps -q db 2>/dev/null || true
}

# =============================================
# COLLECT API KEYS UPFRONT
# =============================================
echo ""
echo "Enter your API keys (press Enter to skip if already saved):"
echo ""
read -r -p "RESEND_API_KEY: " RESEND_API_KEY
read -r -p "OPENAI_API_KEY: " OPENAI_API_KEY
read -r -p "TURNSTILE_SECRET_KEY (Cloudflare CAPTCHA): " TURNSTILE_SECRET_KEY
read -r -p "GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
read -r -s -p "GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
echo ""

if [ -z "${RESEND_API_KEY}" ] || [ -z "${OPENAI_API_KEY}" ] || [ -z "${GOOGLE_CLIENT_ID}" ] || [ -z "${GOOGLE_CLIENT_SECRET}" ]; then
  echo ""
  echo "ERROR: Core API keys are required (RESEND, OPENAI, GOOGLE)!"
  echo ""
  exit 1
fi

if [ -z "${TURNSTILE_SECRET_KEY}" ]; then
  echo ""
  echo "WARNING: TURNSTILE_SECRET_KEY not provided - CAPTCHA will not work!"
  echo "You can add it later to: ~/supabase/docker/volumes/functions/.env"
  echo ""
fi

# =============================================
# STEP 0: HARDEN (DISABLE ROOT LOGIN)
# =============================================
echo ""
read -r -p "Disable root login now (recommended)? [y/N]: " DISABLE_ROOT
if [[ "${DISABLE_ROOT}" =~ ^[Yy]$ ]]; then
  bash "$SCRIPT_DIR/harden-disable-root.sh"
else
  echo "Skipping root disable step"
fi

# =============================================
# STEP 1: Stop all services
# =============================================
echo ""
echo "[1/10] Stopping services..."
sudo systemctl stop jac-deploy 2>/dev/null || true
sudo systemctl stop justachat-email 2>/dev/null || true

if [ -d "$DOCKER_DIR" ]; then
  cd "$DOCKER_DIR"
  sudo docker compose down --remove-orphans 2>/dev/null || true
fi

# =============================================
# STEP 2: Clean old installation
# =============================================
echo "[2/10] Cleaning old installation..."
sudo rm -rf /var/www/justachat
sudo rm -rf "$DOCKER_DIR/volumes/db/data"/* 2>/dev/null || true

# =============================================
# STEP 3: Generate fresh JWT keys
# =============================================
echo "[3/10] Generating fresh JWT credentials..."
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')

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
SECRET_KEY_BASE=$(openssl rand -hex 64)
PG_META_CRYPTO_KEY=$(openssl rand -base64 32 | tr -d '\n')
VAULT_ENC_KEY=$(openssl rand -base64 32 | tr -d '\n')
LOGFLARE_API_KEY=$(openssl rand -hex 32)

echo "  JWT keys generated successfully"

# =============================================
# STEP 4: Setup directory structure + write backend env
# =============================================
echo "[4/10] Setting up backend env..."
mkdir -p "$DOCKER_DIR/volumes/db/data" "$DOCKER_DIR/volumes/functions" "$DOCKER_DIR/volumes/storage"

cat > "$DOCKER_DIR/.env" << ENVFILE
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
# Meta
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
# Pooler
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

echo "  Backend environment configured"

# =============================================
# STEP 5: Start backend stack (staged: analytics can't block Kong)
# =============================================
echo "[5/10] Starting backend Docker stack (staged)..."
cd "$DOCKER_DIR"

sudo docker compose pull 2>/dev/null || true

echo "  Stage 1: Starting core services (db, vector, imgproxy)..."
compose_up_if_exists db vector imgproxy

echo "  Waiting for DB to initialize (20s)..."
sleep 20

echo "  Waiting for DB health check..."
for i in {1..40}; do
  DB_CID=$(db_container_id)
  if [ -n "$DB_CID" ] && sudo docker inspect "$DB_CID" --format='{{.State.Health.Status}}' 2>/dev/null | grep -q healthy; then
    echo "  ✓ DB is healthy"
    break
  fi
  echo "    Waiting for DB... ($i/40)"
  sleep 2
done

echo "  Syncing supabase_admin password for analytics (best-effort)..."
DB_CID=$(db_container_id)
if [ -n "$DB_CID" ]; then
  # Some stacks treat supabase_admin as reserved and forbid changing it.
  # This must never abort the rebuild; analytics is non-critical.
  set +e
  sudo docker exec -i "$DB_CID" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<SQL
ALTER USER supabase_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
SQL
  RC=$?
  set -e
  if [ "$RC" -ne 0 ]; then
    echo "  ⚠ Could not update supabase_admin (reserved role); continuing (analytics may fail)"
  fi
fi

echo "  Stage 2: Skipping analytics (disabled for stability)..."
# Analytics is non-essential and frequently blocks rebuilds - permanently skipped

echo "  Stage 3: Starting remaining services..."
compose_up_if_exists meta supavisor auth rest realtime storage functions email-relay

echo "  Stage 4: Starting kong (no-deps so analytics can't block)..."
compose_up_no_deps_if_exists kong

echo "  Stage 5: Starting studio (no-deps)..."
compose_up_no_deps_if_exists studio

echo "  Waiting 15s for Kong to stabilize..."
sleep 15

echo "  Stage 6: Fixing Kong realtime WebSocket (remove key-auth + acl on realtime-v1)..."
KONG_YML="$DOCKER_DIR/volumes/api/kong.yml"
if [ -f "$KONG_YML" ]; then
  # Supabase Realtime WebSocket connects via: /realtime/v1/websocket?apikey=...
  # Kong's key-auth does not read query-string apikey by default, causing 403.
  # Realtime validates JWT itself, so we remove key-auth + acl for realtime-v1.
  python3 - "$KONG_YML" <<'FIXWS'
import sys, re

path = sys.argv[1]
lines = open(path, "r", encoding="utf-8").read().splitlines(True)

out: list[str] = []
in_realtime = False
modified = False

def is_realtime_start(line: str) -> bool:
    return bool(re.match(r"^\s{2}- name:\s+realtime-v1\s*$", line))

def is_new_top_service(line: str) -> bool:
    # Top-level service entries are indented by exactly 2 spaces.
    return bool(re.match(r"^\s{2}- name:\s+", line)) and not is_realtime_start(line)

i = 0
while i < len(lines):
    line = lines[i]

    if is_realtime_start(line):
        in_realtime = True
        out.append(line)
        i += 1
        continue

    if in_realtime and is_new_top_service(line):
        in_realtime = False
        out.append(line)
        i += 1
        continue

    if in_realtime:
        m = re.match(r"^(\s+)- name:\s+(key-auth|acl)\s*$", line)
        if m:
            indent = m.group(1)
            modified = True
            i += 1
            # Skip the entire plugin block until the next sibling plugin (- name: ...)
            # or until we exit the realtime-v1 service.
            while i < len(lines):
                nxt = lines[i]
                if is_new_top_service(nxt):
                    break
                if re.match(r"^" + re.escape(indent) + r"- name:\s+", nxt):
                    break
                i += 1
            continue

    out.append(line)
    i += 1

if modified:
    open(path, "w", encoding="utf-8").write("".join(out))
    print("  ✓ Removed key-auth + acl from realtime-v1 (WebSocket should upgrade to 101)")
else:
    print("  ✓ Realtime WebSocket plugins already fixed or not present")
FIXWS

  # Restart Kong to apply the fix
  echo "  Restarting Kong with fixed realtime-v1 WebSocket config..."
  sudo docker compose restart kong
  sleep 5
else
  echo "  ⚠ kong.yml not found, skipping realtime-v1 WebSocket fix"
fi

echo "  Container status:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E 'supabase|realtime|kong|studio|supavisor|logflare' || true

# =============================================
# STEP 6: Clone and build frontend
# =============================================
echo "[6/10] Setting up frontend..."
sudo mkdir -p /var/www/justachat
sudo chown -R unix:unix /var/www/justachat

cd /var/www
rm -rf justachat
git clone https://github.com/bhoel86/justachat-49417d6b.git justachat
cd justachat

cat > .env << FRONTENV
VITE_SUPABASE_URL=https://justachat.net
VITE_SUPABASE_PUBLISHABLE_KEY=${ANON_KEY}
VITE_SUPABASE_PROJECT_ID=justachat-vps
FRONTENV

npm install
rm -rf dist node_modules/.vite .vite
npm run build

echo "  Frontend built successfully"

# =============================================
# STEP 7: Setup email webhook service
# =============================================
echo "[7/10] Setting up email webhook service..."
sudo mkdir -p /opt/email-webhook
sudo chown unix:unix /opt/email-webhook

cat > /opt/email-webhook/server.js << 'EMAILSERVER'
const http = require('http');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const server = http.createServer(async (req, res) => {
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
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({}));
          return;
        }

        const type = email_data?.email_action_type || 'unknown';
        const token_hash = email_data?.token_hash || '';
        const redirect = email_data?.redirect_to || 'https://justachat.net/home';

        const verifyLink = `https://justachat.net/auth/v1/verify?token=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirect)}`;

        let subject = 'Justachat Notification';
        let html = `<p>Action type: ${type}</p><p><a href="${verifyLink}">Click here</a></p>`;

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
        }

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

        await response.json().catch(() => ({}));

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({}));
      } catch (e) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {message: e.message}}));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3001, '127.0.0.1', () => {
  console.log('Email webhook running on http://127.0.0.1:3001');
});
EMAILSERVER

cat > /opt/email-webhook/.env << EMAILENV
RESEND_API_KEY=${RESEND_API_KEY}
EMAILENV

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
sudo systemctl restart justachat-email

echo "  Email service started"

# =============================================
# STEP 8: Sync functions volume + create router
# =============================================
echo "[8/10] Syncing backend functions volume..."
rm -rf "$DOCKER_DIR/volumes/functions"/*
cp -r /var/www/justachat/supabase/functions/* "$DOCKER_DIR/volumes/functions/"

# Create the main router (CRITICAL: dispatches requests to sub-functions)
mkdir -p "$DOCKER_DIR/volumes/functions/main"
cat > "$DOCKER_DIR/volumes/functions/main/index.ts" << 'MAINROUTER'
// Edge-runtime main service router
// Dispatches /function-name to /home/deno/functions/function-name/index.ts
//
// IMPORTANT:
// Most functions in this repo use `serve(...)` (std/http) which internally calls `Deno.serve(...)`.
// To run those functions from a single "main" service, we temporarily monkey-patch `Deno.serve`
// to capture the handler for a function module when it is imported.

type Handler = (req: Request) => Response | Promise<Response>;

const handlers = new Map<string, Handler>();

async function loadHandler(functionName: string): Promise<Handler> {
  const cached = handlers.get(functionName);
  if (cached) return cached;

  const originalServe = (Deno as unknown as { serve: unknown }).serve;
  let captured: Handler | null = null;

  // Patch Deno.serve so imports that call serve(handler) register into `captured`
  (Deno as unknown as { serve: unknown }).serve = (optionsOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = (typeof optionsOrHandler === "function" ? optionsOrHandler : maybeHandler) as Handler | undefined;
    if (!handler) throw new Error("Router: could not capture handler");
    captured = handler;
    // Return a minimal object compatible with std/http's serve() expectations.
    return { finished: Promise.resolve(), shutdown() {} } as unknown;
  };

  try {
    // Use file:// URL for absolute path imports.
    const fileUrl = new URL(`file:///home/deno/functions/${functionName}/index.ts`);
    // Cache-bust to avoid stale modules if functions are re-synced.
    fileUrl.searchParams.set("t", String(Date.now()));
    await import(fileUrl.href);
  } finally {
    (Deno as unknown as { serve: unknown }).serve = originalServe;
  }

  if (!captured) {
    throw new Error(`Router: function '${functionName}' did not call serve()`);
  }

  handlers.set(functionName, captured);
  return captured;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Health check endpoint
  if (path === "/" || path === "/health") {
    return new Response(JSON.stringify({ healthy: true, router: "main" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract function name from path (e.g., /verify-captcha -> verify-captcha)
  const match = path.match(/^\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const functionName = match[1];

  try {
    const handler = await loadHandler(functionName);

    // Strip /<functionName> prefix so the function sees '/' as its pathname.
    const proxiedUrl = new URL(req.url);
    const stripped = proxiedUrl.pathname.replace(new RegExp(`^\\/${functionName}`), "") || "/";
    proxiedUrl.pathname = stripped;

    const proxiedReq = new Request(proxiedUrl.toString(), req.clone());
    return await handler(proxiedReq);
  } catch (err) {
    console.error(`Router error for ${functionName}:`, err);
    return new Response(JSON.stringify({ error: "Function not found", function: functionName }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
});
MAINROUTER

echo "  Main router created at volumes/functions/main/index.ts"

# Create functions environment file
cat > "$DOCKER_DIR/volumes/functions/.env" << FUNCENV
SUPABASE_URL=https://justachat.net
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY:-}
OPENAI_API_KEY=${OPENAI_API_KEY}
FUNCENV

# Set correct ownership for deno user (UID 1000)
sudo chown -R 1000:1000 "$DOCKER_DIR/volumes/functions"

# Restart functions container if present
if require_service functions; then
  sudo docker compose restart functions 2>/dev/null || true
fi

echo "  Functions synced with router"

# =============================================
# STEP 9: Apply database schema
# =============================================
echo "[9/10] Applying database schema..."
DB_CID=$(db_container_id)
if [ -n "$DB_CID" ] && [ -f /var/www/justachat/public/vps-deploy/fresh-schema.sql ]; then
  sudo docker exec -i "$DB_CID" psql -U postgres -d postgres < /var/www/justachat/public/vps-deploy/fresh-schema.sql
  echo "  Database schema applied"
else
  echo "  WARNING: db container or fresh-schema.sql not found, run manually"
fi

# =============================================
# STEP 10: Save credentials
# =============================================
cat > "$HOME/justachat-credentials.txt" << CREDS
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

============================================
KEEP THIS FILE SAFE! DELETE AFTER SAVING!
============================================
CREDS

chmod 600 "$HOME/justachat-credentials.txt"

echo ""
echo "============================================"
echo "REBUILD COMPLETE!"
echo "============================================"
echo "Credentials saved to: $HOME/justachat-credentials.txt"
echo ""
echo "Verify APIs:"
echo "  cd $DOCKER_DIR"
echo "  ANON_KEY=\$(grep '^ANON_KEY=' .env | cut -d'=' -f2- | tr -d '"')"
echo "  curl -s http://127.0.0.1:8000/auth/v1/health -H \"apikey: \$ANON_KEY\""
echo ""
