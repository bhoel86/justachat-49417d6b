#!/bin/bash
# JustAChat - Quick Fix for Mobile Login (phone-friendly script)
# Run: curl -sSL https://justachat.net/vps-deploy/quick-fix-mobile.sh | bash

set -e
cd /var/www/justachat

echo "╔═════════════════════════════════════════╗"
echo "║   JustAChat Mobile Login Fix            ║"
echo "╚═════════════════════════════════════════╝"
echo ""

echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main

echo "📦 Building..."
npm run build 2>/dev/null || npm install && npm run build

echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "╔═════════════════════════════════════════╗"
echo "║   ✅ DONE! Clear browser cache & retry  ║"
echo "╚═════════════════════════════════════════╝"
