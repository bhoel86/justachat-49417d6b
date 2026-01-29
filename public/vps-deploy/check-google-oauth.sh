#!/bin/bash
# Check Google OAuth Configuration on VPS
# Run: sudo bash /var/www/justachat/public/vps-deploy/check-google-oauth.sh

echo "========================================"
echo "  GOOGLE OAUTH CONFIGURATION CHECK"
echo "========================================"
echo ""

cd ~/supabase/docker 2>/dev/null || { echo "ERROR: ~/supabase/docker not found"; exit 1; }

echo "=== 1. GOOGLE OAUTH SETTINGS IN .env ==="
echo ""

GOOGLE_ENABLED=$(grep "GOTRUE_EXTERNAL_GOOGLE_ENABLED" .env | cut -d'=' -f2 | tr -d '"')
GOOGLE_CLIENT_ID=$(grep "GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID" .env | cut -d'=' -f2 | tr -d '"')
GOOGLE_SECRET=$(grep "GOTRUE_EXTERNAL_GOOGLE_SECRET" .env | cut -d'=' -f2 | tr -d '"')
SITE_URL=$(grep "^GOTRUE_SITE_URL=" .env | cut -d'=' -f2 | tr -d '"')
REDIRECT_URI=$(grep "GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI" .env | cut -d'=' -f2 | tr -d '"')

echo "GOTRUE_EXTERNAL_GOOGLE_ENABLED: $GOOGLE_ENABLED"
echo "GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:30}..."
echo "GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET:0:10}... (length: ${#GOOGLE_SECRET})"
echo "GOTRUE_SITE_URL: $SITE_URL"
echo "GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: $REDIRECT_URI"
echo ""

echo "=== 2. VALIDATION ==="
echo ""

# Check if enabled
if [ "$GOOGLE_ENABLED" = "true" ]; then
  echo "✓ Google OAuth is enabled"
else
  echo "✗ Google OAuth is NOT enabled - set GOTRUE_EXTERNAL_GOOGLE_ENABLED=true"
fi

# Check Client ID format
if [[ "$GOOGLE_CLIENT_ID" == *".apps.googleusercontent.com" ]]; then
  echo "✓ Client ID format looks valid"
else
  echo "✗ Client ID does NOT look like a Google OAuth client ID"
  echo "  Expected format: XXXX.apps.googleusercontent.com"
fi

# Check Secret exists
if [ ${#GOOGLE_SECRET} -gt 10 ]; then
  echo "✓ Client Secret is set (length: ${#GOOGLE_SECRET})"
else
  echo "✗ Client Secret is missing or too short"
fi

# Check Site URL
if [ "$SITE_URL" = "https://justachat.net" ]; then
  echo "✓ Site URL is correct"
else
  echo "✗ Site URL should be https://justachat.net (current: $SITE_URL)"
fi

echo ""
echo "=== 3. AUTH CONTAINER STATUS ==="
docker ps --filter "name=supabase-auth" --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "=== 4. RECENT AUTH LOGS (Google related) ==="
docker logs supabase-auth --tail 50 2>&1 | grep -iE "google|oauth|client|invalid" | tail -10
echo ""

echo "=== 5. GOOGLE CLOUD CONSOLE CHECKLIST ==="
echo ""
echo "In Google Cloud Console (https://console.cloud.google.com/):"
echo ""
echo "1. Go to APIs & Services > Credentials"
echo "2. Check your OAuth 2.0 Client ID exists and matches:"
echo "   ${GOOGLE_CLIENT_ID:0:50}..."
echo ""
echo "3. Verify Authorized JavaScript origins includes:"
echo "   - https://justachat.net"
echo ""
echo "4. Verify Authorized redirect URIs includes:"
echo "   - https://justachat.net/auth/v1/callback"
echo ""
echo "5. Check OAuth consent screen is set to 'In Production' (not Testing)"
echo ""
echo "========================================"
echo "  IF CLIENT ID IS WRONG, UPDATE .env:"
echo "========================================"
echo ""
echo "nano ~/supabase/docker/.env"
echo ""
echo "Set these values:"
echo "  GOTRUE_EXTERNAL_GOOGLE_ENABLED=true"
echo "  GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com"
echo "  GOTRUE_EXTERNAL_GOOGLE_SECRET=your-client-secret"
echo ""
echo "Then restart:"
echo "  cd ~/supabase/docker && docker compose down && docker compose up -d"
echo ""
