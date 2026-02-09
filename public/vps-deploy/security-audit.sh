#!/bin/bash
# ╔═ JustAChat™ VPS Security Audit ═══════════════════════════════╗
# ╚═ Scans for suspicious users, IPs, and activity (web + IRC) ══╝
#
# Usage: bash security-audit.sh [--full]
#   --full: Include raw message content samples

set -euo pipefail

RED='\033[0;31m'
YEL='\033[1;33m'
GRN='\033[0;32m'
CYN='\033[0;36m'
NC='\033[0m'

FULL_MODE="${1:-}"
DB_CMD="docker exec -i supabase-db psql -U postgres --no-align -t"

# Detect messages table join column (user_id or sender_id)
MSG_USER_COL=$(docker exec -i supabase-db psql -U postgres --no-align -t -c "
  SELECT column_name FROM information_schema.columns 
  WHERE table_schema='public' AND table_name='messages' AND column_name IN ('user_id','sender_id')
  LIMIT 1;
" 2>/dev/null | tr -d '[:space:]')
MSG_USER_COL="${MSG_USER_COL:-user_id}"

banner() {
  echo ""
  echo -e "${CYN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYN}║  JustAChat™ VPS Security Audit                         ║${NC}"
  echo -e "${CYN}║  $(date '+%Y-%m-%d %H:%M:%S %Z')                               ║${NC}"
  echo -e "${CYN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

section() {
  echo ""
  echo -e "${YEL}━━━ $1 ━━━${NC}"
}

ok() { echo -e "  ${GRN}✓${NC} $1"; }
warn() { echo -e "  ${YEL}⚠${NC} $1"; }
alert() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  ${CYN}ℹ${NC} $1"; }

banner

# ──────────────────────────────────────────────
# 1. SPAM USERS — Users who sent repetitive junk
# ──────────────────────────────────────────────
section "1. SPAM / JUNK MESSAGE DETECTION"

info "Scanning for users who sent 10+ identical or near-identical messages..."
SPAM_USERS=$($DB_CMD <<SQL
SELECT p.username, COUNT(*) as spam_count, 
       LEFT(m.content, 40) as sample,
       MIN(m.created_at)::date as first_seen,
       MAX(m.created_at)::date as last_seen
FROM messages m
JOIN profiles p ON p.user_id = m.${MSG_USER_COL}
WHERE (
  -- All dots, periods, commas
  m.content ~ '^[.\-_=+!@#\$%^&*()~,;:]+\$'
  -- Single repeated character
  OR m.content ~ '^(.)\1{4,}\$'
  -- Very short junk (1-2 chars repeated)
  OR (LENGTH(m.content) >= 5 AND LENGTH(REGEXP_REPLACE(m.content, '(.)(?=.*\1)', '', 'g')) <= 2)
)
GROUP BY p.username, LEFT(m.content, 40)
HAVING COUNT(*) >= 10
ORDER BY spam_count DESC
LIMIT 20;
SQL
)

if [ -n "$SPAM_USERS" ]; then
  alert "Spam users detected:"
  echo "$SPAM_USERS" | while IFS='|' read -r user count sample first last; do
    echo -e "    ${RED}$user${NC}: ${count}x spam msgs (\"${sample}\") [$first → $last]"
  done
else
  ok "No heavy spam patterns detected"
fi

# ──────────────────────────────────────────────
# 2. FLOOD DETECTION — Rapid-fire message senders
# ──────────────────────────────────────────────
section "2. FLOOD DETECTION (Message Rate)"

info "Users who sent 50+ messages in any single hour..."
FLOOD_USERS=$($DB_CMD <<SQL
SELECT p.username,
       DATE_TRUNC('hour', m.created_at) as hour,
       COUNT(*) as msg_count
FROM messages m
JOIN profiles p ON p.user_id = m.${MSG_USER_COL}
GROUP BY p.username, DATE_TRUNC('hour', m.created_at)
HAVING COUNT(*) >= 50
ORDER BY msg_count DESC
LIMIT 20;
SQL
)

if [ -n "$FLOOD_USERS" ]; then
  warn "High-volume senders detected:"
  echo "$FLOOD_USERS" | while IFS='|' read -r user hour count; do
    echo -e "    ${YEL}$user${NC}: ${count} msgs at ${hour}"
  done
else
  ok "No flood patterns detected"
fi

# ──────────────────────────────────────────────
# 3. SUSPICIOUS IPs — Multiple accounts per IP
# ──────────────────────────────────────────────
section "3. SUSPICIOUS IPs (Multi-Account Detection)"

info "IPs associated with 3+ different user accounts..."
MULTI_IP=$($DB_CMD <<'SQL'
SELECT ul.ip_address,
       COUNT(DISTINCT ul.user_id) as account_count,
       STRING_AGG(DISTINCT p.username, ', ') as usernames,
       ul.city || ', ' || ul.country as location
FROM user_locations ul
JOIN profiles p ON p.user_id = ul.user_id
GROUP BY ul.ip_address, ul.city, ul.country
HAVING COUNT(DISTINCT ul.user_id) >= 3
ORDER BY account_count DESC
LIMIT 15;
SQL
)

if [ -n "$MULTI_IP" ]; then
  warn "Multi-account IPs found:"
  echo "$MULTI_IP" | while IFS='|' read -r ip count users loc; do
    echo -e "    ${YEL}IP:${ip:0:12}...${NC} → ${count} accounts (${users}) [${loc}]"
  done
else
  ok "No multi-account IPs detected"
fi

# ──────────────────────────────────────────────
# 4. FAILED AUTH / BRUTE FORCE
# ──────────────────────────────────────────────
section "4. FAILED LOGIN ATTEMPTS"

info "Checking login_attempts table for lockouts..."
LOCKOUTS=$($DB_CMD <<'SQL'
SELECT identifier, attempt_count, locked_until, last_attempt_at
FROM login_attempts
WHERE attempt_count >= 5
ORDER BY last_attempt_at DESC
LIMIT 10;
SQL
)

if [ -n "$LOCKOUTS" ]; then
  alert "High failed-login identifiers:"
  echo "$LOCKOUTS" | while IFS='|' read -r ident count locked last; do
    echo -e "    ${RED}${ident}${NC}: ${count} attempts, locked until ${locked:-never}"
  done
else
  ok "No brute force attempts detected"
fi

# ──────────────────────────────────────────────
# 5. BANNED / MUTED USERS SUMMARY
# ──────────────────────────────────────────────
section "5. ACTIVE BANS & MUTES"

BAN_COUNT=$($DB_CMD -c "SELECT COUNT(*) FROM bans WHERE expires_at IS NULL OR expires_at > NOW();")
MUTE_COUNT=$($DB_CMD -c "SELECT COUNT(*) FROM mutes WHERE expires_at IS NULL OR expires_at > NOW();")
ROOM_BAN_COUNT=$($DB_CMD -c "SELECT COUNT(*) FROM room_bans WHERE expires_at IS NULL OR expires_at > NOW();")

info "Global bans: ${BAN_COUNT:-0}"
info "Global mutes: ${MUTE_COUNT:-0}"
info "Room bans: ${ROOM_BAN_COUNT:-0}"

ACTIVE_BANS=$($DB_CMD <<'SQL'
SELECT p.username, b.reason, b.created_at::date
FROM bans b
JOIN profiles p ON p.user_id = b.user_id
WHERE b.expires_at IS NULL OR b.expires_at > NOW()
ORDER BY b.created_at DESC
LIMIT 10;
SQL
)

if [ -n "$ACTIVE_BANS" ]; then
  echo "$ACTIVE_BANS" | while IFS='|' read -r user reason dt; do
    echo -e "    ${RED}BANNED${NC}: $user — $reason ($dt)"
  done
fi

# ──────────────────────────────────────────────
# 6. USER REPORTS
# ──────────────────────────────────────────────
section "6. PENDING USER REPORTS"

PENDING_REPORTS=$($DB_CMD <<'SQL'
SELECT ur.reason, ur.description, ur.created_at::date,
       p1.username as reporter, p2.username as reported
FROM user_reports ur
JOIN profiles p1 ON p1.user_id = ur.reporter_id
JOIN profiles p2 ON p2.user_id = ur.reported_user_id
WHERE ur.status = 'pending'
ORDER BY ur.created_at DESC
LIMIT 10;
SQL
)

if [ -n "$PENDING_REPORTS" ]; then
  warn "Pending reports:"
  echo "$PENDING_REPORTS" | while IFS='|' read -r reason desc dt reporter reported; do
    echo -e "    ${YEL}${reporter}${NC} reported ${RED}${reported}${NC}: ${reason} ($dt)"
  done
else
  ok "No pending reports"
fi

# ──────────────────────────────────────────────
# 7. NGINX ACCESS LOG — Suspicious Requests
# ──────────────────────────────────────────────
section "7. NGINX SUSPICIOUS REQUESTS (Last 24h)"

if [ -f /var/log/nginx/access.log ]; then
  info "Scanning for attack patterns in nginx logs..."
  
  # SQL injection attempts
  SQL_INJECT=$(sudo grep -ciE "(union.*select|drop.*table|insert.*into|delete.*from|sleep\(|benchmark\(|0x[0-9a-f]{4})" /var/log/nginx/access.log 2>/dev/null || echo "0")
  if [ "$SQL_INJECT" -gt 0 ]; then
    alert "SQL injection attempts: $SQL_INJECT"
  else
    ok "No SQL injection patterns"
  fi

  # Path traversal
  PATH_TRAV=$(sudo grep -ciE "(\.\.\/|\.\.\\\\|etc/passwd|etc/shadow|proc/self)" /var/log/nginx/access.log 2>/dev/null || echo "0")
  if [ "$PATH_TRAV" -gt 0 ]; then
    alert "Path traversal attempts: $PATH_TRAV"
  else
    ok "No path traversal patterns"
  fi

  # XSS attempts
  XSS=$(sudo grep -ciE "(<script|javascript:|onerror=|onload=|eval\()" /var/log/nginx/access.log 2>/dev/null || echo "0")
  if [ "$XSS" -gt 0 ]; then
    alert "XSS attempt patterns: $XSS"
  else
    ok "No XSS patterns"
  fi

  # Top 10 IPs by request count (potential DDoS/scanners)
  info "Top 10 IPs by request volume:"
  sudo awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10 | while read count ip; do
    if [ "$count" -gt 1000 ]; then
      echo -e "    ${RED}${ip}${NC}: ${count} requests"
    elif [ "$count" -gt 500 ]; then
      echo -e "    ${YEL}${ip}${NC}: ${count} requests"
    else
      echo -e "    ${ip}: ${count} requests"
    fi
  done

  # 4xx/5xx error spikes
  ERRORS_4xx=$(sudo grep -c '" 4[0-9][0-9] ' /var/log/nginx/access.log 2>/dev/null || echo "0")
  ERRORS_5xx=$(sudo grep -c '" 5[0-9][0-9] ' /var/log/nginx/access.log 2>/dev/null || echo "0")
  info "4xx errors: $ERRORS_4xx | 5xx errors: $ERRORS_5xx"

else
  warn "Nginx access log not found at /var/log/nginx/access.log"
fi

# ──────────────────────────────────────────────
# 8. IRC BRIDGE — Suspicious IRC Activity
# ──────────────────────────────────────────────
section "8. IRC BRIDGE ACTIVITY"

if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "irc-bridge"; then
  info "Checking IRC bridge logs for suspicious patterns..."
  
  # Check recent IRC errors
  IRC_ERRORS=$(pm2 logs irc-bridge --nostream --lines 200 2>/dev/null | grep -ciE "(error|failed|rejected|unauthorized|invalid)" || echo "0")
  if [ "$IRC_ERRORS" -gt 10 ]; then
    alert "IRC bridge errors in recent logs: $IRC_ERRORS"
  else
    ok "IRC bridge errors: $IRC_ERRORS"
  fi

  # Check for rapid connection attempts (potential abuse)
  IRC_CONNECTS=$(pm2 logs irc-bridge --nostream --lines 500 2>/dev/null | grep -ci "new connection\|client connected\|NICK" || echo "0")
  info "Recent IRC connections/NICK changes: $IRC_CONNECTS"
  
  # Check for unusual commands
  IRC_UNUSUAL=$(pm2 logs irc-bridge --nostream --lines 500 2>/dev/null | grep -ciE "(OPER|KILL|DIE|RESTART|WALLOPS)" || echo "0")
  if [ "$IRC_UNUSUAL" -gt 0 ]; then
    warn "Unusual IRC commands detected: $IRC_UNUSUAL"
  else
    ok "No unusual IRC commands"
  fi
else
  info "IRC bridge not running via PM2 (or not named 'irc-bridge')"
fi

# ──────────────────────────────────────────────
# 9. DOCKER / EDGE FUNCTION HEALTH
# ──────────────────────────────────────────────
section "9. DOCKER & EDGE FUNCTION STATUS"

info "Checking container health..."
docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null | while read line; do
  if echo "$line" | grep -qi "unhealthy"; then
    echo -e "    ${RED}$line${NC}"
  elif echo "$line" | grep -qi "healthy\|up"; then
    echo -e "    ${GRN}$line${NC}"
  else
    echo "    $line"
  fi
done

# Check edge function recent errors
info "Edge function errors (last 50 Docker logs):"
EF_ERRORS=$(docker logs supabase-functions --tail 50 2>&1 | grep -ciE "(error|panic|fatal)" || echo "0")
if [ "$EF_ERRORS" -gt 5 ]; then
  alert "Edge function errors: $EF_ERRORS (check: docker logs supabase-functions --tail 100)"
else
  ok "Edge function errors: $EF_ERRORS"
fi

# ──────────────────────────────────────────────
# 10. OVERALL STATS
# ──────────────────────────────────────────────
section "10. OVERALL DATABASE STATS"

TOTAL_USERS=$($DB_CMD -c "SELECT COUNT(*) FROM profiles;")
TOTAL_MSGS=$($DB_CMD -c "SELECT COUNT(*) FROM messages;")
TOTAL_PMS=$($DB_CMD -c "SELECT COUNT(*) FROM private_messages;")
TOTAL_CHANNELS=$($DB_CMD -c "SELECT COUNT(*) FROM channels;")
MSGS_TODAY=$($DB_CMD -c "SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours';")
NEW_USERS_WEEK=$($DB_CMD -c "SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days';")

info "Total users: $TOTAL_USERS"
info "Total messages: $TOTAL_MSGS (last 24h: $MSGS_TODAY)"
info "Total PMs: $TOTAL_PMS"
info "Total channels: $TOTAL_CHANNELS"
info "New users (7 days): $NEW_USERS_WEEK"

# ──────────────────────────────────────────────
# FULL MODE: Sample suspicious messages
# ──────────────────────────────────────────────
if [ "$FULL_MODE" = "--full" ]; then
  section "FULL: SAMPLE SUSPICIOUS MESSAGES"
  
  info "Last 20 messages matching spam patterns:"
  $DB_CMD <<SQL
SELECT p.username, LEFT(m.content, 60) as content, m.created_at
FROM messages m
JOIN profiles p ON p.user_id = m.${MSG_USER_COL}
WHERE (
  m.content ~ '^[.\-_=+!@#\$%^&*()~,;:]+\$'
  OR m.content ~ '^(.)\1{4,}\$'
  OR LENGTH(m.content) <= 2
)
ORDER BY m.created_at DESC
LIMIT 20;
SQL
fi

echo ""
echo -e "${CYN}━━━ Audit Complete ━━━${NC}"
echo -e "Run with ${YEL}--full${NC} for message samples"
echo ""
