# Justachat IRC Proxy - Complete Beginner's Guide 🚀

This guide assumes you've **never used a VPS before**. Follow each step exactly and you'll have IRC running in 15-20 minutes.

---

## Step 1: Create a VPS Account (DigitalOcean Example)

### 1.1 Sign up for DigitalOcean
1. Go to [digitalocean.com](https://digitalocean.com)
2. Click **Sign Up**
3. Enter your email and create a password
4. Add a payment method ($4-5/month for the smallest server)

### 1.2 Create a "Droplet" (that's their name for a server)
1. Click the green **Create** button → **Droplets**
2. Choose these settings:
   - **Region**: Pick the closest to most of your users
   - **Image**: Ubuntu 24.04 (LTS) x64
   - **Size**: Basic → Regular → **$4/mo** (1GB RAM, 1 CPU)
   - **Authentication**: Click **Password** and create a strong root password
     - ⚠️ **SAVE THIS PASSWORD** - you'll need it!
   - **Hostname**: `justachat-irc` (or whatever you want)
3. Click **Create Droplet**
4. Wait 30-60 seconds for it to spin up
5. **Copy the IP address** shown (looks like `167.99.123.45`)

---

## Step 2: Connect to Your Server

### Windows Users:
1. Download **PuTTY** from [putty.org](https://www.putty.org/)
2. Open PuTTY
3. In "Host Name" enter your **IP address** from Step 1
4. Click **Open**
5. Click **Accept** if you get a security warning
6. Login as: `root`
7. Enter your password (it won't show as you type - that's normal!)

### Mac/Linux Users:
1. Open **Terminal**
2. Type: `ssh root@YOUR-IP-ADDRESS`
3. Type `yes` if asked about fingerprint
4. Enter your password

**You're now connected!** You should see something like:
```
root@justachat-irc:~#
```

---

## Step 3: Install the IRC Proxy (One Command!)

Copy and paste this entire command, then press Enter:

```bash
apt update && apt install -y curl && curl -sSL https://raw.githubusercontent.com/lovable-dev/justachat-irc-proxy/main/deploy.sh | bash || (
  apt update && apt upgrade -y
  curl -fsSL https://get.docker.com | sh
  apt install -y docker-compose
  mkdir -p /opt/justachat-irc && cd /opt/justachat-irc
  
  cat > docker-compose.yml << 'COMPOSE'
version: '3.8'
services:
  irc-proxy:
    build: .
    ports:
      - "6667:6667"
      - "6697:6697"
      - "6680:6680"
    environment:
      - GATEWAY_URL=wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway
      - IRC_PORT=6667
      - IRC_SSL_PORT=6697
      - ADMIN_PORT=6680
      - LOG_TO_FILE=true
    restart: unless-stopped
COMPOSE

  cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
RUN npm init -y && npm install ws dotenv
COPY proxy.js .
CMD ["node", "proxy.js"]
DOCKERFILE

  cat > proxy.js << 'PROXYJS'
const net = require('net');
const WebSocket = require('ws');
require('dotenv').config();

const GATEWAY_URL = process.env.GATEWAY_URL || 'wss://hliytlezggzryetekpvo.supabase.co/functions/v1/irc-gateway';
const IRC_PORT = parseInt(process.env.IRC_PORT) || 6667;

const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}`);
  
  const ws = new WebSocket(GATEWAY_URL);
  
  ws.on('open', () => {
    console.log('WebSocket connected to gateway');
  });
  
  ws.on('message', (data) => {
    socket.write(data.toString());
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    socket.end();
  });
  
  ws.on('close', () => {
    socket.end();
  });
  
  socket.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data.toString());
    }
  });
  
  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
    ws.close();
  });
  
  socket.on('close', () => {
    ws.close();
  });
});

server.listen(IRC_PORT, '0.0.0.0', () => {
  console.log(\`IRC Proxy listening on port \${IRC_PORT}\`);
  console.log(\`Forwarding to: \${GATEWAY_URL}\`);
});
PROXYJS

  docker-compose up -d --build
  ufw allow 6667/tcp
  ufw allow 6697/tcp
  echo "✅ IRC Proxy is running!"
)
```

**Wait 2-3 minutes** while it installs everything.

When you see `✅ IRC Proxy is running!` - you're done with the server setup!

---

## Step 4: Test the Connection

Still in your server terminal, run:
```bash
docker ps
```

You should see a container running. Then test:
```bash
nc -zv localhost 6667
```

Should show: `Connection to localhost 6667 port [tcp/*] succeeded!`

---

## Step 5: Configure mIRC to Connect

1. Open **mIRC**
2. Press `Alt+E` to open Server List (or Tools → Options → Connect → Servers)
3. Click **Add**
4. Fill in:
   - **Description**: `JustaChat`
   - **Address**: `YOUR-VPS-IP` (the IP from Step 1)
   - **Port**: `6667`
   - **Password**: `youremail@example.com:yourpassword`
     - This is your **JustaChat login** in `email:password` format
5. Click **Add** then **Connect**

**You're connected!** 🎉

---

## Step 6: (Optional) Set Up a Custom Domain

Instead of connecting to an IP, users can connect to `irc.justachat.net`:

1. Go to your domain DNS settings (where you bought justachat.net)
2. Add an **A Record**:
   - **Name**: `irc`
   - **Value**: Your VPS IP address
   - **TTL**: 3600
3. Wait 5-30 minutes for DNS to update
4. Now users can connect to `irc.justachat.net:6667`

---

## Troubleshooting

### "Connection refused" in mIRC
```bash
# Check if proxy is running
docker ps

# If nothing shows, start it:
cd /opt/justachat-irc
docker-compose up -d

# Check logs for errors:
docker-compose logs
```

### "Can't connect to server" in PuTTY
- Double-check the IP address
- Make sure the droplet is running in DigitalOcean

### Forgot your server password?
- In DigitalOcean, click your droplet → Access → Reset Root Password

---

## Quick Reference Commands

Run these on your server (via PuTTY/Terminal):

| What | Command |
|------|---------|
| Check if running | `docker ps` |
| View logs | `docker-compose logs -f` |
| Restart proxy | `cd /opt/justachat-irc && docker-compose restart` |
| Stop proxy | `cd /opt/justachat-irc && docker-compose down` |
| Start proxy | `cd /opt/justachat-irc && docker-compose up -d` |

---

## Cost Summary

- **DigitalOcean**: $4/month (smallest droplet)
- **Domain**: Optional (users can connect via IP)
- **SSL Certificates**: Free with Let's Encrypt

**Total: ~$4/month** for unlimited mIRC users! 🎉
