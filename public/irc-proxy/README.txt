========================================
JAC IRC Proxy v2.0
========================================

Connect mIRC, HexChat, and other IRC clients to JAC chat.
Supports both plain TCP (6667) and SSL/TLS (6697) connections.


========================================
OPTION 1: LOCAL USE (Personal)
========================================

REQUIREMENTS:
- Node.js (https://nodejs.org/ - download LTS version)

SETUP:
1. Install Node.js from https://nodejs.org/
2. Double-click "install.bat"
3. Double-click "START.bat"

MIRC SETTINGS:
- Server: 127.0.0.1
- Port: 6667
- Password: your-email@example.com:your-password


========================================
OPTION 2: DOCKER (Recommended for VPS)
========================================

The easiest way to host publicly.

REQUIREMENTS:
- Docker & Docker Compose

QUICK START (no SSL):
  docker-compose up -d

WITH SSL:
  1. Create certs folder: mkdir certs
  2. Add your certificates (see SSL section below)
  3. Run: SSL_ENABLED=true docker-compose up -d

VIEW LOGS:
  docker-compose logs -f

STOP:
  docker-compose down

YOUR USERS' MIRC SETTINGS:
- Server: your-vps-ip-address
- Port: 6667 (plain) or 6697 (SSL)
- Password: their-email@example.com:their-password
- SSL: Enable if using port 6697


========================================
OPTION 3: NODE.JS ON VPS
========================================

If you prefer not to use Docker.

QUICK SETUP (no SSL):
  npm install
  HOST=0.0.0.0 node proxy.js

WITH SSL:
  npm install
  HOST=0.0.0.0 SSL_ENABLED=true \
  SSL_CERT=/path/to/fullchain.pem \
  SSL_KEY=/path/to/privkey.pem \
  node proxy.js

SYSTEMD SERVICE:
Create /etc/systemd/system/jac-irc.service:

  [Unit]
  Description=JAC IRC Proxy
  After=network.target

  [Service]
  Type=simple
  User=www-data
  WorkingDirectory=/path/to/irc-proxy
  Environment=HOST=0.0.0.0
  Environment=PORT=6667
  Environment=SSL_ENABLED=true
  Environment=SSL_PORT=6697
  Environment=SSL_CERT=/etc/letsencrypt/live/irc.example.com/fullchain.pem
  Environment=SSL_KEY=/etc/letsencrypt/live/irc.example.com/privkey.pem
  ExecStart=/usr/bin/node proxy.js
  Restart=on-failure

  [Install]
  WantedBy=multi-user.target


========================================
SSL/TLS SETUP
========================================

Standard IRC SSL port is 6697. You need SSL certificates.

OPTION A - LET'S ENCRYPT (Recommended):

  # Install certbot
  sudo apt install certbot
  
  # Get certificate (stop any web servers on port 80 first)
  sudo certbot certonly --standalone -d irc.yourdomain.com
  
  # Certificates are saved to:
  #   /etc/letsencrypt/live/irc.yourdomain.com/fullchain.pem
  #   /etc/letsencrypt/live/irc.yourdomain.com/privkey.pem

OPTION B - SELF-SIGNED (Testing only):

  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout privkey.pem -out fullchain.pem \
    -subj "/CN=irc.localhost"

  Note: Clients will show a certificate warning.

RUNNING WITH SSL:

  SSL_ENABLED=true \
  SSL_PORT=6697 \
  SSL_CERT=/path/to/fullchain.pem \
  SSL_KEY=/path/to/privkey.pem \
  HOST=0.0.0.0 \
  node proxy.js

MIRC SSL SETTINGS:
1. Server address: your-server-ip
2. Port: 6697
3. Check "SSL" or "Use SSL for this server"
4. Password: email@example.com:password


========================================
ENVIRONMENT VARIABLES
========================================

WS_URL      - WebSocket gateway URL
              Default: JAC production gateway

HOST        - IP to bind to
              127.0.0.1 = local only (default)
              0.0.0.0 = public/all interfaces

PORT        - TCP port (default: 6667)

SSL_ENABLED - Enable SSL/TLS (true/false)
SSL_PORT    - SSL port (default: 6697)
SSL_CERT    - Path to certificate file
SSL_KEY     - Path to private key file
SSL_CA      - Path to CA bundle (optional)

LOG_LEVEL   - debug, info, warn, error
              Default: info


========================================
TROUBLESHOOTING
========================================

"Port in use"
  - Use different ports: PORT=7000 SSL_PORT=7001

"SSL handshake failed"
  - Check certificate paths are correct
  - Ensure key file permissions (chmod 600)
  - Verify cert matches domain

"Connection refused" (remote users)
  - Check firewall allows ports 6667/6697
  - Verify proxy is running with HOST=0.0.0.0

Debug mode:
  LOG_LEVEL=debug node proxy.js

Docker logs:
  docker-compose logs -f

========================================
