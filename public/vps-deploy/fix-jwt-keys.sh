#!/bin/bash
# Fix JWT Keys for VPS Supabase
# Run: sudo bash /var/www/justachat/public/vps-deploy/fix-jwt-keys.sh

echo "=== JWT Key Fix Script ==="
cd ~/supabase/docker

# Check current JWT_SECRET
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2 | tr -d '"')
echo "Current JWT_SECRET length: ${#JWT_SECRET}"

if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "ERROR: JWT_SECRET is too short (need at least 32 chars)"
  echo "Generate one with: openssl rand -base64 32"
  exit 1
fi

echo ""
echo "=== Current Keys ==="
CURRENT_ANON=$(grep "^ANON_KEY=" .env | cut -d'=' -f2 | tr -d '"')
echo "ANON_KEY starts with: ${CURRENT_ANON:0:20}..."
echo "ANON_KEY length: ${#CURRENT_ANON}"

# Check if keys look like JWTs
if [[ ! "$CURRENT_ANON" == ey* ]]; then
  echo ""
  echo "!!! ANON_KEY is NOT a valid JWT - this is your problem!"
  echo ""
fi

echo ""
echo "=== Generating New JWT Keys ==="
echo "Using jwt.io-compatible method..."

# We need to generate proper JWTs. The easiest way on the VPS is using Node.js
# First check if node is available
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing quick JWT generator..."
  
  # Use python if available
  if command -v python3 &> /dev/null; then
    echo "Using Python to generate JWTs..."
    
    # Generate ANON key (role: anon)
    NEW_ANON=$(python3 << EOF
import base64
import hmac
import hashlib
import json
import time

secret = "$JWT_SECRET"

# Header
header = {"alg": "HS256", "typ": "JWT"}
header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(',', ':')).encode()).rstrip(b'=').decode()

# Payload for anon
exp = int(time.time()) + (10 * 365 * 24 * 60 * 60)  # 10 years
payload = {"role": "anon", "iss": "supabase", "iat": int(time.time()), "exp": exp}
payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(',', ':')).encode()).rstrip(b'=').decode()

# Signature
message = f"{header_b64}.{payload_b64}"
signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()

print(f"{header_b64}.{payload_b64}.{signature_b64}")
EOF
)
    
    # Generate SERVICE_ROLE key (role: service_role)
    NEW_SERVICE=$(python3 << EOF
import base64
import hmac
import hashlib
import json
import time

secret = "$JWT_SECRET"

# Header
header = {"alg": "HS256", "typ": "JWT"}
header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(',', ':')).encode()).rstrip(b'=').decode()

# Payload for service_role
exp = int(time.time()) + (10 * 365 * 24 * 60 * 60)  # 10 years
payload = {"role": "service_role", "iss": "supabase", "iat": int(time.time()), "exp": exp}
payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(',', ':')).encode()).rstrip(b'=').decode()

# Signature
message = f"{header_b64}.{payload_b64}"
signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b'=').decode()

print(f"{header_b64}.{payload_b64}.{signature_b64}")
EOF
)
  else
    echo "Neither Node.js nor Python3 found. Please install one."
    exit 1
  fi
else
  # Use Node.js
  echo "Using Node.js to generate JWTs..."
  
  NEW_ANON=$(node -e "
const crypto = require('crypto');
const secret = '$JWT_SECRET';
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const exp = Math.floor(Date.now()/1000) + (10*365*24*60*60);
const payload = Buffer.from(JSON.stringify({role:'anon',iss:'supabase',iat:Math.floor(Date.now()/1000),exp})).toString('base64url');
const sig = crypto.createHmac('sha256',secret).update(header+'.'+payload).digest('base64url');
console.log(header+'.'+payload+'.'+sig);
")
  
  NEW_SERVICE=$(node -e "
const crypto = require('crypto');
const secret = '$JWT_SECRET';
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const exp = Math.floor(Date.now()/1000) + (10*365*24*60*60);
const payload = Buffer.from(JSON.stringify({role:'service_role',iss:'supabase',iat:Math.floor(Date.now()/1000),exp})).toString('base64url');
const sig = crypto.createHmac('sha256',secret).update(header+'.'+payload).digest('base64url');
console.log(header+'.'+payload+'.'+sig);
")
fi

echo ""
echo "=== Generated New Keys ==="
echo "NEW ANON_KEY: ${NEW_ANON:0:50}..."
echo "NEW SERVICE_ROLE_KEY: ${NEW_SERVICE:0:50}..."

# Validate they start with 'ey'
if [[ "$NEW_ANON" == ey* ]] && [[ "$NEW_SERVICE" == ey* ]]; then
  echo "✓ Both keys are valid JWTs"
else
  echo "ERROR: Generated keys don't look like JWTs"
  exit 1
fi

echo ""
echo "=== Updating .env file ==="

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d%H%M%S)
echo "Backed up .env"

# Update the keys
sed -i "s|^ANON_KEY=.*|ANON_KEY=$NEW_ANON|" .env
sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$NEW_SERVICE|" .env

echo "Updated ANON_KEY and SERVICE_ROLE_KEY in .env"

echo ""
echo "=== Restarting Supabase Services ==="
docker compose down
docker compose up -d

echo ""
echo "=== Waiting for services to start ==="
sleep 15

echo ""
echo "=== Testing Auth API ==="
curl -s http://127.0.0.1:8000/auth/v1/health -H "apikey: $NEW_ANON" || echo "Health check failed"

echo ""
echo "=== IMPORTANT: Update Frontend! ==="
echo ""
echo "You MUST update /var/www/justachat/.env with the new keys:"
echo ""
echo "VITE_SUPABASE_ANON_KEY=$NEW_ANON"
echo ""
echo "Then rebuild the frontend:"
echo "  cd /var/www/justachat && npm run build"
echo ""
echo "=== Done ==="
