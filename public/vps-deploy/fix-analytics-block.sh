#!/bin/bash
# JustAChat VPS - Fix Analytics Blocking Stack Startup
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-analytics-block.sh

set -euo pipefail

DOCKER_DIR="$HOME/supabase/docker"
cd "$DOCKER_DIR"

echo "========================================"
echo "  FIX ANALYTICS BLOCKING ISSUE"
echo "========================================"
echo ""

# Step 1: Stop everything
echo "=== Stopping all containers ==="
sudo docker compose down --remove-orphans
sleep 3

# Step 2: Start DB and Vector first (no dependencies)
echo ""
echo "=== Starting core services (db, vector, imgproxy) ==="
sudo docker compose up -d supabase-db supabase-vector supabase-imgproxy
sleep 15

# Step 3: Check if DB is healthy
echo ""
echo "=== Waiting for DB to be healthy ==="
for i in {1..30}; do
  if sudo docker inspect supabase-db --format='{{.State.Health.Status}}' 2>/dev/null | grep -q healthy; then
    echo "✓ DB is healthy"
    break
  fi
  echo "  Waiting for DB... ($i/30)"
  sleep 2
done

# Step 4: Start analytics in background (don't wait for health)
echo ""
echo "=== Starting analytics (background, no health wait) ==="
sudo docker compose up -d supabase-analytics --no-deps &
ANALYTICS_PID=$!

# Step 5: Immediately start all other services
echo ""
echo "=== Starting remaining services ==="
sleep 5
sudo docker compose up -d supabase-meta supabase-pooler supabase-auth supabase-rest supabase-realtime supabase-storage supabase-edge-functions supabase-kong supabase-studio

# Wait for analytics background process
wait $ANALYTICS_PID 2>/dev/null || true

echo ""
echo "=== Waiting 20s for services to initialize ==="
sleep 20

echo ""
echo "=== Container Status ==="
sudo docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase

echo ""
echo "=== Quick API Health Check ==="
ANON_KEY=$(grep "^ANON_KEY=" .env 2>/dev/null | cut -d'=' -f2- | tr -d '"' || true)

echo -n "Kong (8000): "
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/ 2>/dev/null || echo "FAILED"
echo ""

echo -n "Auth API: "
curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/auth/v1/health" -H "apikey: $ANON_KEY" 2>/dev/null || echo "FAILED"
echo ""

echo -n "REST API: "
curl -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/rest/v1/" -H "apikey: $ANON_KEY" 2>/dev/null || echo "FAILED"
echo ""

echo ""
echo "========================================"
echo "DONE. Analytics may still be starting in background."
echo "Core services (auth, rest, kong) should be operational."
echo "========================================"
