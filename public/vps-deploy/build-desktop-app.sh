#!/bin/bash
# =============================================================================
# Justachat Desktop App Builder
# Run this on the VPS to build Windows/Linux desktop apps
# =============================================================================

set -e

PROJECT_DIR="/var/www/justachat"
OUTPUT_DIR="/var/www/justachat/dist/downloads"

echo "========================================"
echo "  Justachat Desktop App Builder"
echo "========================================"
echo ""

cd "$PROJECT_DIR"

# Check if electron and electron-builder are installed
if ! npm list electron > /dev/null 2>&1; then
    echo "Installing Electron dependencies..."
    npm install electron electron-builder --save-dev
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo ""
echo "Building desktop apps..."
echo ""

# Build for Windows (works on Linux via Wine or without code signing)
echo "→ Building Windows installer..."
npx electron-builder --win --x64 --config electron-builder.json

# Build for Linux
echo "→ Building Linux AppImage..."
npx electron-builder --linux --x64 --config electron-builder.json

# Move built files to public downloads folder
echo ""
echo "Moving files to downloads folder..."
cp -f electron-dist/*.exe "$OUTPUT_DIR/" 2>/dev/null || echo "  (no .exe files)"
cp -f electron-dist/*.AppImage "$OUTPUT_DIR/" 2>/dev/null || echo "  (no .AppImage files)"
cp -f electron-dist/*.deb "$OUTPUT_DIR/" 2>/dev/null || echo "  (no .deb files)"

# Set permissions
chmod 644 "$OUTPUT_DIR"/*.exe 2>/dev/null || true
chmod 755 "$OUTPUT_DIR"/*.AppImage 2>/dev/null || true
chmod 644 "$OUTPUT_DIR"/*.deb 2>/dev/null || true

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Files available at:"
ls -la "$OUTPUT_DIR"
echo ""
echo "Download URLs:"
echo "  Windows: https://justachat.net/downloads/Justachat-Setup-1.0.0.exe"
echo "  Linux:   https://justachat.net/downloads/Justachat-1.0.0-linux.AppImage"
echo ""
