#!/bin/bash
# JustAChat VPS - Complete Wipe Script
# Removes ALL remnants: Docker, services, project files
# Run this BEFORE rebuild-vps-v2.sh for a clean slate
#
# Usage: bash /var/www/justachat/public/vps-deploy/wipe-vps.sh
#    or: curl -sSL https://raw.githubusercontent.com/UnixMint/justachat-unix/main/public/vps-deploy/wipe-vps.sh | bash

set -euo pipefail

echo "============================================"
echo "JUSTACHAT VPS COMPLETE WIPE"
echo "Running as: $(whoami)"
echo "Date: $(date)"
echo "============================================"
echo ""
echo "WARNING: This will remove ALL Docker containers,"
echo "images, volumes, project files, and services."
echo ""
read -r -p "Are you sure you want to continue? [y/N]: " CONFIRM
if [[ ! "${CONFIRM}" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "[1/6] Stopping system services..."
sudo systemctl stop jac-deploy 2>/dev/null || true
sudo systemctl stop justachat-email 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
echo "  ✓ Services stopped"

echo ""
echo "[2/6] Stopping Docker stack..."
if [ -d "/home/unix/supabase/docker" ]; then
  cd /home/unix/supabase/docker
  sudo docker compose down -v --remove-orphans 2>/dev/null || true
  echo "  ✓ Docker stack stopped"
else
  echo "  ⚠ No Docker stack found at /home/unix/supabase/docker"
fi

echo ""
echo "[3/6] Removing ALL Docker images, containers, and volumes..."
sudo docker system prune -af --volumes
echo "  ✓ Docker cleaned"

echo ""
echo "[4/6] Removing project folders..."
sudo rm -rf /home/unix/supabase
sudo rm -rf /var/www/justachat
sudo rm -rf /opt/jac-deploy
sudo rm -rf /opt/justachat-email
sudo rm -rf /opt/email-webhook
echo "  ✓ Project folders removed"

echo ""
echo "[5/6] Removing systemd service units..."
sudo rm -f /etc/systemd/system/jac-deploy.service
sudo rm -f /etc/systemd/system/justachat-email.service
sudo systemctl daemon-reload
echo "  ✓ Service units removed"

echo ""
echo "[6/6] Cleaning up credentials..."
rm -f /home/unix/justachat-credentials.txt 2>/dev/null || true
echo "  ✓ Old credentials removed"

echo ""
echo "============================================"
echo "WIPE COMPLETE!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Setup directories:"
echo "     sudo mkdir -p /var/www && sudo chown -R unix:unix /var/www"
echo ""
echo "  2. Clone fresh repo:"
echo "     cd /var/www"
echo "     git clone https://github.com/bhoel86/justachat-49417d6b.git justachat"
echo ""
echo "  3. Run rebuild:"
echo "     cd justachat"
echo "     bash public/vps-deploy/rebuild-vps-v2.sh"
echo ""
