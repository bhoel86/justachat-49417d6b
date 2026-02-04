#!/bin/bash
# ============================================
# JUSTACHAT VPS UPDATE SCRIPT
# Run after pushing to GitHub to sync VPS
# Usage: bash /var/www/justachat/public/vps-deploy/update-vps.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/var/www/justachat"
FUNCTIONS_DIR="$HOME/supabase/docker/volumes/functions/main"

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "============================================"
echo "  JUSTACHAT VPS UPDATE - $(date '+%Y-%m-%d %H:%M')"
echo "============================================"
echo ""

# Ensure we're in the right directory
cd "$PROJECT_DIR"

# ============================================
# STAGE 0: Backup VPS-specific files before git reset
# ============================================
log_info "Stage 0: Backing up VPS-protected files..."

BACKUP_DIR="/tmp/vps-env-backup-$$"
mkdir -p "$BACKUP_DIR"

# Backup .env if it exists and has VPS config
if [ -f ".env" ]; then
  cp ".env" "$BACKUP_DIR/.env"
  log_success "Backed up .env"
fi

# ============================================
# STAGE 1: Pull latest from GitHub
# ============================================
log_info "Stage 1: Pulling latest changes from GitHub..."

git fetch origin main
git reset --hard origin/main

log_success "Git pull complete"

# ============================================
# STAGE 1b: Restore VPS-specific .env
# ============================================
log_info "Stage 1b: Restoring VPS .env configuration..."

# Always write the correct VPS .env (prevents Cloud contamination)
cat > .env << 'VPSENV'
VITE_SUPABASE_URL=https://justachat.net
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4NjE5MjAwMDB9.ApWkSEYJ7yzNQ_H7yfVE2zyUp--eWrR-h9pj-rUSQEU
VPSENV

log_success "VPS .env restored (justachat.net)"

# Cleanup backup
rm -rf "$BACKUP_DIR"

# ============================================
# STAGE 2: Run post-pull patcher
# ============================================
log_info "Stage 2: Running post-pull patcher..."

if [ -f "public/vps-deploy/patch-after-pull.sh" ]; then
  bash public/vps-deploy/patch-after-pull.sh
else
  log_warn "patch-after-pull.sh not found, skipping"
fi

# ============================================
# STAGE 3: Validate VPS configuration
# ============================================
log_info "Stage 3: Validating VPS configuration..."

if [ -f "public/vps-deploy/validate-before-deploy.sh" ]; then
  bash public/vps-deploy/validate-before-deploy.sh || {
    log_error "Validation failed! Review errors above."
    exit 1
  }
else
  log_warn "validate-before-deploy.sh not found, skipping validation"
fi

# ============================================
# STAGE 4: Install dependencies
# ============================================
log_info "Stage 4: Installing npm dependencies..."

npm install --legacy-peer-deps

log_success "Dependencies installed"

# ============================================
# STAGE 5: Clean and rebuild frontend
# ============================================
log_info "Stage 5: Cleaning build artifacts..."

rm -rf dist node_modules/.vite .vite 2>/dev/null || true

log_info "Stage 5: Building frontend..."

npm run build

if [ -d "dist" ]; then
  log_success "Frontend built successfully"
else
  log_error "Build failed - dist folder not created"
  exit 1
fi

# ============================================
# STAGE 6: Sync Edge Functions
# ============================================
log_info "Stage 6: Syncing edge functions..."

if [ -d "$FUNCTIONS_DIR" ]; then
  # List of edge functions to sync
  FUNCTIONS=(
    "admin-list-users"
    "admin-reset-password"
    "ai-moderator"
    "art-curator"
    "audit-log"
    "chat-bot"
    "check-rate-limit"
    "decrypt-pm"
    "delete-account"
    "donation-notify"
    "encrypt-pm"
    "execute-moderation"
    "geolocate"
    "gif-search"
    "image-to-irc"
    "irc-gateway"
    "oper-auth"
    "pm-monitor"
    "send-auth-email"
    "translate-message"
    "upload-image"
    "verify-captcha"
    "vps-test"
  )

  for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
      mkdir -p "$FUNCTIONS_DIR/$func"
      cp -r "supabase/functions/$func/"* "$FUNCTIONS_DIR/$func/" 2>/dev/null || true
      log_success "Synced: $func"
    fi
  done

  # Restart edge functions container
  log_info "Restarting edge functions container..."
  cd $HOME/supabase/docker
  docker compose restart edge-functions 2>/dev/null || docker-compose restart edge-functions 2>/dev/null || true
  cd "$PROJECT_DIR"
  
  log_success "Edge functions synced and restarted"
else
  log_warn "Edge functions directory not found at $FUNCTIONS_DIR"
fi

# ============================================
# STAGE 7: Reload Nginx
# ============================================
log_info "Stage 7: Reloading Nginx..."

sudo nginx -t && sudo systemctl reload nginx

log_success "Nginx reloaded"

# ============================================
# STAGE 8: Quick health check
# ============================================
log_info "Stage 8: Running quick health check..."

echo ""
echo "Checking frontend..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/)
if [ "$HTTP_STATUS" == "200" ]; then
  log_success "Frontend: OK (HTTP $HTTP_STATUS)"
else
  log_warn "Frontend: HTTP $HTTP_STATUS"
fi

echo ""
echo "Checking API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/rest/v1/)
if [ "$API_STATUS" == "200" ] || [ "$API_STATUS" == "401" ]; then
  log_success "API: OK (HTTP $API_STATUS)"
else
  log_warn "API: HTTP $API_STATUS"
fi

echo ""
echo "============================================"
echo -e "${GREEN}  VPS UPDATE COMPLETE!${NC}"
echo "============================================"
echo ""
echo "What was updated:"
echo "  ✓ Latest code from GitHub"
echo "  ✓ VPS-specific patches applied"
echo "  ✓ Frontend rebuilt"
echo "  ✓ Edge functions synced"
echo "  ✓ Nginx reloaded"
echo ""
echo "Visit: https://justachat.net"
echo ""
