#!/bin/bash
# =============================================================================
# Justachat VPS - Bulk User Import Script
# =============================================================================
# Usage: 
#   1. Edit users.csv with your users (email,username per line)
#   2. Run: bash import-users.sh
#   3. Credentials saved to imported-credentials.csv
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CSV_FILE="${1:-$SCRIPT_DIR/users.csv}"
OUTPUT_FILE="$SCRIPT_DIR/imported-credentials.csv"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================="
echo -e "  JUSTACHAT BULK USER IMPORT"
echo -e "==============================================${NC}"
echo ""

# Check if CSV exists
if [ ! -f "$CSV_FILE" ]; then
    echo -e "${RED}Error: users.csv not found${NC}"
    echo "Create a file with format: email,username"
    echo "Example:"
    echo "  user1@example.com,CoolUser1"
    echo "  user2@example.com,AwesomeUser2"
    exit 1
fi

# Get Supabase credentials
cd ~/supabase/docker 2>/dev/null || { echo -e "${RED}Supabase directory not found${NC}"; exit 1; }

SERVICE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2- | tr -d '"')
if [ -z "$SERVICE_KEY" ]; then
    echo -e "${RED}Error: SERVICE_ROLE_KEY not found in .env${NC}"
    exit 1
fi

API_URL="http://localhost:8000"

# Initialize output file
echo "email,username,password,status" > "$OUTPUT_FILE"

# Count users
TOTAL=$(grep -c '.' "$CSV_FILE" 2>/dev/null || echo "0")
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
    
    # Generate random 12-char password
    PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9!@#' | head -c12)
    
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
    
done < "$CSV_FILE"

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
    echo -e "${BLUE}=== CREDENTIALS (save these!) ===${NC}"
    cat "$OUTPUT_FILE"
fi
