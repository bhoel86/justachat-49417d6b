# JAC Chat Client - Quassel Fork

A custom IRC client based on [Quassel IRC](https://github.com/quassel/quassel) with Justachat™ branding, role-based nicklist coloring, and pre-configured server settings.

## Overview

Quassel is a modern, cross-platform IRC client written in C++/Qt with a unique client-server architecture. Our fork will include:

- **Custom Branding**: JAC Chat logos, splash screen, about dialog
- **Role-Based Nicklist Colors**: Owners (Yellow), Admins (Red), Moderators (Green), Bots (Cyan)
- **Pre-configured Server**: Auto-connects to 157.245.174.197:6697 (SSL)
- **Dark Theme**: Matches justachat.net web UI (#0d1117 background)
- **Custom Stylesheet**: JAC 2026 theme with room-specific colors

## Repository Setup

### 1. Fork the Repository

```bash
# Clone the official Quassel repository
git clone https://github.com/quassel/quassel.git jac-chat-client
cd jac-chat-client

# Create a new branch for JAC customizations
git checkout -b jac-main

# Set up remote for our fork
git remote add jac https://github.com/justachat/jac-chat-client.git
```

### 2. Build Requirements

**Linux (Debian/Ubuntu)**:
```bash
sudo apt install cmake qt5-default libqt5webkit5-dev \
  libqca-qt5-2-dev libqca-qt5-2-plugins \
  libdbusmenu-qt5-dev libkf5coreaddons-dev
```

**macOS**:
```bash
brew install cmake qt5 qca
```

**Windows**:
- Install Qt 5.15+ from https://www.qt.io/download
- Install CMake from https://cmake.org/download/
- Use Visual Studio 2019+ or MinGW

### 3. Build Commands

```bash
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release \
      -DWANT_CORE=ON \
      -DWANT_QTCLIENT=ON \
      -DWANT_MONO=ON \
      ..
make -j$(nproc)
```

## Customization Points

### File: `src/qtui/nicklistwidget.cpp`

Add role-based coloring to the nicklist:

```cpp
// Add to NickListWidget::paintEvent or delegate
QColor getNickColor(const IrcUser* user) {
    QString prefix = user->prefix();
    
    if (prefix.contains('~')) {
        return QColor("#FFD700");  // Owner - Yellow/Gold
    } else if (prefix.contains('&')) {
        return QColor("#FF4444");  // Admin - Red
    } else if (prefix.contains('@')) {
        return QColor("#44FF44");  // Moderator/Op - Green
    } else if (prefix.contains('+')) {
        return QColor("#00CED1");  // Bot/Voice - Cyan
    }
    return QColor("#CCCCCC");      // Regular user - Gray
}
```

### File: `src/qtui/settingspages/networkssettingspage.cpp`

Pre-configure JAC server:

```cpp
// Default network configuration
NetworkInfo defaultNetwork;
defaultNetwork.networkName = "JAC Chat";
defaultNetwork.serverList.append({
    "157.245.174.197",  // Server
    6697,               // Port
    QString(),          // Password (user enters at runtime)
    true                // SSL enabled
});
defaultNetwork.autoReconnect = true;
defaultNetwork.autoConnect = true;
```

### File: `data/stylesheets/jac-dark.qss`

Create JAC dark theme stylesheet:

```css
/* JAC Chat 2026 Dark Theme */

/* Main window background */
QMainWindow, QWidget {
    background-color: #0d1117;
    color: #c9d1d9;
}

/* Chat buffer */
ChatView {
    background-color: #0d1117;
    font-family: "JetBrains Mono", "Consolas", monospace;
    font-size: 13px;
}

/* Nicklist panel */
NickView {
    background-color: #161b22;
    border-left: 1px solid #30363d;
}

NickView::item {
    padding: 4px 8px;
    border-radius: 4px;
}

NickView::item:hover {
    background-color: #21262d;
}

/* Owner (~) - Yellow/Gold */
NickView::item[prefix="~"] {
    color: #FFD700;
    font-weight: bold;
}

/* Admin (&) - Red */
NickView::item[prefix="&"] {
    color: #FF4444;
    font-weight: bold;
}

/* Operator (@) - Green */
NickView::item[prefix="@"] {
    color: #44FF44;
}

/* Voice (+) - Cyan (Bots) */
NickView::item[prefix="+"] {
    color: #00CED1;
}

/* Channel list */
BufferView {
    background-color: #161b22;
    border-right: 1px solid #30363d;
}

BufferView::item {
    padding: 6px 12px;
}

BufferView::item:selected {
    background-color: #238636;
    color: white;
}

/* Input line */
MultiLineEdit {
    background-color: #21262d;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 8px 12px;
    color: #c9d1d9;
}

MultiLineEdit:focus {
    border-color: #58a6ff;
}

/* Topic bar */
TopicWidget {
    background-color: #161b22;
    border-bottom: 1px solid #30363d;
    padding: 8px;
}

/* Scrollbars */
QScrollBar:vertical {
    background-color: #0d1117;
    width: 10px;
}

QScrollBar::handle:vertical {
    background-color: #30363d;
    border-radius: 5px;
    min-height: 30px;
}

QScrollBar::handle:vertical:hover {
    background-color: #484f58;
}

/* Message colors */
Palette {
    marker-line: #58a6ff;
    
    /* Sender colors by role */
    sender-color-owner: #FFD700;
    sender-color-admin: #FF4444;
    sender-color-op: #44FF44;
    sender-color-voice: #00CED1;
    sender-color-self: #58a6ff;
}

ChatLine[sender-prefix="~"] {
    foreground: #FFD700;
}

ChatLine[sender-prefix="&"] {
    foreground: #FF4444;
}

ChatLine[sender-prefix="@"] {
    foreground: #44FF44;
}

ChatLine[sender-prefix="+"] {
    foreground: #00CED1;
}

/* Timestamps */
ChatLine::timestamp {
    foreground: #6e7681;
    font-size: 11px;
}

/* System messages */
ChatLine::message[type="action"] {
    foreground: #a371f7;
    font-style: italic;
}

ChatLine::message[type="notice"] {
    foreground: #8b949e;
}

ChatLine::message[type="error"] {
    foreground: #f85149;
}

/* Highlights */
ChatLine[highlight="true"] {
    background-color: #388bfd26;
}

/* URLs */
ChatLine::url {
    foreground: #58a6ff;
    text-decoration: underline;
}
```

### File: `data/icons/` - Branding Assets

Replace these icon files with JAC branding:

```
icons/
├── hicolor/
│   ├── 16x16/apps/quassel.png    → jac-chat.png
│   ├── 22x22/apps/quassel.png    → jac-chat.png
│   ├── 32x32/apps/quassel.png    → jac-chat.png
│   ├── 48x48/apps/quassel.png    → jac-chat.png
│   ├── 64x64/apps/quassel.png    → jac-chat.png
│   ├── 128x128/apps/quassel.png  → jac-chat.png
│   └── scalable/apps/quassel.svg → jac-chat.svg
└── oxygen/
    └── ... (similar structure)
```

### File: `src/common/quassel.cpp`

Update branding strings:

```cpp
// Application info
const QString Quassel::buildInfo = "JAC Chat Client";
const QString Quassel::organizationName = "Justachat";
const QString Quassel::organizationDomain = "justachat.net";
const QString Quassel::applicationName = "JAC Chat";
```

### File: `src/qtui/aboutdlg.cpp`

Custom About dialog:

```cpp
void AboutDlg::setupUi() {
    setWindowTitle(tr("About JAC Chat"));
    
    QString aboutText = QString(
        "<h2>JAC Chat Client</h2>"
        "<p>Version %1</p>"
        "<p>Based on <a href='https://quassel-irc.org'>Quassel IRC</a></p>"
        "<p>A custom IRC client for <a href='https://justachat.net'>Justachat™</a></p>"
        "<hr>"
        "<p><b>Server:</b> 157.245.174.197</p>"
        "<p><b>Ports:</b> 6667 (plain) / 6697 (SSL)</p>"
        "<hr>"
        "<p>© 2026 Justachat™. All rights reserved.</p>"
    ).arg(Quassel::buildInfo);
    
    ui.aboutLabel->setText(aboutText);
}
```

## Pre-configured Installer

### Windows Installer (NSIS)

Create `installer/jac-chat.nsi`:

```nsi
!include "MUI2.nsh"

Name "JAC Chat Client"
OutFile "JAC-Chat-Setup.exe"
InstallDir "$PROGRAMFILES\JAC Chat"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install"
    SetOutPath "$INSTDIR"
    File /r "build\*.*"
    
    ; Copy default config with JAC server
    SetOutPath "$APPDATA\JAC Chat"
    File "data\default-config.ini"
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\JAC Chat"
    CreateShortcut "$SMPROGRAMS\JAC Chat\JAC Chat.lnk" "$INSTDIR\jac-chat.exe"
    CreateShortcut "$DESKTOP\JAC Chat.lnk" "$INSTDIR\jac-chat.exe"
SectionEnd
```

### macOS DMG

```bash
# Create app bundle
mkdir -p JAC-Chat.app/Contents/{MacOS,Resources}
cp build/jac-chat JAC-Chat.app/Contents/MacOS/
cp data/icons/jac-chat.icns JAC-Chat.app/Contents/Resources/

# Create DMG
hdiutil create -volname "JAC Chat" -srcfolder JAC-Chat.app \
  -ov -format UDZO JAC-Chat.dmg
```

### Linux AppImage

```bash
# Using linuxdeploy
linuxdeploy --appdir AppDir \
  -e build/jac-chat \
  -d data/jac-chat.desktop \
  -i data/icons/jac-chat.png \
  --output appimage
```

## Auto-Update System

Add update checking in `src/qtui/mainwin.cpp`:

```cpp
void MainWin::checkForUpdates() {
    QNetworkRequest request(QUrl("https://justachat.net/api/client-version"));
    QNetworkReply* reply = networkManager->get(request);
    
    connect(reply, &QNetworkReply::finished, this, [this, reply]() {
        QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
        QString latestVersion = doc["version"].toString();
        QString downloadUrl = doc["download_url"].toString();
        
        if (latestVersion > Quassel::buildInfo) {
            QMessageBox::information(this, tr("Update Available"),
                tr("A new version (%1) is available!\n\nDownload from: %2")
                    .arg(latestVersion, downloadUrl));
        }
        reply->deleteLater();
    });
}
```

## Distribution

### GitHub Releases

Create releases at `github.com/justachat/jac-chat-client/releases`:

- `JAC-Chat-2026.1.0-Windows-x64.exe`
- `JAC-Chat-2026.1.0-macOS.dmg`
- `JAC-Chat-2026.1.0-Linux-x86_64.AppImage`
- `JAC-Chat-2026.1.0-Source.tar.gz`

### Download Page Integration

Add to justachat.net:

```typescript
// In DownloadProxy.tsx or new ClientDownload.tsx
const clientDownloads = {
  windows: 'https://github.com/justachat/jac-chat-client/releases/latest/download/JAC-Chat-Windows-x64.exe',
  macos: 'https://github.com/justachat/jac-chat-client/releases/latest/download/JAC-Chat-macOS.dmg',
  linux: 'https://github.com/justachat/jac-chat-client/releases/latest/download/JAC-Chat-Linux-x86_64.AppImage',
};
```

## Summary

This fork provides:

1. ✅ **Role-colored nicklist** - Owners/Admins/Mods/Bots with distinct colors
2. ✅ **Pre-configured server** - Auto-connects to JAC IRC gateway
3. ✅ **Dark theme** - Matches web UI aesthetic
4. ✅ **Custom branding** - JAC Chat logos and about dialog
5. ✅ **Cross-platform** - Windows, macOS, Linux installers
6. ✅ **Auto-updates** - Check for new versions on startup

## Next Steps

1. Fork https://github.com/quassel/quassel to https://github.com/justachat/jac-chat-client
2. Apply the customizations outlined above
3. Set up CI/CD for automated builds (GitHub Actions)
4. Create installer packages for each platform
5. Add download links to justachat.net/downloads
