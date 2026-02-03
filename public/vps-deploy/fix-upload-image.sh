#!/bin/bash
# Fix upload-image edge function on VPS
# Run: bash public/vps-deploy/fix-upload-image.sh

set -euo pipefail

TARGET="/home/unix/supabase/docker/volumes/functions/main/upload-image/index.ts"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE="$REPO_ROOT/supabase/functions/upload-image/index.ts"

echo "🔧 Fixing upload-image edge function..."

if [ ! -f "$SOURCE" ]; then
  echo "❌ Source function not found: $SOURCE" >&2
  echo "Make sure you're running this from the git repo after a successful pull." >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"

# Copy the repo's known-good implementation (supports multipart/form-data uploads)
cp -f "$SOURCE" "$TARGET"

# Sanity check: ensure we didn't accidentally install a JSON-only handler
if ! grep -q "multipart/form-data" "$TARGET"; then
  echo "❌ Sanity check failed: installed function does not mention multipart/form-data" >&2
  echo "   This would cause JSON parse errors when the client uploads with FormData." >&2
  exit 1
fi

if ! grep -q "req.formData" "$TARGET"; then
  echo "❌ Sanity check failed: installed function does not call req.formData()" >&2
  echo "   This would cause JSON parse errors when the client uploads with FormData." >&2
  exit 1
fi

echo "✅ File written: $TARGET"
echo "📊 Line count: $(wc -l < "$TARGET")"

echo "🔎 Installed handler markers:"
grep -n "multipart/form-data\|req\.formData" "$TARGET" | head -n 20

# Restart functions container
cd /home/unix/supabase/docker
echo "🔄 Restarting edge functions..."
docker compose restart functions

sleep 3
echo "📋 Recent logs:"
docker compose logs functions 2>&1 | grep -i "upload-image\|error\|listening" | tail -10

echo ""
echo "✅ Done! Test image upload in chat."
