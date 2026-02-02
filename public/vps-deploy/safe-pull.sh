#!/bin/bash
# VPS Safe Pull - Validates files before and after git pull
# Automatically protects VPS-specific files from being overwritten
# Usage: bash /var/www/justachat/public/vps-deploy/safe-pull.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"
BACKUP_DIR="/tmp/vps-protected-backup-$(date +%s)"

echo "========================================"
echo -e "${CYAN}  VPS SAFE PULL${NC}"
echo "========================================"

cd "$DEPLOY_DIR"

# Files to protect (backup before pull, restore after)
PROTECTED_FILES=(
  ".env"
  ".env.local"
  "supabase/functions/chat-bot/index.ts"
)

# Step 1: Backup protected files
echo ""
echo -e "${YELLOW}[1/5] Backing up VPS-protected files...${NC}"
mkdir -p "$BACKUP_DIR"
for file in "${PROTECTED_FILES[@]}"; do
  if [ -f "$DEPLOY_DIR/$file" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname $file)"
    cp "$DEPLOY_DIR/$file" "$BACKUP_DIR/$file"
    echo "  ✓ Backed up: $file"
  fi
done

# Step 2: Stash any local changes
echo ""
echo -e "${YELLOW}[2/5] Stashing local changes...${NC}"
git stash --include-untracked 2>/dev/null || true

# Step 3: Pull from origin
echo ""
echo -e "${YELLOW}[3/5] Pulling from GitHub...${NC}"
git fetch origin main
git reset --hard origin/main

# Step 4: Restore protected files
echo ""
echo -e "${YELLOW}[4/5] Restoring VPS-protected files...${NC}"
for file in "${PROTECTED_FILES[@]}"; do
  if [ -f "$BACKUP_DIR/$file" ]; then
    cp "$BACKUP_DIR/$file" "$DEPLOY_DIR/$file"
    echo "  ✓ Restored: $file"
  fi
done

# Step 5: Fix frontend to use VPS endpoints
echo ""
echo -e "${YELLOW}[5/5] Patching frontend for VPS...${NC}"

# Patch useChatBots.ts to use 'chat-bot' instead of 'chat-bot-cloud'
BOTS_FILE="$DEPLOY_DIR/src/hooks/useChatBots.ts"
if [ -f "$BOTS_FILE" ]; then
  if grep -q "chat-bot-cloud" "$BOTS_FILE"; then
    sed -i "s/chat-bot-cloud/chat-bot/g" "$BOTS_FILE"
    echo "  ✓ Patched useChatBots.ts: chat-bot-cloud → chat-bot"
  else
    echo "  ✓ useChatBots.ts already uses correct endpoint"
  fi
fi

# Run validation
echo ""
echo -e "${YELLOW}Running validation...${NC}"
bash "$DEPLOY_DIR/public/vps-deploy/validate-before-deploy.sh" || {
  echo ""
  echo -e "${RED}Validation failed! Restoring from backup...${NC}"
  for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$file" ]; then
      cp "$BACKUP_DIR/$file" "$DEPLOY_DIR/$file"
    fi
  done
  exit 1
}

# Cleanup
rm -rf "$BACKUP_DIR"

echo ""
echo -e "${GREEN}✓ Safe pull complete!${NC}"
echo ""
echo "Next steps:"
echo "  cd $DEPLOY_DIR"
echo "  npm install --legacy-peer-deps"
echo "  npm run build"
