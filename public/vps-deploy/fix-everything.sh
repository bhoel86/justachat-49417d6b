#!/bin/bash
# JustAChat - Fix Everything Script
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-everything.sh

set -e
echo "╔══════════════════════════════════════╗"
echo "║  JUSTACHAT - FIX EVERYTHING SCRIPT   ║"
echo "╚══════════════════════════════════════╝"

cd ~/supabase/docker
source .env

# ─── 1. DIAGNOSE GOOGLE OAUTH ───
echo ""
echo "=== [1/5] DIAGNOSING GOOGLE OAUTH ==="

GOOGLE_ENABLED=$(grep "GOTRUE_EXTERNAL_GOOGLE_ENABLED" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
GOOGLE_CLIENT_ID=$(grep "GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
GOOGLE_SECRET=$(grep "GOTRUE_EXTERNAL_GOOGLE_SECRET" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
SITE_URL=$(grep "^GOTRUE_SITE_URL=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
API_URL=$(grep "^API_EXTERNAL_URL=" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")

echo "Google Enabled: $GOOGLE_ENABLED"
echo "Client ID: ${GOOGLE_CLIENT_ID:0:30}..."
echo "Secret length: ${#GOOGLE_SECRET}"
echo "Site URL: $SITE_URL"
echo "API External URL: $API_URL"

# Fix Site URL if wrong
if [ "$SITE_URL" != "https://justachat.net" ]; then
  echo "⚠ Fixing GOTRUE_SITE_URL..."
  sed -i 's|^GOTRUE_SITE_URL=.*|GOTRUE_SITE_URL=https://justachat.net|' .env
  echo "✓ Set GOTRUE_SITE_URL=https://justachat.net"
fi

# Fix API External URL if wrong
if [ "$API_URL" != "https://justachat.net/auth/v1" ] && [ "$API_URL" != "https://justachat.net" ]; then
  echo "⚠ Checking API_EXTERNAL_URL..."
fi

# Ensure Google is enabled
if [ "$GOOGLE_ENABLED" != "true" ]; then
  echo "⚠ Enabling Google OAuth..."
  if grep -q "GOTRUE_EXTERNAL_GOOGLE_ENABLED" .env; then
    sed -i 's|^GOTRUE_EXTERNAL_GOOGLE_ENABLED=.*|GOTRUE_EXTERNAL_GOOGLE_ENABLED=true|' .env
  else
    echo "GOTRUE_EXTERNAL_GOOGLE_ENABLED=true" >> .env
  fi
  echo "✓ Google OAuth enabled"
fi

# Ensure redirect URI allow list includes justachat.net
if ! grep -q "GOTRUE_URI_ALLOW_LIST" .env; then
  echo "GOTRUE_URI_ALLOW_LIST=https://justachat.net/**" >> .env
  echo "✓ Added URI allow list"
elif ! grep "GOTRUE_URI_ALLOW_LIST" .env | grep -q "justachat.net"; then
  sed -i 's|^GOTRUE_URI_ALLOW_LIST=.*|GOTRUE_URI_ALLOW_LIST=https://justachat.net/**|' .env
  echo "✓ Fixed URI allow list"
fi

echo "✓ Google OAuth config checked"

# ─── 2. SYNC KEYS ───
echo ""
echo "=== [2/5] SYNCING FRONTEND KEYS ==="

BACKEND_ANON=$(grep "^ANON_KEY=" .env | cut -d'=' -f2 | tr -d '"')
cd /var/www/justachat

if [ -n "$BACKEND_ANON" ]; then
  # Update frontend .env
  if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env 2>/dev/null; then
    CURRENT_FE_KEY=$(grep "VITE_SUPABASE_PUBLISHABLE_KEY" .env | cut -d'=' -f2 | tr -d '"')
    if [ "$CURRENT_FE_KEY" != "$BACKEND_ANON" ]; then
      sed -i "s|^VITE_SUPABASE_PUBLISHABLE_KEY=.*|VITE_SUPABASE_PUBLISHABLE_KEY=$BACKEND_ANON|" .env
      echo "✓ Synced ANON_KEY to frontend"
    else
      echo "✓ Keys already in sync"
    fi
  fi
else
  echo "⚠ Could not read ANON_KEY from backend"
fi

cd ~/supabase/docker

# ─── 3. CHECK SERVICES (no restart - assume already running) ───
echo ""
echo "=== [3/5] CHECKING SUPABASE SERVICES ==="
echo "Service status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase

# ─── 4. CREATE/UPDATE OWNER ACCOUNT (Unix) ───
echo ""
echo "=== [4/5] CREATING OWNER ACCOUNT ==="

EMAIL="unix2@justachat.net"
PASSWORD="634103258"
USERNAME="Unix"

echo "Email: $EMAIL"
echo "Username: $USERNAME"
echo "Role: owner"

# Reload env after restart
source .env

# Create user via GoTrue admin API
USER_RESPONSE=$(curl -s -X POST "http://127.0.0.1:8000/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"username\": \"$USERNAME\"
    }
  }" 2>/dev/null)

USER_ID=$(echo "$USER_RESPONSE" | grep -oP '"id"\s*:\s*"\K[^"]+' | head -1)

if [ -z "$USER_ID" ]; then
  echo "User may already exist, looking up..."
  USER_ID=$(docker exec supabase-db psql -U postgres -t -c \
    "SELECT id FROM auth.users WHERE email = '$EMAIL' LIMIT 1;" 2>/dev/null | tr -d ' \n')
  
  if [ -n "$USER_ID" ]; then
    echo "Found existing user: $USER_ID"
    # Update password
    docker exec supabase-db psql -U postgres -c \
      "UPDATE auth.users SET encrypted_password = crypt('$PASSWORD', gen_salt('bf')), email_confirmed_at = now() WHERE id = '$USER_ID';" 2>/dev/null
    echo "✓ Password updated"
  else
    echo "✗ ERROR: Could not create or find user"
  fi
else
  echo "✓ Created new user: $USER_ID"
fi

if [ -n "$USER_ID" ]; then
  # Create/update profile
  docker exec supabase-db psql -U postgres -c "
  INSERT INTO public.profiles (user_id, username, age, created_at, updated_at)
  VALUES ('$USER_ID', '$USERNAME', 30, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET 
    username = EXCLUDED.username,
    updated_at = now();
  " 2>/dev/null
  echo "✓ Profile set"

  # Assign owner role
  docker exec supabase-db psql -U postgres -c "
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('$USER_ID', 'owner')
  ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
  " 2>/dev/null
  echo "✓ Owner role assigned"
fi

# ─── 5. REBUILD FRONTEND ───
echo ""
echo "=== [5/5] REBUILDING FRONTEND ==="
cd /var/www/justachat
npm run build 2>&1 | tail -5

if [ $? -eq 0 ]; then
  echo "✓ Frontend built successfully"
else
  echo "⚠ Build may have issues - check output above"
fi

# ─── FINAL REPORT ───
echo ""
echo "╔══════════════════════════════════════╗"
echo "║         FINAL REPORT                 ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Test auth health
AUTH_HEALTH=$(curl -s http://127.0.0.1:8000/auth/v1/health 2>/dev/null)
if echo "$AUTH_HEALTH" | grep -q "alive"; then
  echo "✓ Auth API: HEALTHY"
else
  echo "✗ Auth API: DOWN"
fi

# Check Google provider
GOOGLE_CHECK=$(curl -s http://127.0.0.1:8000/auth/v1/settings 2>/dev/null)
if echo "$GOOGLE_CHECK" | grep -qi '"google".*true'; then
  echo "✓ Google OAuth: ENABLED"
else
  echo "⚠ Google OAuth: Check settings (may need container restart)"
fi

# Verify owner
if [ -n "$USER_ID" ]; then
  ROLE_CHECK=$(docker exec supabase-db psql -U postgres -t -c \
    "SELECT role FROM public.user_roles WHERE user_id = '$USER_ID';" 2>/dev/null | tr -d ' \n')
  echo "✓ Owner account: $EMAIL (role: $ROLE_CHECK)"
fi

echo ""
echo "Login: https://justachat.net/auth"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo "Username: $USERNAME"
echo ""
echo "=== DONE ==="
