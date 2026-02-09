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

# Detect messages table columns using DIRECT query tests
# information_schema returns stale data due to collation version mismatch on this VPS
# NOTE: Must use || true to prevent set -e from killing the script

# Helper: test if a column exists in messages table
msg_col_exists() {
  local col="$1"
  local result
  result=$(docker exec -i supabase-db psql -U postgres --no-align -t -c "
    SELECT '${col}' FROM (SELECT ${col} FROM public.messages LIMIT 0) sub;
  " 2>/dev/null || true)
  result=$(echo "$result" | tr -d '[:space:]')
  [ "$result" = "$col" ]
}

# Detect user/sender column
MSG_USER_COL=""
for candidate in user_id sender_id author_id profile_id; do
  if msg_col_exists "$candidate"; then
    MSG_USER_COL="$candidate"
    break
  fi
done

# Detect timestamp column
MSG_TIME_COL=""
for candidate in created_at updated_at sent_at timestamp; do
  if msg_col_exists "$candidate"; then
    MSG_TIME_COL="$candidate"
    break
  fi
done

# Debug output
echo -e "  [DEBUG] Messages user column: '${MSG_USER_COL:-NOT FOUND}'"
echo -e "  [DEBUG] Messages time column: '${MSG_TIME_COL:-NOT FOUND}'"

# If neither found, show actual table structure
if [ -z "$MSG_USER_COL" ] && [ -z "$MSG_TIME_COL" ]; then
  echo -e "  [DEBUG] Dumping actual messages table header:"
  docker exec -i supabase-db psql -U postgres -c "\\d public.messages" 2>&1 | head -20 || true
fi

# Helper: safely count grep matches (handles sudo multi-line output)
safe_count() {
  local result
  result=$(sudo grep -ciE "$1" "$2" 2>/dev/null || true)
  # Take only the last numeric value (strips sudo noise)
  echo "$result" | grep -oE '[0-9]+' | tail -1 || echo "0"
}

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

if [ -n "$MSG_USER_COL" ] && [ -n "$MSG_TIME_COL" ]; then
  SPAM_USERS=$($DB_CMD <<SQL 2>/dev/null || true
SELECT p.username, COUNT(*) as spam_count, 
       LEFT(m.content, 40) as sample,
       MIN(m.${MSG_TIME_COL})::date as first_seen,
       MAX(m.${MSG_TIME_COL})::date as last_seen
FROM messages m
JOIN profiles p ON p.user_id = m.${MSG_USER_COL}
WHERE (
  m.content ~ '^[.\-_=+!@#\$%^&*()~,;:]+\$'
  OR m.content ~ '^(.)\1{4,}\$'
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
else
  warn "Skipping spam detection — missing column(s) in messages table (user=${MSG_USER_COL:-none}, time=${MSG_TIME_COL:-none})"
fi

# ──────────────────────────────────────────────
# 2. FLOOD DETECTION — Rapid-fire message senders
# ──────────────────────────────────────────────
section "2. FLOOD DETECTION (Message Rate)"

info "Users who sent 50+ messages in any single hour..."
if [ -n "$MSG_USER_COL" ] && [ -n "$MSG_TIME_COL" ]; then
  FLOOD_USERS=$($DB_CMD <<SQL 2>/dev/null || true
SELECT p.username,
       DATE_TRUNC('hour', m.${MSG_TIME_COL}) as hour,
       COUNT(*) as msg_count
FROM messages m
JOIN profiles p ON p.user_id = m.${MSG_USER_COL}
GROUP BY p.username, DATE_TRUNC('hour', m.${MSG_TIME_COL})
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
else
  warn "Skipping flood detection — missing column(s) in messages table"
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
  SQL_INJECT=$(safe_count "(union.*select|drop.*table|insert.*into|delete.*from|sleep\(|benchmark\(|0x[0-9a-f]{4})" /var/log/nginx/access.log)
  if [ "${SQL_INJECT:-0}" -gt 0 ] 2>/dev/null; then
    alert "SQL injection attempts: $SQL_INJECT"
  else
    ok "No SQL injection patterns"
  fi

  # Path traversal
  PATH_TRAV=$(safe_count "(\.\.\/|\.\.\\\\|etc/passwd|etc/shadow|proc/self)" /var/log/nginx/access.log)
  if [ "${PATH_TRAV:-0}" -gt 0 ] 2>/dev/null; then
    alert "Path traversal attempts: $PATH_TRAV"
  else
    ok "No path traversal patterns"
  fi

  # XSS attempts
  XSS=$(safe_count "(<script|javascript:|onerror=|onload=|eval\()" /var/log/nginx/access.log)
  if [ "${XSS:-0}" -gt 0 ] 2>/dev/null; then
    alert "XSS attempt patterns: $XSS"
  else
    ok "No XSS patterns"
  fi

  # Top 10 IPs by request count (potential DDoS/scanners)
  info "Top 10 IPs by request volume:"
  sudo awk '{print $1}' /var/log/nginx/access.log 2>/dev/null | sort | uniq -c | sort -rn | head -10 | while read count ip; do
    if [ "$count" -gt 1000 ]; then
      echo -e "    ${RED}${ip}${NC}: ${count} requests"
    elif [ "$count" -gt 500 ]; then
      echo -e "    ${YEL}${ip}${NC}: ${count} requests"
    else
      echo -e "    ${ip}: ${count} requests"
    fi
  done

  # 4xx/5xx error spikes
  ERRORS_4xx=$(safe_count '" 4[0-9][0-9] ' /var/log/nginx/access.log)
  ERRORS_5xx=$(safe_count '" 5[0-9][0-9] ' /var/log/nginx/access.log)
  info "4xx errors: ${ERRORS_4xx:-0} | 5xx errors: ${ERRORS_5xx:-0}"

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
  IRC_ERRORS=$(pm2 logs irc-bridge --nostream --lines 200 2>/dev/null | grep -ciE "(error|failed|rejected|unauthorized|invalid)" || true)
  IRC_ERRORS=$(echo "$IRC_ERRORS" | tail -1 | tr -d '[:space:]')
  IRC_ERRORS="${IRC_ERRORS:-0}"
  if [ "$IRC_ERRORS" -gt 10 ] 2>/dev/null; then
    alert "IRC bridge errors in recent logs: $IRC_ERRORS"
  else
    ok "IRC bridge errors: $IRC_ERRORS"
  fi

  # Check for rapid connection attempts (potential abuse)
  IRC_CONNECTS=$(pm2 logs irc-bridge --nostream --lines 500 2>/dev/null | grep -ci "new connection\|client connected\|NICK" || true)
  IRC_CONNECTS=$(echo "$IRC_CONNECTS" | tail -1 | tr -d '[:space:]')
  IRC_CONNECTS="${IRC_CONNECTS:-0}"
  info "Recent IRC connections/NICK changes: $IRC_CONNECTS"
  
  # Check for unusual commands
  IRC_UNUSUAL=$(pm2 logs irc-bridge --nostream --lines 500 2>/dev/null | grep -ciE "(OPER|KILL|DIE|RESTART|WALLOPS)" || true)
  IRC_UNUSUAL=$(echo "$IRC_UNUSUAL" | tail -1 | tr -d '[:space:]')
  IRC_UNUSUAL="${IRC_UNUSUAL:-0}"
  if [ "$IRC_UNUSUAL" -gt 0 ] 2>/dev/null; then
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
FUNC_CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i "function\|edge" | head -1 || echo "supabase-edge-functions")
info "Edge function errors (last 50 Docker logs from ${FUNC_CONTAINER:-unknown}):"
if [ -n "$FUNC_CONTAINER" ]; then
  EF_ERRORS=$(docker logs "$FUNC_CONTAINER" --tail 50 2>&1 | grep -ciE "(error|panic|fatal)" || echo "0")
  if [ "$EF_ERRORS" -gt 5 ]; then
    alert "Edge function errors: $EF_ERRORS (check: docker logs $FUNC_CONTAINER --tail 100)"
  else
    ok "Edge function errors: $EF_ERRORS"
  fi
else
  warn "No functions container found"
fi

# ──────────────────────────────────────────────
# 10. OVERALL STATS
# ──────────────────────────────────────────────
section "10. OVERALL DATABASE STATS"

TOTAL_USERS=$($DB_CMD -c "SELECT COUNT(*) FROM profiles;" 2>/dev/null || echo "?")
TOTAL_MSGS=$($DB_CMD -c "SELECT COUNT(*) FROM messages;" 2>/dev/null || echo "?")
TOTAL_PMS=$($DB_CMD -c "SELECT COUNT(*) FROM private_messages;" 2>/dev/null || echo "?")
TOTAL_CHANNELS=$($DB_CMD -c "SELECT COUNT(*) FROM channels;" 2>/dev/null || echo "?")

if [ -n "$MSG_TIME_COL" ]; then
  MSGS_TODAY=$($DB_CMD -c "SELECT COUNT(*) FROM messages WHERE ${MSG_TIME_COL} > NOW() - INTERVAL '24 hours';" 2>/dev/null || echo "?")
else
  MSGS_TODAY="N/A"
fi
NEW_USERS_WEEK=$($DB_CMD -c "SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days';" 2>/dev/null || echo "?")

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
  
  if [ -n "$MSG_USER_COL" ] && [ -n "$MSG_TIME_COL" ]; then
    info "Last 20 messages matching spam patterns:"
    $DB_CMD <<SQL 2>/dev/null || true
SELECT p.username, LEFT(m.content, 60) as content, m.${MSG_TIME_COL}
FROM messages m
JOIN profiles p ON p.user_id = m.${MSG_USER_COL}
WHERE (
  m.content ~ '^[.\-_=+!@#\$%^&*()~,;:]+\$'
  OR m.content ~ '^(.)\1{4,}\$'
  OR LENGTH(m.content) <= 2
)
ORDER BY m.${MSG_TIME_COL} DESC
LIMIT 20;
SQL
  else
    warn "Skipping message samples — missing column(s) in messages table"
  fi
fi

echo ""
echo -e "${CYN}━━━ Audit Complete ━━━${NC}"
echo -e "Run with ${YEL}--full${NC} for message samples"
echo ""
