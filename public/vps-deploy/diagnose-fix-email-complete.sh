#!/bin/bash
# =============================================================================
# COMPLETE VPS EMAIL DIAGNOSTIC & FIX SCRIPT
# Run: sudo bash /var/www/justachat/public/vps-deploy/diagnose-fix-email-complete.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DOCKER_ENV="$HOME/supabase/docker/.env"
WEBHOOK_DIR="/opt/justachat-email"
ISSUES=()
FIXES_APPLIED=0

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  COMPLETE VPS EMAIL SYSTEM DIAGNOSTIC & FIX${NC}"
echo -e "${CYAN}  $(date)${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
add_issue() {
    ISSUES+=("$1")
    echo -e "${RED}✗ ISSUE: $1${NC}"
}

fix_applied() {
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
    echo -e "${GREEN}✓ FIX APPLIED: $1${NC}"
}

# =============================================================================
# CHECK 1: Docker network and gateway IP
# =============================================================================
echo -e "${BLUE}[1/10] Checking Docker network...${NC}"

GATEWAY_IP=$(docker network inspect supabase_default 2>/dev/null | grep -oP '"Gateway": "\K[^"]+' | head -1)
if [ -z "$GATEWAY_IP" ]; then
    add_issue "Cannot detect Docker gateway IP"
    GATEWAY_IP="172.18.0.1"
    echo -e "${YELLOW}Using default: $GATEWAY_IP${NC}"
else
    echo -e "${GREEN}✓ Docker gateway: $GATEWAY_IP${NC}"
fi

SUBNET=$(docker network inspect supabase_default 2>/dev/null | grep -oP '"Subnet": "\K[^"]+' | head -1)
echo -e "${GREEN}✓ Docker subnet: $SUBNET${NC}"
echo ""

# =============================================================================
# CHECK 2: Webhook service running
# =============================================================================
echo -e "${BLUE}[2/10] Checking webhook service...${NC}"

WEBHOOK_RUNNING=false
WEBHOOK_SERVICE=""

if systemctl is-active --quiet justachat-email 2>/dev/null; then
    echo -e "${GREEN}✓ justachat-email service is running${NC}"
    WEBHOOK_RUNNING=true
    WEBHOOK_SERVICE="justachat-email"
elif systemctl is-active --quiet jac-email-webhook 2>/dev/null; then
    echo -e "${GREEN}✓ jac-email-webhook service is running${NC}"
    WEBHOOK_RUNNING=true
    WEBHOOK_SERVICE="jac-email-webhook"
elif ss -tlnp 2>/dev/null | grep -q ":3001"; then
    echo -e "${YELLOW}⚠ Port 3001 is listening but no systemd service detected${NC}"
    WEBHOOK_RUNNING=true
else
    add_issue "No email webhook service running on port 3001"
fi
echo ""

# =============================================================================
# CHECK 3: Webhook binding address (must be 0.0.0.0)
# =============================================================================
echo -e "${BLUE}[3/10] Checking webhook binding address...${NC}"

BINDING=$(ss -tlnp 2>/dev/null | grep ":3001" | awk '{print $4}')
if echo "$BINDING" | grep -q "0.0.0.0:3001"; then
    echo -e "${GREEN}✓ Webhook bound to 0.0.0.0:3001${NC}"
elif echo "$BINDING" | grep -q "127.0.0.1:3001"; then
    add_issue "Webhook bound to 127.0.0.1 - Docker cannot reach it"
    
    # FIX: Update server.js to bind to 0.0.0.0
    if [ -f "${WEBHOOK_DIR}/server.js" ]; then
        sed -i "s/127.0.0.1/0.0.0.0/g" "${WEBHOOK_DIR}/server.js"
        sed -i "s/'localhost'/'0.0.0.0'/g" "${WEBHOOK_DIR}/server.js"
        fix_applied "Updated webhook to bind to 0.0.0.0"
        
        if [ -n "$WEBHOOK_SERVICE" ]; then
            systemctl restart "$WEBHOOK_SERVICE"
            fix_applied "Restarted $WEBHOOK_SERVICE"
            sleep 2
        fi
    fi
else
    echo -e "${YELLOW}⚠ Binding: $BINDING${NC}"
fi
echo ""

# =============================================================================
# CHECK 4: UFW firewall rules
# =============================================================================
echo -e "${BLUE}[4/10] Checking UFW firewall for port 3001...${NC}"

UFW_ALLOWS_3001=false
if ufw status 2>/dev/null | grep -q "3001"; then
    echo -e "${GREEN}✓ UFW has rules for port 3001${NC}"
    UFW_ALLOWS_3001=true
else
    add_issue "UFW may be blocking Docker access to port 3001"
    
    # FIX: Add UFW rule
    if [ -n "$SUBNET" ]; then
        ufw allow from "$SUBNET" to any port 3001 proto tcp 2>/dev/null || true
        fix_applied "Added UFW rule: allow from $SUBNET to port 3001"
        UFW_ALLOWS_3001=true
    fi
fi
echo ""

# =============================================================================
# CHECK 5: GoTrue email hook configuration
# =============================================================================
echo -e "${BLUE}[5/10] Checking GoTrue email hook config...${NC}"

if [ ! -f "$DOCKER_ENV" ]; then
    add_issue "Docker .env not found at $DOCKER_ENV"
else
    # Check GOTRUE_HOOK_SEND_EMAIL_ENABLED
    HOOK_ENABLED=$(grep "^GOTRUE_HOOK_SEND_EMAIL_ENABLED" "$DOCKER_ENV" 2>/dev/null | cut -d'=' -f2-)
    if [ "$HOOK_ENABLED" = "true" ]; then
        echo -e "${GREEN}✓ GOTRUE_HOOK_SEND_EMAIL_ENABLED=true${NC}"
    else
        add_issue "GOTRUE_HOOK_SEND_EMAIL_ENABLED is not true"
        
        # FIX: Enable the hook
        sed -i '/^GOTRUE_HOOK_SEND_EMAIL_ENABLED/d' "$DOCKER_ENV"
        echo "GOTRUE_HOOK_SEND_EMAIL_ENABLED=true" >> "$DOCKER_ENV"
        fix_applied "Set GOTRUE_HOOK_SEND_EMAIL_ENABLED=true"
    fi
    
    # Check GOTRUE_HOOK_SEND_EMAIL_URI
    HOOK_URI=$(grep "^GOTRUE_HOOK_SEND_EMAIL_URI" "$DOCKER_ENV" 2>/dev/null | cut -d'=' -f2-)
    EXPECTED_URI="http://${GATEWAY_IP}:3001/hook/email"
    
    if [ "$HOOK_URI" = "$EXPECTED_URI" ]; then
        echo -e "${GREEN}✓ GOTRUE_HOOK_SEND_EMAIL_URI=$HOOK_URI${NC}"
    else
        add_issue "GOTRUE_HOOK_SEND_EMAIL_URI is wrong: $HOOK_URI"
        echo -e "${YELLOW}  Expected: $EXPECTED_URI${NC}"
        
        # FIX: Set correct URI
        sed -i '/^GOTRUE_HOOK_SEND_EMAIL_URI/d' "$DOCKER_ENV"
        echo "GOTRUE_HOOK_SEND_EMAIL_URI=$EXPECTED_URI" >> "$DOCKER_ENV"
        fix_applied "Set GOTRUE_HOOK_SEND_EMAIL_URI=$EXPECTED_URI"
    fi
fi
echo ""

# =============================================================================
# CHECK 6: Resend API key
# =============================================================================
echo -e "${BLUE}[6/10] Checking Resend API key...${NC}"

WEBHOOK_ENV="${WEBHOOK_DIR}/.env"
if [ -f "$WEBHOOK_ENV" ]; then
    RESEND_KEY=$(grep "^RESEND_API_KEY" "$WEBHOOK_ENV" 2>/dev/null | cut -d'=' -f2-)
    if [[ "$RESEND_KEY" == re_* ]]; then
        echo -e "${GREEN}✓ RESEND_API_KEY configured (${RESEND_KEY:0:10}...)${NC}"
    else
        add_issue "RESEND_API_KEY not set or invalid in $WEBHOOK_ENV"
    fi
else
    add_issue "Webhook .env not found at $WEBHOOK_ENV"
fi
echo ""

# =============================================================================
# CHECK 7: Test webhook health endpoint locally
# =============================================================================
echo -e "${BLUE}[7/10] Testing webhook health (localhost)...${NC}"

HEALTH_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health 2>/dev/null || echo "000")
if [ "$HEALTH_LOCAL" = "200" ]; then
    HEALTH_BODY=$(curl -s http://127.0.0.1:3001/health 2>/dev/null)
    echo -e "${GREEN}✓ Localhost health: HTTP 200 - $HEALTH_BODY${NC}"
else
    add_issue "Webhook health check failed locally: HTTP $HEALTH_LOCAL"
fi
echo ""

# =============================================================================
# CHECK 8: Test webhook from Docker gateway
# =============================================================================
echo -e "${BLUE}[8/10] Testing webhook from Docker gateway ($GATEWAY_IP)...${NC}"

HEALTH_DOCKER=$(curl -s -o /dev/null -w "%{http_code}" "http://${GATEWAY_IP}:3001/health" --connect-timeout 5 2>/dev/null || echo "000")
if [ "$HEALTH_DOCKER" = "200" ]; then
    echo -e "${GREEN}✓ Docker gateway health: HTTP 200${NC}"
else
    add_issue "Docker cannot reach webhook: HTTP $HEALTH_DOCKER"
fi
echo ""

# =============================================================================
# CHECK 9: Test the actual email hook endpoint
# =============================================================================
echo -e "${BLUE}[9/10] Testing email hook endpoint...${NC}"

# Test POST to /hook/email with minimal payload
HOOK_RESPONSE=$(curl -s -X POST "http://${GATEWAY_IP}:3001/hook/email" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    --connect-timeout 5 2>/dev/null || echo "CONNECTION_FAILED")

if [ "$HOOK_RESPONSE" = "CONNECTION_FAILED" ]; then
    add_issue "Cannot connect to email hook endpoint"
else
    echo -e "${GREEN}✓ Email hook endpoint responding: ${HOOK_RESPONSE:0:100}${NC}"
fi
echo ""

# =============================================================================
# CHECK 10: Auth container environment
# =============================================================================
echo -e "${BLUE}[10/10] Checking auth container config...${NC}"

AUTH_HOOK_URI=$(docker exec supabase-auth printenv GOTRUE_HOOK_SEND_EMAIL_URI 2>/dev/null || echo "NOT_SET")
AUTH_HOOK_ENABLED=$(docker exec supabase-auth printenv GOTRUE_HOOK_SEND_EMAIL_ENABLED 2>/dev/null || echo "NOT_SET")

echo "  Container GOTRUE_HOOK_SEND_EMAIL_ENABLED: $AUTH_HOOK_ENABLED"
echo "  Container GOTRUE_HOOK_SEND_EMAIL_URI: $AUTH_HOOK_URI"

if [ "$AUTH_HOOK_ENABLED" != "true" ] || [ "$AUTH_HOOK_URI" != "$EXPECTED_URI" ]; then
    add_issue "Auth container has outdated config - needs restart"
fi
echo ""

# =============================================================================
# APPLY FINAL FIX: Restart auth container if any config changes
# =============================================================================
if [ $FIXES_APPLIED -gt 0 ]; then
    echo -e "${YELLOW}Restarting auth container to apply changes...${NC}"
    cd ~/supabase/docker
    docker compose up -d --force-recreate auth 2>&1 | grep -v "WARN"
    fix_applied "Restarted supabase-auth container"
    sleep 3
fi

# =============================================================================
# FINAL VERIFICATION
# =============================================================================
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  FINAL VERIFICATION${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# Re-check auth container
NEW_AUTH_URI=$(docker exec supabase-auth printenv GOTRUE_HOOK_SEND_EMAIL_URI 2>/dev/null || echo "NOT_SET")
NEW_AUTH_ENABLED=$(docker exec supabase-auth printenv GOTRUE_HOOK_SEND_EMAIL_ENABLED 2>/dev/null || echo "NOT_SET")

echo "Auth container config:"
echo "  GOTRUE_HOOK_SEND_EMAIL_ENABLED: $NEW_AUTH_ENABLED"
echo "  GOTRUE_HOOK_SEND_EMAIL_URI: $NEW_AUTH_URI"
echo ""

# Re-test connectivity
FINAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://${GATEWAY_IP}:3001/health" --connect-timeout 5 2>/dev/null || echo "000")
echo "Docker → Webhook connectivity: HTTP $FINAL_HEALTH"
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  SUMMARY${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

if [ ${#ISSUES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ NO ISSUES FOUND - Email system should be working!${NC}"
else
    echo -e "${YELLOW}Issues found: ${#ISSUES[@]}${NC}"
    for issue in "${ISSUES[@]}"; do
        echo -e "  ${RED}• $issue${NC}"
    done
fi

echo ""
echo -e "${GREEN}Fixes applied: $FIXES_APPLIED${NC}"
echo ""

if [ "$NEW_AUTH_ENABLED" = "true" ] && [ "$NEW_AUTH_URI" = "$EXPECTED_URI" ] && [ "$FINAL_HEALTH" = "200" ]; then
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}  EMAIL SYSTEM READY - TEST PASSWORD RESET NOW${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo "Go to: https://justachat.net/auth"
    echo "Click 'Forgot password' and enter your email"
    echo ""
else
    echo -e "${RED}============================================================${NC}"
    echo -e "${RED}  STILL HAVE ISSUES - CHECK LOGS BELOW${NC}"
    echo -e "${RED}============================================================${NC}"
    echo ""
    echo "Check webhook logs:"
    echo "  sudo journalctl -u justachat-email -n 50 --no-pager"
    echo ""
    echo "Check auth logs:"
    echo "  docker logs supabase-auth --tail 50 2>&1 | grep -iE 'hook|email|error'"
    echo ""
fi

# Show recent auth logs for email hooks
echo ""
echo -e "${BLUE}Recent auth logs (email/hook related):${NC}"
docker logs supabase-auth --tail 100 2>&1 | grep -iE 'hook|email|send' | tail -10 || echo "No relevant logs"
echo ""
