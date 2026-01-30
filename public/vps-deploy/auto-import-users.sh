#!/bin/bash
# =============================================================================
# Justachat VPS - Auto Import Users from GitHub
# =============================================================================
# This script:
#   1. Pulls users.csv from the GitHub repo
#   2. Creates all users with random passwords
#   3. Outputs credentials to imported-credentials.csv
#
# Usage: curl -sL https://raw.githubusercontent.com/USER/justachat-49417d6b/main/public/vps-deploy/auto-import-users.sh | bash
# =============================================================================

set -e

# Config
GITHUB_RAW="https://raw.githubusercontent.com/GPT-Engineer-App-Dev/justachat-49417d6b/main/public/vps-deploy/users.csv"
WORK_DIR="/tmp/justachat-import"
OUTPUT_FILE="$WORK_DIR/imported-credentials.csv"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================="
echo -e "  JUSTACHAT AUTO USER IMPORT"
echo -e "==============================================${NC}"
echo ""

# Create work directory
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Download users.csv from GitHub
echo -e "${YELLOW}Downloading users.csv from GitHub...${NC}"
if ! curl -sL "$GITHUB_RAW" -o users.csv; then
    echo -e "${RED}Failed to download users.csv from GitHub${NC}"
    exit 1
fi

# Check if file has content
if [ ! -s users.csv ]; then
    echo -e "${RED}users.csv is empty or not found${NC}"
    exit 1
fi

# Show what we're importing
echo -e "${GREEN}Downloaded users.csv:${NC}"
cat users.csv | grep -v '^#' | head -10
echo ""

# Get Supabase credentials
cd ~/supabase/docker 2>/dev/null || { echo -e "${RED}Supabase directory not found at ~/supabase/docker${NC}"; exit 1; }

SERVICE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2- | tr -d '"')
if [ -z "$SERVICE_KEY" ]; then
    echo -e "${RED}Error: SERVICE_ROLE_KEY not found in .env${NC}"
    exit 1
fi

API_URL="http://localhost:8000"

# Initialize output file
echo "email,username,password,status" > "$OUTPUT_FILE"

# Count users (excluding comments and empty lines)
TOTAL=$(grep -v '^#' "$WORK_DIR/users.csv" | grep -c '.' 2>/dev/null || echo "0")
echo -e "${YELLOW}Found $TOTAL users to import${NC}"
echo ""

SUCCESS=0
FAILED=0

# Process each line
while IFS=',' read -r EMAIL USERNAME || [ -n "$EMAIL" ]; do
    # Skip empty lines and comments
    [[ -z "$EMAIL" || "$EMAIL" =~ ^# ]] && continue
    
    # Trim whitespace
    EMAIL=$(echo "$EMAIL" | xargs)
    USERNAME=$(echo "$USERNAME" | xargs)
    
    # Skip if no email
    [ -z "$EMAIL" ] && continue
    
    # Generate random 12-char password
    PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9!@#$' | head -c12)
    
    echo -n "Creating $EMAIL ($USERNAME)... "
    
    # Create user via GoTrue Admin API
    RESULT=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
        -H "Authorization: Bearer $SERVICE_KEY" \
        -H "apikey: $SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"$PASSWORD\",
            \"email_confirm\": true,
            \"user_metadata\": {\"username\": \"$USERNAME\"}
        }" 2>/dev/null)
    
    # Check result
    if echo "$RESULT" | grep -q '"id"'; then
        echo -e "${GREEN}✓ Success${NC}"
        echo "$EMAIL,$USERNAME,$PASSWORD,created" >> "$OUTPUT_FILE"
        ((SUCCESS++))
    else
        ERROR=$(echo "$RESULT" | grep -oP '"message"\s*:\s*"\K[^"]+' | head -1)
        if [ -z "$ERROR" ]; then
            ERROR=$(echo "$RESULT" | grep -oP '"msg"\s*:\s*"\K[^"]+' | head -1)
        fi
        [ -z "$ERROR" ] && ERROR="Unknown error"
        echo -e "${RED}✗ $ERROR${NC}"
        echo "$EMAIL,$USERNAME,,$ERROR" >> "$OUTPUT_FILE"
        ((FAILED++))
    fi
    
done < "$WORK_DIR/users.csv"

echo ""
echo -e "${BLUE}=============================================="
echo -e "  IMPORT COMPLETE"
echo -e "==============================================${NC}"
echo -e "${GREEN}Success: $SUCCESS${NC}"
echo -e "${RED}Failed:  $FAILED${NC}"
echo ""
echo -e "Credentials saved to: ${YELLOW}$OUTPUT_FILE${NC}"
echo ""

# Show the credentials
if [ $SUCCESS -gt 0 ]; then
    echo -e "${BLUE}=== CREDENTIALS (SAVE THESE!) ===${NC}"
    cat "$OUTPUT_FILE"
    echo ""
    echo -e "${YELLOW}Copy /tmp/justachat-import/imported-credentials.csv to keep these!${NC}"
fi
