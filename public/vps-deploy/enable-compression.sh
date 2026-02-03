#!/bin/bash
# Enable gzip compression for better page speed scores
# Run on VPS: bash enable-compression.sh

set -e

NGINX_CONF="/etc/nginx/nginx.conf"

echo "=== Enabling Gzip Compression for JustAChat ==="

# Backup current config
cp "$NGINX_CONF" "$NGINX_CONF.bak.$(date +%Y%m%d%H%M%S)"
echo "✓ Backed up current nginx.conf"

# Check if gzip is already enabled
if grep -q "gzip on;" "$NGINX_CONF"; then
    echo "⚠ Gzip is already enabled in nginx.conf"
else
    # Add gzip configuration after 'http {' line
    sed -i '/http {/a\
    # Gzip Compression for SEO & Performance\
    gzip on;\
    gzip_vary on;\
    gzip_proxied any;\
    gzip_comp_level 6;\
    gzip_min_length 1000;\
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;' "$NGINX_CONF"
    echo "✓ Added gzip compression configuration"
fi

# Test nginx config
echo "Testing nginx configuration..."
nginx -t

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "=== Gzip Compression Enabled Successfully ==="
echo "Compression is now active for:"
echo "  - text/plain, text/css, text/xml"
echo "  - application/json, application/javascript"
echo "  - application/rss+xml, application/atom+xml"
echo "  - image/svg+xml"
echo ""
echo "Test at: https://tools.keycdn.com/http2-test"
