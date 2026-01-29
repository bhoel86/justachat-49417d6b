#!/bin/bash
# JAC Deploy Server - Quick Diagnostic
# Run: curl -sSL https://justachat.net/vps-deploy/check-deploy.sh | sudo bash

echo "========================================"
echo "JAC Deploy Server Diagnostic"
echo "========================================"
echo ""

# 1. Check if service is running
echo "=== Service Status ==="
if systemctl is-active --quiet jac-deploy; then
  echo "[OK] jac-deploy service is running"
else
  echo "[FAIL] jac-deploy service is NOT running"
  echo "  Fix: sudo systemctl start jac-deploy"
fi
echo ""

# 2. Check .env file
echo "=== Token Configuration ==="
if [ -f /opt/jac-deploy/.env ]; then
  TOKEN=$(grep "^DEPLOY_TOKEN=" /opt/jac-deploy/.env | cut -d'=' -f2)
  if [ -n "$TOKEN" ]; then
    echo "[OK] DEPLOY_TOKEN is set"
    echo "  Value: ${TOKEN:0:8}...${TOKEN: -4} (first 8 + last 4 chars)"
    echo ""
    echo "  COPY THIS FULL TOKEN TO YOUR BROWSER:"
    echo "  $TOKEN"
  else
    echo "[FAIL] DEPLOY_TOKEN is empty"
    echo "  Fix: echo 'DEPLOY_TOKEN=your-secret-token' >> /opt/jac-deploy/.env"
  fi
else
  echo "[FAIL] No .env file found"
  echo "  Fix: Create /opt/jac-deploy/.env with DEPLOY_TOKEN=your-token"
fi
echo ""

# 3. Check if port 6680 is listening
echo "=== Port 6680 ==="
if netstat -tlnp 2>/dev/null | grep -q ":6680" || ss -tlnp 2>/dev/null | grep -q ":6680"; then
  echo "[OK] Something is listening on port 6680"
else
  echo "[FAIL] Nothing listening on port 6680"
  echo "  Fix: sudo systemctl restart jac-deploy"
fi
echo ""

# 4. Test health endpoint
echo "=== Health Check ==="
HEALTH=$(curl -s http://127.0.0.1:6680/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "[OK] Health endpoint responds"
  echo "  Response: $HEALTH"
else
  echo "[FAIL] Health endpoint not responding"
  echo "  Response: $HEALTH"
fi
echo ""

# 5. Test authenticated endpoint
echo "=== Auth Test ==="
if [ -n "$TOKEN" ]; then
  AUTH_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:6680/deploy/status 2>/dev/null)
  if echo "$AUTH_TEST" | grep -q '"deployDir"'; then
    echo "[OK] Authentication works!"
    echo "  App Version: $(echo "$AUTH_TEST" | grep -o '"appVersion":"[^"]*"' | cut -d'"' -f4)"
  else
    echo "[FAIL] Authentication failed"
    echo "  Response: $AUTH_TEST"
  fi
else
  echo "[SKIP] No token to test with"
fi
echo ""

# 6. Check recent logs
echo "=== Recent Logs (last 10 lines) ==="
journalctl -u jac-deploy --no-pager -n 10 2>/dev/null || echo "No logs available"
echo ""

echo "========================================"
echo "NEXT STEPS:"
echo "========================================"
echo ""
echo "1. Copy the DEPLOY_TOKEN shown above"
echo "2. Go to https://justachat.net/admin/deploy"
echo "3. Click 'Clear' to remove old token"
echo "4. Paste the token and click 'Save Token'"
echo "5. Click 'Pull & Deploy' to test"
echo ""
