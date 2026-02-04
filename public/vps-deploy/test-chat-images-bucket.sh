#!/bin/bash
# ============================================
# TEST CHAT-IMAGES BUCKET ON VPS
# Validates bucket exists, policies are set, and uploads work
# Run: bash /var/www/justachat/public/vps-deploy/test-chat-images-bucket.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DOCKER_DIR="${DOCKER_DIR:-/home/unix/supabase/docker}"

echo ""
echo "============================================"
echo -e "${CYAN}  CHAT-IMAGES BUCKET TEST${NC}"
echo "============================================"
echo ""

# Test 1: Check bucket exists
echo -e "${YELLOW}[1] Checking chat-images bucket exists...${NC}"
BUCKET_CHECK=$(cd "$DOCKER_DIR" && docker compose exec -T db psql -U postgres -t -c "SELECT id, public FROM storage.buckets WHERE id = 'chat-images';" 2>/dev/null | tr -d ' ')

if echo "$BUCKET_CHECK" | grep -q "chat-images"; then
  echo -e "${GREEN}✓ chat-images bucket exists${NC}"
  if echo "$BUCKET_CHECK" | grep -q "|t"; then
    echo -e "${GREEN}✓ Bucket is public${NC}"
  else
    echo -e "${RED}✗ Bucket is NOT public - uploads won't be viewable${NC}"
  fi
else
  echo -e "${RED}✗ chat-images bucket NOT FOUND${NC}"
  echo "  Run: docker compose exec db psql -U postgres -c \"INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);\""
  exit 1
fi

# Test 2: Check RLS policies
echo ""
echo -e "${YELLOW}[2] Checking RLS policies on storage.objects...${NC}"
POLICIES=$(cd "$DOCKER_DIR" && docker compose exec -T db psql -U postgres -t -c "SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE 'chat_images%';" 2>/dev/null)

EXPECTED_POLICIES=("chat_images_public_read" "chat_images_user_insert" "chat_images_service_role_all")
MISSING=0

for policy in "${EXPECTED_POLICIES[@]}"; do
  if echo "$POLICIES" | grep -q "$policy"; then
    echo -e "${GREEN}✓ Policy: $policy${NC}"
  else
    echo -e "${RED}✗ Missing policy: $policy${NC}"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  echo -e "${YELLOW}Run this to create missing policies:${NC}"
  echo "docker compose exec db psql -U postgres -c \""
  echo "DROP POLICY IF EXISTS chat_images_public_read ON storage.objects;"
  echo "DROP POLICY IF EXISTS chat_images_user_insert ON storage.objects;"
  echo "DROP POLICY IF EXISTS chat_images_service_role_all ON storage.objects;"
  echo "CREATE POLICY chat_images_public_read ON storage.objects FOR SELECT USING (bucket_id = 'chat-images');"
  echo "CREATE POLICY chat_images_user_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);"
  echo "CREATE POLICY chat_images_service_role_all ON storage.objects FOR ALL TO service_role USING (bucket_id = 'chat-images') WITH CHECK (bucket_id = 'chat-images');"
  echo "\""
fi

# Test 3: Check frontend code is using chat-images bucket
echo ""
echo -e "${YELLOW}[3] Checking frontend code uses chat-images bucket...${NC}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"

FILES_TO_CHECK=(
  "src/components/chat/ChatInput.tsx"
  "src/components/chat/PrivateChatWindow.tsx"
  "src/components/video/VideoChatBar.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
  FULL_PATH="$DEPLOY_DIR/$file"
  if [ -f "$FULL_PATH" ]; then
    if grep -q 'bucket.*chat-images' "$FULL_PATH" 2>/dev/null; then
      echo -e "${GREEN}✓ $file uses chat-images bucket${NC}"
    elif grep -q 'bucket.*avatars' "$FULL_PATH" 2>/dev/null; then
      echo -e "${RED}✗ $file still uses avatars bucket - needs git pull${NC}"
    else
      echo -e "${YELLOW}? $file - couldn't verify bucket${NC}"
    fi
  else
    echo -e "${YELLOW}? $file not found${NC}"
  fi
done

# Test 4: Check upload-image edge function
echo ""
echo -e "${YELLOW}[4] Checking upload-image edge function...${NC}"
FUNC_PATH="$DOCKER_DIR/volumes/functions/main/upload-image/index.ts"

if [ -f "$FUNC_PATH" ]; then
  if grep -q "chat-images" "$FUNC_PATH"; then
    echo -e "${GREEN}✓ Edge function allows chat-images bucket${NC}"
  else
    echo -e "${YELLOW}⚠ Edge function may need update for chat-images${NC}"
  fi
else
  echo -e "${YELLOW}? Edge function not found at expected path${NC}"
fi

# Test 5: Test endpoint responds
echo ""
echo -e "${YELLOW}[5] Testing upload-image endpoint...${NC}"
OPTIONS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://127.0.0.1:8000/functions/v1/upload-image 2>/dev/null || echo "000")
POST_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8000/functions/v1/upload-image 2>/dev/null || echo "000")

echo "  OPTIONS: $OPTIONS_CODE (expect 200)"
echo "  POST (no auth): $POST_CODE (expect 401)"

if [ "$OPTIONS_CODE" = "200" ]; then
  echo -e "${GREEN}✓ CORS preflight working${NC}"
else
  echo -e "${RED}✗ CORS may have issues${NC}"
fi

if [ "$POST_CODE" = "401" ]; then
  echo -e "${GREEN}✓ Auth enforcement working${NC}"
else
  echo -e "${YELLOW}⚠ Unexpected response (may still work)${NC}"
fi

# Summary
echo ""
echo "============================================"
echo -e "${CYAN}  TEST COMPLETE${NC}"
echo "============================================"
echo ""
echo "If all checks passed, test by uploading an image in:"
echo "  - Main chat room"
echo "  - Private message window"
echo "  - Video chat bar"
echo ""
