#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - FIREWALL HARDENING
# Closes unnecessary ports (specifically port 8000 Kong gateway)
#
# Port 8000 should NOT be publicly accessible - all traffic goes through Nginx
# This prevents bots from directly hitting Kong/Supabase endpoints
#
# Usage: sudo bash harden-firewall.sh
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     JUSTACHAT VPS FIREWALL HARDENING                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root: sudo bash harden-firewall.sh${NC}"
  exit 1
fi

echo "=== Current UFW Status ==="
ufw status numbered
echo ""

#===============================================================================
# STEP 1: Remove port 8000 from public access
#===============================================================================
echo -e "${BLUE}[1/4] Removing public access to port 8000 (Kong)...${NC}"

# Delete any rules allowing port 8000
UFW_RULES=$(ufw status numbered | grep "8000" | grep -oP '^\[\s*\K[0-9]+' | sort -rn)
for rule in $UFW_RULES; do
  echo "  Deleting rule $rule..."
  yes | ufw delete $rule 2>/dev/null || true
done

echo -e "${GREEN}✓ Port 8000 rules removed${NC}"
echo ""

#===============================================================================
# STEP 2: Ensure only required ports are open
#===============================================================================
echo -e "${BLUE}[2/4] Configuring allowed ports...${NC}"

# Reset and set defaults
ufw default deny incoming
ufw default allow outgoing

# Only these ports should be open publicly:
# 22  - SSH
# 80  - HTTP (redirects to HTTPS)
# 443 - HTTPS (all traffic goes through Nginx)
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

echo -e "${GREEN}✓ Allowed ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)${NC}"
echo ""

#===============================================================================
# STEP 3: Allow internal Docker communication
#===============================================================================
echo -e "${BLUE}[3/4] Allowing internal Docker communication...${NC}"

# Docker subnet needs to reach host services (email webhook on 3001)
DOCKER_SUBNET=$(docker network inspect bridge -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null || echo "172.17.0.0/16")

# Allow Docker to host email webhook
ufw allow from "$DOCKER_SUBNET" to any port 3001 proto tcp comment 'Docker to email webhook'

# Also allow common Docker ranges
ufw allow from 172.16.0.0/12 to any port 3001 proto tcp comment 'Docker range to email webhook' 2>/dev/null || true

echo -e "${GREEN}✓ Docker internal access configured${NC}"
echo ""

#===============================================================================
# STEP 4: Reload firewall
#===============================================================================
echo -e "${BLUE}[4/4] Enabling UFW...${NC}"

ufw --force enable
ufw reload

echo ""
echo "=== Final UFW Status ==="
ufw status verbose
echo ""

#===============================================================================
# VERIFY
#===============================================================================
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              FIREWALL HARDENING COMPLETE                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "PORTS NOW OPEN:"
echo "  22  - SSH access"
echo "  80  - HTTP (redirects to HTTPS via Nginx)"
echo "  443 - HTTPS (all API/IRC/realtime traffic via Nginx)"
echo ""
echo "PORTS NOW CLOSED:"
echo "  8000 - Kong gateway (was exposing backend directly)"
echo ""
echo "All traffic now goes through Nginx:"
echo "  - /auth/*     → Kong → GoTrue"
echo "  - /rest/*     → Kong → PostgREST"
echo "  - /realtime/* → Kong → Realtime (IRC WebSocket)"
echo "  - /storage/*  → Kong → Storage"
echo "  - /functions/* → Kong → Edge Functions"
echo ""
echo -e "${GREEN}✓ Bots can no longer access Kong directly${NC}"
