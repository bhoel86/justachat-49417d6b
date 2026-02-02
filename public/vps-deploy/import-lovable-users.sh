#!/bin/bash
# ============================================
# IMPORT LOVABLE USERS TO VPS
# Run: bash /var/www/justachat/public/vps-deploy/import-lovable-users.sh
# ============================================

set -e

echo "============================================"
echo "  IMPORTING LOVABLE USERS TO VPS"
echo "============================================"

# Users to import: EMAIL|USERNAME|AGE
# Fill in actual emails below
USERS=(
  "email1@example.com|MandaloreTheInvincib|18"
  "email2@example.com|focker69|18"
  "email3@example.com|Emmytech232|18"
  "email4@example.com|Prophet|18"
  "email5@example.com|w.ksfinest|18"
  "email6@example.com|Eric_Targaryen|18"
  "email7@example.com|cammy_wammy|18"
  "email8@example.com|NoelTrevor|18"
  "email9@example.com|broncosman|18"
  "email10@example.com|electricaquarius|18"
  "bhoel86@gmail.com|Mars|38"
)

CREDS_FILE="$HOME/imported-users-$(date +%Y%m%d).txt"
echo "Imported Users - $(date)" > "$CREDS_FILE"
echo "USERNAME | EMAIL | PASSWORD" >> "$CREDS_FILE"
echo "================================" >> "$CREDS_FILE"

for user_data in "${USERS[@]}"; do
  IFS='|' read -r email username age <<< "$user_data"
  
  # Skip placeholder emails
  if [[ "$email" == email* ]]; then
    echo "[SKIP] $username - update email in script first"
    continue
  fi
  
  # Check if already exists
  EXISTS=$(docker exec supabase-db psql -U postgres -t -c \
    "SELECT COUNT(*) FROM public.profiles WHERE username = '$username';" | xargs)
  
  if [ "$EXISTS" != "0" ]; then
    echo "[SKIP] $username already exists"
    continue
  fi
  
  # Generate random password
  PASSWORD=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c 12)
  USER_ID=$(cat /proc/sys/kernel/random/uuid)
  
  # Insert into auth.users
  docker exec supabase-db psql -U postgres -c "
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, aud, role)
    VALUES ('$USER_ID', '00000000-0000-0000-0000-000000000000', '$email', crypt('$PASSWORD', gen_salt('bf')), NOW(), NOW(), NOW(), '{\"username\": \"$username\", \"age\": $age}'::jsonb, 'authenticated', 'authenticated')
    ON CONFLICT (email) DO NOTHING;" 2>/dev/null
  
  # Insert profile
  docker exec supabase-db psql -U postgres -c "
    INSERT INTO public.profiles (user_id, username, age)
    VALUES ('$USER_ID', '$username', $age)
    ON CONFLICT DO NOTHING;" 2>/dev/null
  
  # Insert role
  docker exec supabase-db psql -U postgres -c "
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('$USER_ID', 'user')
    ON CONFLICT DO NOTHING;" 2>/dev/null
  
  echo "[OK] $username ($email)"
  echo "$username | $email | $PASSWORD" >> "$CREDS_FILE"
done

echo ""
echo "Done! Credentials saved to: $CREDS_FILE"
