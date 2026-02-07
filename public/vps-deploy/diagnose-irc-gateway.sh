#!/bin/bash
# JAC IRC Gateway Diagnostic Script
# Run: sudo bash /var/www/justachat/public/vps-deploy/diagnose-irc-gateway.sh
#
# Tests mIRC connectivity, Edge Function health, and auth flow

echo "============================================"
echo "  JAC IRC Gateway Diagnostic"
echo "  $(date)"
echo "============================================"
echo ""

cd ~/supabase/docker 2>/dev/null || cd /root/supabase/docker 2>/dev/null

# 1. Check if port 6667 is listening
echo "=== 1. Port 6667 (IRC) Check ==="
if ss -tlnp | grep -q ':6667'; then
  echo "✓ Port 6667 is OPEN"
  ss -tlnp | grep ':6667'
else
  echo "✗ Port 6667 is NOT listening!"
  echo "  This means no IRC server is running."
  echo "  Check if Nginx is proxying IRC or if a standalone process should be running."
fi

echo ""
echo "=== 2. Port 6697 (IRC SSL) Check ==="
if ss -tlnp | grep -q ':6697'; then
  echo "✓ Port 6697 (SSL) is OPEN"
  ss -tlnp | grep ':6697'
else
  echo "- Port 6697 (SSL) is NOT listening (optional)"
fi

echo ""
echo "=== 3. Nginx IRC Stream Config ==="
if grep -rq 'stream' /etc/nginx/nginx.conf 2>/dev/null; then
  echo "✓ Nginx has stream block (TCP proxy)"
  grep -A 20 'stream' /etc/nginx/nginx.conf | head -25
elif [ -f /etc/nginx/stream.d/irc.conf ]; then
  echo "✓ Nginx stream config found at /etc/nginx/stream.d/irc.conf"
  cat /etc/nginx/stream.d/irc.conf
else
  echo "✗ No Nginx stream/TCP proxy config found for IRC"
  echo "  IRC connections on port 6667 need to be proxied to the Edge Function"
fi

echo ""
echo "=== 4. Edge Function Container ==="
FUNC_STATUS=$(docker ps --format "{{.Names}}\t{{.Status}}" | grep -i "functions")
if [ -n "$FUNC_STATUS" ]; then
  echo "✓ Functions container: $FUNC_STATUS"
else
  echo "✗ Functions container NOT running!"
fi

echo ""
echo "=== 5. IRC Gateway Function Exists ==="
FUNC_DIR="/root/supabase/docker/volumes/functions/main"
if [ -f "$FUNC_DIR/irc-gateway/index.ts" ]; then
  echo "✓ irc-gateway/index.ts found in functions volume"
  echo "  Size: $(wc -c < "$FUNC_DIR/irc-gateway/index.ts") bytes"
else
  echo "✗ irc-gateway/index.ts NOT found at $FUNC_DIR"
  echo "  Checking alternative locations..."
  find /root/supabase -name "irc-gateway" -type d 2>/dev/null
fi

echo ""
echo "=== 6. Test IRC Gateway via HTTP (Edge Function) ==="
# Test if the edge function responds at all
ANON_KEY=$(grep "^ANON_KEY=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"')
if [ -z "$ANON_KEY" ]; then
  echo "✗ Could not read ANON_KEY from .env"
else
  echo "Testing edge function endpoint..."
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "apikey: $ANON_KEY" \
    -d '{"command":"PING","args":"test"}' \
    "http://127.0.0.1:8000/functions/v1/irc-gateway" 2>&1)
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")
  
  echo "  HTTP Status: $HTTP_CODE"
  echo "  Response: $BODY"
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ IRC Gateway edge function is responding"
  elif [ "$HTTP_CODE" = "401" ]; then
    echo "  ✗ 401 Unauthorized - ANON_KEY may be wrong"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "  ✗ 404 Not Found - function not deployed"
  elif [ "$HTTP_CODE" = "500" ]; then
    echo "  ✗ 500 Server Error - check function logs"
  else
    echo "  ✗ Unexpected response"
  fi
fi

echo ""
echo "=== 7. Test Auth (Simulated IRC Login) ==="
if [ -z "$ANON_KEY" ]; then
  echo "Skipped - no ANON_KEY"
else
  echo "Testing auth with PASS command simulation..."
  # This simulates what mIRC sends: PASS email;password
  # We test if the edge function can parse and authenticate
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "apikey: $ANON_KEY" \
    -d '{"command":"PASS","args":"test@test.com;testpassword123"}' \
    "http://127.0.0.1:8000/functions/v1/irc-gateway" 2>&1)
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")
  
  echo "  HTTP Status: $HTTP_CODE"
  echo "  Response: $BODY"
  
  if echo "$BODY" | grep -qi "invalid\|error\|unauthorized\|credentials"; then
    echo "  → Auth rejected (expected for test credentials)"
    echo "  ✓ Function is processing PASS commands correctly"
  elif echo "$BODY" | grep -qi "welcome\|authenticated\|success"; then
    echo "  ✓ Auth flow is working"
  else
    echo "  ? Unexpected response - review the output above"
  fi
fi

echo ""
echo "=== 8. GoTrue Auth Health ==="
AUTH_HEALTH=$(curl -s http://127.0.0.1:8000/auth/v1/health 2>/dev/null)
echo "Auth health: $AUTH_HEALTH"

echo ""
echo "=== 9. Recent IRC-Related Function Logs ==="
echo "(Last 30 lines mentioning irc/PASS/NICK/gateway)"
docker logs supabase-functions --tail 200 2>&1 | grep -iE "irc|gateway|PASS|NICK|USER|auth.*email" | tail -30

echo ""
echo "=== 10. Raw TCP Connection Test ==="
echo "Attempting raw TCP connection to localhost:6667..."
RESULT=$(echo -e "PASS test@test.com;test123\r\nNICK TestBot\r\nUSER TestBot 0 * :Test\r\nQUIT\r\n" | timeout 5 nc -q 3 127.0.0.1 6667 2>&1)
if [ $? -eq 0 ] && [ -n "$RESULT" ]; then
  echo "✓ Got response from port 6667:"
  echo "$RESULT" | head -20
else
  echo "✗ No response from port 6667 (connection refused or timeout)"
  echo "  mIRC will NOT be able to connect"
fi

echo ""
echo "=== 11. Firewall Check ==="
if command -v ufw &>/dev/null; then
  UFW_STATUS=$(ufw status 2>/dev/null | grep -E "6667|6697")
  if [ -n "$UFW_STATUS" ]; then
    echo "Firewall rules for IRC ports:"
    echo "$UFW_STATUS"
  else
    echo "✗ No firewall rules found for ports 6667/6697"
    echo "  Run: sudo ufw allow 6667/tcp && sudo ufw allow 6697/tcp"
  fi
else
  echo "UFW not installed, checking iptables..."
  iptables -L -n 2>/dev/null | grep -E "6667|6697" || echo "No iptables rules for IRC ports"
fi

echo ""
echo "============================================"
echo "  DIAGNOSIS SUMMARY"
echo "============================================"
echo ""
echo "For mIRC to connect, you need:"
echo "1. Port 6667 open and listening (TCP)"
echo "2. Something accepting IRC protocol on that port"
echo "3. The IRC gateway must authenticate via PASS email;password"
echo "4. GoTrue (auth) must be healthy to verify credentials"
echo ""
echo "If port 6667 isn't listening, the IRC gateway needs"
echo "a TCP listener (Node.js IRC server or Nginx stream proxy"
echo "forwarding to the Edge Function via WebSocket)."
echo ""
echo "Edge Functions are HTTP-based, so raw IRC (TCP) needs"
echo "a bridge/adapter layer to translate IRC protocol to HTTP."
echo ""
echo "============================================"
