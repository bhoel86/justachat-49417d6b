#!/bin/bash
# Sync Frontend Keys with Backend
# Run: sudo bash /var/www/justachat/public/vps-deploy/sync-frontend-keys.sh

echo "=== SYNCING FRONTEND KEYS ==="

# Get backend ANON_KEY
BACKEND_ANON=$(grep "^ANON_KEY=" ~/supabase/docker/.env | cut -d'=' -f2 | tr -d '"')

if [ -z "$BACKEND_ANON" ]; then
  echo "ERROR: Could not read ANON_KEY from ~/supabase/docker/.env"
  exit 1
fi

echo "Backend ANON_KEY: ${BACKEND_ANON:0:50}..."

# Update frontend .env
cd /var/www/justachat

# Check if VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY exists
if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
  sed -i "s|^VITE_SUPABASE_PUBLISHABLE_KEY=.*|VITE_SUPABASE_PUBLISHABLE_KEY=$BACKEND_ANON|" .env
  echo "✓ Updated VITE_SUPABASE_PUBLISHABLE_KEY"
elif grep -q "VITE_SUPABASE_ANON_KEY" .env; then
  sed -i "s|^VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$BACKEND_ANON|" .env
  echo "✓ Updated VITE_SUPABASE_ANON_KEY"
else
  echo "VITE_SUPABASE_PUBLISHABLE_KEY=$BACKEND_ANON" >> .env
  echo "✓ Added VITE_SUPABASE_PUBLISHABLE_KEY"
fi

echo ""
echo "=== REBUILDING FRONTEND ==="
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Frontend rebuilt successfully!"
  echo ""
  echo "=== VERIFYING ==="
  FRONTEND_KEY=$(grep "VITE_SUPABASE_PUBLISHABLE_KEY\|VITE_SUPABASE_ANON_KEY" .env | cut -d'=' -f2 | head -1)
  if [ "$FRONTEND_KEY" = "$BACKEND_ANON" ]; then
    echo "✓ Keys are now in sync!"
  else
    echo "✗ Keys still don't match - check manually"
  fi
else
  echo "✗ Build failed!"
  exit 1
fi

echo ""
echo "=== DONE - Test login at https://justachat.net ==="
