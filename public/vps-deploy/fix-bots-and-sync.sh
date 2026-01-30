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

# 3.5. Update handle_new_user function for Google OAuth usernames
echo ""
echo "[3.5/6] Updating handle_new_user trigger for Google OAuth..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p 5432 -U postgres -d postgres << 'SQLEOF'
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  final_username TEXT;
  google_name TEXT;
  base_username TEXT;
  counter INT := 0;
BEGIN
  -- Check for Google OAuth name first (from raw_user_meta_data)
  google_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'username'
  );
  
  -- Determine base username
  IF google_name IS NOT NULL AND google_name != '' THEN
    -- Use first name from Google, clean it up
    base_username := REGEXP_REPLACE(SPLIT_PART(google_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g');
    IF LENGTH(base_username) < 2 THEN
      base_username := REGEXP_REPLACE(google_name, '[^a-zA-Z0-9]', '', 'g');
    END IF;
  ELSE
    -- Fall back to explicit username from signup form
    base_username := NEW.raw_user_meta_data->>'username';
  END IF;
  
  -- Final fallback to 'User' if still empty
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'User';
  END IF;
  
  -- Truncate to 16 chars to leave room for numbers
  base_username := LEFT(base_username, 16);
  
  -- Ensure uniqueness by adding random suffix if needed
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
    IF counter > 100 THEN
      -- Fallback to UUID suffix if too many collisions
      final_username := base_username || LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 4);
      EXIT;
    END IF;
  END LOOP;
  
  INSERT INTO public.profiles (user_id, username, age, parent_email, is_minor)
  VALUES (
    NEW.id, 
    final_username,
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'parent_email',
    COALESCE((NEW.raw_user_meta_data->>'is_minor')::boolean, false)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;
SQLEOF
echo "✓ handle_new_user trigger updated"

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
