#!/bin/bash
# Justachat Deploy Server - Upgrade to HTTPS + PAT
# Run: curl -sSL https://justachat.net/vps-deploy/upgrade-to-https.sh | sudo bash

set -e

echo "========================================"
echo "Upgrading Deploy Server to HTTPS + PAT"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo)"
  exit 1
fi

# Prompt for GitHub PAT
echo "Enter your GitHub Personal Access Token (PAT) with 'repo' scope:"
echo "(Create one at: https://github.com/settings/tokens/new)"
echo ""
read -r GITHUB_PAT

if [ -z "$GITHUB_PAT" ]; then
  echo "ERROR: GitHub PAT is required"
  exit 1
fi

# Configuration
DEPLOY_DIR="/var/www/justachat"
DEPLOY_USER="unix"
GITHUB_REPO="bhoel86/justachat"
JAC_DEPLOY_DIR="/opt/jac-deploy"

echo ""
echo "Stopping deploy server..."
systemctl stop jac-deploy 2>/dev/null || true

echo "Downloading updated server.js..."
cd "$JAC_DEPLOY_DIR"
curl -sSL -o server.js https://justachat.net/vps-deploy/server.js

echo "Updating .env configuration..."
# Preserve existing DEPLOY_TOKEN if present
if [ -f .env ]; then
  EXISTING_TOKEN=$(grep "^DEPLOY_TOKEN=" .env | cut -d'=' -f2)
fi

if [ -z "$EXISTING_TOKEN" ]; then
  EXISTING_TOKEN=$(openssl rand -hex 24)
  echo "Generated new DEPLOY_TOKEN: $EXISTING_TOKEN"
fi

cat > .env << EOF
DEPLOY_TOKEN=$EXISTING_TOKEN
DEPLOY_DIR=$DEPLOY_DIR
GIT_BRANCH=main
DEPLOY_PORT=6680
GITHUB_PAT=$GITHUB_PAT
GITHUB_REPO=$GITHUB_REPO
DEPLOY_USER=$DEPLOY_USER
EOF

echo "Fixing permissions on $DEPLOY_DIR..."
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

echo "Switching git remote to HTTPS..."
cd "$DEPLOY_DIR"
sudo -u "$DEPLOY_USER" git remote set-url origin "https://${GITHUB_PAT}@github.com/${GITHUB_REPO}.git"

echo "Starting deploy server..."
systemctl start jac-deploy

echo ""
echo "========================================"
echo "Upgrade Complete!"
echo "========================================"
echo ""
echo "Deploy server is now using HTTPS + PAT authentication"
echo "All git operations will run as user: $DEPLOY_USER"
echo ""
echo "Your DEPLOY_TOKEN: $EXISTING_TOKEN"
echo "(Use this in /admin/deploy if not already saved)"
echo ""
echo "Test with: systemctl status jac-deploy"
echo ""
