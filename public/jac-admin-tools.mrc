; ╔══════════════════════════════════════════════════╗
; ║  JAC Admin Tools v2.0 - mIRC Script             ║
; ║  For JustAChat.net IRC Administrators            ║
; ║  Server: 157.245.174.197 · Port: 6667           ║
; ║  Auth: NickServ IDENTIFY (no server password)    ║
; ║  Load: /load -rs $mircdir $+ jac-admin-tools.mrc║
; ╚══════════════════════════════════════════════════╝

; ── Configuration ──────────────────────────────────
alias -l jac.adm.server { return 157.245.174.197 }
alias -l jac.adm.version { return 2.0 }
alias -l jac.adm.isJac { return $iif($serverip == $jac.adm.server,1,0) }

; ── Main Menu Trigger ──────────────────────────────
alias jac.admin {
  if (!$jac.adm.isJac) {
    echo -a 4[JAC Admin] You must be connected to JustAChat (157.245.174.197:6667) first!
    echo -a 7[JAC Admin] Type /jac to connect.
    return
  }
  if (!$dialog(jac_admin_panel)) dialog -m jac_admin_panel jac_admin_panel
}

; ── Right-click: Channel background ───────────────
menu channel {
  JAC Admin Tools:/jac.admin
  -
  $iif($me isop #,Quick Actions)
  .Kick Selected User:/jac.kick $$1
  .Ban Selected User:/jac.ban $$1
  .Mute (30 min):/jac.mute $$1 30
  .K-Line:/jac.kline $$1
  .Whois:/whois $$1
}

; ── Right-click: Nick list ─────────────────────────
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
  .K-Line:/jac.kline $$1
  .Unban:/jac.unban $$1
  .Unmute:/jac.unmute $$1
  -
  .Private Message:/query $$1
  .Slap:/me slaps $$1 around a bit with a large trout 🐟
}

; ── Main Admin Panel Dialog ────────────────────────
dialog jac_admin_panel {
  title "JAC Admin Tools v2.0"
  size -1 -1 400 460
  option dbu

  ; Header
  text "═══ JustAChat Admin Panel v2.0 ═══", 1, 10 8 380 12, center
  text "Logged in as:", 2, 10 22 60 10
  text "", 3, 72 22 150 10

  ; Tab buttons
  button "Users", 10, 10 38 60 14
  button "Rooms", 11, 74 38 60 14
  button "Moderation", 12, 138 38 70 14
  button "Broadcast", 13, 212 38 70 14
  button "NickServ", 14, 286 38 65 14
  button "Server", 15, 354 38 40 14

  ; Main content area
  box "Actions", 20, 8 56 384 320

  ; ── Users Section ──
  text "Username:", 100, 18 72 50 10
  edit "", 101, 70 70 150 12
  button "Whois", 102, 226 70 50 14
  button "Profile", 103, 280 70 50 14
  button "Kick", 104, 334 70 50 14

  text "Reason:", 105, 18 90 50 10
  edit "", 106, 70 88 310 12

  button "Ban User", 107, 18 106 75 14
  button "K-Line (IP)", 108, 97 106 75 14
  button "Mute 15m", 109, 176 106 65 14
  button "Mute 1h", 110, 245 106 60 14
  button "Unban", 111, 309 106 38 14
  button "Unmute", 112, 350 106 40 14

  ; ── Room Section ──
  text "Room:", 200, 18 130 40 10
  edit "", 201, 55 128 130 12
  text "Topic:", 202, 18 148 40 10
  edit "", 203, 55 146 270 12
  button "Set Topic", 204, 330 146 56 14

  button "Join Room", 205, 18 164 65 14
  button "Part Room", 206, 86 164 65 14
  button "Lock Room", 207, 154 164 65 14
  button "Unlock", 208, 222 164 55 14
  button "Clear Room", 209, 280 164 65 14
  button "Invite", 210, 348 164 40 14

  ; ── Broadcast Section ──
  text "Message:", 300, 18 186 50 10
  edit "", 301, 70 184 316 12
  button "Send to Current Room", 302, 18 200 115 14
  button "Send to ALL Rooms", 303, 137 200 110 14
  button "Server Notice", 304, 251 200 75 14
  button "MOTD", 305, 330 200 56 14

  ; ── NickServ Section ──
  text "NickServ:", 350, 18 220 50 10
  button "IDENTIFY", 351, 70 218 65 14
  button "REGISTER", 352, 138 218 65 14
  button "SET PASS", 353, 206 218 65 14
  button "INFO", 354, 274 218 65 14
  button "GHOST", 355, 342 218 46 14

  ; ── Quick Stats ──
  box "Info", 400, 8 240 384 60
  text "Current Room:", 401, 18 254 65 10
  text "", 402, 85 254 150 10
  text "Users in Room:", 403, 18 266 70 10
  text "", 404, 90 266 50 10
  text "Your Modes:", 405, 18 278 60 10
  text "", 406, 80 278 100 10
  text "Server:", 407, 220 254 40 10
  text "157.245.174.197", 408, 262 254 120 10
  text "Port:", 409, 220 266 30 10
  text "6667 (no SSL)", 410, 252 266 80 10

  ; ── Log Area ──
  box "Activity Log", 500, 8 304 384 76
  list 501, 14 316 372 58

  ; Footer
  button "Refresh", 600, 10 390 60 14
  button "OPER Login", 601, 74 390 65 14
  button "De-OPER", 602, 142 390 60 14
  button "NickServ", 603, 206 390 55 14
  button "Help", 604, 265 390 40 14
  button "Close", 605, 310 390 55 14
}

; ── Dialog Events ──────────────────────────────────
on *:dialog:jac_admin_panel:init:*: {
  did -a jac_admin_panel 3 $me
  jac.refresh
  jac.log Admin panel v $+ $jac.adm.version opened
}

; Whois
on *:dialog:jac_admin_panel:sclick:102: {
  var %user = $did(jac_admin_panel,101).text
  if (%user) {
    whois %user
    jac.log Whois sent for %user
  }
  else jac.log Error: Enter a username first
}

; Profile
on *:dialog:jac_admin_panel:sclick:103: {
  var %user = $did(jac_admin_panel,101).text
  if (%user) {
    msg $active /profile %user
    jac.log Viewing profile: %user
  }
}

; Kick
on *:dialog:jac_admin_panel:sclick:104: {
  var %user = $did(jac_admin_panel,101).text
  var %reason = $did(jac_admin_panel,106).text
  if (%user) jac.kick %user %reason
  else jac.log Error: Enter a username
}

; Ban
on *:dialog:jac_admin_panel:sclick:107: {
  var %user = $did(jac_admin_panel,101).text
  var %reason = $did(jac_admin_panel,106).text
  if (%user) jac.ban %user %reason
  else jac.log Error: Enter a username
}

; K-Line
on *:dialog:jac_admin_panel:sclick:108: {
  var %user = $did(jac_admin_panel,101).text
  var %reason = $did(jac_admin_panel,106).text
  if (%user) jac.kline %user %reason
  else jac.log Error: Enter a username
}

; Mute 15m
on *:dialog:jac_admin_panel:sclick:109: {
  var %user = $did(jac_admin_panel,101).text
  if (%user) jac.mute %user 15
  else jac.log Error: Enter a username
}

; Mute 1h
on *:dialog:jac_admin_panel:sclick:110: {
  var %user = $did(jac_admin_panel,101).text
  if (%user) jac.mute %user 60
  else jac.log Error: Enter a username
}

; Unban
on *:dialog:jac_admin_panel:sclick:111: {
  var %user = $did(jac_admin_panel,101).text
  if (%user) jac.unban %user
  else jac.log Error: Enter a username
}

; Unmute
on *:dialog:jac_admin_panel:sclick:112: {
  var %user = $did(jac_admin_panel,101).text
  if (%user) jac.unmute %user
  else jac.log Error: Enter a username
}

; Set Topic
on *:dialog:jac_admin_panel:sclick:204: {
  var %room = $did(jac_admin_panel,201).text
  var %topic = $did(jac_admin_panel,203).text
  if (!%room) %room = $active
  if (%topic) {
    topic %room %topic
    jac.log Topic set in %room
  }
}

; Join Room
on *:dialog:jac_admin_panel:sclick:205: {
  var %room = $did(jac_admin_panel,201).text
  if (%room) {
    if ($left(%room,1) != $chr(35)) %room = $chr(35) $+ %room
    join %room
    jac.log Joined %room
  }
}

; Part Room
on *:dialog:jac_admin_panel:sclick:206: {
  var %room = $did(jac_admin_panel,201).text
  if (%room) {
    if ($left(%room,1) != $chr(35)) %room = $chr(35) $+ %room
    part %room
    jac.log Left %room
  }
}

; Lock Room (+i)
on *:dialog:jac_admin_panel:sclick:207: {
  var %room = $did(jac_admin_panel,201).text
  if (!%room) %room = $active
  mode %room +i
  jac.log Room %room locked (+i)
}

; Unlock Room (-i)
on *:dialog:jac_admin_panel:sclick:208: {
  var %room = $did(jac_admin_panel,201).text
  if (!%room) %room = $active
  mode %room -i
  jac.log Room %room unlocked (-i)
}

; Clear Room
on *:dialog:jac_admin_panel:sclick:209: {
  var %room = $did(jac_admin_panel,201).text
  if (!%room) %room = $active
  jac.log Clearing room %room ...
  msg %room /clear
}

; Invite
on *:dialog:jac_admin_panel:sclick:210: {
  var %room = $did(jac_admin_panel,201).text
  var %user = $did(jac_admin_panel,101).text
  if (!%room) %room = $active
  if (%user) {
    invite %user %room
    jac.log Invited %user to %room
  }
  else jac.log Error: Enter a username in the Users field
}

; Broadcast to current room
on *:dialog:jac_admin_panel:sclick:302: {
  var %msg = $did(jac_admin_panel,301).text
  if (%msg) {
    msg $active 📢 [ADMIN] %msg
    jac.log Broadcast to $active
  }
}

; Broadcast to ALL rooms
on *:dialog:jac_admin_panel:sclick:303: {
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

; Server notice
on *:dialog:jac_admin_panel:sclick:304: {
  var %msg = $did(jac_admin_panel,301).text
  if (%msg) {
    msg $active /notice %msg
    jac.log Server notice sent
  }
}

; MOTD
on *:dialog:jac_admin_panel:sclick:305: {
  raw MOTD
  jac.log Requested MOTD
}

; NickServ IDENTIFY
on *:dialog:jac_admin_panel:sclick:351: {
  var %pass = $$?="NickServ password:"
  if (%pass) {
    msg NickServ IDENTIFY %pass
    jac.log NickServ IDENTIFY sent
  }
}

; NickServ REGISTER
on *:dialog:jac_admin_panel:sclick:352: {
  var %pass = $$?="Choose a password:"
  if (%pass) {
    msg NickServ REGISTER %pass
    jac.log NickServ REGISTER sent
  }
}

; NickServ SET PASSWORD
on *:dialog:jac_admin_panel:sclick:353: {
  var %pass = $$?="New password:"
  if (%pass) {
    msg NickServ SET PASSWORD %pass
    jac.log NickServ SET PASSWORD sent
  }
}

; NickServ INFO
on *:dialog:jac_admin_panel:sclick:354: {
  var %nick = $did(jac_admin_panel,101).text
  if (!%nick) %nick = $me
  msg NickServ INFO %nick
  jac.log NickServ INFO for %nick
}

; NickServ GHOST
on *:dialog:jac_admin_panel:sclick:355: {
  var %nick = $$?="Ghost which nick:"
  if (%nick) {
    var %pass = $$?="Password:"
    if (%pass) {
      msg NickServ GHOST %nick %pass
      jac.log NickServ GHOST %nick
    }
  }
}

; Refresh
on *:dialog:jac_admin_panel:sclick:600: {
  jac.refresh
}

; OPER login
on *:dialog:jac_admin_panel:sclick:601: {
  jac.log Sending /oper command...
  msg $active /oper
}

; De-OPER
on *:dialog:jac_admin_panel:sclick:602: {
  msg $active /deoper
  jac.log De-OPER sent
}

; NickServ button (footer)
on *:dialog:jac_admin_panel:sclick:603: {
  jac.log ── NickServ Commands ──
  jac.log /msg NickServ IDENTIFY <password>
  jac.log /msg NickServ REGISTER <password>
  jac.log /msg NickServ SET PASSWORD <newpass>
  jac.log /msg NickServ INFO <nick>
  jac.log /msg NickServ GHOST <nick> <pass>
}

; Help
on *:dialog:jac_admin_panel:sclick:604: {
  jac.log ── JAC Admin Help v2.0 ──
  jac.log Server: 157.245.174.197 Port: 6667
  jac.log Auth: NickServ IDENTIFY (no server password)
  jac.log Right-click users in nicklist for quick actions
  jac.log Type /jac.admin to reopen this panel
  jac.log Press F8 as shortcut
  jac.log Commands: /kick /ban /mute /kline /unban /unmute
  jac.log /oper to gain admin, /deoper to drop
}

; Close
on *:dialog:jac_admin_panel:sclick:605: {
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
    ; Keep log to 50 lines max
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

alias jac.unban {
  var %user = $1
  msg $active /unban %user
  jac.log Unban sent for %user
}

alias jac.mute {
  var %user = $1
  var %mins = $iif($2,$2,15)
  msg $active /mute %user %mins
  jac.log Muted %user for %mins minutes
}

alias jac.unmute {
  var %user = $1
  msg $active /unmute %user
  jac.log Unmuted %user
}

alias jac.kline {
  var %user = $1
  var %reason = $iif($2-,$2-,K-Lined by admin)
  msg $active /kline %user %reason
  jac.log K-Line sent for %user $+ : %reason
}

alias jac.profile {
  var %user = $1
  msg $active /profile %user
  jac.log Viewing profile for %user
}

; ── Auto-load notification ─────────────────────────
on *:load: {
  echo -a  
  echo -a 4╔══════════════════════════════════════════════╗
  echo -a 4║ 11 JAC Admin Tools v2.0 loaded!               4║
  echo -a 4╠══════════════════════════════════════════════╣
  echo -a 4║ 11 /jac.admin  4- Open admin panel              ║
  echo -a 4║ 11 F8          4- Shortcut to admin panel       ║
  echo -a 4║ 11 Right-click 4- Quick actions on users        ║
  echo -a 4╠══════════════════════════════════════════════╣
  echo -a 4║ 3 Server: 157.245.174.197:6667               4║
  echo -a 4║ 3 Auth: NickServ IDENTIFY (no server pass)   4║
  echo -a 4╚══════════════════════════════════════════════╝
  echo -a  
}

; ── Keyboard shortcut: F8 opens admin panel ────────
alias F8 /jac.admin

; ── Auto-refresh on room change ────────────────────
on *:join:#: {
  if ($nick == $me) jac.refresh
}

on *:part:#: {
  if ($nick == $me) jac.refresh
}
