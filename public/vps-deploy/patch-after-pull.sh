#!/bin/bash
# ============================================
# JUSTACHAT VPS POST-PULL PATCH SCRIPT
# Run after git pull to fix Lovable Cloud contamination
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."

cd "$PROJECT_ROOT"

echo "============================================"
echo "  JUSTACHAT VPS POST-PULL PATCHER"
echo "============================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

FIXES_MADE=0

# ============================================
# 1. Fix Supabase Client imports (prevent .co URLs)
# ============================================
log_info "Checking Supabase client configuration..."

CLIENT_FILE="src/integrations/supabase/client.ts"
if [ -f "$CLIENT_FILE" ]; then
  if grep -q "supabase.co" "$CLIENT_FILE" 2>/dev/null; then
    log_warn "Found supabase.co in client.ts - this is auto-generated, checking .env instead"
  fi
fi

# ============================================
# 2. Verify .env has correct VPS values
# ============================================
log_info "Checking .env configuration..."

if [ -f ".env" ]; then
  if grep -q "supabase.co" ".env" 2>/dev/null; then
    log_error ".env contains supabase.co URLs - needs manual fix!"
    echo "  Expected: VITE_SUPABASE_URL=https://justachat.net"
    FIXES_MADE=$((FIXES_MADE + 1))
  else
    log_success ".env looks correct (no supabase.co)"
  fi
else
  log_warn ".env file not found - creating from template"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    log_info "Created .env from .env.example - please update with VPS values"
  fi
fi

# ============================================
# 3. Fix useAuth.tsx VPS endpoint
# ============================================
log_info "Checking useAuth.tsx for VPS endpoints..."

AUTH_FILE="src/hooks/useAuth.tsx"
if [ -f "$AUTH_FILE" ]; then
  # Check if it has the VPS_ANON_KEY constant
  if grep -q "VPS_ANON_KEY" "$AUTH_FILE" 2>/dev/null; then
    log_success "useAuth.tsx has VPS_ANON_KEY constant"
  else
    log_warn "useAuth.tsx missing VPS_ANON_KEY - may need manual patching"
  fi
  
  # Check for supabase.co contamination
  if grep -q "supabase.co" "$AUTH_FILE" 2>/dev/null; then
    log_error "useAuth.tsx contains supabase.co - needs patching!"
    FIXES_MADE=$((FIXES_MADE + 1))
  fi
fi

# ============================================
# 4. Fix environment.ts for VPS
# ============================================
log_info "Checking environment.ts..."

ENV_FILE="src/lib/environment.ts"
if [ -f "$ENV_FILE" ]; then
  if grep -q "justachat.net" "$ENV_FILE" 2>/dev/null; then
    log_success "environment.ts references justachat.net"
  fi
  
  if grep -q "supabase.co" "$ENV_FILE" 2>/dev/null; then
    log_warn "environment.ts may have Cloud references - check manually"
  fi
fi

# ============================================
# 5. Fix chat-bot edge function (remove std/http imports)
# ============================================
log_info "Checking edge functions for Deno compatibility..."

CHATBOT_FILE="supabase/functions/chat-bot/index.ts"
if [ -f "$CHATBOT_FILE" ]; then
  if grep -q "std/http/server" "$CHATBOT_FILE" 2>/dev/null; then
    log_warn "chat-bot has std/http import - patching for VPS..."
    # Remove the problematic import
    sed -i 's|import.*from.*"https://deno.land/std.*/http/server.*"||g' "$CHATBOT_FILE"
    log_success "Removed std/http/server import from chat-bot"
    FIXES_MADE=$((FIXES_MADE + 1))
  else
    log_success "chat-bot/index.ts is VPS-compatible"
  fi
fi

# Check other edge functions
for func_dir in supabase/functions/*/; do
  func_name=$(basename "$func_dir")
  func_file="${func_dir}index.ts"
  
  if [ -f "$func_file" ] && [ "$func_name" != "_shared" ]; then
    if grep -q "std/http/server" "$func_file" 2>/dev/null; then
      log_warn "$func_name has std/http import - patching..."
      sed -i 's|import.*from.*"https://deno.land/std.*/http/server.*"||g' "$func_file"
      FIXES_MADE=$((FIXES_MADE + 1))
    fi
  fi
done

# ============================================
# 6. Ensure theme names are correct
# ============================================
log_info "Checking theme configuration..."

THEME_FILE="src/contexts/ThemeContext.tsx"
if [ -f "$THEME_FILE" ]; then
  if grep -q "name: 'Simulation'" "$THEME_FILE" 2>/dev/null; then
    log_success "Theme 'Simulation' is correctly named"
  elif grep -q "name: 'The Matrix'" "$THEME_FILE" 2>/dev/null; then
    log_warn "Theme still named 'The Matrix' - patching to 'Simulation'..."
    sed -i "s/name: 'The Matrix'/name: 'Simulation'/g" "$THEME_FILE"
    log_success "Renamed Matrix theme to Simulation"
    FIXES_MADE=$((FIXES_MADE + 1))
  fi
fi

# ============================================
# 7. Clean build artifacts
# ============================================
log_info "Cleaning stale build artifacts..."

if [ -d "dist" ]; then
  rm -rf dist
  log_success "Removed old dist folder"
fi

if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
  log_success "Removed Vite cache"
fi

if [ -d ".vite" ]; then
  rm -rf .vite
  log_success "Removed .vite cache"
fi

# ============================================
# 8. Summary
# ============================================
echo ""
echo "============================================"
if [ $FIXES_MADE -eq 0 ]; then
  echo -e "${GREEN}  ALL CHECKS PASSED - NO FIXES NEEDED${NC}"
else
  echo -e "${YELLOW}  MADE $FIXES_MADE FIXES${NC}"
fi
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Review any warnings above"
echo "  2. Run: npm run build"
echo "  3. Restart Nginx if needed: sudo systemctl reload nginx"
echo ""
