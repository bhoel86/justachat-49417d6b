#!/bin/bash
# Create Unix as Owner with Full Superuser Powers
# Run: sudo bash /var/www/justachat/public/vps-deploy/create-owner-unix.sh

set -e

echo "=== CREATING UNIX OWNER ACCOUNT ==="
cd ~/supabase/docker

# Load environment
source .env

# User details
EMAIL="unix@justachat.com"
PASSWORD="634103258"
USERNAME="Unix"

echo ""
echo "Creating user: $EMAIL"
echo "Username: $USERNAME"
echo "Role: owner (superuser)"
echo ""

# Create user via GoTrue API
echo "Step 1: Creating auth user..."
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
  }")

echo "Auth response: $USER_RESPONSE"

# Extract user ID
USER_ID=$(echo "$USER_RESPONSE" | grep -oP '"id"\s*:\s*"\K[^"]+' | head -1)

if [ -z "$USER_ID" ]; then
  echo ""
  echo "User may already exist. Trying to fetch existing user..."
  
  # Try to get existing user by email
  EXISTING_USER=$(docker exec supabase-db psql -U postgres -t -c \
    "SELECT id FROM auth.users WHERE email = '$EMAIL' LIMIT 1;" 2>/dev/null | tr -d ' \n')
  
  if [ -n "$EXISTING_USER" ]; then
    USER_ID="$EXISTING_USER"
    echo "Found existing user: $USER_ID"
    
    # Update password for existing user
    echo "Updating password..."
    docker exec supabase-db psql -U postgres -c \
      "UPDATE auth.users SET encrypted_password = crypt('$PASSWORD', gen_salt('bf')) WHERE id = '$USER_ID';"
  else
    echo "ERROR: Could not create or find user!"
    exit 1
  fi
fi

echo ""
echo "User ID: $USER_ID"

# Create/update profile
echo ""
echo "Step 2: Creating/updating profile..."
docker exec supabase-db psql -U postgres -c "
INSERT INTO public.profiles (user_id, username, age, created_at, updated_at)
VALUES ('$USER_ID', '$USERNAME', 30, now(), now())
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  updated_at = now();
"

# Assign owner role
echo ""
echo "Step 3: Assigning owner role..."
docker exec supabase-db psql -U postgres -c "
INSERT INTO public.user_roles (user_id, role)
VALUES ('$USER_ID', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
"

# Verify
echo ""
echo "=== VERIFICATION ==="
echo ""
echo "User in auth.users:"
docker exec supabase-db psql -U postgres -c \
  "SELECT id, email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users WHERE email = '$EMAIL';"

echo ""
echo "Profile:"
docker exec supabase-db psql -U postgres -c \
  "SELECT user_id, username, age FROM public.profiles WHERE username = '$USERNAME';"

echo ""
echo "Role:"
docker exec supabase-db psql -U postgres -c \
  "SELECT user_id, role FROM public.user_roles WHERE user_id = '$USER_ID';"

echo ""
echo "=== SUCCESS ==="
echo ""
echo "✓ User created: $EMAIL"
echo "✓ Username: $USERNAME"  
echo "✓ Password: $PASSWORD"
echo "✓ Role: owner (full superuser access)"
echo ""
echo "Login at: https://justachat.net/auth"
echo ""
