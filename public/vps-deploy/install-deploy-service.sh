#!/bin/bash
# Justachat Deploy Server - Quick Install
# Run: curl -sSL https://justachat.net/vps-deploy/install.sh | sudo bash

set -e

echo "========================================"
echo "Justachat Deploy Server - Installation"
echo "========================================"

# Create directory
mkdir -p /opt/jac-deploy
cd /opt/jac-deploy

# Download files
echo "Downloading files..."
curl -sSL -o server.js https://justachat.net/vps-deploy/server.js
curl -sSL -o package.json https://justachat.net/vps-deploy/package.json

# Install dependencies
echo "Installing dependencies..."
npm install --omit=dev

# Generate random token if not set
if [ -z "$DEPLOY_TOKEN" ]; then
  DEPLOY_TOKEN=$(openssl rand -hex 24)
  echo "Generated DEPLOY_TOKEN: $DEPLOY_TOKEN"
fi

# Prompt for GitHub PAT if not set
if [ -z "$GITHUB_PAT" ]; then
  echo ""
  echo "Enter your GitHub Personal Access Token (PAT) with 'repo' scope:"
  echo "(Get one at: https://github.com/settings/tokens/new)"
  read -r GITHUB_PAT
fi

# Prompt for GitHub repo if not set
if [ -z "$GITHUB_REPO" ]; then
  GITHUB_REPO="bhoel86/justachat"
  echo "Using default GitHub repo: $GITHUB_REPO"
fi

# Create .env file
cat > .env << EOF
DEPLOY_TOKEN=$DEPLOY_TOKEN
DEPLOY_DIR=/var/www/justachat
GIT_BRANCH=main
DEPLOY_PORT=6680
GITHUB_PAT=$GITHUB_PAT
GITHUB_REPO=$GITHUB_REPO
DEPLOY_USER=unix
EOF

echo "Configuration saved to /opt/jac-deploy/.env"

# Create systemd service
cat > /etc/systemd/system/jac-deploy.service << EOF
[Unit]
Description=Justachat Deploy Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jac-deploy
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=jac-deploy
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable jac-deploy
systemctl start jac-deploy

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Deploy server running on http://127.0.0.1:6680"
echo ""
echo "IMPORTANT: Add this token as a Supabase secret:"
echo "  Secret Name: VPS_DEPLOY_TOKEN"
echo "  Value: $DEPLOY_TOKEN"
echo ""
echo "Commands:"
echo "  Status:  systemctl status jac-deploy"
echo "  Logs:    journalctl -u jac-deploy -f"
echo "  Restart: systemctl restart jac-deploy"
echo ""
