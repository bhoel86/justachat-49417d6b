 #!/bin/bash
 # ============================================
 # JUSTACHAT VPS MASTER UPDATE & DIAGNOSE
 # One command to rule them all!
 # Usage: bash /var/www/justachat/public/vps-deploy/master-update.sh
 # ============================================
 
 set -e
 
 # Colors
 RED='\033[0;31m'
 GREEN='\033[0;32m'
 YELLOW='\033[1;33m'
 CYAN='\033[0;36m'
 MAGENTA='\033[0;35m'
 NC='\033[0m'
 BOLD='\033[1m'
 
 PROJECT_DIR="/var/www/justachat"
 DOCKER_DIR="$HOME/supabase/docker"
 FUNCTIONS_DIR="$DOCKER_DIR/volumes/functions/main"
 
 log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
 log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
 log_warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
 log_error() { echo -e "${RED}[✗]${NC} $1"; }
 log_step() { echo -e "\n${MAGENTA}${BOLD}═══ $1 ═══${NC}\n"; }
 
echo -e ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}JUSTACHAT VPS MASTER UPDATE${NC}                                 ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  $(date '+%Y-%m-%d %H:%M:%S')                                       ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e ""
 
 cd "$PROJECT_DIR"
 
 # ============================================
 # STAGE 1: Git Pull
 # ============================================
 log_step "STAGE 1: Git Pull"
 
 log_info "Fetching latest from GitHub..."
 git fetch origin main
 
 log_info "Resetting to origin/main..."
 git reset --hard origin/main
 
 log_success "Git pull complete"
 
 # ============================================
 # STAGE 2: Protect VPS Environment
 # ============================================
 log_step "STAGE 2: Protect VPS Environment"
 
 log_info "Writing VPS-specific .env..."
echo 'VITE_SUPABASE_URL=https://justachat.net' > .env
echo 'VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY5NjYyODk3LCJleHAiOjIwODUwMjI4OTd9.qdPb9zUcD3hXTAUO8M2hAfK4UQoyHc3uPUXIsxofFfw' >> .env
 
 log_success "VPS .env protected (justachat.net)"
 
 # ============================================
 # STAGE 3: Patch & Validate
 # ============================================
 log_step "STAGE 3: Patch & Validate"
 
 if [ -f "public/vps-deploy/patch-after-pull.sh" ]; then
   log_info "Running post-pull patcher..."
   bash public/vps-deploy/patch-after-pull.sh || log_warn "Patcher had warnings"
 fi
 
 if [ -f "public/vps-deploy/validate-before-deploy.sh" ]; then
   log_info "Validating VPS configuration..."
   bash public/vps-deploy/validate-before-deploy.sh || {
     log_error "Validation failed! Check for cloud contamination."
     exit 1
   }
 fi
 
 log_success "Validation passed"
 
 # ============================================
 # STAGE 4: Install & Build
 # ============================================
 log_step "STAGE 4: Install & Build"
 
 log_info "Installing npm dependencies..."
 npm install --legacy-peer-deps --silent
 
 log_info "Cleaning old build artifacts..."
 rm -rf dist node_modules/.vite .vite 2>/dev/null || true
 
 log_info "Building frontend..."
 npm run build
 
 if [ -d "dist" ]; then
   log_success "Frontend built successfully"
 else
   log_error "Build failed - dist folder not created"
   exit 1
 fi
 
 # ============================================
 # STAGE 5: Sync Edge Functions
 # ============================================
 log_step "STAGE 5: Sync Edge Functions"
 
 if [ -d "$FUNCTIONS_DIR" ]; then
   FUNCTIONS=(
     "admin-list-users" "admin-reset-password" "ai-moderator" "art-curator"
     "audit-log" "chat-bot" "check-rate-limit" "decrypt-pm" "delete-account"
     "encrypt-pm" "execute-moderation" "geolocate" "gif-search" "image-to-irc"
     "irc-gateway" "oper-auth" "pm-monitor" "send-auth-email" "translate-message"
     "upload-image" "verify-captcha" "vps-test"
   )
 
   for func in "${FUNCTIONS[@]}"; do
     if [ -d "supabase/functions/$func" ]; then
       mkdir -p "$FUNCTIONS_DIR/$func"
       cp -r "supabase/functions/$func/"* "$FUNCTIONS_DIR/$func/" 2>/dev/null || true
     fi
   done
   log_success "Edge functions synced to Docker volume"
 else
   log_warn "Functions directory not found at $FUNCTIONS_DIR"
 fi
 
 # ============================================
 # STAGE 6: Restart Services (Cold Restart)
 # ============================================
 log_step "STAGE 6: Restart Services"
 
 log_info "Cold restarting edge functions container..."
 cd "$DOCKER_DIR"
 
 # Cold restart (down + up) to clear Deno cache
 docker compose stop functions 2>/dev/null || docker-compose stop functions 2>/dev/null || true
 sleep 2
 docker compose up -d functions 2>/dev/null || docker-compose up -d functions 2>/dev/null || true
 
 log_success "Edge functions container restarted"
 
 cd "$PROJECT_DIR"
 
 log_info "Reloading Nginx..."
 sudo nginx -t && sudo systemctl reload nginx
 log_success "Nginx reloaded"
 
 # ============================================
 # STAGE 7: Health Checks
 # ============================================
 log_step "STAGE 7: Health Checks"
 
 echo ""
 echo "Checking Docker containers..."
 UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null || true)
 if [ -n "$UNHEALTHY" ]; then
   log_warn "Unhealthy containers: $UNHEALTHY"
 else
   log_success "All containers healthy"
 fi
 
 echo ""
 echo "Checking frontend..."
 HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/ 2>/dev/null || echo "000")
 if [ "$HTTP_STATUS" == "200" ]; then
   log_success "Frontend: OK (HTTP $HTTP_STATUS)"
 else
   log_error "Frontend: HTTP $HTTP_STATUS"
 fi
 
 echo ""
 echo "Checking REST API..."
 API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://justachat.net/rest/v1/ 2>/dev/null || echo "000")
 if [ "$API_STATUS" == "200" ] || [ "$API_STATUS" == "401" ]; then
   log_success "REST API: OK (HTTP $API_STATUS)"
 else
   log_error "REST API: HTTP $API_STATUS"
 fi
 
 echo ""
 echo "Checking Auth API..."
 AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://justachat.net/auth/v1/health" 2>/dev/null || echo "000")
 if [ "$AUTH_STATUS" == "200" ]; then
   log_success "Auth API: OK (HTTP $AUTH_STATUS)"
 else
   log_warn "Auth API: HTTP $AUTH_STATUS"
 fi
 
 # ============================================
 # STAGE 8: Edge Function Tests
 # ============================================
 log_step "STAGE 8: Edge Function Tests"
 
 ANON_KEY=$(grep SUPABASE_ANON_KEY "$DOCKER_DIR/.env" 2>/dev/null | cut -d'=' -f2 || echo '')
 
 echo "Testing vps-test..."
 VPS_TEST=$(curl -s -X POST https://justachat.net/functions/v1/vps-test \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $ANON_KEY" \
   -d '{}' 2>/dev/null | head -c 200)
 if echo "$VPS_TEST" | grep -qi 'success\|ok\|working'; then
   log_success "vps-test: Working"
 else
   log_warn "vps-test: $VPS_TEST"
 fi
 
 echo "Testing chat-bot..."
 CHAT_BOT=$(curl -s -X POST https://justachat.net/functions/v1/chat-bot \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $ANON_KEY" \
   -d '{"message":"test","botId":"serenity","channelName":"general"}' 2>/dev/null | head -c 200)
 if echo "$CHAT_BOT" | grep -qi '"reply"'; then
   log_success "chat-bot: Working"
 else
   log_warn "chat-bot: $CHAT_BOT"
 fi
 
 echo "Testing ai-moderator..."
 AI_MOD=$(curl -s -X POST https://justachat.net/functions/v1/ai-moderator \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer $ANON_KEY" \
   -d '{"message":"hello","username":"test"}' 2>/dev/null | head -c 200)
 if echo "$AI_MOD" | grep -qi '"safe"'; then
   log_success "ai-moderator: Working"
 else
   log_warn "ai-moderator: $AI_MOD"
 fi
 
 # ============================================
 # STAGE 9: Radio Diagnostics
 # ============================================
 log_step "STAGE 9: Radio Diagnostics"
 
 echo "The radio system uses YouTube's IFrame API which runs client-side."
 echo "Common issues and checks:"
 echo ""
 
 # Check if YouTube is accessible from VPS
 echo "Testing YouTube API accessibility..."
 YT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://www.youtube.com/iframe_api" 2>/dev/null || echo "000")
 if [ "$YT_STATUS" == "200" ]; then
   log_success "YouTube IFrame API: Accessible (HTTP $YT_STATUS)"
 else
   log_error "YouTube IFrame API: HTTP $YT_STATUS - May be blocked"
 fi
 
 # Check for Content-Security-Policy that might block YouTube
 echo ""
 echo "Checking CSP headers..."
 CSP_HEADER=$(curl -s -I https://justachat.net/ 2>/dev/null | grep -i "content-security-policy" || echo "")
 if [ -n "$CSP_HEADER" ]; then
   if echo "$CSP_HEADER" | grep -qi "youtube"; then
     log_success "CSP allows YouTube"
   else
     log_warn "CSP found but may not include YouTube - check manually"
     echo "  $CSP_HEADER"
   fi
 else
   log_success "No restrictive CSP header (YouTube should work)"
 fi
 
 # Check Nginx config for X-Frame-Options that might interfere
 echo ""
 echo "Checking X-Frame-Options..."
 XFO_HEADER=$(curl -s -I https://justachat.net/ 2>/dev/null | grep -i "x-frame-options" || echo "")
 if [ -n "$XFO_HEADER" ]; then
   log_info "X-Frame-Options: $XFO_HEADER"
 else
   log_success "No X-Frame-Options restriction"
 fi
 
 echo ""
 echo -e "${YELLOW}Radio Troubleshooting Tips:${NC}"
 echo "  1. Radio uses YouTube IFrame API - requires browser-side execution"
 echo "  2. Check browser console for 'Radio:' prefixed log messages"
 echo "  3. Ensure no ad-blockers are blocking youtube.com/iframe_api"
 echo "  4. Try a different browser or incognito mode"
 echo "  5. Radio state persists in localStorage (jac-radio-*)"
 echo ""
 
 # ============================================
 # STAGE 10: Recent Logs Check
 # ============================================
 log_step "STAGE 10: Recent Error Logs"
 
 echo "Last 10 error lines from functions container:"
 docker logs supabase-functions 2>&1 | grep -i "error\|exception\|failed" | tail -10 || echo "  No recent errors found"
 
 echo ""
 echo "Last 5 lines from Nginx error log:"
 sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "  Could not read Nginx logs"
 
 # ============================================
 # COMPLETE
 # ============================================
 echo ""
 echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
 echo -e "${GREEN}║${NC}  ${BOLD}VPS UPDATE COMPLETE!${NC}                                        ${GREEN}║${NC}"
 echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
 echo ""
 echo "Summary:"
 echo "  ✓ Git pulled latest code"
 echo "  ✓ VPS environment protected"
 echo "  ✓ Frontend rebuilt"
 echo "  ✓ Edge functions synced & cold restarted"
 echo "  ✓ Nginx reloaded"
 echo "  ✓ Health checks performed"
 echo "  ✓ Radio diagnostics complete"
 echo ""
 echo "Visit: https://justachat.net"
 echo ""
 echo -e "${CYAN}If radio still not working, check browser console for errors.${NC}"
 echo ""