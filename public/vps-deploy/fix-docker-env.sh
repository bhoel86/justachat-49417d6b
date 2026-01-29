#!/bin/bash
# Quick fix for missing Docker env variables
set -e

DOCKER_ENV="$HOME/supabase/docker/.env"

echo "=== Fixing missing Docker .env variables ==="

# Add DOCKER_SOCKET_LOCATION if missing
if ! grep -q "DOCKER_SOCKET_LOCATION" "$DOCKER_ENV"; then
    echo "DOCKER_SOCKET_LOCATION=/var/run/docker.sock" >> "$DOCKER_ENV"
    echo "✓ Added DOCKER_SOCKET_LOCATION"
fi

# Add other commonly missing variables
declare -A DEFAULTS=(
    ["POSTGRES_HOST"]="db"
    ["POSTGRES_DB"]="postgres"
    ["JWT_EXPIRY"]="3600"
)

for VAR in "${!DEFAULTS[@]}"; do
    if ! grep -q "^${VAR}=" "$DOCKER_ENV"; then
        echo "${VAR}=${DEFAULTS[$VAR]}" >> "$DOCKER_ENV"
        echo "✓ Added ${VAR}"
    fi
done

echo ""
echo "=== Restarting auth container ==="
cd ~/supabase/docker
sudo docker compose up -d auth

echo ""
echo "=== Verifying ==="
sleep 3
sudo docker ps | grep -E "auth|supabase-auth" && echo "✓ Auth container running"

echo ""
echo "=== Testing webhook connectivity ==="
curl -s http://127.0.0.1:3001/health || echo "(webhook health check)"

echo ""
echo "Done! Try password reset at https://justachat.net/auth"
