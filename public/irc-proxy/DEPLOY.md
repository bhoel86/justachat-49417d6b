# Justachat IRC Proxy - VPS Deployment Guide

This guide will get the IRC proxy running on your VPS in under 5 minutes. Once deployed, mIRC users can connect directly to your server.

## Quick Start (Ubuntu/Debian VPS)

### 1. SSH into your VPS
```bash
ssh root@your-vps-ip
```

### 2. Run the automated installer
```bash
curl -sSL https://justachat.net/irc-proxy/deploy.sh | bash
```

Or manually:

### Manual Installation

#### Step 1: Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose -y
```

#### Step 2: Create the proxy directory
```bash
mkdir -p /opt/justachat-irc
cd /opt/justachat-irc
```

#### Step 3: Download proxy files
```bash
curl -O https://justachat.net/irc-proxy/proxy.js
curl -O https://justachat.net/irc-proxy/package.json
curl -O https://justachat.net/irc-proxy/docker-compose.yml
curl -O https://justachat.net/irc-proxy/Dockerfile
```

#### Step 4: Configure environment
```bash
cat > .env << 'EOF'
# Justachat WebSocket Gateway
GATEWAY_URL=wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway

# IRC Ports
IRC_PORT=6667
IRC_SSL_PORT=6697

# Admin API (change this token!)
ADMIN_PORT=6680
ADMIN_TOKEN=your-secure-admin-token-here

# SSL (optional - paths to your certificates)
SSL_CERT=
SSL_KEY=

# GeoIP Blocking (optional)
GEOIP_ENABLED=false
GEOIP_MODE=block
GEOIP_COUNTRIES=

# Logging
LOG_TO_FILE=true
LOG_DIR=/logs
EOF
```

#### Step 5: Start the proxy
```bash
docker-compose up -d
```

#### Step 6: Open firewall ports
```bash
ufw allow 6667/tcp  # IRC
ufw allow 6697/tcp  # IRC SSL
ufw allow 6680/tcp  # Admin API (restrict to your IP in production)
```

## Verify It's Running

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test connection
nc -zv localhost 6667
```

## mIRC User Connection Settings

Tell your users to configure mIRC with:

| Setting | Value |
|---------|-------|
| **Server** | `your-vps-ip` or `irc.justachat.net` |
| **Port** | `6667` (or `6697` for SSL) |
| **Password** | `email@example.com:password` |

## Optional: Custom Domain

Point a subdomain to your VPS:
```
irc.justachat.net  →  A record  →  your-vps-ip
```

## Optional: SSL Certificates (Let's Encrypt)

```bash
# Install certbot
apt install certbot -y

# Get certificate
certbot certonly --standalone -d irc.justachat.net

# Update .env
SSL_CERT=/etc/letsencrypt/live/irc.justachat.net/fullchain.pem
SSL_KEY=/etc/letsencrypt/live/irc.justachat.net/privkey.pem

# Restart
docker-compose restart
```

## Maintenance Commands

```bash
# View live logs
docker-compose logs -f

# Restart proxy
docker-compose restart

# Update proxy
docker-compose pull && docker-compose up -d

# Stop proxy
docker-compose down
```

## Connecting the Admin Panel

In the Justachat Admin Panel (IRC Gateway section):
1. Set Proxy URL to: `http://your-vps-ip:6680`
2. Enter your ADMIN_TOKEN
3. Click Connect

Now you can manage connections, view GeoIP stats, and browse logs from the web interface.
