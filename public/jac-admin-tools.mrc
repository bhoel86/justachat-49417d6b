; ╔══════════════════════════════════════════════════╗
; ║  JAC Admin Tools v1.0 - mIRC Script             ║
; ║  For JustAChat.net IRC Administrators            ║
; ║  Load: /load -rs jac-admin-tools.mrc             ║
; ╚══════════════════════════════════════════════════╝

; ── Main Menu Trigger ──────────────────────────────
alias jac.admin {
  if (!$dialog(jac_admin_panel)) dialog -m jac_admin_panel jac_admin_panel
}

; Right-click menu integration
menu channel {
  JAC Admin Tools:/jac.admin
  -
  $iif($me isop #,Quick Actions)
  .Kick Selected User:/jac.kick $$1
  .Ban Selected User:/jac.ban $$1
  .Mute (30 min):/jac.mute $$1 30
  .Whois:/whois $$1
}

menu nicklist {
  JAC Admin Tools
  .View Profile:/jac.profile $$1
  .Whois:/whois $$1
  -
  .Kick:/jac.kick $$1
  .Ban:/jac.ban $$1
  .Mute (15 min):/jac.mute $$1 15
  .Mute (30 min):/jac.mute $$1 30
  .Mute (1 hour):/jac.mute $$1 60
  -
  .Private Message:/query $$1
  .Slap:/me slaps $$1 around a bit with a large trout 🐟
}

; ── Main Admin Panel Dialog ────────────────────────
dialog jac_admin_panel {
  title "JAC Admin Tools v1.0"
  size -1 -1 380 420
  option dbu

  ; Header
  text "═══ JustAChat Admin Panel ═══", 1, 10 8 360 12, center
  text "Logged in as:", 2, 10 22 60 10
  text "", 3, 72 22 150 10

  ; Tab-like buttons
  button "Users", 10, 10 38 55 14
  button "Rooms", 11, 68 38 55 14
  button "Moderation", 12, 126 38 65 14
  button "Broadcast", 13, 194 38 65 14
  button "Server", 14, 262 38 55 14

  ; Main content area
  box "Actions", 20, 8 56 364 310

  ; ── Users Tab ──
  text "Username:", 100, 18 72 50 10
  edit "", 101, 70 70 140 12
  button "Whois", 102, 216 70 50 14
  button "Profile", 103, 270 70 50 14
  button "Kick", 104, 324 70 46 14

  text "Reason:", 105, 18 90 50 10
  edit "", 106, 70 88 250 12

  button "Ban User", 107, 18 106 70 14
  button "K-Line (IP)", 108, 92 106 70 14
  button "Mute 15m", 109, 166 106 65 14
  button "Mute 1h", 110, 234 106 60 14
  button "Unban", 111, 298 106 70 14

  ; ── Room Tab ──
  text "Room:", 200, 18 130 40 10
  edit "", 201, 55 128 120 12
  text "Topic:", 202, 18 148 40 10
  edit "", 203, 55 146 260 12
  button "Set Topic", 204, 320 146 50 14

  button "Join Room", 205, 18 164 65 14
  button "Part Room", 206, 86 164 65 14
  button "Lock Room", 207, 154 164 65 14
  button "Unlock", 208, 222 164 55 14
  button "Clear Room", 209, 280 164 65 14

  ; ── Broadcast Tab ──
  text "Message:", 300, 18 186 50 10
  edit "", 301, 70 184 295 12
  button "Send to Current Room", 302, 18 200 110 14
  button "Send to ALL Rooms", 303, 132 200 110 14
  button "Server Notice", 304, 246 200 110 14

  ; ── Quick Stats ──
  box "Info", 400, 8 222 364 60
  text "Current Room:", 401, 18 234 65 10
  text "", 402, 85 234 150 10
  text "Users in Room:", 403, 18 246 70 10
  text "", 404, 90 246 50 10
  text "Your Modes:", 405, 18 258 60 10
  text "", 406, 80 258 100 10
  text "Server:", 407, 200 234 40 10
  text "157.245.174.197", 408, 242 234 120 10
  text "Port:", 409, 200 246 30 10
  text "6667 / 6697", 410, 232 246 80 10

  ; ── Log Area ──
  box "Activity Log", 500, 8 286 364 76
  list 501, 14 298 352 58

  ; Footer
  button "Refresh", 600, 10 370 60 14
  button "OPER Login", 601, 74 370 65 14
  button "De-OPER", 602, 142 370 60 14
  button "Help", 603, 330 370 40 14
  button "Close", 604, 270 370 55 14
}

; ── Dialog Events ──────────────────────────────────
on *:dialog:jac_admin_panel:init:*: {
  did -a jac_admin_panel 3 $me
  jac.refresh
}

on *:dialog:jac_admin_panel:sclick:102: {
  ; Whois
  var %user = $did(jac_admin_panel,101).text
  if (%user) {
    whois %user
    jac.log Whois sent for %user
  }
  else jac.log Error: Enter a username first
}

on *:dialog:jac_admin_panel:sclick:103: {
  ; Profile
  var %user = $did(jac_admin_panel,101).text
  if (%user) {
    msg $active /profile %user
    jac.log Viewing profile: %user
  }
}

on *:dialog:jac_admin_panel:sclick:104: {
  ; Kick
  var %user = $did(jac_admin_panel,101).text
  var %reason = $did(jac_admin_panel,106).text
  if (%user) {
    jac.kick %user %reason
  }
  else jac.log Error: Enter a username
}

on *:dialog:jac_admin_panel:sclick:107: {
  ; Ban
  var %user = $did(jac_admin_panel,101).text
  var %reason = $did(jac_admin_panel,106).text
  if (%user) jac.ban %user %reason
  else jac.log Error: Enter a username
}

on *:dialog:jac_admin_panel:sclick:108: {
  ; K-Line
  var %user = $did(jac_admin_panel,101).text
  var %reason = $did(jac_admin_panel,106).text
  if (%user) {
    msg $active /kline %user %reason
    jac.log K-Line sent for %user
  }
}

on *:dialog:jac_admin_panel:sclick:109: {
  ; Mute 15m
  var %user = $did(jac_admin_panel,101).text
  if (%user) jac.mute %user 15
}

on *:dialog:jac_admin_panel:sclick:110: {
  ; Mute 1h
  var %user = $did(jac_admin_panel,101).text
  if (%user) jac.mute %user 60
}

on *:dialog:jac_admin_panel:sclick:111: {
  ; Unban
  var %user = $did(jac_admin_panel,101).text
  if (%user) {
    msg $active /unban %user
    jac.log Unban sent for %user
  }
}

on *:dialog:jac_admin_panel:sclick:204: {
  ; Set Topic
  var %room = $did(jac_admin_panel,201).text
  var %topic = $did(jac_admin_panel,203).text
  if (!%room) %room = $active
  if (%topic) {
    topic %room %topic
    jac.log Topic set in %room
  }
}

on *:dialog:jac_admin_panel:sclick:205: {
  ; Join Room
  var %room = $did(jac_admin_panel,201).text
  if (%room) {
    if ($left(%room,1) != $chr(35)) %room = $chr(35) $+ %room
    join %room
    jac.log Joined %room
  }
}

on *:dialog:jac_admin_panel:sclick:206: {
  ; Part Room
  var %room = $did(jac_admin_panel,201).text
  if (%room) {
    if ($left(%room,1) != $chr(35)) %room = $chr(35) $+ %room
    part %room
    jac.log Left %room
  }
}

on *:dialog:jac_admin_panel:sclick:207: {
  ; Lock Room (set +i)
  var %room = $did(jac_admin_panel,201).text
  if (!%room) %room = $active
  mode %room +i
  jac.log Room %room locked (+i)
}

on *:dialog:jac_admin_panel:sclick:208: {
  ; Unlock Room
  var %room = $did(jac_admin_panel,201).text
  if (!%room) %room = $active
  mode %room -i
  jac.log Room %room unlocked (-i)
}

on *:dialog:jac_admin_panel:sclick:209: {
  ; Clear Room - kick all non-ops
  var %room = $did(jac_admin_panel,201).text
  if (!%room) %room = $active
  jac.log Clearing room %room ...
  msg %room /clear
}

on *:dialog:jac_admin_panel:sclick:302: {
  ; Broadcast to current room
  var %msg = $did(jac_admin_panel,301).text
  if (%msg) {
    msg $active 📢 [ADMIN] %msg
    jac.log Broadcast to $active
  }
}

on *:dialog:jac_admin_panel:sclick:303: {
  ; Broadcast to ALL rooms
  var %msg = $did(jac_admin_panel,301).text
  if (%msg) {
    var %i = 1
    while ($chan(%i)) {
      msg $chan(%i) 📢 [ADMIN BROADCAST] %msg
      inc %i
    }
    jac.log Broadcast sent to all rooms
  }
}

on *:dialog:jac_admin_panel:sclick:304: {
  ; Server notice
  var %msg = $did(jac_admin_panel,301).text
  if (%msg) {
    msg $active /notice %msg
    jac.log Server notice sent
  }
}

on *:dialog:jac_admin_panel:sclick:600: {
  ; Refresh
  jac.refresh
}

on *:dialog:jac_admin_panel:sclick:601: {
  ; OPER login
  jac.log Sending /oper command...
  msg $active /oper
}

on *:dialog:jac_admin_panel:sclick:602: {
  ; De-OPER
  msg $active /deoper
  jac.log De-OPER sent
}

on *:dialog:jac_admin_panel:sclick:603: {
  ; Help
  jac.log ── JAC Admin Help ──
  jac.log Right-click users in nicklist for quick actions
  jac.log Type /jac.admin to reopen this panel
  jac.log Commands: /kick /ban /mute /kline /unban
  jac.log /oper to gain admin, /deoper to drop
}

on *:dialog:jac_admin_panel:sclick:604: {
  dialog -c jac_admin_panel
}

; ── Helper Functions ───────────────────────────────

alias jac.refresh {
  if ($dialog(jac_admin_panel)) {
    did -a jac_admin_panel 402 $active
    did -a jac_admin_panel 404 $nick($active,0)
    did -a jac_admin_panel 406 $usermode
    if ($active) did -a jac_admin_panel 201 $active
    jac.log Panel refreshed at $time
  }
}

alias jac.log {
  if ($dialog(jac_admin_panel)) {
    did -i jac_admin_panel 501 1 [ $+ [ $time ] $+ ] $1-
    ; Keep log to 50 lines
    while ($did(jac_admin_panel,501).lines > 50) {
      did -d jac_admin_panel 501 $did(jac_admin_panel,501).lines
    }
  }
}

alias jac.kick {
  var %user = $1
  var %reason = $iif($2-,$2-,Removed by admin)
  msg $active /kick %user %reason
  jac.log Kicked %user $+ : %reason
}

alias jac.ban {
  var %user = $1
  var %reason = $iif($2-,$2-,Banned by admin)
  msg $active /ban %user %reason
  jac.log Banned %user $+ : %reason
}

alias jac.mute {
  var %user = $1
  var %mins = $iif($2,$2,15)
  msg $active /mute %user %mins
  jac.log Muted %user for %mins minutes
}

alias jac.profile {
  var %user = $1
  msg $active /profile %user
  jac.log Viewing profile for %user
}

; ── Auto-load notification ─────────────────────────
on *:load: {
  echo -a 4═══════════════════════════════════════════
  echo -a 4  JAC Admin Tools v1.0 loaded!
  echo -a 4  Type /jac.admin to open the admin panel
  echo -a 4  Right-click users for quick actions
  echo -a 4═══════════════════════════════════════════
}

; ── Keyboard shortcut: F8 opens admin panel ────────
on *:hotlink:*:*: { }
alias F8 /jac.admin

; ── Auto-refresh on room change ────────────────────
on *:join:#: {
  if ($nick == $me) jac.refresh
}

on *:part:#: {
  if ($nick == $me) jac.refresh
}
