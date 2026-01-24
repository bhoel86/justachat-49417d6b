========================================
JAC IRC Proxy v2.1
========================================

Connect mIRC, HexChat, and other IRC clients to JAC chat.
Supports plain TCP (6667) and SSL/TLS (6697) with auto-renewal.


========================================
QUICK START (VPS with Auto-SSL)
========================================

The easiest way - automatic Let's Encrypt certificates!

REQUIREMENTS:
- VPS with Docker installed
- Domain pointing to your VPS (A record)
- Ports 80, 6667, 6697 open

ONE-COMMAND SETUP:
  curl -O https://justachat.net/irc-proxy/setup.sh
  # If your domain isn't live yet:
  # curl -O https://id-preview--3468328b-9f6a-4d30-ad57-93742355db43.lovable.app/irc-proxy/setup.sh
  chmod +x setup.sh
  ./setup.sh

MANUAL DOCKER SETUP:
  1. Copy files to your VPS
  2. Edit .env.docker and rename to .env:
       DOMAIN=irc.yourdomain.com
       ACME_EMAIL=you@email.com
  3. Get initial certificate:
       docker compose --profile init up certbot-init
  4. Start proxy:
       docker compose up -d

Certificates auto-renew every 12 hours (if needed).


========================================
OPTION 1: LOCAL USE (Personal)
========================================

REQUIREMENTS:
- Node.js (https://nodejs.org/)

SETUP:
1. Install Node.js
2. Double-click "install.bat"
3. Double-click "START.bat"

MIRC SETTINGS:
- Server: 127.0.0.1
- Port: 6667
- Password: your-email@example.com:your-password


========================================
OPTION 2: DOCKER (No Auto-SSL)
========================================

If you have your own certificates.

  mkdir certs
  cp /path/to/fullchain.pem certs/
  cp /path/to/privkey.pem certs/
  
  # Edit docker-compose.yml to use ./certs volume
  docker compose up -d


========================================
OPTION 3: NODE.JS DIRECT
========================================

  npm install
  HOST=0.0.0.0 SSL_ENABLED=true \
  SSL_CERT=/path/to/cert.pem \
  SSL_KEY=/path/to/key.pem \
  node proxy.js


========================================
ENVIRONMENT VARIABLES
========================================

WS_URL      - WebSocket gateway URL
HOST        - 127.0.0.1 (local) or 0.0.0.0 (public)
PORT        - TCP port (default: 6667)
SSL_ENABLED - true/false
SSL_PORT    - SSL port (default: 6697)
SSL_CERT    - Path to certificate
SSL_KEY     - Path to private key
LOG_LEVEL   - debug, info, warn, error

Docker-specific:
DOMAIN      - Your domain for Let's Encrypt
ACME_EMAIL  - Email for cert notifications


========================================
TROUBLESHOOTING
========================================

"Certificate not found"
  - Run: docker compose --profile init up certbot-init
  - Check domain DNS points to server

"Port 80 in use"
  - Stop web server: sudo systemctl stop nginx
  - Or use standalone cert method

"Renewal failed"
  - Check: docker compose logs certbot
  - Manual renew: docker compose run --rm certbot renew

View all logs:
  docker compose logs -f

Restart after cert renewal:
  docker compose restart irc-proxy


========================================
YOUR USERS' SETTINGS
========================================

Once running, tell your users:

  Server: your-domain.com (or IP)
  Port: 6667 (plain) or 6697 (SSL)
  Password: their-email@example.com:their-password
  
  Enable SSL/TLS for port 6697

========================================
