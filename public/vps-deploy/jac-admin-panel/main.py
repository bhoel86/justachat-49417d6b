#!/usr/bin/env python3
"""
Justachat™ IRC Admin Console v7

Modern dark-themed admin panel with:
- Dual connection (Admin + Bot)
- Room monitoring with colored chat
- User management (WHOIS, OP, BAN, KICK, etc.)
- IP Lookup tool (DNS, GeoIP, Reverse DNS)
- Port Scanner (common + custom ports)
- Rate limiting / flood detection
- JustAChat branding & watermark
- Room controls (+m, +i, +k, +l)

Run: python main.py
"""

import queue, socket, threading, time, tkinter as tk, json, struct
from dataclasses import dataclass, field
from tkinter import ttk, messagebox, simpledialog, scrolledtext
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Branding ──────────────────────────────────────────────────────
APP_NAME     = "Justachat™ IRC Admin Console"
APP_VERSION  = "v7.0"
APP_TAGLINE  = "Chat. Connect. Chill."
SERVER_HOST  = "157.245.174.197"

# ── Theme Colors ──────────────────────────────────────────────────
COLORS = {
    "bg_dark":     "#0a0e17",
    "bg_panel":    "#111827",
    "bg_input":    "#1a2236",
    "bg_header":   "#0d1424",
    "bg_sidebar":  "#0f1628",
    "bg_card":     "#141d30",
    "bg_hover":    "#1e2a45",
    "bg_selected": "#1a3a5c",
    "fg_primary":  "#e2e8f0",
    "fg_dim":      "#64748b",
    "fg_bright":   "#f8fafc",
    "accent_cyan": "#22d3ee",
    "accent_blue": "#3b82f6",
    "accent_green":"#10b981",
    "accent_red":  "#ef4444",
    "accent_amber":"#f59e0b",
    "accent_pink": "#ec4899",
    "accent_purple":"#a78bfa",
    "border":      "#1e293b",
    "border_light":"#334155",
    "scrollbar":   "#334155",
    "owner_gold":  "#fbbf24",
    "admin_red":   "#f87171",
    "mod_green":   "#34d399",
    "bot_cyan":    "#67e8f9",
    "user_slate":  "#94a3b8",
}

# ── Common Ports for Scanner ─────────────────────────────────────
COMMON_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
    80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS", 445: "SMB",
    993: "IMAPS", 995: "POP3S", 3306: "MySQL", 3389: "RDP",
    5432: "PostgreSQL", 5900: "VNC", 6667: "IRC", 6697: "IRC-SSL",
    8000: "HTTP-Alt", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt",
    8888: "HTTP-Alt2", 9090: "Web-Console", 27017: "MongoDB",
}

def safe_strip(s: str) -> str:
    return (s or "").replace("\r", "").replace("\n", "")

def parse_prefix(prefix: str):
    nick = prefix.split("!", 1)[0] if "!" in prefix else prefix
    userhost = prefix.split("!", 1)[1] if "!" in prefix else ""
    user = userhost.split("@", 1)[0] if "@" in userhost else ""
    host = userhost.split("@", 1)[1] if "@" in userhost else ""
    return nick, user, host

def strip_irc_colors(text: str) -> str:
    """Remove mIRC color codes from text"""
    import re
    # Remove \x03FG,BG or \x03FG patterns
    text = re.sub(r'\x03(\d{1,2}(,\d{1,2})?)?', '', text)
    # Remove bold, italic, underline, reset
    text = text.replace('\x02', '').replace('\x1d', '').replace('\x1f', '').replace('\x0f', '')
    # Remove reverse
    text = text.replace('\x16', '')
    return text

@dataclass
class RateWindow:
    window_s: int = 10
    hits: list = field(default_factory=list)
    def add(self, t: float):
        self.hits.append(t)
        cut = t - self.window_s
        self.hits = [x for x in self.hits if x >= cut]
    def count(self) -> int:
        return len(self.hits)


# ══════════════════════════════════════════════════════════════════
#  IRC Connection Handler
# ══════════════════════════════════════════════════════════════════
class IRCConn:
    def __init__(self, label: str, uiq: queue.Queue):
        self.label = label
        self.uiq = uiq
        self.sock = None
        self.connected = False
        self._stop = threading.Event()
        self._tx = threading.Lock()
        self._buf = ""
        self.nick = ""
        self.channels = []
        self.channel_users = {}
        self.user_hostmask = {}
        self.user_prefixes = {}   # chan -> {nick: prefix_char}
        self.chat = []
        self.events = []
        self.whois_buffer = {}    # nick -> [lines]
        self.msg_rate = {}
        self.join_rate = {}

    def emit(self, kind, *args):
        self.uiq.put((self.label, kind, *args))

    def status(self, s: str):
        self.emit("status", s)

    def send_raw(self, line: str):
        if not self.connected or not self.sock:
            return
        data = (safe_strip(line) + "\r\n").encode("utf-8", errors="ignore")
        with self._tx:
            try:
                self.sock.sendall(data)
            except OSError as e:
                self.status(f"Send failed: {e}")
                self.disconnect()

    def privmsg(self, target, msg):
        self.send_raw(f"PRIVMSG {target} :{safe_strip(msg)}")

    def connect(self, host, port, nick, email, password, realname):
        if self.connected:
            return
        self._stop.clear()
        self.nick = nick.strip()
        try:
            self.sock = socket.create_connection((host.strip(), int(port)), timeout=12)
            self.sock.settimeout(1.0)
        except Exception as e:
            self.status(f"Connect failed: {e}")
            return
        self.connected = True
        self.status("Connected. Registering…")
        if email and password:
            self.send_raw(f"PASS {email.strip()};{password}")
        self.send_raw(f"NICK {self.nick}")
        self.send_raw(f"USER {safe_strip(nick)} 0 * :{safe_strip(realname)}")
        threading.Thread(target=self._rx_loop, daemon=True).start()

    def disconnect(self):
        self._stop.set()
        if self.connected:
            try: self.send_raw("QUIT :disconnect")
            except: pass
        try:
            if self.sock: self.sock.close()
        except: pass
        self.sock = None
        self.connected = False
        self.status("Disconnected.")

    def list_channels(self):
        self.channels = []
        self.emit("channels", list(self.channels))
        self.send_raw("LIST")

    def join(self, chan):
        if not chan: return
        if not chan.startswith("#"): chan = "#" + chan
        self.send_raw(f"JOIN {chan}")

    def names(self, chan):
        if chan: self.send_raw(f"NAMES {chan}")

    def whois(self, nick):
        if nick: self.send_raw(f"WHOIS {nick}")

    def kick(self, chan, nick, reason="Kicked"):
        self.send_raw(f"KICK {chan} {nick} :{safe_strip(reason)}")

    def mode(self, target, modes):
        self.send_raw(f"MODE {target} {modes}")

    def _log_event(self, line):
        clean = strip_irc_colors(line)
        self.events.append(clean)
        self.events = self.events[-5000:]
        self.emit("events", list(self.events))

    def _log_chat(self, chan, nick, text):
        clean = strip_irc_colors(text)
        self.chat.append((time.time(), chan, nick, clean))
        self.chat = self.chat[-10000:]
        self.emit("chat", list(self.chat))

    def _alert(self, msg):
        self.emit("alert", msg)

    def _rx_loop(self):
        try:
            while not self._stop.is_set() and self.sock:
                try:
                    chunk = self.sock.recv(4096)
                    if not chunk: break
                    self._buf += chunk.decode("utf-8", errors="ignore")
                    while "\r\n" in self._buf:
                        line, self._buf = self._buf.split("\r\n", 1)
                        if line: self._handle_line(line)
                except socket.timeout:
                    continue
                except OSError:
                    break
        finally:
            self.connected = False
            self.status("Connection closed.")

    def _handle_line(self, line):
        self._log_event(line)
        if line.startswith("PING "):
            token = line.split(" ", 1)[1]
            self.send_raw(f"PONG {token}")
            return

        prefix = ""
        rest = line
        if rest.startswith(":"):
            prefix, rest = rest[1:].split(" ", 1)
        parts = rest.split(" ")
        cmd = parts[0]
        params = parts[1:]

        nick = user = host = ""
        if prefix:
            nick, user, host = parse_prefix(prefix)
            if nick and (user or host):
                self.user_hostmask[nick] = (user + "@" + host).strip("@")
                self.emit("user_hostmask", nick, self.user_hostmask[nick])

        if cmd.isdigit():
            num = int(cmd)
            if num == 1:
                self.status("Registered (001).")
                return
            if num == 322 and len(params) >= 4:
                chan = params[1]
                try: users = int(params[2])
                except: users = 0
                topic = strip_irc_colors(" ".join(params[3:]).lstrip(":"))
                self.channels.append((chan, users, topic))
                self.emit("channels", list(self.channels))
                return
            if num == 353 and len(params) >= 4:
                chan = params[2]
                names_part = " ".join(params[3:]).lstrip(":")
                raw_nicks = [strip_irc_colors(n) for n in names_part.split() if n]
                s = self.channel_users.setdefault(chan, set())
                prefixes = self.user_prefixes.setdefault(chan, {})
                for raw in raw_nicks:
                    prefix_char = ""
                    clean = raw
                    while clean and clean[0] in "~&@%+":
                        prefix_char += clean[0]
                        clean = clean[1:]
                    if clean:
                        s.add(clean)
                        if prefix_char:
                            prefixes[clean] = prefix_char
                self.emit("users", chan, sorted(s, key=str.lower))
                return
            # WHOIS replies
            if num in (311, 312, 317, 319, 320, 330, 338, 378, 671):
                target = params[1] if len(params) > 1 else ""
                info = strip_irc_colors(" ".join(params[1:]))
                self.whois_buffer.setdefault(target, []).append(f"{num}: {info}")
                return
            if num == 318:
                target = params[1] if len(params) > 1 else ""
                lines = self.whois_buffer.pop(target, [])
                self.emit("whois_result", target, lines)
                return
            return

        if cmd == "NOTICE":
            # Filter out server NOTICEs from chat - they're just decorative
            return

        if cmd == "JOIN":
            chan = (params[0] if params else "").lstrip(":")
            if chan:
                rw = self.join_rate.setdefault(chan, RateWindow())
                rw.add(time.time())
                if rw.count() >= 12:
                    self._alert(f"⚠ Join burst in {chan}: {rw.count()}/10s")
            if nick and chan:
                self.channel_users.setdefault(chan, set()).add(nick)
                self.emit("users", chan, sorted(self.channel_users.get(chan, set()), key=str.lower))
                if nick == self.nick:
                    self.names(chan)
            return

        if cmd == "PART":
            chan = params[0] if params else ""
            if nick and chan:
                self.channel_users.setdefault(chan, set()).discard(nick)
                self.emit("users", chan, sorted(self.channel_users.get(chan, set()), key=str.lower))
            return

        if cmd == "QUIT":
            if nick:
                for ch, s in list(self.channel_users.items()):
                    if nick in s:
                        s.discard(nick)
                        self.emit("users", ch, sorted(s, key=str.lower))
            return

        if cmd == "KICK" and len(params) >= 2:
            chan, kicked = params[0], params[1]
            self.channel_users.setdefault(chan, set()).discard(kicked)
            self.emit("users", chan, sorted(self.channel_users.get(chan, set()), key=str.lower))
            return

        if cmd == "PRIVMSG" and len(params) >= 2:
            target = params[0]
            text = " ".join(params[1:]).lstrip(":")
            if target.startswith("#"):
                self._log_chat(target, nick, text)
                rw = self.msg_rate.setdefault((target, nick), RateWindow())
                rw.add(time.time())
                if rw.count() >= 12:
                    self._alert(f"⚠ Flood: {nick} in {target}: {rw.count()}/10s")
            else:
                self._log_chat(f"@{nick}", nick, text)
            return


# ══════════════════════════════════════════════════════════════════
#  Network Tools
# ══════════════════════════════════════════════════════════════════
def ip_lookup(target: str) -> dict:
    """Perform IP/hostname lookup with DNS resolution and reverse DNS"""
    result = {"target": target, "ips": [], "reverse_dns": [], "error": None}
    try:
        # Forward lookup
        infos = socket.getaddrinfo(target, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        seen = set()
        for family, _, _, _, sockaddr in infos:
            ip = sockaddr[0]
            if ip not in seen:
                seen.add(ip)
                fam = "IPv4" if family == socket.AF_INET else "IPv6"
                result["ips"].append({"ip": ip, "family": fam})
        # Reverse DNS for each IP
        for entry in result["ips"]:
            try:
                hostname, _, _ = socket.gethostbyaddr(entry["ip"])
                entry["rdns"] = hostname
            except:
                entry["rdns"] = "(no reverse DNS)"
    except socket.gaierror as e:
        result["error"] = str(e)
    except Exception as e:
        result["error"] = str(e)
    return result

def scan_port(host: str, port: int, timeout: float = 2.0) -> dict:
    """Scan a single port"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        service = COMMON_PORTS.get(port, "unknown")
        if result == 0:
            # Try banner grab
            banner = ""
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((host, port))
                s.send(b"\r\n")
                banner = s.recv(256).decode("utf-8", errors="ignore").strip()[:80]
                s.close()
            except:
                pass
            return {"port": port, "state": "OPEN", "service": service, "banner": banner}
        else:
            return {"port": port, "state": "CLOSED", "service": service, "banner": ""}
    except socket.timeout:
        return {"port": port, "state": "FILTERED", "service": COMMON_PORTS.get(port, "unknown"), "banner": ""}
    except Exception as e:
        return {"port": port, "state": "ERROR", "service": COMMON_PORTS.get(port, "unknown"), "banner": str(e)}

def scan_ports(host: str, ports: list, timeout: float = 2.0, callback=None) -> list:
    """Scan multiple ports concurrently"""
    results = []
    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(scan_port, host, p, timeout): p for p in ports}
        for f in as_completed(futures):
            r = f.result()
            results.append(r)
            if callback:
                callback(r)
    return sorted(results, key=lambda x: x["port"])


# ══════════════════════════════════════════════════════════════════
#  Main Application
# ══════════════════════════════════════════════════════════════════
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} {APP_VERSION}")
        self.geometry("1700x980")
        self.minsize(1400, 820)
        self.configure(bg=COLORS["bg_dark"])

        # Apply dark theme
        self._setup_theme()

        self.uiq = queue.Queue()
        self.admin = IRCConn("ADMIN", self.uiq)
        self.bot = IRCConn("BOT", self.uiq)
        self.current_room = None
        self.room_tabs = {}

        self._build_ui()
        self._poll()

    def _setup_theme(self):
        style = ttk.Style(self)
        style.theme_use("clam")

        # Global background
        style.configure(".", background=COLORS["bg_panel"], foreground=COLORS["fg_primary"],
                        fieldbackground=COLORS["bg_input"], borderwidth=0, font=("Segoe UI", 10))

        # Frames
        style.configure("TFrame", background=COLORS["bg_panel"])
        style.configure("Dark.TFrame", background=COLORS["bg_dark"])
        style.configure("Card.TFrame", background=COLORS["bg_card"])
        style.configure("Header.TFrame", background=COLORS["bg_header"])

        # Labels
        style.configure("TLabel", background=COLORS["bg_panel"], foreground=COLORS["fg_primary"])
        style.configure("Header.TLabel", background=COLORS["bg_header"], foreground=COLORS["accent_cyan"],
                        font=("Segoe UI", 11, "bold"))
        style.configure("Brand.TLabel", background=COLORS["bg_header"], foreground=COLORS["accent_cyan"],
                        font=("Segoe UI", 16, "bold"))
        style.configure("Tagline.TLabel", background=COLORS["bg_header"], foreground=COLORS["fg_dim"],
                        font=("Segoe UI", 9))
        style.configure("Version.TLabel", background=COLORS["bg_header"], foreground=COLORS["fg_dim"],
                        font=("Segoe UI", 8))
        style.configure("Status.TLabel", foreground=COLORS["accent_green"], font=("Segoe UI", 9))
        style.configure("Dim.TLabel", foreground=COLORS["fg_dim"], font=("Segoe UI", 9))
        style.configure("Accent.TLabel", foreground=COLORS["accent_cyan"])

        # Buttons
        style.configure("TButton", background=COLORS["bg_card"], foreground=COLORS["fg_primary"],
                        padding=(12, 6), font=("Segoe UI", 9))
        style.map("TButton",
                   background=[("active", COLORS["bg_hover"]), ("pressed", COLORS["bg_selected"])],
                   foreground=[("active", COLORS["accent_cyan"])])

        style.configure("Accent.TButton", background=COLORS["accent_blue"], foreground="#ffffff",
                        padding=(14, 7), font=("Segoe UI", 9, "bold"))
        style.map("Accent.TButton",
                   background=[("active", "#2563eb"), ("pressed", "#1d4ed8")])

        style.configure("Danger.TButton", background=COLORS["accent_red"], foreground="#ffffff",
                        padding=(12, 6))
        style.map("Danger.TButton",
                   background=[("active", "#dc2626"), ("pressed", "#b91c1c")])

        style.configure("Success.TButton", background=COLORS["accent_green"], foreground="#000000",
                        padding=(12, 6))

        # LabelFrame
        style.configure("TLabelframe", background=COLORS["bg_panel"],
                        foreground=COLORS["accent_cyan"], borderwidth=1, relief="solid")
        style.configure("TLabelframe.Label", background=COLORS["bg_panel"],
                        foreground=COLORS["accent_cyan"], font=("Segoe UI", 10, "bold"))

        # Notebook
        style.configure("TNotebook", background=COLORS["bg_dark"], borderwidth=0)
        style.configure("TNotebook.Tab", background=COLORS["bg_card"], foreground=COLORS["fg_dim"],
                        padding=(16, 8), font=("Segoe UI", 9))
        style.map("TNotebook.Tab",
                   background=[("selected", COLORS["bg_panel"])],
                   foreground=[("selected", COLORS["accent_cyan"])])

        # Treeview
        style.configure("Treeview", background=COLORS["bg_input"], foreground=COLORS["fg_primary"],
                        fieldbackground=COLORS["bg_input"], borderwidth=0, rowheight=28,
                        font=("Segoe UI", 10))
        style.configure("Treeview.Heading", background=COLORS["bg_card"],
                        foreground=COLORS["accent_cyan"], font=("Segoe UI", 9, "bold"))
        style.map("Treeview",
                   background=[("selected", COLORS["bg_selected"])],
                   foreground=[("selected", COLORS["accent_cyan"])])

        # Entry
        style.configure("TEntry", fieldbackground=COLORS["bg_input"],
                        foreground=COLORS["fg_primary"], insertcolor=COLORS["accent_cyan"])

        # Panedwindow
        style.configure("TPanedwindow", background=COLORS["bg_dark"])

        # Separator
        style.configure("TSeparator", background=COLORS["border"])

        # Progressbar
        style.configure("TProgressbar", background=COLORS["accent_cyan"],
                        troughcolor=COLORS["bg_input"])

    def _build_ui(self):
        # ── Header Bar ────────────────────────────────────────
        header = ttk.Frame(self, style="Header.TFrame")
        header.pack(fill=tk.X)

        brand_frame = ttk.Frame(header, style="Header.TFrame")
        brand_frame.pack(side=tk.LEFT, padx=16, pady=8)

        ttk.Label(brand_frame, text="☍ Justachat™", style="Brand.TLabel").pack(side=tk.LEFT)
        ttk.Label(brand_frame, text=f"  IRC Admin Console {APP_VERSION}", style="Version.TLabel").pack(side=tk.LEFT, padx=(8, 0))

        tagline = ttk.Frame(header, style="Header.TFrame")
        tagline.pack(side=tk.RIGHT, padx=16, pady=8)
        ttk.Label(tagline, text=APP_TAGLINE, style="Tagline.TLabel").pack(side=tk.RIGHT)

        # ── Connection Panel ──────────────────────────────────
        conn = ttk.Frame(self)
        conn.pack(fill=tk.X, padx=12, pady=(8, 4))

        # Admin connection
        admin_box = ttk.Labelframe(conn, text="⚡ Admin Connection")
        admin_box.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6))

        self.admin_host = tk.StringVar(value=SERVER_HOST)
        self.admin_port = tk.IntVar(value=6667)
        self.admin_nick = tk.StringVar(value="Sky")
        self.admin_email = tk.StringVar(value="")
        self.admin_pass = tk.StringVar(value="")

        row = ttk.Frame(admin_box); row.pack(fill=tk.X, padx=10, pady=6)
        for lbl, var, w in [("Host", self.admin_host, 16), ("Port", self.admin_port, 6),
                             ("Nick", self.admin_nick, 10), ("Email", self.admin_email, 22),
                             ("Password", self.admin_pass, 14)]:
            ttk.Label(row, text=lbl, style="Dim.TLabel").pack(side=tk.LEFT, padx=(4, 2))
            e = ttk.Entry(row, textvariable=var, width=w)
            if lbl == "Password": e.configure(show="•")
            e.pack(side=tk.LEFT, padx=(0, 4))

        btnrow = ttk.Frame(admin_box); btnrow.pack(fill=tk.X, padx=10, pady=(0, 6))
        ttk.Button(btnrow, text="▶ Connect", style="Accent.TButton", command=self._connect_admin).pack(side=tk.LEFT)
        ttk.Button(btnrow, text="⏹ Disconnect", command=self.admin.disconnect).pack(side=tk.LEFT, padx=6)
        ttk.Button(btnrow, text="📋 LIST Rooms", command=self.admin.list_channels).pack(side=tk.LEFT, padx=6)
        self.admin_status = tk.StringVar(value="⬤ Disconnected")
        ttk.Label(btnrow, textvariable=self.admin_status, style="Status.TLabel").pack(side=tk.RIGHT)

        # Bot connection
        bot_box = ttk.Labelframe(conn, text="🤖 Bot Connection")
        bot_box.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(6, 0))

        self.bot_nick = tk.StringVar(value="JustaBot")
        self.bot_email = tk.StringVar(value="")
        self.bot_pass = tk.StringVar(value="")

        brow = ttk.Frame(bot_box); brow.pack(fill=tk.X, padx=10, pady=6)
        for lbl, var, w in [("Nick", self.bot_nick, 10), ("Email", self.bot_email, 22),
                             ("Password", self.bot_pass, 14)]:
            ttk.Label(brow, text=lbl, style="Dim.TLabel").pack(side=tk.LEFT, padx=(4, 2))
            e = ttk.Entry(brow, textvariable=var, width=w)
            if lbl == "Password": e.configure(show="•")
            e.pack(side=tk.LEFT, padx=(0, 4))

        bbtn = ttk.Frame(bot_box); bbtn.pack(fill=tk.X, padx=10, pady=(0, 6))
        ttk.Button(bbtn, text="▶ Connect", style="Accent.TButton", command=self._connect_bot).pack(side=tk.LEFT)
        ttk.Button(bbtn, text="⏹ Disconnect", command=self.bot.disconnect).pack(side=tk.LEFT, padx=6)
        ttk.Button(bbtn, text="🔗 Bot JOIN All", command=self._bot_join_all).pack(side=tk.LEFT, padx=6)
        self.bot_status = tk.StringVar(value="⬤ Disconnected")
        ttk.Label(bbtn, textvariable=self.bot_status, style="Status.TLabel").pack(side=tk.RIGHT)

        # ── Main Content ──────────────────────────────────────
        main = ttk.Panedwindow(self, orient=tk.HORIZONTAL)
        main.pack(fill=tk.BOTH, expand=True, padx=12, pady=(4, 8))

        # Left sidebar
        left = ttk.Frame(main)
        main.add(left, weight=1)

        ttk.Label(left, text="📡 Channels", style="Header.TLabel").pack(anchor="w", pady=(0, 4))
        self.room_tree = ttk.Treeview(left, columns=("users", "topic"), show="headings", selectmode="browse")
        self.room_tree.heading("users", text="👥")
        self.room_tree.heading("topic", text="Topic")
        self.room_tree.column("users", width=50, anchor="center")
        self.room_tree.column("topic", width=300, anchor="w")
        self.room_tree.pack(fill=tk.BOTH, expand=True, pady=(0, 6))
        self.room_tree.bind("<<TreeviewSelect>>", lambda e: self._room_selected())

        joinbar = ttk.Frame(left); joinbar.pack(fill=tk.X, pady=(0, 6))
        self.manual_room = tk.StringVar(value="#help")
        ttk.Entry(joinbar, textvariable=self.manual_room).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        ttk.Button(joinbar, text="Join", command=self._join_manual).pack(side=tk.LEFT)

        # Room controls
        ctrl = ttk.Labelframe(left, text="🎛 Room Controls")
        ctrl.pack(fill=tk.X, pady=(0, 6))
        ctrl_row = ttk.Frame(ctrl); ctrl_row.pack(fill=tk.X, padx=6, pady=6)
        for txt, mode in [("🔇 +m", "+m"), ("🔊 -m", "-m"), ("🔒 +i", "+i"), ("🔓 -i", "-i")]:
            ttk.Button(ctrl_row, text=txt, command=lambda m=mode: self._room_mode(m)).pack(side=tk.LEFT, padx=2)

        # Alerts
        self.alerts = tk.Text(left, height=6, wrap=tk.WORD,
                              bg=COLORS["bg_input"], fg=COLORS["accent_amber"],
                              insertbackground=COLORS["accent_cyan"], font=("Consolas", 9),
                              relief="flat", borderwidth=0)
        self.alerts.pack(fill=tk.X, pady=(0, 0))
        self.alerts.insert("1.0", "⚡ Alerts appear here.\n")
        self.alerts.configure(state=tk.DISABLED)

        # Right content
        right = ttk.Frame(main)
        main.add(right, weight=3)

        self.nb = ttk.Notebook(right)
        self.nb.pack(fill=tk.BOTH, expand=True)

        # Raw Events tab
        self.events_tab = ttk.Frame(self.nb)
        self.nb.add(self.events_tab, text="📜 Raw Events")
        self.events_text = tk.Text(self.events_tab, wrap=tk.NONE,
                                    bg=COLORS["bg_input"], fg=COLORS["fg_dim"],
                                    insertbackground=COLORS["accent_cyan"],
                                    font=("Consolas", 9), relief="flat")
        self.events_text.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        self.events_text.configure(state=tk.DISABLED)

        # IP Lookup tab
        self._build_ip_lookup_tab()

        # Port Scanner tab
        self._build_port_scanner_tab()

        # User right-click menu
        self.user_menu = tk.Menu(self, tearoff=0, bg=COLORS["bg_card"], fg=COLORS["fg_primary"],
                                 activebackground=COLORS["bg_selected"], activeforeground=COLORS["accent_cyan"],
                                 font=("Segoe UI", 10))
        self.user_menu.add_command(label="🔍 WHOIS", command=self._whois_selected)
        self.user_menu.add_command(label="📡 IP Lookup", command=self._ip_lookup_user)
        self.user_menu.add_separator()
        self.user_menu.add_command(label="⭐ OP (+o)", command=lambda: self._mode_selected("+o"))
        self.user_menu.add_command(label="  DEOP (-o)", command=lambda: self._mode_selected("-o"))
        self.user_menu.add_command(label="🎤 VOICE (+v)", command=lambda: self._mode_selected("+v"))
        self.user_menu.add_command(label="  DEVOICE (-v)", command=lambda: self._mode_selected("-v"))
        self.user_menu.add_separator()
        self.user_menu.add_command(label="🚫 BAN (+b)", command=lambda: self._ban_selected(True))
        self.user_menu.add_command(label="  UNBAN (-b)", command=lambda: self._ban_selected(False))
        self.user_menu.add_separator()
        self.user_menu.add_command(label="👢 KICK…", command=self._kick_selected)
        self.user_menu.add_command(label="💀 KICKBAN…", command=self._kickban_selected)

    def _build_ip_lookup_tab(self):
        tab = ttk.Frame(self.nb)
        self.nb.add(tab, text="🌐 IP Lookup")

        top = ttk.Frame(tab); top.pack(fill=tk.X, padx=12, pady=10)
        ttk.Label(top, text="Target (IP or hostname):", style="Accent.TLabel").pack(side=tk.LEFT)
        self.ip_lookup_var = tk.StringVar(value=SERVER_HOST)
        ttk.Entry(top, textvariable=self.ip_lookup_var, width=40).pack(side=tk.LEFT, padx=8)
        ttk.Button(top, text="🔍 Lookup", style="Accent.TButton", command=self._do_ip_lookup).pack(side=tk.LEFT)

        self.ip_result = tk.Text(tab, wrap=tk.WORD,
                                  bg=COLORS["bg_input"], fg=COLORS["fg_primary"],
                                  insertbackground=COLORS["accent_cyan"],
                                  font=("Consolas", 10), relief="flat")
        self.ip_result.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))
        self.ip_result.insert("1.0", "Enter an IP address or hostname and click Lookup.\n\n"
                              "Features:\n"
                              "  • DNS Resolution (A/AAAA records)\n"
                              "  • Reverse DNS lookup\n"
                              "  • IPv4 and IPv6 support\n")
        self.ip_result.configure(state=tk.DISABLED)

    def _build_port_scanner_tab(self):
        tab = ttk.Frame(self.nb)
        self.nb.add(tab, text="🔌 Port Scanner")

        top = ttk.Frame(tab); top.pack(fill=tk.X, padx=12, pady=10)
        ttk.Label(top, text="Host:", style="Accent.TLabel").pack(side=tk.LEFT)
        self.scan_host_var = tk.StringVar(value=SERVER_HOST)
        ttk.Entry(top, textvariable=self.scan_host_var, width=24).pack(side=tk.LEFT, padx=8)

        ttk.Label(top, text="Ports:", style="Dim.TLabel").pack(side=tk.LEFT, padx=(8, 2))
        self.scan_ports_var = tk.StringVar(value="common")
        ttk.Entry(top, textvariable=self.scan_ports_var, width=30).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Label(top, text="('common' or 80,443,6667…)", style="Dim.TLabel").pack(side=tk.LEFT)

        ttk.Button(top, text="⚡ Scan", style="Accent.TButton", command=self._do_port_scan).pack(side=tk.LEFT, padx=8)

        self.scan_progress = ttk.Progressbar(tab, mode="determinate")
        self.scan_progress.pack(fill=tk.X, padx=12, pady=(0, 6))

        self.scan_result = tk.Text(tab, wrap=tk.WORD,
                                    bg=COLORS["bg_input"], fg=COLORS["fg_primary"],
                                    insertbackground=COLORS["accent_cyan"],
                                    font=("Consolas", 10), relief="flat")
        self.scan_result.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))
        self.scan_result.tag_configure("open", foreground=COLORS["accent_green"])
        self.scan_result.tag_configure("closed", foreground=COLORS["fg_dim"])
        self.scan_result.tag_configure("filtered", foreground=COLORS["accent_amber"])
        self.scan_result.tag_configure("header", foreground=COLORS["accent_cyan"], font=("Consolas", 10, "bold"))
        self.scan_result.insert("1.0", "Enter a host and ports, then click Scan.\n\n"
                                "Modes:\n"
                                "  • 'common' — scans well-known ports (SSH, HTTP, IRC, DB, etc.)\n"
                                "  • Custom — comma-separated port numbers (e.g. 80,443,6667)\n"
                                "  • Range — e.g. 1-1024\n")
        self.scan_result.configure(state=tk.DISABLED)

    # ── Connection ────────────────────────────────────────────
    def _connect_admin(self):
        if not self.admin_email.get().strip() or not self.admin_pass.get().strip():
            if not messagebox.askyesno("No PASS?", "Email/password empty. Connect without PASS?"):
                return
        self.admin.connect(self.admin_host.get(), int(self.admin_port.get()),
                           self.admin_nick.get(), self.admin_email.get(), self.admin_pass.get(),
                           "Justachat Admin")

    def _connect_bot(self):
        if not self.bot_email.get().strip() or not self.bot_pass.get().strip():
            messagebox.showerror("Bot login required", "Enter bot email + password.")
            return
        self.bot.connect(self.admin_host.get(), int(self.admin_port.get()),
                         self.bot_nick.get(), self.bot_email.get(), self.bot_pass.get(),
                         "Justachat Bot")

    # ── Room Management ───────────────────────────────────────
    def _render_rooms(self, rooms):
        self.room_tree.delete(*self.room_tree.get_children())
        for chan, users, topic in sorted(rooms, key=lambda x: (-x[1], x[0].lower())):
            self.room_tree.insert("", tk.END, iid=chan, values=(users, topic))

    def _room_selected(self):
        sel = self.room_tree.selection()
        if not sel: return
        self._open_room(sel[0])

    def _join_manual(self):
        room = self.manual_room.get().strip()
        if not room: return
        if not room.startswith("#"): room = "#" + room
        self._open_room(room)

    def _open_room(self, room):
        self.current_room = room
        self.admin.join(room)
        self.admin.names(room)
        self._ensure_room_tab(room)
        self.nb.select(self.room_tabs[room]["tab"])

    def _ensure_room_tab(self, room):
        if room in self.room_tabs: return
        tab = ttk.Frame(self.nb)
        self.nb.add(tab, text=room)

        pan = ttk.Panedwindow(tab, orient=tk.HORIZONTAL)
        pan.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        left = ttk.Frame(pan); right = ttk.Frame(pan)
        pan.add(left, weight=3); pan.add(right, weight=1)

        # Chat display
        chat = tk.Text(left, wrap=tk.WORD,
                        bg=COLORS["bg_input"], fg=COLORS["fg_primary"],
                        insertbackground=COLORS["accent_cyan"],
                        font=("Consolas", 10), relief="flat", borderwidth=0)
        chat.pack(fill=tk.BOTH, expand=True)
        chat.tag_configure("timestamp", foreground=COLORS["fg_dim"])
        chat.tag_configure("nick_owner", foreground=COLORS["owner_gold"], font=("Consolas", 10, "bold"))
        chat.tag_configure("nick_admin", foreground=COLORS["admin_red"], font=("Consolas", 10, "bold"))
        chat.tag_configure("nick_mod", foreground=COLORS["mod_green"])
        chat.tag_configure("nick_bot", foreground=COLORS["bot_cyan"])
        chat.tag_configure("nick_user", foreground=COLORS["accent_blue"])
        chat.tag_configure("message", foreground=COLORS["fg_primary"])
        chat.configure(state=tk.DISABLED)

        entrybar = ttk.Frame(left); entrybar.pack(fill=tk.X, pady=(6, 0))
        msgvar = tk.StringVar()
        entry = ttk.Entry(entrybar, textvariable=msgvar)
        entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        entry.bind("<Return>", lambda e, r=room, m=msgvar: self._send_chat(r, m))
        ttk.Button(entrybar, text="Send", command=lambda: self._send_chat(room, msgvar)).pack(side=tk.LEFT)

        # User list
        ttk.Label(right, text="👥 Users", style="Accent.TLabel").pack(anchor="w")
        users = tk.Listbox(right, bg=COLORS["bg_input"], fg=COLORS["fg_primary"],
                           selectbackground=COLORS["bg_selected"], selectforeground=COLORS["accent_cyan"],
                           font=("Consolas", 10), relief="flat", borderwidth=0, activestyle="none")
        users.pack(fill=tk.BOTH, expand=True, pady=(4, 0))
        users.bind("<Button-3>", lambda e, r=room: self._user_menu_popup(e, users))

        # Selected user info
        info = ttk.Labelframe(right, text="Selected")
        info.pack(fill=tk.X, pady=(6, 0))
        sel_var = tk.StringVar(value="—")
        host_var = tk.StringVar(value="")
        ttk.Label(info, textvariable=sel_var, font=("Consolas", 10, "bold"),
                  foreground=COLORS["accent_cyan"]).pack(anchor="w", padx=8, pady=(6, 2))
        ttk.Label(info, textvariable=host_var, wraplength=260, style="Dim.TLabel").pack(anchor="w", padx=8, pady=(0, 6))

        def on_select(evt=None):
            try:
                idx = users.curselection()[0]
                nick = users.get(idx)
            except: return
            sel_var.set(nick)
            hm = self.admin.user_hostmask.get(nick) or self.bot.user_hostmask.get(nick) or ""
            host_var.set(f"{nick}!{hm}" if hm else "(hostmask unknown)")
        users.bind("<<ListboxSelect>>", on_select)

        self.room_tabs[room] = {"tab": tab, "chat": chat, "users": users, "sel_var": sel_var, "host_var": host_var}

    def _send_chat(self, room, msgvar):
        msg = msgvar.get().strip()
        if not msg: return
        msgvar.set("")
        self.admin.privmsg(room, msg)

    # ── User Actions ──────────────────────────────────────────
    def _user_menu_popup(self, event, listbox):
        idx = listbox.nearest(event.y)
        if idx >= 0:
            listbox.selection_clear(0, tk.END)
            listbox.selection_set(idx)
        try: self.user_menu.tk_popup(event.x_root, event.y_root)
        finally: self.user_menu.grab_release()

    def _active_room(self):
        tab_id = self.nb.select()
        if not tab_id: return self.current_room
        text = self.nb.tab(tab_id, "text")
        return text if text.startswith("#") else self.current_room

    def _selected_user(self):
        room = self._active_room()
        if not room or room not in self.room_tabs:
            return room, None
        lb = self.room_tabs[room]["users"]
        try:
            idx = lb.curselection()[0]
            return room, lb.get(idx)
        except: return room, None

    def _whois_selected(self):
        _, nick = self._selected_user()
        if nick: self.admin.whois(nick)

    def _ip_lookup_user(self):
        """Lookup IP for selected user from hostmask"""
        _, nick = self._selected_user()
        if not nick: return
        hm = self.admin.user_hostmask.get(nick) or self.bot.user_hostmask.get(nick) or ""
        host = hm.split("@", 1)[1] if "@" in hm else hm
        if host:
            self.ip_lookup_var.set(host)
            # Switch to IP Lookup tab
            for i in range(self.nb.index("end")):
                if "IP Lookup" in self.nb.tab(i, "text"):
                    self.nb.select(i)
                    break
            self._do_ip_lookup()
        else:
            messagebox.showinfo("No host", f"No hostmask available for {nick}. Try WHOIS first.")

    def _mode_selected(self, mode):
        room, nick = self._selected_user()
        if room and nick: self.admin.mode(room, f"{mode} {nick}")

    def _ban_selected(self, add):
        room, nick = self._selected_user()
        if room and nick:
            sign = "+" if add else "-"
            hm = self.admin.user_hostmask.get(nick) or ""
            host = hm.split("@", 1)[1] if "@" in hm else "*"
            self.admin.mode(room, f"{sign}b {nick}!*@{host}")

    def _kick_selected(self):
        room, nick = self._selected_user()
        if not (room and nick): return
        reason = simpledialog.askstring("Kick", "Reason:", initialvalue="Kicked", parent=self) or "Kicked"
        self.admin.kick(room, nick, reason)

    def _kickban_selected(self):
        room, nick = self._selected_user()
        if not (room and nick): return
        reason = simpledialog.askstring("Kickban", "Reason:", initialvalue="Banned", parent=self) or "Banned"
        hm = self.admin.user_hostmask.get(nick) or ""
        host = hm.split("@", 1)[1] if "@" in hm else "*"
        self.admin.mode(room, f"+b {nick}!*@{host}")
        self.admin.kick(room, nick, reason)

    def _room_mode(self, modeflag):
        room = self._active_room()
        if not room:
            messagebox.showinfo("No room", "Select a room tab first.")
            return
        self.admin.mode(room, modeflag)

    def _bot_join_all(self):
        if not self.bot.connected:
            messagebox.showinfo("Bot not connected", "Connect the bot first.")
            return
        rooms = [c[0] for c in self.admin.channels] if self.admin.channels else []
        if not rooms:
            messagebox.showinfo("No rooms", "Admin: click LIST Rooms first.")
            return
        if not messagebox.askyesno("Join all?", f"Bot will JOIN {len(rooms)} rooms. Continue?"):
            return
        for r in rooms:
            self.bot.join(r)
            time.sleep(0.12)

    # ── IP Lookup ─────────────────────────────────────────────
    def _do_ip_lookup(self):
        target = self.ip_lookup_var.get().strip()
        if not target: return

        self.ip_result.configure(state=tk.NORMAL)
        self.ip_result.delete("1.0", tk.END)
        self.ip_result.insert(tk.END, f"Looking up: {target}...\n\n")
        self.ip_result.configure(state=tk.DISABLED)

        def run():
            result = ip_lookup(target)
            self.after(0, lambda: self._show_ip_result(result))
        threading.Thread(target=run, daemon=True).start()

    def _show_ip_result(self, result):
        self.ip_result.configure(state=tk.NORMAL)
        self.ip_result.delete("1.0", tk.END)

        self.ip_result.insert(tk.END, f"═══ IP LOOKUP: {result['target']} ═══\n\n")

        if result["error"]:
            self.ip_result.insert(tk.END, f"❌ Error: {result['error']}\n")
        elif not result["ips"]:
            self.ip_result.insert(tk.END, "No results found.\n")
        else:
            for entry in result["ips"]:
                self.ip_result.insert(tk.END, f"  {entry['family']}: {entry['ip']}\n")
                self.ip_result.insert(tk.END, f"  Reverse DNS: {entry.get('rdns', '(none)')}\n\n")

        self.ip_result.insert(tk.END, "\n── Additional Info ──\n")
        try:
            import urllib.request
            url = f"http://ip-api.com/json/{result['ips'][0]['ip']}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query"
            req = urllib.request.Request(url, headers={"User-Agent": "Justachat-Admin/7.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                geo = json.loads(resp.read().decode())
                if geo.get("status") == "success":
                    self.ip_result.insert(tk.END, f"\n  🌍 Location: {geo.get('city', '?')}, {geo.get('regionName', '?')}, {geo.get('country', '?')}\n")
                    self.ip_result.insert(tk.END, f"  📍 Coordinates: {geo.get('lat', '?')}, {geo.get('lon', '?')}\n")
                    self.ip_result.insert(tk.END, f"  🕐 Timezone: {geo.get('timezone', '?')}\n")
                    self.ip_result.insert(tk.END, f"  🏢 ISP: {geo.get('isp', '?')}\n")
                    self.ip_result.insert(tk.END, f"  🏗 Org: {geo.get('org', '?')}\n")
                    self.ip_result.insert(tk.END, f"  🔗 AS: {geo.get('as', '?')}\n")
                    self.ip_result.insert(tk.END, f"  📮 Zip: {geo.get('zip', '?')}\n")
                else:
                    self.ip_result.insert(tk.END, f"  GeoIP: {geo.get('message', 'unavailable')}\n")
        except Exception as e:
            self.ip_result.insert(tk.END, f"  GeoIP lookup failed: {e}\n")

        self.ip_result.configure(state=tk.DISABLED)

    # ── Port Scanner ──────────────────────────────────────────
    def _do_port_scan(self):
        host = self.scan_host_var.get().strip()
        ports_str = self.scan_ports_var.get().strip()
        if not host: return

        # Parse ports
        if ports_str.lower() == "common":
            ports = sorted(COMMON_PORTS.keys())
        elif "-" in ports_str and "," not in ports_str:
            try:
                start, end = ports_str.split("-", 1)
                ports = list(range(int(start), int(end) + 1))
            except:
                messagebox.showerror("Invalid", "Use format: start-end (e.g. 1-1024)")
                return
        else:
            try:
                ports = [int(p.strip()) for p in ports_str.split(",") if p.strip()]
            except:
                messagebox.showerror("Invalid", "Enter comma-separated port numbers or 'common'")
                return

        self.scan_progress["maximum"] = len(ports)
        self.scan_progress["value"] = 0

        self.scan_result.configure(state=tk.NORMAL)
        self.scan_result.delete("1.0", tk.END)
        self.scan_result.insert(tk.END, f"Scanning {host} ({len(ports)} ports)...\n\n", "header")
        self.scan_result.insert(tk.END, f"{'PORT':<8} {'STATE':<12} {'SERVICE':<16} {'BANNER'}\n", "header")
        self.scan_result.insert(tk.END, "─" * 60 + "\n")
        self.scan_result.configure(state=tk.DISABLED)

        self._scan_count = 0
        self._scan_open = 0

        def on_result(r):
            self._scan_count += 1
            if r["state"] == "OPEN":
                self._scan_open += 1
            self.after(0, lambda: self._append_scan_result(r))

        def run():
            results = scan_ports(host, ports, timeout=2.0, callback=on_result)
            self.after(0, lambda: self._scan_complete(host, len(ports)))

        threading.Thread(target=run, daemon=True).start()

    def _append_scan_result(self, r):
        self.scan_progress["value"] = self._scan_count
        self.scan_result.configure(state=tk.NORMAL)

        tag = "closed"
        if r["state"] == "OPEN": tag = "open"
        elif r["state"] == "FILTERED": tag = "filtered"

        line = f"{r['port']:<8} {r['state']:<12} {r['service']:<16} {r['banner']}\n"
        # Only show open/filtered by default
        if r["state"] in ("OPEN", "FILTERED"):
            self.scan_result.insert(tk.END, line, tag)

        self.scan_result.configure(state=tk.DISABLED)

    def _scan_complete(self, host, total):
        self.scan_result.configure(state=tk.NORMAL)
        self.scan_result.insert(tk.END, "\n" + "─" * 60 + "\n")
        self.scan_result.insert(tk.END, f"✓ Scan complete: {self._scan_open} open / {total} scanned on {host}\n", "header")
        self.scan_result.configure(state=tk.DISABLED)

    # ── Event Loop ────────────────────────────────────────────
    def _poll(self):
        try:
            while True:
                label, kind, *rest = self.uiq.get_nowait()
                if kind == "status":
                    icon = "🟢" if "Registered" in rest[0] else "🔴" if "Disconnect" in rest[0] else "🟡"
                    if label == "ADMIN":
                        self.admin_status.set(f"{icon} {rest[0]}")
                    else:
                        self.bot_status.set(f"{icon} {rest[0]}")
                elif kind == "channels" and label == "ADMIN":
                    self._render_rooms(rest[0])
                elif kind == "users":
                    chan, users = rest
                    if chan in self.room_tabs:
                        lb = self.room_tabs[chan]["users"]
                        lb.delete(0, tk.END)
                        for u in users:
                            lb.insert(tk.END, u)
                elif kind == "chat":
                    chat_data = rest[0]
                    last = chat_data[-320:]
                    by_room = {}
                    for ts, chan, nick, msg in last:
                        by_room.setdefault(chan, []).append((ts, nick, msg))
                    for chan, lines in by_room.items():
                        if chan.startswith("#") and chan in self.room_tabs:
                            box = self.room_tabs[chan]["chat"]
                            box.configure(state=tk.NORMAL)
                            box.delete("1.0", tk.END)
                            for ts, nick, msg in lines[-240:]:
                                t = time.strftime("%H:%M:%S", time.localtime(ts))
                                box.insert(tk.END, f"[{t}] ", "timestamp")
                                box.insert(tk.END, f"<{nick}> ", "nick_user")
                                box.insert(tk.END, f"{msg}\n", "message")
                            box.see(tk.END)
                            box.configure(state=tk.DISABLED)
                elif kind == "events":
                    if label == "ADMIN":
                        lines = rest[0][-900:]
                        self.events_text.configure(state=tk.NORMAL)
                        self.events_text.delete("1.0", tk.END)
                        for ln in lines:
                            self.events_text.insert(tk.END, ln + "\n")
                        self.events_text.see(tk.END)
                        self.events_text.configure(state=tk.DISABLED)
                elif kind == "alert":
                    self.alerts.configure(state=tk.NORMAL)
                    ts = time.strftime("%H:%M:%S")
                    self.alerts.insert(tk.END, f"[{ts}] {rest[0]}\n")
                    self.alerts.see(tk.END)
                    self.alerts.configure(state=tk.DISABLED)
                elif kind == "whois_result":
                    nick, lines = rest
                    self._show_whois(nick, lines)
        except queue.Empty:
            pass
        self.after(100, self._poll)

    def _show_whois(self, nick, lines):
        """Show WHOIS result in a popup"""
        win = tk.Toplevel(self)
        win.title(f"WHOIS — {nick}")
        win.geometry("500x350")
        win.configure(bg=COLORS["bg_panel"])

        ttk.Label(win, text=f"🔍 WHOIS: {nick}", style="Header.TLabel").pack(anchor="w", padx=12, pady=(10, 4))

        text = tk.Text(win, wrap=tk.WORD, bg=COLORS["bg_input"], fg=COLORS["fg_primary"],
                       font=("Consolas", 10), relief="flat")
        text.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 10))

        for line in lines:
            text.insert(tk.END, line + "\n")
        if not lines:
            text.insert(tk.END, "(No WHOIS data received)\n")
        text.configure(state=tk.DISABLED)

        ttk.Button(win, text="Close", command=win.destroy).pack(pady=(0, 10))


def main():
    app = App()
    app.mainloop()

if __name__ == "__main__":
    main()
