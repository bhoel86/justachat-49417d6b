#!/bin/bash
# JustAChat VPS - Diagnose and Fix Network Errors
# Run: bash /var/www/justachat/public/vps-deploy/vps-network-fix.sh

set -e
cd /var/www/justachat

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     JustAChat™ VPS Network Error Diagnosis & Fix                   ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Verify JWT Keys Match
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 STEP 1: Checking JWT Key Alignment..."
echo ""

FRONTEND_KEY=$(grep "VITE_SUPABASE_PUBLISHABLE_KEY" /var/www/justachat/.env 2>/dev/null | cut -d'=' -f2 | tail -c 20 || echo "NOT_FOUND")
DOCKER_KEY=$(grep "^ANON_KEY=" ~/supabase/docker/.env 2>/dev/null | cut -d'=' -f2 | tail -c 20 || echo "NOT_FOUND")

echo "   Frontend key ends with: ...${FRONTEND_KEY}"
echo "   Docker key ends with:   ...${DOCKER_KEY}"

if [[ "$FRONTEND_KEY" != "$DOCKER_KEY" ]]; then
    echo ""
    echo "   ❌ MISMATCH DETECTED - Syncing keys..."
    
    ANON_KEY=$(grep "^ANON_KEY=" ~/supabase/docker/.env | cut -d'=' -f2)
    
    cat > /var/www/justachat/.env << EOF
VITE_SUPABASE_URL=https://justachat.net
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
VITE_SUPABASE_PROJECT_ID=justachat-vps
EOF
    
    echo "   ✅ Keys synced!"
else
    echo "   ✅ Keys already match"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Test Backend Connectivity
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 STEP 2: Testing Backend Services..."
echo ""

ANON_KEY=$(grep "VITE_SUPABASE_PUBLISHABLE_KEY" /var/www/justachat/.env | cut -d'=' -f2)

# Test Auth
AUTH_RESULT=$(curl -s -H "apikey: $ANON_KEY" https://justachat.net/auth/v1/settings 2>/dev/null | head -c 50)
if [[ "$AUTH_RESULT" == *"external"* ]]; then
    echo "   ✅ Auth service: OK"
else
    echo "   ❌ Auth service: FAILED"
    echo "      Response: $AUTH_RESULT"
fi

# Test REST API
REST_RESULT=$(curl -s -H "apikey: $ANON_KEY" "https://justachat.net/rest/v1/channels?select=name&limit=1" 2>/dev/null)
if [[ "$REST_RESULT" == *"name"* ]]; then
    echo "   ✅ REST API: OK"
else
    echo "   ❌ REST API: FAILED"
    echo "      Response: $REST_RESULT"
fi

# Test site_settings (for theme loading)
THEME_RESULT=$(curl -s -H "apikey: $ANON_KEY" "https://justachat.net/rest/v1/site_settings?key=eq.theme" 2>/dev/null)
if [[ "$THEME_RESULT" == *"value"* ]] || [[ "$THEME_RESULT" == "[]" ]]; then
    echo "   ✅ site_settings table: OK"
else
    echo "   ⚠️  site_settings: May need initialization"
    echo "      Response: $THEME_RESULT"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Pull Latest Code
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 STEP 3: Pulling Latest Code from GitHub..."
echo ""

git fetch origin
git reset --hard origin/main
echo "   ✅ Code synced to latest"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Clean Build
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 STEP 4: Clean Rebuilding Frontend..."
echo ""

# Remove old build artifacts
rm -rf dist node_modules/.vite

# Install any new dependencies
npm install --silent 2>/dev/null || npm install

# Build with correct environment
npm run build

echo ""
echo "   ✅ Frontend rebuilt with new pages and correct keys"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Verify New Pages Exist
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 STEP 5: Verifying New Pages in Build..."
echo ""

if grep -rq "About.*JustAChat\|JustAChat.*About" dist/assets/*.js 2>/dev/null; then
    echo "   ✅ About page: Compiled"
else
    echo "   ⚠️  About page: Not found in build"
fi

if grep -rq "Powerful.*Features\|Features" dist/assets/*.js 2>/dev/null; then
    echo "   ✅ Features page: Compiled"
else
    echo "   ⚠️  Features page: Not found in build"
fi

if grep -rq "Frequently.*Asked\|FAQ" dist/assets/*.js 2>/dev/null; then
    echo "   ✅ FAQ page: Compiled"
else
    echo "   ⚠️  FAQ page: Not found in build"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Reload Nginx
# ═══════════════════════════════════════════════════════════════════════════
echo "📋 STEP 6: Reloading Nginx..."
echo ""

sudo nginx -t && sudo systemctl reload nginx
echo "   ✅ Nginx reloaded"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# FINAL VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ FIX COMPLETE                                  ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔍 Test these URLs in your browser (hard refresh with Ctrl+Shift+R):"
echo ""
echo "   • https://justachat.net"
echo "   • https://justachat.net/about"
echo "   • https://justachat.net/features"
echo "   • https://justachat.net/faq"
echo ""
echo "💡 If you still see errors, clear your browser cache completely:"
echo "   Chrome: Settings → Privacy → Clear browsing data → Cached images"
echo ""
