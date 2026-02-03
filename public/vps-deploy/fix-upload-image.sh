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

echo "✅ File written: $TARGET"
echo "📊 Line count: $(wc -l < "$TARGET")"

# Restart functions container
cd /home/unix/supabase/docker
echo "🔄 Restarting edge functions..."
docker compose restart functions

sleep 3
echo "📋 Recent logs:"
docker compose logs functions 2>&1 | grep -i "upload-image\|error\|listening" | tail -10

echo ""
echo "✅ Done! Test image upload in chat."
