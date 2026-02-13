#!/bin/bash
# JustAChat VPS - Regenerate JWT Keys & Restart Stack
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-jwt-regen.sh

set -euo pipefail

ENV_FILE="/root/supabase/docker/.env"
COMPOSE_FILE="/root/supabase/docker/docker-compose.yml"
FRONTEND_ENV="/var/www/justachat/.env"

echo "============================================"
echo "  JUSTACHAT - REGENERATE JWT KEYS"
echo "============================================"

# Get current JWT_SECRET
JWT=$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2)
echo "JWT_SECRET: ${JWT:0:20}..."

# Generate new ANON_KEY
NEW_ANON=$(python3 -c "
import hmac, hashlib, base64, json
header = base64.urlsafe_b64encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode()).rstrip(b'=').decode()
payload = base64.urlsafe_b64encode(json.dumps({'role':'anon','iss':'supabase','iat':1609459200,'exp':1893456000}).encode()).rstrip(b'=').decode()
sig = hmac.new('$JWT'.encode(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()
print(f'{header}.{payload}.{base64.urlsafe_b64encode(sig).rstrip(b\"=\").decode()}')
")

# Generate new SERVICE_ROLE_KEY
NEW_SERVICE=$(python3 -c "
import hmac, hashlib, base64, json
header = base64.urlsafe_b64encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode()).rstrip(b'=').decode()
payload = base64.urlsafe_b64encode(json.dumps({'role':'service_role','iss':'supabase','iat':1609459200,'exp':1893456000}).encode()).rstrip(b'=').decode()
sig = hmac.new('$JWT'.encode(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()
print(f'{header}.{payload}.{base64.urlsafe_b64encode(sig).rstrip(b\"=\").decode()}')
")

echo ""
echo "New ANON_KEY: ${NEW_ANON:0:30}..."
echo "New SERVICE_ROLE_KEY: ${NEW_SERVICE:0:30}..."

# Backup .env
cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%F-%H%M%S)"
echo "✓ Backend .env backed up"

# Update backend .env
sed -i "s|^ANON_KEY=.*|ANON_KEY=$NEW_ANON|" "$ENV_FILE"
sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$NEW_SERVICE|" "$ENV_FILE"
echo "✓ Backend .env updated"

# Update frontend .env
if [ -f "$FRONTEND_ENV" ]; then
  cp "$FRONTEND_ENV" "$FRONTEND_ENV.bak.$(date +%F-%H%M%S)"
  sed -i "s|^VITE_SUPABASE_PUBLISHABLE_KEY=.*|VITE_SUPABASE_PUBLISHABLE_KEY=$NEW_ANON|" "$FRONTEND_ENV"
  sed -i "s|^VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$NEW_ANON|" "$FRONTEND_ENV"
  echo "✓ Frontend .env updated"
fi

# Update realtime tenant
docker exec supabase-db psql -U supabase_admin -d postgres -c \
  "UPDATE _realtime.tenants SET jwt_secret = '$JWT' WHERE external_id = 'realtime-dev';" 2>/dev/null || echo "Note: realtime tenant update skipped"
echo "✓ Realtime tenant jwt_secret updated"

# Restart full stack
echo ""
echo "Restarting Supabase stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
echo "✓ Stack restarting"

# Rebuild frontend
echo ""
echo "Rebuilding frontend..."
cd /var/www/justachat
rm -rf dist
chown -R unix:unix /var/www/justachat/
su - unix -c "cd /var/www/justachat && npm run build"
echo "✓ Frontend rebuilt"

# Reload Nginx
systemctl reload nginx
echo "✓ Nginx reloaded"

# Wait for services
echo ""
echo "Waiting 30s for services..."
sleep 30

# Verify
echo ""
echo "=== SERVICE STATUS ==="
docker ps --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== KEY VERIFICATION ==="
ANON_CHECK=$(grep '^ANON_KEY=' "$ENV_FILE" | cut -d= -f2)
python3 -c "
import hmac, hashlib, base64
parts = '$ANON_CHECK'.split('.')
sig = hmac.new('$JWT'.encode(), (parts[0]+'.'+parts[1]).encode(), hashlib.sha256).digest()
expected = base64.urlsafe_b64encode(sig).rstrip(b'=').decode()
print(f'ANON_KEY signature MATCH: {expected == parts[2]}')
"

echo ""
echo "============================================"
echo "  DONE! Test at https://justachat.net"
echo "============================================"
