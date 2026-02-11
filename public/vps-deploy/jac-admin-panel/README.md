# Justachat™ IRC Admin Console v7

Modern dark-themed IRC admin panel for managing the JustAChat network.

## Features

- **Dual Connection** — Admin + Bot with independent sessions
- **Room Monitoring** — Real-time chat with colored messages
- **User Management** — WHOIS, OP, VOICE, BAN, KICK, KICKBAN via right-click menu
- **IP Lookup** — DNS resolution, reverse DNS, GeoIP (city, ISP, coordinates)
- **Port Scanner** — Common ports, custom ranges, concurrent scanning with banner grabbing
- **Room Controls** — Moderated (+m), Invite-only (+i) toggles
- **Flood Detection** — Rate limiting alerts for join bursts and message floods
- **Dark Theme** — Modern 2026 UI matching JustAChat branding

## Requirements

- Python 3.8+ (install from [python.org](https://python.org), check "Add to PATH")
- No additional packages required (uses only stdlib)

## Run

**Windows:** Double-click `Run.bat`  
**PowerShell:** `.\Run.ps1`  
**Terminal:** `python main.py`

## Usage

1. Enter your admin email & password, click **▶ Connect**
2. Click **📋 LIST Rooms** to see all channels
3. Click a room to join and monitor
4. Right-click users for management actions
5. Use **🌐 IP Lookup** tab for DNS/GeoIP queries
6. Use **🔌 Port Scanner** tab to check open ports

## Changes from v6

- Complete UI redesign with dark theme
- Added IP Lookup tool with GeoIP integration
- Added Port Scanner with concurrent scanning
- Added KICKBAN action
- Added WHOIS popup window
- IRC color codes stripped from display
- Enter key sends messages
- Status indicators with emoji icons
- Banner grabbing on open ports
- User hostmask-based banning (nick!*@host)
