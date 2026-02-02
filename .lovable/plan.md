
# Match Lobby Content to 80s Retro Header & Footer

## Current State
The lobby header and footer already have proper 80s Retro Memphis styling with:
- Yellow backgrounds (`hsl(50 100% 70%)`)
- Bold 3px black borders with offset shadows
- Press Start 2P and VT323 fonts
- Pink, cyan, yellow color palette

However, the **middle content area** (chat rooms sidebar, lobby mirror room, main container) still uses default card styling and doesn't match.

## What Needs to Match

### 1. Chat Rooms Sidebar Container (Left Panel)
**Current**: Purple card with basic border
**Target**: Yellow background matching header, with Memphis patterns and bold borders

### 2. "Chat Rooms" Heading
**Current**: Basic styling with emoji
**Target**: Press Start 2P font, pink with cyan shadow, proper retro styling

### 3. Room Cards in Grid
**Current**: Cyan with basic styling
**Target**: More vibrant Memphis colors, bolder shadows, better hover effects

### 4. Voice/Video/Games/Dating Cards
**Current**: Basic retro styling
**Target**: Enhanced with Memphis patterns, proper icon containers

### 5. Lobby Mirror Room Container
**Current**: Default card styling
**Target**: Yellow background with Memphis pattern overlay, bold black borders

### 6. Main Content Background
**Current**: Memphis radial gradients (partial)
**Target**: Enhanced to better match header/footer yellow palette

## Technical Changes

### File: `src/index.css`

Add targeted CSS rules in the retro80s section to style lobby-specific elements:

```css
/* ============================================
   RETRO 80s LOBBY/HOME PAGE STYLING
   ============================================ */

/* Lobby main container background */
.theme-retro80s main.container {
  background: transparent !important;
}

/* Chat rooms sidebar container */
.theme-retro80s .bg-secondary {
  background: hsl(50 100% 72%) !important;
}

/* Lobby panels - yellow Memphis style */
.theme-retro80s .bg-card\/50 {
  background: hsl(50 100% 70%) !important;
  border: 3px solid hsl(0 0% 0%) !important;
  box-shadow: 5px 5px 0px hsl(0 0% 0%) !important;
}

/* Room card buttons in lobby */
.theme-retro80s button.bg-card {
  background: hsl(185 90% 55%) !important;
}

/* Lobby mirror room container */
.theme-retro80s .rounded-xl.border {
  border-radius: 0 !important;
  border: 3px solid hsl(0 0% 0%) !important;
  box-shadow: 5px 5px 0px hsl(0 0% 0%) !important;
}

/* Welcome back text */
.theme-retro80s header .text-muted-foreground {
  font-family: 'VT323', monospace !important;
  color: hsl(330 90% 45%) !important;
}

/* Friends tray retro styling */
.theme-retro80s .fixed.bottom-0 button,
.theme-retro80s [class*="FriendsTray"] {
  border-radius: 0 !important;
  border: 2px solid hsl(0 0% 0%) !important;
  background: hsl(50 100% 70%) !important;
  box-shadow: 3px 3px 0px hsl(0 0% 0%) !important;
}
```

### File: `src/pages/Home.tsx`

Update inline conditional classes for lobby elements to enhance retro styling:

1. **Chat rooms container** (line ~604-608): Change from purple secondary to yellow
2. **Room heading** (line ~610): Enhance with text shadow
3. **Voice/Video/Games links** (lines ~716-823): Add Memphis pattern backgrounds
4. **Main content wrapper**: Ensure proper Memphis background

## Changes Summary

| Element | Before | After |
|---------|--------|-------|
| Rooms sidebar | Purple bg-secondary | Yellow Memphis container |
| Section headings | Basic uppercase | Press Start 2P + cyan shadow |
| Room cards | Basic cyan | Vibrant with chunky shadows |
| Feature links | Basic border | Yellow bg with Memphis dots |
| Lobby mirror | Default card | Yellow Memphis panel |
| Text elements | Default | VT323 with themed colors |

## Implementation Approach

1. Add new CSS rules to `src/index.css` targeting lobby-specific elements within `.theme-retro80s`
2. Update `src/pages/Home.tsx` to use yellow background for the rooms container instead of purple when retro theme is active
3. Enhance section headings with text shadows
4. Style the feature link cards (Voice, Cams, Games, Dating) with Memphis backgrounds

## Scope
- Only affects `.theme-retro80s` class
- Zero impact on other themes
- Focused on lobby/home page elements
