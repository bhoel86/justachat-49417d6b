#!/bin/bash
# Debug Google OAuth on VPS
# Run: sudo bash /var/www/justachat/public/vps-deploy/debug-google-oauth.sh

echo "=== Google OAuth Debug ==="
cd ~/supabase/docker

echo ""
echo "=== 1. GoTrue Auth Container Status ==="
docker ps --filter "name=supabase-auth" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== 2. Recent GoTrue Auth Logs (looking for OAuth errors) ==="
docker logs supabase-auth --tail 50 2>&1 | grep -iE "google|oauth|redirect|error|provider|external" || echo "(no relevant logs found)"

echo ""
echo "=== 3. Checking GoTrue Environment Variables ==="
docker exec supabase-auth env 2>/dev/null | grep -iE "GOTRUE_SITE_URL|GOTRUE_URI_ALLOW|GOTRUE_EXTERNAL_GOOGLE|GOTRUE_API_EXTERNAL_URL" | head -20 || echo "(could not read env)"

echo ""
echo "=== 4. Current .env Google OAuth Settings ==="
grep -iE "GOOGLE|GOTRUE_SITE_URL|GOTRUE_URI_ALLOW|API_EXTERNAL_URL" .env | head -20

echo ""
echo "=== 5. Testing Auth API Health ==="
curl -s http://127.0.0.1:8000/auth/v1/health || echo "Failed to reach auth API"

echo ""
echo "=== 6. Testing Google Provider Config ==="
curl -s http://127.0.0.1:8000/auth/v1/settings | grep -i "google" || echo "(no google settings visible)"

echo ""
echo "=== 7. Kong Gateway Status ==="
docker ps --filter "name=supabase-kong" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "=== 8. Kong Logs for Auth Errors ==="
docker logs supabase-kong --tail 30 2>&1 | grep -iE "auth|error|401|403|500" || echo "(no relevant logs)"

echo ""
echo "=== Summary ==="
echo "If GOTRUE_EXTERNAL_GOOGLE_ENABLED is not 'true', Google OAuth won't work."
echo "If GOTRUE_SITE_URL or GOTRUE_URI_ALLOW_LIST are wrong, redirects will fail."
echo ""
echo "=== Done ==="
