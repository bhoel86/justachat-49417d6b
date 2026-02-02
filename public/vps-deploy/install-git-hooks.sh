#!/bin/bash
# Install Git hooks to auto-validate before any pull/merge
# Run once: bash /var/www/justachat/public/vps-deploy/install-git-hooks.sh

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"
HOOKS_DIR="$DEPLOY_DIR/.git/hooks"

echo "Installing VPS protection git hooks..."

# Pre-merge hook (runs before git pull completes)
cat > "$HOOKS_DIR/post-merge" << 'HOOK'
#!/bin/bash
# Auto-runs after git pull/merge to validate and patch VPS files

DEPLOY_DIR="$(git rev-parse --show-toplevel)"
VALIDATOR="$DEPLOY_DIR/public/vps-deploy/validate-before-deploy.sh"

echo ""
echo "=== VPS Post-Merge Validation ==="

# Auto-patch: Replace chat-bot-cloud with chat-bot in frontend
BOTS_FILE="$DEPLOY_DIR/src/hooks/useChatBots.ts"
if [ -f "$BOTS_FILE" ] && grep -q "chat-bot-cloud" "$BOTS_FILE"; then
  sed -i "s/chat-bot-cloud/chat-bot/g" "$BOTS_FILE"
  echo "✓ Auto-patched: useChatBots.ts (chat-bot-cloud → chat-bot)"
fi

# Run full validation
if [ -f "$VALIDATOR" ]; then
  bash "$VALIDATOR"
else
  echo "⚠ Validator script not found at $VALIDATOR"
fi
HOOK

chmod +x "$HOOKS_DIR/post-merge"
echo "✓ Installed post-merge hook"

# Also create a pre-commit hook to prevent accidental commits of Cloud code
cat > "$HOOKS_DIR/pre-commit" << 'HOOK'
#!/bin/bash
# Prevents committing Lovable Cloud patterns to VPS repo

LOVABLE_PATTERNS="supabase\.co|LOVABLE_API_KEY|chat-bot-cloud"

# Check staged files for Lovable patterns
VIOLATIONS=$(git diff --cached --name-only | xargs grep -l -E "$LOVABLE_PATTERNS" 2>/dev/null | grep -v node_modules || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ COMMIT BLOCKED: Staged files contain Lovable Cloud patterns"
  echo ""
  echo "Files with violations:"
  echo "$VIOLATIONS"
  echo ""
  echo "VPS commits should not include supabase.co URLs or LOVABLE_API_KEY"
  exit 1
fi
HOOK

chmod +x "$HOOKS_DIR/pre-commit"
echo "✓ Installed pre-commit hook"

echo ""
echo "Git hooks installed! Protection is now automatic."
echo ""
echo "What happens now:"
echo "  - After every 'git pull': Files are auto-validated and patched"
echo "  - Before every 'git commit': Lovable Cloud patterns are blocked"
