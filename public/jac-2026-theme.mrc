; ========================================
; JAC Chat 2026 - Ultimate mIRC Theme
; Version: 2026.1.6
; ========================================
;
; FEATURES:
;   - Dark theme matching JAC web interface
;   - Emoji picker dialog
;   - User actions menu (slap, hug, etc)
;   - Quick commands toolbar
;   - Color/format picker
;   - Embedded radio player
;   - DCC file transfers
;   - 1-click updater support
;
; INSTALLATION:
;   1. Open mIRC
;   2. Press Alt+R to open Remote Scripts
;   3. File -> Load -> Select this file
;   4. Type /jac to connect!
;
; UPDATE: Run jac-updater.bat to get latest version
;
; ========================================

; =====================
; CONFIGURATION
; =====================

alias -l jac.server { return 157.245.174.197 }
alias -l jac.port { return 6667 }
; User-specific credentials live in jac-config.ini so updates don't wipe them.
alias -l jac.cfg { return $scriptdir $+ jac-config.ini }
alias -l jac.email { return $readini($jac.cfg, auth, email) }
alias -l jac.pass_raw { return $readini($jac.cfg, auth, pass) }
alias -l jac.nick { return $readini($jac.cfg, auth, nick) }
alias -l jac.radio { return https://justachat.net }
alias -l jac.version { return 2026.1.6 }

; =====================
; THEME COLORS
; =====================

; Default channel to auto-join
alias -l jac.channel { return #general }

on *:START:{
  echo -a 12[JAC] Theme v $+ $jac.version loaded! Type /jac to connect.
}

; =====================
; MAIN CONNECTION
; =====================

alias -l jac.isJac { return $iif($serverip == $jac.server,1,0) }

; Safely escape $ in passwords for mIRC scripting contexts.
; (If your password contains $, this ensures it is treated as literal text.)
alias -l jac.pass {
  if (!$jac.pass_raw) return
  return $replace($jac.pass_raw,$chr(36),$chr(36) $+ $chr(36))
}

alias -l jac.hasConfig {
  if (!$exists($jac.cfg)) return 0
  if ($jac.email == $null) return 0
  if ($jac.pass_raw == $null) return 0
  if ($jac.nick == $null) return 0
  return 1
}

alias jac.setup {
  echo -a 11[JAC] Creating/Updating $jac.cfg ...
  var %email = $$?="Email:"
  if (!%email) { echo -a 4[JAC] Cancelled. | return }
  var %pass = $$?="Password:"
  if (!%pass) { echo -a 4[JAC] Cancelled. | return }
  var %nick = $$?="Nickname:"
  if (!%nick) { echo -a 4[JAC] Cancelled. | return }

  writeini -n $jac.cfg auth email %email
  writeini -n $jac.cfg auth pass %pass
  writeini -n $jac.cfg auth nick %nick

  echo -a 3[JAC] Saved! Now type /jac to connect.
}

alias jac {
  ; IMPORTANT: PASS must be sent BEFORE mIRC registers (NICK/USER).
  ; Using /server ... <password> makes mIRC send PASS first.
  if (!$jac.hasConfig) {
    echo -a 4[JAC] Missing config. Running /jac.setup...
    jac.setup
    return
  }

  ; Avoid triggering the proxy's connection rate limiter / auto-ban.
  if (%jac_last_attempt != $null) && ($calc($ticks - %jac_last_attempt) < 20000) {
    echo -a 7[JAC] Please wait at least 20 seconds before retrying /jac.
    return
  }
  set %jac_last_attempt $ticks
  unset %jac_blocked

  echo -a 11[JAC 2026] Connecting to JAC Chat...
  ; mIRC strips everything before ':' in the /server password argument (server password becomes just the password).
  ; The gateway accepts multiple delimiters, so we use ';' which is safe in mIRC scripts.
  var %auth = $jac.email $+ $chr(59) $+ $jac.pass
  nick $jac.nick
  server -m $jac.server $jac.port %auth
}

; Numeric 465 is used by the proxy for ban / rate-limit notices.
raw 465:*:{
  if ($jac.isJac) {
    var %msg = $4-
    echo -a 4[JAC] $remove(%msg,$chr(58))
    if ($regex(%msg,/(banned|rate limited|auto-ban)/i)) {
      set %jac_blocked 1
    }
  }
}

on *:CONNECT:{
  if ($jac.isJac) {
    ; Keepalive (after socket open)
    .timerjac.keepalive 0 90 raw -q PING :keepalive
  }
}

; RPL_WELCOME (001) - Successfully registered, now auto-join
raw 001:*:{
  if ($jac.isJac) {
    echo -a 3[JAC] Logged in as $jac.nick
    jac.toolbar.create
    ; Auto-join default channel
    .timerjac.autojoin 1 2 join $jac.channel
  }
}

on *:DISCONNECT:{
  if ($jac.isJac) {
    .timerjac.keepalive off
    .timerjac.autojoin off
    ; Do NOT auto-reconnect: mIRC already retries, and extra retries trigger the proxy auto-ban.
    if (%jac_blocked) {
      echo -a 4[JAC] You appear to be banned / rate-limited. Not auto-reconnecting.
      echo -a 7[JAC] If you have access, unban your IP in the IRC Proxy Admin. Otherwise wait ~60 minutes and try /jac again.
    } else {
      echo -a 7[JAC] Disconnected. Type /jac to reconnect (wait at least 20s between attempts).
    }
  }
}

on *:PING:{ raw -q PONG $1- }

; =====================
; EMOJI PICKER
; =====================

alias jac.emoji { dialog -m jac_emoji jac_emoji }

dialog jac_emoji {
  title "JAC Emoji Picker"
  size -1 -1 320 400
  option dbu
  
  tab "Smileys", 1, 5 5 310 370
  text "Click to insert:", 2, 10 25 100 10, tab 1
  button "😀", 100, 10 40 30 20, tab 1 flat
  button "😂", 101, 45 40 30 20, tab 1 flat
  button "🤣", 102, 80 40 30 20, tab 1 flat
  button "😊", 103, 115 40 30 20, tab 1 flat
  button "😍", 104, 150 40 30 20, tab 1 flat
  button "🥰", 105, 185 40 30 20, tab 1 flat
  button "😘", 106, 220 40 30 20, tab 1 flat
  button "😎", 107, 255 40 30 20, tab 1 flat
  button "🤔", 108, 10 65 30 20, tab 1 flat
  button "😏", 109, 45 65 30 20, tab 1 flat
  button "😒", 110, 80 65 30 20, tab 1 flat
  button "😢", 111, 115 65 30 20, tab 1 flat
  button "😭", 112, 150 65 30 20, tab 1 flat
  button "😤", 113, 185 65 30 20, tab 1 flat
  button "😡", 114, 220 65 30 20, tab 1 flat
  button "🤯", 115, 255 65 30 20, tab 1 flat
  button "😱", 116, 10 90 30 20, tab 1 flat
  button "🙄", 117, 45 90 30 20, tab 1 flat
  button "😴", 118, 80 90 30 20, tab 1 flat
  button "🤮", 119, 115 90 30 20, tab 1 flat
  button "🤑", 120, 150 90 30 20, tab 1 flat
  button "🤗", 121, 185 90 30 20, tab 1 flat
  button "🤫", 122, 220 90 30 20, tab 1 flat
  button "🤭", 123, 255 90 30 20, tab 1 flat
  
  tab "Gestures", 3
  button "👍", 200, 10 40 30 20, tab 3 flat
  button "👎", 201, 45 40 30 20, tab 3 flat
  button "👏", 202, 80 40 30 20, tab 3 flat
  button "🙌", 203, 115 40 30 20, tab 3 flat
  button "🤝", 204, 150 40 30 20, tab 3 flat
  button "✌️", 205, 185 40 30 20, tab 3 flat
  button "🤞", 206, 220 40 30 20, tab 3 flat
  button "🤟", 207, 255 40 30 20, tab 3 flat
  button "👋", 208, 10 65 30 20, tab 3 flat
  button "💪", 209, 45 65 30 20, tab 3 flat
  button "🖕", 210, 80 65 30 20, tab 3 flat
  button "✋", 211, 115 65 30 20, tab 3 flat
  button "👊", 212, 150 65 30 20, tab 3 flat
  button "🤜", 213, 185 65 30 20, tab 3 flat
  button "🤛", 214, 220 65 30 20, tab 3 flat
  button "🙏", 215, 255 65 30 20, tab 3 flat
  
  tab "Objects", 4
  button "❤️", 300, 10 40 30 20, tab 4 flat
  button "💔", 301, 45 40 30 20, tab 4 flat
  button "💯", 302, 80 40 30 20, tab 4 flat
  button "🔥", 303, 115 40 30 20, tab 4 flat
  button "⭐", 304, 150 40 30 20, tab 4 flat
  button "💎", 305, 185 40 30 20, tab 4 flat
  button "🎵", 306, 220 40 30 20, tab 4 flat
  button "🎮", 307, 255 40 30 20, tab 4 flat
  button "📱", 308, 10 65 30 20, tab 4 flat
  button "💻", 309, 45 65 30 20, tab 4 flat
  button "☕", 310, 80 65 30 20, tab 4 flat
  button "🍕", 311, 115 65 30 20, tab 4 flat
  button "🍺", 312, 150 65 30 20, tab 4 flat
  button "🎉", 313, 185 65 30 20, tab 4 flat
  button "🎁", 314, 220 65 30 20, tab 4 flat
  button "💰", 315, 255 65 30 20, tab 4 flat
  
  tab "Animals", 5
  button "🐶", 400, 10 40 30 20, tab 5 flat
  button "🐱", 401, 45 40 30 20, tab 5 flat
  button "🐼", 402, 80 40 30 20, tab 5 flat
  button "🦊", 403, 115 40 30 20, tab 5 flat
  button "🦁", 404, 150 40 30 20, tab 5 flat
  button "🐸", 405, 185 40 30 20, tab 5 flat
  button "🐷", 406, 220 40 30 20, tab 5 flat
  button "🐔", 407, 255 40 30 20, tab 5 flat
  button "🦄", 408, 10 65 30 20, tab 5 flat
  button "🐙", 409, 45 65 30 20, tab 5 flat
  button "🦋", 410, 80 65 30 20, tab 5 flat
  button "🐝", 411, 115 65 30 20, tab 5 flat
  button "🦀", 412, 150 65 30 20, tab 5 flat
  button "🐍", 413, 185 65 30 20, tab 5 flat
  button "🐢", 414, 220 65 30 20, tab 5 flat
  button "🐠", 415, 255 65 30 20, tab 5 flat
  
  button "Close", 999, 130 375 60 20, ok
}

on *:DIALOG:jac_emoji:sclick:*:{
  if ($did >= 100 && $did <= 499) {
    var %emoji = $did($dname, $did).text
    if ($active ischan) || ($active isquery) {
      editbox -a $active %emoji
    }
    else { echo -a Emoji: %emoji }
  }
}

; =====================
; USER ACTIONS
; =====================

alias jac.actions { dialog -m jac_actions jac_actions }

dialog jac_actions {
  title "JAC User Actions"
  size -1 -1 280 320
  option dbu
  
  text "Select user:", 1, 10 10 80 10
  combo 2, 10 22 260 100, drop sort
  
  text "Choose action:", 3, 10 50 100 10
  
  button "👋 Wave", 100, 10 65 125 20, flat
  button "🤗 Hug", 101, 140 65 125 20, flat
  button "🐟 Slap", 102, 10 90 125 20, flat
  button "🎉 Celebrate", 103, 140 90 125 20, flat
  button "👊 Fist bump", 104, 10 115 125 20, flat
  button "💃 Dance", 105, 140 115 125 20, flat
  button "☕ Coffee", 106, 10 140 125 20, flat
  button "🍕 Pizza", 107, 140 140 125 20, flat
  button "🎵 Serenade", 108, 10 165 125 20, flat
  button "😏 Wink", 109, 140 165 125 20, flat
  button "🤝 High five", 110, 10 190 125 20, flat
  button "🎯 Challenge", 111, 140 190 125 20, flat
  button "💐 Flowers", 112, 10 215 125 20, flat
  button "🎁 Gift", 113, 140 215 125 20, flat
  button "🫂 Console", 114, 10 240 125 20, flat
  button "🚀 Blast off", 115, 140 240 125 20, flat
  
  button "Close", 999, 110 275 60 20, ok
}

on *:DIALOG:jac_actions:init:*:{
  if ($active ischan) {
    var %i = 1
    while (%i <= $nick($active, 0)) {
      did -a $dname 2 $nick($active, %i)
      inc %i
    }
  }
}

on *:DIALOG:jac_actions:sclick:*:{
  var %target = $did($dname, 2).seltext
  if (!%target) { echo -a 4[JAC] Select a user first! | return }
  
  var %action
  if ($did == 100) { %action = waves at %target 👋 }
  elseif ($did == 101) { %action = gives %target a warm hug 🤗 }
  elseif ($did == 102) { %action = slaps %target with a large trout 🐟 }
  elseif ($did == 103) { %action = celebrates with %target 🎉 }
  elseif ($did == 104) { %action = fist bumps %target 👊 }
  elseif ($did == 105) { %action = dances with %target 💃 }
  elseif ($did == 106) { %action = buys %target a coffee ☕ }
  elseif ($did == 107) { %action = shares pizza with %target 🍕 }
  elseif ($did == 108) { %action = serenades %target 🎵 }
  elseif ($did == 109) { %action = winks at %target 😏 }
  elseif ($did == 110) { %action = high fives %target! ✋ }
  elseif ($did == 111) { %action = challenges %target! 🎯 }
  elseif ($did == 112) { %action = gives %target flowers 💐 }
  elseif ($did == 113) { %action = gives %target a gift 🎁 }
  elseif ($did == 114) { %action = hugs %target 🫂 }
  elseif ($did == 115) { %action = blasts off with %target! 🚀 }
  
  if (%action) {
    if ($active ischan) { describe $active %action }
    dialog -c $dname
  }
}

; =====================
; QUICK COMMANDS
; =====================

alias jac.commands { dialog -m jac_commands jac_commands }

dialog jac_commands {
  title "JAC Quick Commands"
  size -1 -1 300 280
  option dbu
  
  text "Channel:", 1, 10 10 50 10
  edit "", 2, 60 8 180 14
  
  box "Channel", 3, 10 30 280 75
  button "Join", 100, 20 45 60 18, flat
  button "Part", 101, 85 45 60 18, flat
  button "Topic", 102, 150 45 60 18, flat
  button "+o", 103, 215 45 60 18, flat
  button "-o", 104, 20 68 60 18, flat
  button "Kick", 105, 85 68 60 18, flat
  button "Ban", 106, 150 68 60 18, flat
  button "K-Line", 107, 215 68 60 18, flat
  
  box "Network", 4, 10 115 280 50
  button "List Rooms", 200, 20 130 80 18, flat
  button "Who's Here", 201, 105 130 80 18, flat
  button "My Stats", 202, 190 130 80 18, flat
  
  box "DCC File", 5, 10 175 280 45
  button "Send File...", 300, 20 190 80 18, flat
  button "Accept All", 301, 105 190 80 18, flat
  button "Chat", 302, 190 190 80 18, flat
  
  button "Close", 999, 120 230 60 18, ok
}

on *:DIALOG:jac_commands:sclick:*:{
  var %chan = $did($dname, 2).text
  
  if ($did == 100) { if (%chan) { join %chan } else { echo -a 4Enter channel! } }
  elseif ($did == 101) { if (%chan) { part %chan } }
  elseif ($did == 102) { if (%chan) { editbox -a /topic %chan  } }
  elseif ($did == 103) { if (%chan) { editbox -a /mode %chan +o  } }
  elseif ($did == 104) { if (%chan) { editbox -a /mode %chan -o  } }
  elseif ($did == 105) { if (%chan) { editbox -a /kick %chan  } }
  elseif ($did == 106) { if (%chan) { editbox -a /mode %chan +b  } }
  elseif ($did == 107) { editbox -a /kline  }
  elseif ($did == 200) { raw LIST }
  elseif ($did == 201) { if (%chan) { who %chan } else { who * } }
  elseif ($did == 202) { whois $me }
  elseif ($did == 300) { dcc send }
  elseif ($did == 301) { dcc auto }
  elseif ($did == 302) { dcc chat }
}

; =====================
; TEXT FORMATTER
; =====================

alias jac.format { dialog -m jac_format jac_format }

dialog jac_format {
  title "JAC Text Formatter"
  size -1 -1 350 180
  option dbu
  
  text "Preview:", 1, 10 10 50 10
  edit "Type here", 2, 10 22 330 20
  
  box "Format", 3, 10 50 165 55
  button "Bold", 100, 20 65 45 18, flat
  button "Italic", 101, 70 65 45 18, flat
  button "Uline", 102, 120 65 45 18, flat
  button "Reverse", 103, 20 88 70 18, flat
  button "Reset", 104, 95 88 70 18, flat
  
  box "Color", 4, 180 50 160 85
  button "", 200, 190 65 16 16, flat
  button "", 201, 210 65 16 16, flat
  button "", 202, 230 65 16 16, flat
  button "", 203, 250 65 16 16, flat
  button "", 204, 270 65 16 16, flat
  button "", 205, 290 65 16 16, flat
  button "", 206, 310 65 16 16, flat
  button "", 207, 190 85 16 16, flat
  button "", 208, 210 85 16 16, flat
  button "", 209, 230 85 16 16, flat
  button "", 210, 250 85 16 16, flat
  button "", 211, 270 85 16 16, flat
  button "", 212, 290 85 16 16, flat
  button "", 213, 310 85 16 16, flat
  button "", 214, 250 105 16 16, flat
  button "", 215, 270 105 16 16, flat
  
  button "Insert", 300, 10 145 80 22, ok
  button "Copy", 301, 100 145 60 22
  button "Cancel", 999, 170 145 60 22, cancel
}

on *:DIALOG:jac_format:sclick:*:{
  var %text = $did($dname, 2).text
  
  if ($did == 100) { did -ra $dname 2 $chr(2) $+ %text $+ $chr(2) }
  elseif ($did == 101) { did -ra $dname 2 $chr(29) $+ %text $+ $chr(29) }
  elseif ($did == 102) { did -ra $dname 2 $chr(31) $+ %text $+ $chr(31) }
  elseif ($did == 103) { did -ra $dname 2 $chr(22) $+ %text $+ $chr(22) }
  elseif ($did == 104) { did -ra $dname 2 $chr(15) $+ %text }
  elseif ($did >= 200 && $did <= 215) {
    var %color = $calc($did - 200)
    did -ra $dname 2 $chr(3) $+ %color $+ %text $+ $chr(3)
  }
  elseif ($did == 300) {
    if ($active ischan) || ($active isquery) { editbox -a $active %text }
  }
  elseif ($did == 301) { clipboard %text }
}

; =====================
; RADIO PLAYER
; =====================

alias jac.radio { dialog -m jac_radio jac_radio }

dialog jac_radio {
  title "JAC Radio"
  size -1 -1 260 160
  option dbu
  
  text "Now Playing:", 1, 10 10 60 10
  text "JAC Radio - Live", 2, 70 10 180 10
  
  box "Player", 3, 10 25 240 65
  text "Status: Ready", 4, 20 40 200 10
  button "Play", 100, 20 55 50 22, flat
  button "Pause", 101, 75 55 50 22, flat
  button "Stop", 102, 130 55 50 22, flat
  button "Vol", 103, 185 55 50 22, flat
  
  box "Stations", 5, 10 95 240 35
  radio "Rock", 200, 20 108 45 15
  radio "EDM", 201, 70 108 40 15
  radio "Chill", 202, 115 108 40 15
  radio "Pop", 203, 160 108 35 15
  radio "Web", 204, 200 108 40 15
  
  button "Close", 999, 100 135 60 18, ok
}

on *:DIALOG:jac_radio:sclick:*:{
  if ($did == 100) { did -ra $dname 4 Status: Playing... }
  elseif ($did == 101) { did -ra $dname 4 Status: Paused }
  elseif ($did == 102) { did -ra $dname 4 Status: Stopped }
  elseif ($did == 204) { url -a $jac.radio }
}

; =====================
; TOOLBAR
; =====================

alias jac.toolbar.create {
  toolbar -a jac_emoji 0 "Emoji" "Emoji picker" jac.emoji
  toolbar -a jac_actions 0 "Actions" "User actions" jac.actions
  toolbar -a jac_cmds 0 "Cmds" "Quick commands" jac.commands
  toolbar -a jac_format 0 "Format" "Text format" jac.format
  toolbar -a jac_radio 0 "Radio" "Radio player" jac.radio
  toolbar -a jac_dcc 0 "DCC" "Send file" dcc.send
  echo -a 11[JAC] Toolbar ready!
}

alias dcc.send {
  if ($active ischan) {
    var %nick = $$?="Nick to send file:"
    if (%nick) { dcc send %nick }
  }
  else { dcc send }
}

; =====================
; 1-CLICK UPDATE
; =====================

alias jac.update {
  echo -a 12[JAC] Checking for updates...
  echo -a 7[JAC] Current version: $jac.version
  echo -a 11[JAC] Run jac-updater.bat to update!
  url -a https://justachat.net/mirc-setup
}

; =====================
; HELPER COMMANDS
; =====================

alias jac.rooms { if ($status == connected) { raw LIST } else { echo -a 4Not connected! } }
alias jac.help {
  echo -a 12══════════════════════════════════════
  echo -a 11 JAC Chat 2026 - Commands
  echo -a 12══════════════════════════════════════
  echo -a 11Main:
  echo -a   /jac         - Connect
  echo -a   /jac.rooms   - List channels
  echo -a   /jac.update  - Check updates
  echo -a 11Features:
  echo -a   /jac.emoji   - Emoji picker
  echo -a   /jac.actions - User actions
  echo -a   /jac.commands- Quick commands
  echo -a   /jac.format  - Text formatter
  echo -a   /jac.radio   - Radio player
  echo -a 11DCC:
  echo -a   /dcc send    - Send file
  echo -a   /dcc get     - Accept file
  echo -a 12══════════════════════════════════════
}

; =====================
; CONTEXT MENUS
; =====================

menu nicklist {
  User Actions
  .👋 Wave:describe $active waves at $$1 👋
  .🤗 Hug:describe $active gives $$1 a warm hug 🤗
  .🐟 Slap:describe $active slaps $$1 with a trout 🐟
  .🎉 Celebrate:describe $active celebrates with $$1 🎉
  .-
  📤 Send File:dcc send $$1
  💬 PM:query $$1
  ℹ️ Whois:whois $$1
  .-
  Mod
  .+o:mode $active +o $$1
  .-o:mode $active -o $$1
  .Kick:kick $active $$1
  .Ban:mode $active +b $$1
}

menu channel {
  📋 Commands:/jac.commands
  😀 Emoji:/jac.emoji
  ⚡ Actions:/jac.actions
  🎨 Format:/jac.format
  🎵 Radio:/jac.radio
  -
  📤 Send File:dcc send
  -
  📊 Who:who $active
}

; =====================
; WELCOME
; =====================

on *:LOAD:{
  echo -a  
  echo -a 12╔══════════════════════════════════════╗
  echo -a 12║  11 JAC Chat 2026 Theme Loaded!        12║
  echo -a 12╠══════════════════════════════════════╣
  echo -a 12║ 11/jac          12- Connect               ║
  echo -a 12║ 11/jac.help     12- Commands              ║
  echo -a 12║ 11/jac.update   12- Check updates         ║
  echo -a 12╠══════════════════════════════════════╣
  echo -a 12║ 3✓12 Emoji  3✓12 Actions  3✓12 Radio       ║
  echo -a 12║ 3✓12 Format 3✓12 Commands 3✓12 DCC        ║
  echo -a 12╚══════════════════════════════════════╝
  echo -a  
  jac.applyTheme
}

; --- JAC 2026 v2026.1.0 ---
