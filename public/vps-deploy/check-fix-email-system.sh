#!/bin/bash
# =============================================================================
# VPS Email System Check & Fix
# Ensures VPS uses local email webhook, NOT Lovable Cloud
# Run: sudo bash /var/www/justachat/public/vps-deploy/check-fix-email-system.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOCKER_ENV="$HOME/supabase/docker/.env"
WEBHOOK_DIR="/opt/justachat-email"
ISSUES_FOUND=0

echo -e "${BLUE}========================================"
echo -e "  VPS EMAIL SYSTEM CHECK & FIX"
echo -e "========================================${NC}"
echo ""

# =============================================================================
# Check 1: Look for Lovable/Cloud email references in GoTrue config
# =============================================================================
echo -e "${YELLOW}[1/6] Checking for Lovable Cloud email references...${NC}"

if [ -f "$DOCKER_ENV" ]; then
    # Check for any lovable/cloud URLs in email config
    if grep -iE "GOTRUE.*lovable|GOTRUE.*supabase\.co|MAILER.*lovable|MAILER.*supabase\.co" "$DOCKER_ENV" 2>/dev/null; then
        echo -e "${RED}✗ FOUND Lovable/Cloud email references in GoTrue config!${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    else
        echo -e "${GREEN}✓ No Lovable/Cloud email URLs in GoTrue config${NC}"
    fi
else
    echo -e "${RED}✗ Docker .env not found at $DOCKER_ENV${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# =============================================================================
# Check 2: Verify local email webhook is configured
# =============================================================================
echo -e "${YELLOW}[2/6] Checking local email webhook configuration...${NC}"

# Get Docker gateway IP
GATEWAY_IP=$(docker network inspect supabase_default 2>/dev/null | grep -oP '"Gateway": "\K[^"]+' | head -1)
if [ -z "$GATEWAY_IP" ]; then
    GATEWAY_IP="172.18.0.1"
fi

HOOK_ENABLED=$(grep "GOTRUE_HOOK_SEND_EMAIL_ENABLED" "$DOCKER_ENV" 2>/dev/null | cut -d'=' -f2-)
HOOK_URI=$(grep "GOTRUE_HOOK_SEND_EMAIL_URI" "$DOCKER_ENV" 2>/dev/null | cut -d'=' -f2-)

if [ "$HOOK_ENABLED" = "true" ]; then
    echo -e "${GREEN}✓ GOTRUE_HOOK_SEND_EMAIL_ENABLED=true${NC}"
else
    echo -e "${RED}✗ Email hook not enabled${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if echo "$HOOK_URI" | grep -qE "172\.[0-9]+\.[0-9]+\.[0-9]+:3001|localhost:3001|127\.0\.0\.1:3001"; then
    echo -e "${GREEN}✓ Hook URI points to local webhook: $HOOK_URI${NC}"
elif [ -z "$HOOK_URI" ]; then
    echo -e "${RED}✗ GOTRUE_HOOK_SEND_EMAIL_URI not set${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${RED}✗ Hook URI may point to wrong location: $HOOK_URI${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# =============================================================================
# Check 3: Email webhook service running
# =============================================================================
echo -e "${YELLOW}[3/6] Checking email webhook service...${NC}"

WEBHOOK_RUNNING=false
if systemctl is-active --quiet justachat-email 2>/dev/null; then
    echo -e "${GREEN}✓ justachat-email service is running${NC}"
    WEBHOOK_RUNNING=true
elif systemctl is-active --quiet jac-email-webhook 2>/dev/null; then
    echo -e "${GREEN}✓ jac-email-webhook service is running${NC}"
    WEBHOOK_RUNNING=true
elif ss -tlnp 2>/dev/null | grep -q ":3001"; then
    echo -e "${GREEN}✓ Something is listening on port 3001${NC}"
    WEBHOOK_RUNNING=true
else
    echo -e "${RED}✗ No email webhook service running on port 3001${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# =============================================================================
# Check 4: Webhook binding (should be 0.0.0.0, not 127.0.0.1)
# =============================================================================
echo -e "${YELLOW}[4/6] Checking webhook binding address...${NC}"

BINDING=$(ss -tlnp 2>/dev/null | grep ":3001" | awk '{print $4}')
if echo "$BINDING" | grep -q "0.0.0.0:3001"; then
    echo -e "${GREEN}✓ Webhook bound to 0.0.0.0:3001 (accessible from Docker)${NC}"
elif echo "$BINDING" | grep -q "127.0.0.1:3001"; then
    echo -e "${RED}✗ Webhook bound to 127.0.0.1:3001 (NOT accessible from Docker)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${YELLOW}⚠ Binding: $BINDING${NC}"
fi
echo ""

# =============================================================================
# Check 5: Resend API key configured
# =============================================================================
echo -e "${YELLOW}[5/6] Checking Resend API key...${NC}"

WEBHOOK_ENV="${WEBHOOK_DIR}/.env"
if [ -f "$WEBHOOK_ENV" ]; then
    if grep -q "RESEND_API_KEY=re_" "$WEBHOOK_ENV" 2>/dev/null; then
        echo -e "${GREEN}✓ RESEND_API_KEY is configured${NC}"
    else
        echo -e "${RED}✗ RESEND_API_KEY not set or invalid in $WEBHOOK_ENV${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}✗ Webhook .env not found at $WEBHOOK_ENV${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# =============================================================================
# Check 6: Test webhook connectivity from Docker
# =============================================================================
echo -e "${YELLOW}[6/6] Testing webhook connectivity...${NC}"

if [ "$WEBHOOK_RUNNING" = true ]; then
    # Test from localhost
    LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/health 2>/dev/null || echo "000")
    if [ "$LOCAL_TEST" = "200" ]; then
        echo -e "${GREEN}✓ Localhost health check: HTTP $LOCAL_TEST${NC}"
    else
        echo -e "${YELLOW}⚠ Localhost health check: HTTP $LOCAL_TEST${NC}"
    fi
    
    # Test from Docker gateway
    DOCKER_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://${GATEWAY_IP}:3001/health" 2>/dev/null || echo "000")
    if [ "$DOCKER_TEST" = "200" ]; then
        echo -e "${GREEN}✓ Docker gateway ($GATEWAY_IP) health check: HTTP $DOCKER_TEST${NC}"
    else
        echo -e "${RED}✗ Docker gateway ($GATEWAY_IP) health check: HTTP $DOCKER_TEST${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi
echo ""

# =============================================================================
# SUMMARY & FIX
# =============================================================================
echo -e "${BLUE}========================================"
echo -e "  SUMMARY"
echo -e "========================================${NC}"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ Email system is correctly configured for VPS!${NC}"
    echo ""
    echo -e "${BLUE}Current configuration:${NC}"
    echo "  - Webhook: http://${GATEWAY_IP}:3001"
    echo "  - From: Unix@justachat.net (via Resend)"
    echo ""
else
    echo -e "${RED}✗ Found $ISSUES_FOUND issue(s) that need fixing${NC}"
    echo ""
    
    read -p "Do you want to auto-fix these issues? (y/n): " FIX_ISSUES
    
    if [ "$FIX_ISSUES" = "y" ] || [ "$FIX_ISSUES" = "Y" ]; then
        echo ""
        echo -e "${YELLOW}Applying fixes...${NC}"
        
        # Fix 1: Update GoTrue email hook config
        echo -e "${BLUE}[FIX] Updating GoTrue email hook configuration...${NC}"
        
        # Remove any existing email hook lines and add correct ones
        sed -i '/GOTRUE_HOOK_SEND_EMAIL/d' "$DOCKER_ENV" 2>/dev/null || true
        sed -i '/GOTRUE_HOOK_CUSTOM_EMAIL/d' "$DOCKER_ENV" 2>/dev/null || true
        
        # Add correct config
        echo "" >> "$DOCKER_ENV"
        echo "# Local Email Webhook (fixed by check script)" >> "$DOCKER_ENV"
        echo "GOTRUE_HOOK_SEND_EMAIL_ENABLED=true" >> "$DOCKER_ENV"
        echo "GOTRUE_HOOK_SEND_EMAIL_URI=http://${GATEWAY_IP}:3001" >> "$DOCKER_ENV"
        
        echo -e "${GREEN}✓ Updated Docker .env${NC}"
        
        # Fix 2: Ensure webhook binds to 0.0.0.0
        if [ -f "${WEBHOOK_DIR}/server.js" ]; then
            if grep -q "127.0.0.1" "${WEBHOOK_DIR}/server.js" 2>/dev/null; then
                sed -i "s/127.0.0.1/0.0.0.0/g" "${WEBHOOK_DIR}/server.js"
                echo -e "${GREEN}✓ Updated webhook to bind to 0.0.0.0${NC}"
            fi
        fi
        
        # Fix 3: Restart services
        echo -e "${BLUE}[FIX] Restarting services...${NC}"
        
        # Restart webhook
        if systemctl is-enabled justachat-email 2>/dev/null; then
            systemctl restart justachat-email
            echo -e "${GREEN}✓ Restarted justachat-email${NC}"
        elif systemctl is-enabled jac-email-webhook 2>/dev/null; then
            systemctl restart jac-email-webhook
            echo -e "${GREEN}✓ Restarted jac-email-webhook${NC}"
        fi
        
        # Restart GoTrue
        cd ~/supabase/docker
        docker compose up -d --force-recreate auth
        echo -e "${GREEN}✓ Restarted auth container${NC}"
        
        echo ""
        echo -e "${GREEN}========================================"
        echo -e "  FIXES APPLIED"
        echo -e "========================================${NC}"
        echo ""
        echo "Test password reset by going to https://justachat.net/auth"
        echo "and clicking 'Forgot password'"
        echo ""
    fi
fi

echo -e "${BLUE}Useful commands:${NC}"
echo "  - Check webhook logs: sudo journalctl -u justachat-email -f"
echo "  - Check auth logs: docker logs supabase-auth -f"
echo "  - Test email manually: curl -X POST http://localhost:3001/health"
echo ""
