#!/bin/bash
# JustAChat VPS - Diagnose Password Reset & Email System
# Run: sudo bash /var/www/justachat/public/vps-deploy/diagnose-email-auth.sh

echo "========================================"
echo "  EMAIL & PASSWORD RESET DIAGNOSTICS"
echo "========================================"
echo ""

cd ~/supabase/docker 2>/dev/null || { echo "ERROR: ~/supabase/docker not found"; exit 1; }

echo "=== 1. EMAIL WEBHOOK SERVICE STATUS ==="
if systemctl is-active --quiet jac-email-webhook 2>/dev/null; then
  echo "✓ jac-email-webhook service is running"
  systemctl status jac-email-webhook --no-pager | head -5
else
  echo "✗ jac-email-webhook service NOT running or not found"
  echo "  Checking if email webhook is running on port 3001..."
  if ss -tlnp | grep -q ':3001'; then
    echo "  Something is listening on port 3001"
    ss -tlnp | grep ':3001'
  else
    echo "  ✗ Nothing listening on port 3001 - email webhook is DOWN"
  fi
fi
echo ""

echo "=== 2. GOTRUE EMAIL HOOK CONFIGURATION ==="
echo "Checking .env for email hook settings..."
grep -E "GOTRUE_HOOK|GOTRUE_SMTP|GOTRUE_MAILER" .env 2>/dev/null | head -20
echo ""

HOOK_URL=$(grep "GOTRUE_HOOK_SEND_EMAIL_URI\|GOTRUE_HOOK_CUSTOM_EMAIL_URI" .env 2>/dev/null | head -1 | cut -d'=' -f2-)
if [ -n "$HOOK_URL" ]; then
  echo "✓ Email hook URL configured: $HOOK_URL"
else
  echo "✗ No email hook URL found in .env"
  echo "  Password reset emails won't work without email configuration!"
fi
echo ""

echo "=== 3. TEST EMAIL WEBHOOK CONNECTIVITY ==="
# Get Docker gateway IP for internal connectivity
GATEWAY_IP=$(docker network inspect supabase_default 2>/dev/null | grep -oP '"Gateway": "\K[^"]+' | head -1)
if [ -z "$GATEWAY_IP" ]; then
  GATEWAY_IP="172.18.0.1"
fi
echo "Docker gateway IP: $GATEWAY_IP"

echo "Testing webhook from host (localhost:3001)..."
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{"test": true}' 2>/dev/null || echo "FAILED")
echo "Response code: $WEBHOOK_RESPONSE"

if [ "$WEBHOOK_RESPONSE" = "FAILED" ]; then
  echo "✗ Cannot connect to email webhook on localhost:3001"
elif [ "$WEBHOOK_RESPONSE" = "000" ]; then
  echo "✗ Email webhook not responding"
else
  echo "✓ Email webhook responded with HTTP $WEBHOOK_RESPONSE"
fi
echo ""

echo "=== 4. RECENT AUTH CONTAINER LOGS (email related) ==="
echo "Checking for email/password reset errors..."
docker logs supabase-auth --tail 100 2>&1 | grep -iE "email|password|reset|hook|send|error" | tail -20
echo ""

echo "=== 5. UFW FIREWALL CHECK ==="
echo "Checking if port 3001 is allowed from Docker subnet..."
sudo ufw status 2>/dev/null | grep -E "3001|172\."
if ! sudo ufw status 2>/dev/null | grep -q "3001"; then
  echo "⚠ Port 3001 may not be open for Docker containers"
fi
echo ""

echo "=== 6. RESEND API KEY CHECK ==="
if [ -f /opt/jac-email-webhook/.env ]; then
  echo "Email webhook .env found at /opt/jac-email-webhook/.env"
  if grep -q "RESEND_API_KEY" /opt/jac-email-webhook/.env 2>/dev/null; then
    RESEND_KEY=$(grep "RESEND_API_KEY" /opt/jac-email-webhook/.env | cut -d'=' -f2-)
    if [ -n "$RESEND_KEY" ] && [ "$RESEND_KEY" != '""' ]; then
      echo "✓ RESEND_API_KEY is configured (starts with: ${RESEND_KEY:0:10}...)"
    else
      echo "✗ RESEND_API_KEY is empty or not set!"
    fi
  else
    echo "✗ RESEND_API_KEY not found in webhook .env"
  fi
else
  echo "⚠ Email webhook .env not found at /opt/jac-email-webhook/.env"
  echo "  Checking alternative locations..."
  find /opt -name ".env" 2>/dev/null | head -5
fi
echo ""

echo "=== 7. SEND TEST EMAIL ==="
read -p "Do you want to send a test email? (y/n): " SEND_TEST
if [ "$SEND_TEST" = "y" ] || [ "$SEND_TEST" = "Y" ]; then
  read -p "Enter recipient email address: " TEST_EMAIL
  
  echo "Sending test via webhook..."
  TEST_RESULT=$(curl -s -X POST http://localhost:3001 \
    -H "Content-Type: application/json" \
    -d "{
      \"user\": {\"email\": \"$TEST_EMAIL\"},
      \"email_data\": {
        \"token\": \"test-token-123\",
        \"token_hash\": \"test-hash\",
        \"redirect_to\": \"https://justachat.net\",
        \"email_action_type\": \"recovery\",
        \"site_url\": \"https://justachat.net\"
      }
    }" 2>&1)
  
  echo "Webhook response: $TEST_RESULT"
  echo ""
  echo "Check $TEST_EMAIL inbox (and spam) for the test email"
fi
echo ""

echo "=== 8. GOTRUE SITE URL CHECK ==="
SITE_URL=$(grep "GOTRUE_SITE_URL" .env | cut -d'=' -f2-)
API_URL=$(grep "API_EXTERNAL_URL" .env | cut -d'=' -f2-)
echo "GOTRUE_SITE_URL: $SITE_URL"
echo "API_EXTERNAL_URL: $API_URL"
if [ "$SITE_URL" != "https://justachat.net" ]; then
  echo "⚠ GOTRUE_SITE_URL should be https://justachat.net"
fi
echo ""

echo "========================================"
echo "  DIAGNOSIS SUMMARY"
echo "========================================"
echo ""
echo "Common issues for password reset '{}'error:"
echo "1. Email webhook service not running"
echo "2. RESEND_API_KEY not configured or invalid"
echo "3. UFW blocking Docker->host on port 3001"
echo "4. GOTRUE_HOOK_SEND_EMAIL_URI not set in .env"
echo "5. Email webhook signature verification failing"
echo ""
echo "Quick fix commands:"
echo "  - Restart email webhook: sudo systemctl restart jac-email-webhook"
echo "  - Restart auth service: docker compose restart auth"
echo "  - Check webhook logs: sudo journalctl -u jac-email-webhook -f"
echo "========================================"
