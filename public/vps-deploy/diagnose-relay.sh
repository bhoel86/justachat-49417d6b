#!/bin/bash
# JAC Web→IRC Relay Diagnostic
# Run: sudo bash /var/www/justachat/public/vps-deploy/diagnose-relay.sh

echo "========================================"
echo "  Web→IRC Relay Diagnostic $(date '+%H:%M:%S')"
echo "========================================"

cd ~/supabase/docker 2>/dev/null || cd /root/supabase/docker 2>/dev/null
source .env 2>/dev/null

echo ""
echo "=== 1. Edge Functions Container ==="
docker inspect --format='{{.State.Status}} uptime={{.State.StartedAt}}' supabase-edge-functions 2>/dev/null || echo "NOT RUNNING"

echo ""
echo "=== 2. Realtime Container ==="
docker inspect --format='{{.State.Status}} uptime={{.State.StartedAt}}' supabase-realtime 2>/dev/null || echo "NOT RUNNING"

echo ""
echo "=== 3. Publication Tables ==="
docker exec supabase-db psql -U postgres -t -c "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename;" 2>/dev/null

echo ""
echo "=== 4. Realtime Health ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:4000/api/health 2>/dev/null || echo "UNREACHABLE on 4000"
echo ""
curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:8000/realtime/v1/ 2>/dev/null || echo "UNREACHABLE via Kong"

echo ""
echo "=== 5. Deploy ID in Logs ==="
docker logs --tail 100 supabase-edge-functions 2>&1 | grep -i "2026-02-09\|relay\|realtime\|GATEWAY_DEPLOY" | tail -10

echo ""
echo "=== 6. Relay Subscription Errors ==="
docker logs --tail 200 supabase-edge-functions 2>&1 | grep -iE "error|timed.out|channel_error|closed|refused|SUBSCRIBED|subscribe" | tail -15

echo ""
echo "=== 7. Realtime Container Logs ==="
docker logs --tail 50 supabase-realtime 2>&1 | grep -iE "error|connect|subscribe|tenant|publication" | tail -10

echo ""
echo "=== 8. SUPABASE_URL in Functions Env ==="
docker exec supabase-edge-functions env 2>/dev/null | grep -i "SUPABASE_URL\|SERVICE_ROLE" | sed 's/=.\{20\}/=***REDACTED***/'

echo ""
echo "=== 9. Kong Proxy to Realtime ==="
curl -s -o /dev/null -w "HTTP %{http_code}" -H "apikey: ${ANON_KEY:-$SUPABASE_ANON_KEY}" http://127.0.0.1:8000/realtime/v1/ 2>/dev/null
echo ""

echo ""
echo "=== 10. Active IRC Sessions ==="
docker logs --tail 200 supabase-edge-functions 2>&1 | grep -iE "session|authenticated|NICK|connected" | tail -10

echo ""
echo "=== 11. Recent Messages in DB (last 3) ==="
docker exec supabase-db psql -U postgres -t -c "SELECT LEFT(content,40) as msg, created_at FROM public.messages ORDER BY created_at DESC LIMIT 3;" 2>/dev/null

echo ""
echo "========================================"
echo "  DONE - Paste all output above"
echo "========================================"
