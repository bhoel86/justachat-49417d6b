#!/bin/bash
# JAC Deploy Token Diagnostic Script
# Run: bash /opt/jac-deploy/diagnose.sh

echo "=========================================="
echo "JAC Deploy Token Diagnostic"
echo "=========================================="
echo ""

# Check if server.js exists
echo "=== 1. Checking server.js ==="
if [ -f /opt/jac-deploy/server.js ]; then
  echo "✓ server.js found"
else
  echo "✗ server.js NOT found at /opt/jac-deploy/"
fi

# Check .env file
echo ""
echo "=== 2. Checking .env file ==="
if [ -f /opt/jac-deploy/.env ]; then
  echo "✓ .env file exists"
  echo "Contents (token masked):"
  cat /opt/jac-deploy/.env | sed 's/\(DEPLOY_TOKEN=\).*/\1[HIDDEN]/'
else
  echo "✗ No .env file at /opt/jac-deploy/.env"
fi

# Check systemd service
echo ""
echo "=== 3. Checking systemd service ==="
if [ -f /etc/systemd/system/jac-deploy.service ]; then
  echo "✓ Service file exists"
  echo "Environment lines:"
  grep -E "^Environment" /etc/systemd/system/jac-deploy.service | sed 's/\(DEPLOY_TOKEN=\).*/\1[HIDDEN]/'
else
  echo "✗ No systemd service file"
fi

# Check if service is running
echo ""
echo "=== 4. Service status ==="
systemctl is-active jac-deploy 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ Service is running"
  systemctl status jac-deploy --no-pager | head -15
else
  echo "✗ Service is NOT running"
fi

# Check what process is listening on port 6680
echo ""
echo "=== 5. Port 6680 check ==="
lsof -i :6680 2>/dev/null || netstat -tlnp 2>/dev/null | grep 6680

# Check process environment
echo ""
echo "=== 6. Process environment ==="
PID=$(pgrep -f "node.*server.js" | head -1)
if [ -n "$PID" ]; then
  echo "Process PID: $PID"
  echo "Token in process env:"
  cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep DEPLOY_TOKEN | sed 's/\(DEPLOY_TOKEN=\).*/\1[SET]/' || echo "NOT FOUND"
else
  echo "No node server.js process found"
fi

# Test the endpoint
echo ""
echo "=== 7. Health check (no auth) ==="
curl -s http://127.0.0.1:6680/health

echo ""
echo ""
echo "=========================================="
echo "RECOMMENDATION:"
echo "=========================================="
echo ""
echo "The server reads DEPLOY_TOKEN from:"
echo "1. Environment variable DEPLOY_TOKEN"
echo "2. .env file (if dotenv is installed)"
echo ""
echo "To fix, run:"
echo ""
echo "  # Stop the service"
echo "  systemctl stop jac-deploy"
echo ""
echo "  # Create/update .env"
echo "  echo 'DEPLOY_TOKEN=YOUR_TOKEN_HERE' > /opt/jac-deploy/.env"
echo "  echo 'DEPLOY_DIR=/var/www/justachat' >> /opt/jac-deploy/.env"
echo "  echo 'DEPLOY_PORT=6680' >> /opt/jac-deploy/.env"
echo ""
echo "  # Install dotenv if not present"
echo "  cd /opt/jac-deploy && npm install dotenv"
echo ""
echo "  # Start directly to test"
echo "  cd /opt/jac-deploy && node server.js"
echo ""
echo "  # Then in another terminal, test:"
echo "  curl -H 'Authorization: Bearer YOUR_TOKEN' http://127.0.0.1:6680/deploy/status"
echo ""
