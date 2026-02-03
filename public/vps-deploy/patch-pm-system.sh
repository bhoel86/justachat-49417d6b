#!/bin/bash
# ============================================
# JUSTACHAT VPS PM SYSTEM COMPLETE PATCH
# Syncs all PM-related edge functions and verifies
# Run: cd /var/www/justachat && git pull && sudo bash public/vps-deploy/patch-pm-system.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     JustAChat™ PM System Complete Patch                            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

REPO_ROOT="/var/www/justachat"
DOCKER_DIR="/home/unix/supabase/docker"
FUNCTIONS_VOL="$DOCKER_DIR/volumes/functions/main"

cd "$REPO_ROOT"

# ============================================
# STEP 1: Verify Docker environment variables
# ============================================
log_info "STEP 1: Checking Docker environment..."

DOCKER_ENV="$DOCKER_DIR/.env"
if [ -f "$DOCKER_ENV" ]; then
  if grep -q "SUPABASE_SERVICE_ROLE_KEY=" "$DOCKER_ENV"; then
    SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" "$DOCKER_ENV" | cut -d'=' -f2)
    if [ -n "$SERVICE_KEY" ]; then
      log_success "SERVICE_ROLE_KEY is set in Docker .env"
    else
      log_warn "SERVICE_ROLE_KEY is empty - image uploads may fail"
    fi
  else
    log_warn "SERVICE_ROLE_KEY not found in Docker .env"
  fi
  
  # Add VPS_PUBLIC_URL if missing
  if ! grep -q "VPS_PUBLIC_URL=" "$DOCKER_ENV"; then
    echo 'VPS_PUBLIC_URL=https://justachat.net' >> "$DOCKER_ENV"
    log_success "Added VPS_PUBLIC_URL to Docker .env"
  else
    log_success "VPS_PUBLIC_URL already configured"
  fi
else
  log_error "Docker .env not found at $DOCKER_ENV"
fi

# ============================================
# STEP 2: Sync all PM-related edge functions
# ============================================
log_info "STEP 2: Syncing edge functions to Docker volumes..."

FUNCTIONS_TO_SYNC=(
  "upload-image"
  "encrypt-pm"
  "decrypt-pm"
  "chat-bot-cloud"
)

for func in "${FUNCTIONS_TO_SYNC[@]}"; do
  SRC="$REPO_ROOT/supabase/functions/$func/index.ts"
  DEST="$FUNCTIONS_VOL/$func/index.ts"
  
  if [ -f "$SRC" ]; then
    mkdir -p "$(dirname "$DEST")"
    cp -f "$SRC" "$DEST"
    log_success "Synced $func ($(wc -l < "$DEST") lines)"
  else
    log_warn "Source not found: $SRC"
  fi
done

# ============================================
# STEP 3: Verify upload-image has VPS fixes
# ============================================
log_info "STEP 3: Verifying upload-image function..."

UPLOAD_FUNC="$FUNCTIONS_VOL/upload-image/index.ts"
if [ -f "$UPLOAD_FUNC" ]; then
  if grep -q "multipart/form-data" "$UPLOAD_FUNC"; then
    log_success "upload-image supports multipart/form-data"
  else
    log_error "upload-image missing multipart/form-data support!"
  fi
  
  if grep -q "VPS_PUBLIC_URL" "$UPLOAD_FUNC"; then
    log_success "upload-image has VPS URL mapping"
  else
    log_warn "upload-image missing VPS_PUBLIC_URL handling"
  fi
  
  if grep -q "kong:8000" "$UPLOAD_FUNC"; then
    log_success "upload-image handles internal kong URLs"
  else
    log_warn "upload-image may not handle internal URLs"
  fi
else
  log_error "upload-image function not found!"
fi

# ============================================
# STEP 4: Verify encrypt-pm and decrypt-pm
# ============================================
log_info "STEP 4: Verifying encryption functions..."

ENCRYPT_FUNC="$FUNCTIONS_VOL/encrypt-pm/index.ts"
if [ -f "$ENCRYPT_FUNC" ]; then
  if grep -q "PM_MASTER_KEY" "$ENCRYPT_FUNC"; then
    log_success "encrypt-pm uses PM_MASTER_KEY"
  else
    log_warn "encrypt-pm may have key issues"
  fi
fi

DECRYPT_FUNC="$FUNCTIONS_VOL/decrypt-pm/index.ts"
if [ -f "$DECRYPT_FUNC" ]; then
  if grep -q "PM_MASTER_KEY" "$DECRYPT_FUNC"; then
    log_success "decrypt-pm uses PM_MASTER_KEY"
  else
    log_warn "decrypt-pm may have key issues"
  fi
fi

# ============================================
# STEP 5: Restart functions container (cold restart)
# ============================================
log_info "STEP 5: Cold restarting edge functions..."

cd "$DOCKER_DIR"
docker compose stop functions
sleep 2
docker compose up -d functions
sleep 3
log_success "Functions container restarted"

# ============================================
# STEP 6: Test function endpoints
# ============================================
log_info "STEP 6: Testing function endpoints..."

ANON_KEY=$(grep "^ANON_KEY=" "$DOCKER_ENV" | cut -d'=' -f2 || echo "")

test_endpoint() {
  local name="$1"
  local result=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS "http://localhost:8000/functions/v1/$name" \
    -H "apikey: $ANON_KEY" 2>/dev/null || echo "000")
  
  if [ "$result" = "200" ] || [ "$result" = "204" ]; then
    log_success "$name endpoint: OK (CORS preflight passes)"
  else
    log_warn "$name endpoint returned: $result"
  fi
}

test_endpoint "upload-image"
test_endpoint "encrypt-pm"
test_endpoint "decrypt-pm"

# ============================================
# STEP 7: Check recent function logs
# ============================================
log_info "STEP 7: Recent function logs..."

docker compose logs functions 2>&1 | grep -iE "upload-image|encrypt|decrypt|error" | tail -10

# ============================================
# DONE
# ============================================
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ PM SYSTEM PATCHED                            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔍 Test in browser:"
echo "   1. Hard refresh (Ctrl+Shift+R)"
echo "   2. Open a PM window"
echo "   3. Try sending a text message"
echo "   4. Try sending an image"
echo ""
echo "💡 If images still fail, check:"
echo "   - SUPABASE_SERVICE_ROLE_KEY in $DOCKER_DIR/.env"
echo "   - PM_MASTER_KEY in Docker secrets"
echo ""
