#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - FIX BOT ROUTER (MAIN-SERVICE SANDBOX)
#
# Fixes the edge-runtime "main service" router so it can dispatch to functions
# that call `serve(...)` and so it works with --main-service sandbox restrictions.
#
# Usage:
#   cd /var/www/justachat && git pull
#   bash public/vps-deploy/fix-bots-router.sh
#
# Then test:
#   bash public/vps-deploy/diagnose-bots.sh
#===============================================================================

set -euo pipefail

DOCKER_DIR="$HOME/supabase/docker"
FUNCTIONS_DIR="$DOCKER_DIR/volumes/functions"

echo "=== Fixing bot router in: $FUNCTIONS_DIR ==="

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "ERROR: $FUNCTIONS_DIR not found"
  exit 1
fi

if [ ! -f "$FUNCTIONS_DIR/chat-bot/index.ts" ]; then
  echo "ERROR: chat-bot/index.ts not found at $FUNCTIONS_DIR/chat-bot/index.ts"
  echo "Run: cd /var/www/justachat && git pull"
  echo "Then re-sync functions volume."
  exit 1
fi

mkdir -p "$FUNCTIONS_DIR/main"

echo "Backing up existing router..."
if [ -f "$FUNCTIONS_DIR/main/index.ts" ]; then
  cp "$FUNCTIONS_DIR/main/index.ts" "$FUNCTIONS_DIR/main/index.ts.bak.$(date +%s)"
fi

echo "Writing sandbox-compatible router..."
python3 - <<'PY'
router = r'''// Edge-runtime main service router (VPS)
//
// This runtime is started with: --main-service /home/deno/functions/main
// In this mode, imports outside the main-service directory may be blocked.
//
// Additionally, most functions in this repo call `serve(...)` (std/http), which
// internally calls Deno.serve(handler) but does not export a handler.
// We capture that handler by temporarily monkey-patching Deno.serve during import.

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
    const fileUrl = new URL(`file:///home/deno/functions/main/${functionName}/index.ts`);
    fileUrl.searchParams.set("t", String(Date.now()));
    await import(fileUrl.href);
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
    return new Response(JSON.stringify({ healthy: true, router: "main" }), {
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
'''

open("volumes/functions/main/index.ts", "w", encoding="utf-8").write(router)
print("OK: wrote volumes/functions/main/index.ts")
PY

echo "Mirroring functions under main/ (sandbox requirement)..."
for d in "$FUNCTIONS_DIR"/*; do
  name="$(basename "$d")"
  case "$name" in
    main|.env|deno.json|import_map.json) continue ;;
  esac
  if [ -d "$d" ]; then
    rm -rf "$FUNCTIONS_DIR/main/$name"
    cp -r "$d" "$FUNCTIONS_DIR/main/"
  fi
done

echo "Setting ownership for edge runtime user (UID 1000)..."
sudo chown -R 1000:1000 "$FUNCTIONS_DIR"

echo "Restarting edge functions container..."
cd "$DOCKER_DIR"
sudo docker compose restart functions

echo "Done. Next: bash /var/www/justachat/public/vps-deploy/diagnose-bots.sh"
