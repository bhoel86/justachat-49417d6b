#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - BOT FIX & FULL SYNC
#
# This script:
# 1. Pulls latest code from Git (including watermark changes)
# 2. Rebuilds the frontend with clean Vite cache
# 3. Initializes bot_settings table if empty (connects admin UI to bots)
# 4. Fixes edge runtime router (absolute paths, no ?t= cache-busting)
# 5. Syncs edge functions from repo to volume
# 6. Restarts containers
#
# Usage:
#   cd /var/www/justachat && git pull
#   bash public/vps-deploy/fix-bots-and-sync.sh
#
# Or run directly after git pull:
#   bash /var/www/justachat/public/vps-deploy/fix-bots-and-sync.sh
#===============================================================================

set -euo pipefail

echo "============================================"
echo "JUSTACHAT VPS - BOT FIX & FULL SYNC"
echo "============================================"

# Directories
APP_DIR="/var/www/justachat"
DOCKER_DIR="$HOME/supabase/docker"
FUNCTIONS_DIR="$DOCKER_DIR/volumes/functions"

# 1. Pull latest code
echo ""
echo "[1/6] Pulling latest code..."
cd "$APP_DIR"
git pull

# 2. Rebuild frontend
echo ""
echo "[2/6] Rebuilding frontend..."
rm -rf dist node_modules/.vite .vite 2>/dev/null || true
npm run build

# 3. Initialize bot_settings if empty
echo ""
echo "[3/6] Initializing bot_settings table..."
cd "$DOCKER_DIR"
source .env

# Get all room names from config
ROOM_NAMES='["general","music","games","technology","movies-tv","sports","politics","dating","adults","help","lounge","trivia"]'

# Check if bot_settings exists
SETTINGS_CHECK=$(curl -s "http://127.0.0.1:8000/rest/v1/bot_settings?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

if [ "$SETTINGS_CHECK" = "[]" ]; then
  echo "Creating default bot_settings..."
  curl -s -X POST "http://127.0.0.1:8000/rest/v1/bot_settings" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{
      \"enabled\": true,
      \"allowed_channels\": $ROOM_NAMES,
      \"chat_speed\": 5,
      \"moderator_bots_enabled\": true
    }"
  echo ""
  echo "✓ bot_settings initialized"
else
  echo "✓ bot_settings already exists"
fi

# 4. Fix edge runtime router (no ?t= query strings)
echo ""
echo "[4/6] Fixing edge runtime router..."
mkdir -p "$FUNCTIONS_DIR/main"

cat > "$FUNCTIONS_DIR/main/index.ts" << 'ROUTER'
// Edge-runtime main service router (VPS)
// Uses absolute paths without ?t= cache-busting
// Version: main-v2

type Handler = (req: Request) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();

async function loadHandler(functionName: string): Promise<Handler> {
  const cached = handlers.get(functionName);
  if (cached) return cached;

  const originalServe = (Deno as unknown as { serve: unknown }).serve;
  let captured: Handler | null = null;

  (Deno as unknown as { serve: unknown }).serve = (optionsOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = (typeof optionsOrHandler === "function" ? optionsOrHandler : maybeHandler) as Handler | undefined;
    if (!handler) throw new Error("Router: could not capture handler");
    captured = handler;
    return { finished: Promise.resolve(), shutdown() {} } as unknown;
  };

  try {
    // Use absolute file path - NO ?t= query string
    const absolutePath = `/home/deno/functions/${functionName}/index.ts`;
    await import(`file://${absolutePath}`);
  } finally {
    (Deno as unknown as { serve: unknown }).serve = originalServe;
  }

  if (!captured) throw new Error(`Router: function '${functionName}' did not call serve()`);
  handlers.set(functionName, captured);
  return captured;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/" || path === "/health") {
    return new Response(JSON.stringify({ healthy: true, router: "main-v2" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

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
    const proxiedUrl = new URL(req.url);
    proxiedUrl.pathname = proxiedUrl.pathname.replace(new RegExp(`^\\/${functionName}`), "") || "/";
    return await handler(new Request(proxiedUrl.toString(), req.clone()));
  } catch (err) {
    console.error(`Router error for ${functionName}:`, err);
    return new Response(JSON.stringify({ error: "Function not found", function: functionName }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
});
ROUTER

echo "✓ Router written with absolute paths (no ?t=)"

# 5. Sync edge functions from repo
echo ""
echo "[5/6] Syncing edge functions from repo..."
for func in "$APP_DIR/supabase/functions"/*; do
  name="$(basename "$func")"
  if [ -d "$func" ] && [ "$name" != "_shared" ]; then
    rm -rf "$FUNCTIONS_DIR/$name"
    cp -r "$func" "$FUNCTIONS_DIR/"
    echo "  ✓ Synced: $name"
  fi
done

# 6. Fix ownership and restart
echo ""
echo "[6/6] Fixing ownership and restarting edge functions..."
sudo chown -R 1000:1000 "$FUNCTIONS_DIR"
cd "$DOCKER_DIR"
sudo docker compose restart functions

echo ""
echo "============================================"
echo "✓ ALL DONE!"
echo ""
echo "Test bots: bash $APP_DIR/public/vps-deploy/diagnose-bots.sh"
echo "Admin UI:  https://justachat.net/admin/bots"
echo "============================================"
