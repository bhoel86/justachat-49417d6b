#!/bin/bash
# Full Auth Debug for VPS
# Run: sudo bash /var/www/justachat/public/vps-deploy/debug-auth-full.sh

echo "=== FULL AUTH DEBUG ==="
cd ~/supabase/docker

echo ""
echo "=== 1. Container Health ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "supabase-(auth|kong|rest|db)"

echo ""
echo "=== 2. Recent Auth Errors ==="
docker logs supabase-auth --tail 50 2>&1 | grep -iE "error|fail|invalid|denied" | tail -20

echo ""
echo "=== 3. JWT Configuration Check ==="
echo "Checking if JWT_SECRET matches between .env and containers..."
ENV_JWT=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | tr -d '"' | head -c 20)
echo "ENV JWT_SECRET starts with: ${ENV_JWT}..."

echo ""
echo "=== 4. ANON_KEY Validation ==="
ANON_KEY=$(grep "^ANON_KEY=" .env | cut -d'=' -f2 | tr -d '"')
echo "ANON_KEY length: ${#ANON_KEY}"
if [[ "$ANON_KEY" == ey* ]]; then
  echo "✓ ANON_KEY looks like a valid JWT (starts with 'ey')"
else
  echo "✗ ANON_KEY does NOT look like a JWT - this is likely the problem!"
fi

echo ""
echo "=== 5. Google OAuth Config ==="
grep -E "GOOGLE_(CLIENT_ID|CLIENT_SECRET|ENABLED)" .env | sed 's/=.*/=***HIDDEN***/'
GOOGLE_ENABLED=$(grep "GOTRUE_EXTERNAL_GOOGLE_ENABLED" .env | cut -d'=' -f2)
echo "Google OAuth enabled: $GOOGLE_ENABLED"

echo ""
echo "=== 6. Site URL & Redirects ==="
grep -E "GOTRUE_SITE_URL|GOTRUE_URI_ALLOW|API_EXTERNAL_URL" .env

echo ""
echo "=== 7. SMTP/Email Config (for password reset) ==="
grep -E "GOTRUE_SMTP|GOTRUE_MAILER" .env | grep -v PASSWORD | head -10
SMTP_HOST=$(grep "GOTRUE_SMTP_HOST" .env | cut -d'=' -f2)
if [ -z "$SMTP_HOST" ]; then
  echo "✗ SMTP not configured - password reset emails won't work!"
else
  echo "✓ SMTP configured: $SMTP_HOST"
fi

echo ""
echo "=== 8. Test Auth API Health ==="
AUTH_HEALTH=$(curl -s http://127.0.0.1:8000/auth/v1/health)
echo "Auth health: $AUTH_HEALTH"

echo ""
echo "=== 9. Test Auth Settings ==="
AUTH_SETTINGS=$(curl -s http://127.0.0.1:8000/auth/v1/settings 2>/dev/null)
echo "External providers:"
echo "$AUTH_SETTINGS" | grep -oE '"google":\s*(true|false)' || echo "(could not read)"

echo ""
echo "=== 10. Kong Gateway Auth Routing ==="
docker logs supabase-kong --tail 30 2>&1 | grep -iE "auth|error|401|403|500" | tail -10

echo ""
echo "=== DIAGNOSIS ==="
echo ""
echo "Common issues:"
echo "1. If ANON_KEY doesn't start with 'ey' - it's not a valid JWT"
echo "2. If SMTP not configured - password reset won't send emails"  
echo "3. If Google OAuth not enabled - login will fail"
echo "4. If GOTRUE_SITE_URL wrong - redirects fail"
echo ""
echo "=== Done ==="
