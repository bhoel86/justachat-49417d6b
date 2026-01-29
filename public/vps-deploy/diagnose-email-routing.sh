#!/bin/bash
# Quick VPS email routing diagnosis - run: curl -sL https://justachat.net/vps-deploy/diagnose-email-routing.sh | bash

echo "=== VPS EMAIL ROUTING CHECK ==="
echo ""

# Check frontend for Lovable URLs
echo "[1] Checking frontend build for Lovable URLs..."
grep -r "lovable\|supabase.co" /var/www/justachat/dist/assets/*.js 2>/dev/null | head -2 && echo "❌ PROBLEM: Frontend points to Lovable!" || echo "✓ No Lovable URLs"

# Check .env
echo ""
echo "[2] Frontend .env:"
cat /var/www/justachat/.env 2>/dev/null || echo "No .env found"

# Check GoTrue config
echo ""
echo "[3] GoTrue MAILER_URLPATHS_CONFIRMATION:"
docker exec supabase-auth printenv | grep -i "mailer\|site_url\|api_external" 2>/dev/null || echo "Cannot read GoTrue env"

# Check email service
echo ""
echo "[4] Email webhook service:"
systemctl is-active justachat-email 2>/dev/null || systemctl is-active jac-email-webhook 2>/dev/null || echo "No email service"
ss -tlnp 2>/dev/null | grep ":3001" || echo "Port 3001 not listening"

echo ""
echo "=== DONE - Paste output above ==="
