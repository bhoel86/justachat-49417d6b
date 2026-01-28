#!/bin/bash
# =============================================================================
# Justachat VPS Email Webhook Setup
# Uses Resend HTTP API (port 443) - NO SMTP, NO Lovable Cloud
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Justachat VPS Email Webhook Setup${NC}"
echo -e "${BLUE}  Uses Resend HTTP API (Port 443) - Bypasses SMTP Blocks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# =============================================================================
# Step 1: Create email webhook directory
# =============================================================================
echo -e "${YELLOW}[1/7] Creating email webhook directory...${NC}"

mkdir -p /opt/justachat-email
cd /opt/justachat-email

# =============================================================================
# Step 2: Create package.json
# =============================================================================
echo -e "${YELLOW}[2/7] Creating package.json...${NC}"

cat > package.json << 'PACKAGE_EOF'
{
  "name": "justachat-email-webhook",
  "version": "1.0.0",
  "description": "VPS Email Webhook using Resend HTTP API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
PACKAGE_EOF

# =============================================================================
# Step 3: Create the webhook server
# =============================================================================
echo -e "${YELLOW}[3/7] Creating webhook server...${NC}"

cat > server.js << 'SERVER_EOF'
const express = require('express');
const https = require('https');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const HOOK_SECRET = process.env.HOOK_SECRET;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Justachat™ <noreply@justachat.net>';
const SITE_URL = process.env.SITE_URL || 'https://justachat.net';

// Email templates
const getEmailContent = (type, confirmUrl, username) => {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #161b22 0%, #0d1117 100%); border-radius: 16px; border: 1px solid #30363d; padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #58a6ff; font-size: 28px; margin: 0; }
    .logo span { color: #8b949e; font-size: 12px; }
    h2 { color: #e6edf3; font-size: 24px; margin-bottom: 20px; }
    p { color: #8b949e; line-height: 1.6; margin-bottom: 20px; }
    .button { display: inline-block; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #30363d; text-align: center; }
    .footer p { color: #6e7681; font-size: 12px; }
  `;

  const year = new Date().getFullYear();

  switch (type) {
    case 'signup':
    case 'email_confirmation':
      return {
        subject: 'Confirm your Justachat™ account',
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Welcome${username ? `, ${username}` : ''}! 👋</h2>
              <p>Thanks for signing up! Please confirm your email address to activate your account.</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Confirm Email Address</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <div class="footer">
                <p>If you didn't create an account, ignore this email.</p>
                <p>© ${year} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'recovery':
    case 'password_recovery':
      return {
        subject: 'Reset your Justachat™ password',
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Password Reset Request 🔐</h2>
              <p>Click the button below to choose a new password:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Reset Password</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <div class="footer">
                <p>If you didn't request this, ignore this email.</p>
                <p>© ${year} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'magiclink':
      return {
        subject: 'Your Justachat™ magic link',
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Magic Link Login ✨</h2>
              <p>Click the button below to log in:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Log In to Justachat™</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <div class="footer">
                <p>If you didn't request this, ignore this email.</p>
                <p>© ${year} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'email_change':
      return {
        subject: 'Confirm your new email for Justachat™',
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Email Change Request 📧</h2>
              <p>Please confirm your new email address:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Confirm New Email</a>
              </div>
              <p style="font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
              <p style="font-size: 12px; word-break: break-all; color: #58a6ff;">${confirmUrl}</p>
              <div class="footer">
                <p>If you didn't request this, contact support immediately.</p>
                <p>© ${year} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: 'Justachat™ - Email Verification',
        html: `
          <!DOCTYPE html>
          <html>
          <head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Justachat™</h1>
                <span>Free Chat Rooms Since 1997</span>
              </div>
              <h2>Verify Your Email</h2>
              <p>Please click the button below:</p>
              <div style="text-align: center;">
                <a href="${confirmUrl}" class="button">Verify Email</a>
              </div>
              <div class="footer">
                <p>© ${year} Justachat™ - All rights reserved</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
};

// Send email via Resend HTTP API (port 443, not SMTP)
const sendEmailViaResend = (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Resend API error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Verify webhook signature (optional but recommended)
const verifySignature = (payload, signature) => {
  if (!HOOK_SECRET) return true; // Skip if no secret configured
  
  try {
    const [timestamp, sig] = signature.split(',');
    const expected = crypto
      .createHmac('sha256', HOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    return sig === expected;
  } catch {
    return false;
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'justachat-email-webhook',
    method: 'Resend HTTP API (Port 443)',
    smtp: false 
  });
});

// Main webhook endpoint
app.post('/hook/email', async (req, res) => {
  console.log('[Email Webhook] Received request');
  
  try {
    // Verify signature if secret is configured
    const signature = req.headers['x-webhook-signature'];
    if (HOOK_SECRET && signature) {
      if (!verifySignature(JSON.stringify(req.body), signature)) {
        console.error('[Email Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { user, email_data } = req.body;
    
    if (!user?.email || !email_data) {
      console.error('[Email Webhook] Missing required data');
      return res.status(400).json({ error: 'Missing required email data' });
    }

    const { token_hash, redirect_to, email_action_type } = email_data;
    const username = user.user_metadata?.username || '';
    
    // Build confirmation URL pointing to VPS auth endpoint
    const confirmUrl = `${SITE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || SITE_URL}`;
    
    const emailContent = getEmailContent(email_action_type, confirmUrl, username);
    
    console.log(`[Email Webhook] Sending ${email_action_type} email to ${user.email} via Resend HTTP API`);
    
    const result = await sendEmailViaResend(user.email, emailContent.subject, emailContent.html);
    
    console.log(`[Email Webhook] Email sent successfully: ${result.id}`);
    
    res.json({ success: true, id: result.id });
    
  } catch (error) {
    console.error('[Email Webhook] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[Email Webhook] Server running on http://127.0.0.1:${PORT}`);
  console.log('[Email Webhook] Using Resend HTTP API (Port 443) - NO SMTP');
  console.log(`[Email Webhook] From: ${FROM_EMAIL}`);
  console.log(`[Email Webhook] Site URL: ${SITE_URL}`);
});
SERVER_EOF

# =============================================================================
# Step 4: Create .env file
# =============================================================================
echo -e "${YELLOW}[4/7] Creating environment file...${NC}"

cat > .env << 'ENV_EOF'
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_REPLACE_WITH_YOUR_API_KEY

# Webhook port
PORT=3001

# From email (must match verified domain in Resend)
FROM_EMAIL=Justachat™ <noreply@justachat.net>

# Site URL
SITE_URL=https://justachat.net

# Optional: Webhook signature secret (for security)
# Generate with: openssl rand -hex 32
HOOK_SECRET=
ENV_EOF

# =============================================================================
# Step 5: Install dependencies
# =============================================================================
echo -e "${YELLOW}[5/7] Installing Node.js dependencies...${NC}"

npm install

# =============================================================================
# Step 6: Create systemd service
# =============================================================================
echo -e "${YELLOW}[6/7] Creating systemd service...${NC}"

cat > /etc/systemd/system/justachat-email.service << 'SERVICE_EOF'
[Unit]
Description=Justachat Email Webhook (Resend HTTP API)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/justachat-email
EnvironmentFile=/opt/justachat-email/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable justachat-email

# =============================================================================
# Step 7: Update Nginx configuration
# =============================================================================
echo -e "${YELLOW}[7/7] Updating Nginx configuration...${NC}"

# Check if the location block already exists
if ! grep -q "location /hook/email" /etc/nginx/sites-available/justachat.net 2>/dev/null; then
    # Add the email webhook location to nginx config
    # We'll insert it before the last closing brace of the SSL server block
    
    # Create backup
    cp /etc/nginx/sites-available/justachat.net /etc/nginx/sites-available/justachat.net.bak.$(date +%Y%m%d%H%M%S)
    
    # Use sed to add the location block before the final closing brace
    sed -i '/^}$/i\
\
    # Email webhook (Resend HTTP API - no SMTP)\
    location /hook/email {\
        proxy_pass http://127.0.0.1:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_read_timeout 30s;\
    }' /etc/nginx/sites-available/justachat.net
    
    echo -e "${GREEN}✓ Nginx config updated${NC}"
else
    echo -e "${YELLOW}⚠ Nginx email webhook location already exists${NC}"
fi

# Test nginx config
nginx -t

# =============================================================================
# Done - show next steps
# =============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Email Webhook Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo -e "${BLUE}1. Update your Resend API key:${NC}"
echo "   nano /opt/justachat-email/.env"
echo "   (Replace re_REPLACE_WITH_YOUR_API_KEY with your actual key)"
echo ""
echo -e "${BLUE}2. Update GoTrue configuration:${NC}"
echo "   nano ~/supabase/docker/.env"
echo ""
echo "   Add/update these lines:"
echo "   ─────────────────────────────────────────"
echo "   GOTRUE_MAILER_AUTOCONFIRM=false"
echo "   GOTRUE_SMTP_HOST="
echo "   GOTRUE_SMTP_PORT="
echo "   GOTRUE_SMTP_USER="
echo "   GOTRUE_SMTP_PASS="
echo "   GOTRUE_HOOK_CUSTOM_EMAIL_ENABLED=true"
echo "   GOTRUE_HOOK_CUSTOM_EMAIL_URI=http://host.docker.internal:3001/hook/email"
echo "   ─────────────────────────────────────────"
echo ""
echo -e "${BLUE}3. Reload services:${NC}"
echo "   systemctl start justachat-email"
echo "   systemctl reload nginx"
echo "   cd ~/supabase/docker && docker compose up -d --force-recreate auth"
echo ""
echo -e "${BLUE}4. Test the webhook:${NC}"
echo "   curl http://127.0.0.1:3001/health"
echo ""
echo -e "${BLUE}5. Test password recovery:${NC}"
echo "   curl -X POST https://justachat.net/auth/v1/recover \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'apikey: YOUR_ANON_KEY' \\"
echo "     -d '{\"email\":\"test@example.com\"}'"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  This setup uses Resend HTTP API (Port 443)${NC}"
echo -e "${GREEN}  NO SMTP ports (25, 465, 587) are used${NC}"
echo -e "${GREEN}  NO Lovable Cloud services are used${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
