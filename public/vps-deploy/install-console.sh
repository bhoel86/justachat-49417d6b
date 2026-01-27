#!/bin/bash
# JAC VPS Console - Quick Install
# Run: curl -sSL https://justachat.net/vps-deploy/install-console.sh | sudo bash

set -e

echo "========================================"
echo "JAC VPS Console - Installation"
echo "========================================"

# Create directories
mkdir -p /opt/jac-deploy
mkdir -p /backups/justachat

# Download files
echo "Downloading files..."
cd /opt/jac-deploy
curl -sSL -o console-server.js https://justachat.net/vps-deploy/console-server.js
curl -sSL -o manage.sh https://justachat.net/vps-deploy/manage.sh
chmod +x manage.sh

# Create systemd service
cat > /etc/systemd/system/jac-console.service << 'EOF'
[Unit]
Description=JAC VPS Console
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jac-deploy
ExecStart=/usr/bin/node console-server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=DEPLOY_DIR=/var/www/justachat
Environment=BACKUP_DIR=/backups/justachat
Environment=CONSOLE_PORT=6680

[Install]
WantedBy=multi-user.target
EOF

# Add nginx config for /console route
NGINX_CONF="/etc/nginx/sites-available/justachat"
if [ -f "$NGINX_CONF" ]; then
  if ! grep -q "location /console" "$NGINX_CONF"; then
    echo ""
    echo "Add this to your nginx config inside the server block:"
    echo ""
    echo '    location /console {'
    echo '        proxy_pass http://127.0.0.1:6680/;'
    echo '        proxy_http_version 1.1;'
    echo '        proxy_set_header Upgrade $http_upgrade;'
    echo '        proxy_set_header Connection "upgrade";'
    echo '        proxy_set_header Host $host;'
    echo '        proxy_read_timeout 300s;'
    echo '    }'
    echo ""
  fi
fi

# Enable and start service
systemctl daemon-reload
systemctl enable jac-console
systemctl start jac-console

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Console server running on http://127.0.0.1:6680"
echo ""
echo "To access via web, add nginx location block above"
echo "Then: nginx -t && systemctl reload nginx"
echo ""
echo "Access at: https://justachat.net/console"
echo ""
echo "Commands:"
echo "  Status:  systemctl status jac-console"
echo "  Logs:    journalctl -u jac-console -f"
echo "  Restart: systemctl restart jac-console"
echo ""
