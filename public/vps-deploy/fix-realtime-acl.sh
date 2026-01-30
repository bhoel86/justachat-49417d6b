#!/bin/bash
# JustAChat VPS - Fix Realtime WebSocket ACL
# This fixes the 403 error on /realtime/v1/websocket by allowing anon + authenticated roles
#
# Run: bash /var/www/justachat/public/vps-deploy/fix-realtime-acl.sh

set -euo pipefail

echo "============================================"
echo "JUSTACHAT - FIX REALTIME WEBSOCKET ACL"
echo "============================================"
echo ""

KONG_YML="$HOME/supabase/docker/volumes/api/kong.yml"

# Check file exists
if [ ! -f "$KONG_YML" ]; then
  echo "ERROR: Kong config not found at $KONG_YML"
  exit 1
fi

# Backup
BACKUP="$KONG_YML.bak.$(date +%F-%H%M%S)"
cp "$KONG_YML" "$BACKUP"
echo "✓ Backup created: $BACKUP"

# Check if realtime-v1 exists
if ! grep -q "name: realtime-v1" "$KONG_YML"; then
  echo "ERROR: realtime-v1 service not found in kong.yml"
  exit 1
fi

# Use sed to fix the ACL for realtime-v1
# The pattern: find the realtime-v1 block's ACL allow section and replace "- admin" with the full list
# This is a targeted fix that preserves the rest of the file

# First, let's check current state
echo ""
echo "Current realtime-v1 ACL config:"
grep -A 20 "name: realtime-v1" "$KONG_YML" | grep -A 5 "name: acl" | head -8 || echo "(could not parse)"
echo ""

# Create a Python script for precise YAML editing
python3 << 'PYTHONSCRIPT'
import sys

kong_file = sys.argv[1] if len(sys.argv) > 1 else "/home/unix/supabase/docker/volumes/api/kong.yml"

with open(kong_file, 'r') as f:
    content = f.read()

# Find and replace the realtime-v1 ACL block
# We need to find the pattern where realtime-v1 has an ACL that only allows admin

import re

# Pattern to match the realtime-v1 service block's ACL section
# This looks for the acl plugin under realtime-v1 with only admin allowed
old_pattern = r'''(- name: realtime-v1
    url: http://supabase-realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - admin)'''

new_config = '''- name: realtime-v1
    url: http://supabase-realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - anon
            - authenticated
            - service_role
            - admin'''

if old_pattern in content:
    content = content.replace(old_pattern, new_config)
    with open(kong_file, 'w') as f:
        f.write(content)
    print("SUCCESS: Updated realtime-v1 ACL to allow anon + authenticated + service_role + admin")
else:
    # Try a more flexible approach - just update the allow list
    # Look for the realtime section and modify it
    lines = content.split('\n')
    in_realtime = False
    in_acl = False
    in_allow = False
    new_lines = []
    skip_next_admin = False
    modified = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Detect realtime-v1 service
        if 'name: realtime-v1' in line and 'routes' not in line:
            in_realtime = True
        
        # Detect next service (end of realtime block)
        if in_realtime and line.strip().startswith('- name:') and 'realtime-v1' not in line and 'realtime-v1-all' not in line and 'cors' not in line and 'key-auth' not in line and 'acl' not in line:
            in_realtime = False
            in_acl = False
            in_allow = False
        
        # Detect ACL plugin in realtime block
        if in_realtime and 'name: acl' in line:
            in_acl = True
        
        # Detect allow list in ACL
        if in_realtime and in_acl and 'allow:' in line:
            in_allow = True
            new_lines.append(line)
            # Add all the roles
            indent = '            '  # 12 spaces based on the yaml structure
            new_lines.append(indent + '- anon')
            new_lines.append(indent + '- authenticated')
            new_lines.append(indent + '- service_role')
            new_lines.append(indent + '- admin')
            modified = True
            # Skip all existing entries under allow
            i += 1
            while i < len(lines) and lines[i].strip().startswith('- ') and 'name:' not in lines[i]:
                i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    if modified:
        with open(kong_file, 'w') as f:
            f.write('\n'.join(new_lines))
        print("SUCCESS: Updated realtime-v1 ACL (flexible method)")
    else:
        print("WARNING: Could not find realtime-v1 ACL to update. Check manually.")
        sys.exit(1)

PYTHONSCRIPT

if [ $? -ne 0 ]; then
  echo ""
  echo "Python script failed. Restoring backup..."
  cp "$BACKUP" "$KONG_YML"
  exit 1
fi

echo ""
echo "New realtime-v1 ACL config:"
grep -A 25 "name: realtime-v1" "$KONG_YML" | grep -A 8 "name: acl" | head -10 || echo "(could not parse)"
echo ""

# Restart Kong
echo ""
echo "Restarting Kong..."
cd "$HOME/supabase/docker"
sudo docker compose restart kong

echo ""
echo "Waiting 10 seconds for Kong to stabilize..."
sleep 10

# Verify Kong is running
if sudo docker ps | grep -q supabase-kong; then
  echo "✓ Kong is running"
else
  echo "ERROR: Kong failed to start. Check logs:"
  echo "  sudo docker logs supabase-kong --tail 30"
  exit 1
fi

echo ""
echo "============================================"
echo "FIX COMPLETE!"
echo "============================================"
echo ""
echo "Test by:"
echo "1. Open https://justachat.net/chat/general in two tabs"
echo "2. Send a message in one tab"
echo "3. It should appear in the other tab instantly"
echo ""
echo "Check Kong logs for WebSocket connections:"
echo "  sudo docker logs supabase-kong --tail 20 | grep realtime"
echo ""
echo "You should see 101 (Switching Protocols) instead of 403"
echo ""
