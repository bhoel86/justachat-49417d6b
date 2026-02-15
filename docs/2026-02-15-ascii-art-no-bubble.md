# ASCII Art — No Bubble Container Fix

**Date:** 2026-02-15  
**Issue:** ASCII art and RGB block art displayed inside chat message bubbles, breaking layout  
**Status:** ✅ Fixed

## Problem

ASCII art sent via `/ascii` or RGB-colored block art (`[rgb:R,G,B]` tags) was rendered inside the standard chat message bubble container. This caused:

1. **Clipped art** — the `max-w-[85%]` bubble constraint cut off wide ASCII pieces
2. **Ugly wrapping** — colored block art looked broken inside rounded bubble backgrounds

## Fix

Added ASCII art detection in `src/components/chat/MessageBubble.tsx` so these messages render **without the bubble container**, same as image-only messages.

### Detection Logic

```typescript
const isAsciiArt = /\[rgb:\d+,\d+,\d+\]/.test(message) || 
  (message.split('\n').length > 3 && /[█▓▒░╔╗╚╝║═╠╣╬╩╦╤╧╟╢╥╨┌┐└┘│─┼├┤┬┴]/.test(message));
```

Two conditions (either triggers no-bubble rendering):
1. Message contains RGB color codes (`[rgb:R,G,B]`) — used by the `/ascii` image-to-IRC converter
2. Message has 4+ lines AND contains dense box-drawing/block characters — catches plain ASCII art

### Render Changes

- ASCII art gets `max-w-full overflow-x-auto` instead of `max-w-[85%]` so wide art scrolls horizontally
- Username + timestamp header still displays above the art
- Delete button still available on hover

## Files Changed

- `src/components/chat/MessageBubble.tsx` — Added `isAsciiArt` detection, combined with `isImageOnly` render path

## VPS Rebuild

```bash
cd /var/www/justachat && git pull && rm -rf dist node_modules/.vite && npm run build
```
