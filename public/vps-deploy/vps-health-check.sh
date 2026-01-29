#!/bin/bash
# JustAChat VPS Health Check Script
# Run: sudo bash /var/www/justachat/public/vps-deploy/vps-health-check.sh

echo "========================================"
echo "  JUSTACHAT VPS HEALTH CHECK"
echo "========================================"
echo ""

cd ~/supabase/docker 2>/dev/null || { echo "ERROR: ~/supabase/docker not found"; exit 1; }

echo "=== 1. DOCKER CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -15
echo ""

echo "=== 2. JWT KEYS CHECK ==="
ANON_KEY=$(grep "^ANON_KEY=" .env | cut -d'=' -f2 | tr -d '"')
SERVICE_KEY=$(grep "^SERVICE_ROLE_KEY=" .env | cut -d'=' -f2 | tr -d '"')
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | tr -d '"')

echo "JWT_SECRET length: ${#JWT_SECRET}"
echo "ANON_KEY starts with: ${ANON_KEY:0:10}..."
echo "ANON_KEY length: ${#ANON_KEY}"

if [[ "$ANON_KEY" == ey* ]]; then
  echo "✓ ANON_KEY looks like a valid JWT"
else
  echo "✗ ANON_KEY is NOT a valid JWT - needs regeneration!"
fi
echo ""

echo "=== 3. API HEALTH CHECKS ==="
echo -n "Kong Gateway (8000): "
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/ || echo "FAILED"
echo ""

echo -n "Auth API (no key): "
curl -s http://127.0.0.1:8000/auth/v1/health | head -c 100
echo ""

echo -n "Auth API (with key): "
curl -s http://127.0.0.1:8000/auth/v1/health -H "apikey: $ANON_KEY" | head -c 100
echo ""

echo -n "REST API: "
curl -s http://127.0.0.1:8000/rest/v1/ -H "apikey: $ANON_KEY" | head -c 100
echo ""
echo ""

echo "=== 4. GOOGLE OAUTH CONFIG ==="
GOOGLE_ENABLED=$(grep "GOTRUE_EXTERNAL_GOOGLE_ENABLED" .env | cut -d'=' -f2)
SITE_URL=$(grep "GOTRUE_SITE_URL" .env | cut -d'=' -f2)
echo "Google OAuth enabled: $GOOGLE_ENABLED"
echo "Site URL: $SITE_URL"
echo ""

echo "=== 5. SMTP/EMAIL CONFIG ==="
SMTP_HOST=$(grep "GOTRUE_SMTP_HOST" .env | cut -d'=' -f2)
if [ -z "$SMTP_HOST" ] || [ "$SMTP_HOST" = '""' ]; then
  HOOK_URL=$(grep "GOTRUE_HOOK" .env | head -1)
  if [ -n "$HOOK_URL" ]; then
    echo "Using HTTP webhook for emails (Resend)"
  else
    echo "✗ No email configuration found!"
  fi
else
  echo "SMTP Host: $SMTP_HOST"
fi
echo ""

echo "=== 6. NGINX STATUS ==="
systemctl status nginx --no-pager | head -5
echo ""

echo "=== 7. RECENT AUTH ERRORS ==="
docker logs supabase-auth --tail 20 2>&1 | grep -iE "error|fail|invalid" | tail -5
echo ""

echo "=== 8. FRONTEND .ENV CHECK ==="
if [ -f /var/www/justachat/.env ]; then
  FRONTEND_KEY=$(grep "VITE_SUPABASE" /var/www/justachat/.env | head -2)
  echo "$FRONTEND_KEY"
  
  FRONTEND_ANON=$(grep "VITE_SUPABASE_PUBLISHABLE_KEY\|VITE_SUPABASE_ANON_KEY" /var/www/justachat/.env | cut -d'=' -f2 | head -1)
  if [ "$FRONTEND_ANON" = "$ANON_KEY" ]; then
    echo "✓ Frontend ANON_KEY matches backend"
  else
    echo "✗ Frontend ANON_KEY does NOT match backend - needs update!"
  fi
else
  echo "Frontend .env not found"
fi
echo ""

echo "=== 9. DISK SPACE ==="
df -h / | tail -1
echo ""

echo "=== 10. MEMORY ==="
free -h | head -2
echo ""

echo "========================================"
echo "  HEALTH CHECK COMPLETE"
echo "========================================"
