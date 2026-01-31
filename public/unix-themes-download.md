# Justachat Theme System - Complete Download Package

> Download this file and all referenced files below to work on themes locally.
> Last updated: 2026-01-31

---

## 📁 FILE LOCATIONS

### Core Theme System
```
src/contexts/ThemeContext.tsx          # Theme provider & state
src/index.css                          # CSS variables per theme
tailwind.config.ts                     # Tailwind color tokens
```

### 80s Retro Theme Components
```
src/components/theme/RetroFloatingIcons.tsx    # Floating geometric decorations
src/components/theme/RetroWatermark.tsx        # Background watermark
src/components/theme/RetroWelcomeBanner.tsx    # Welcome banner component
src/components/theme/ThemeSelector.tsx         # Admin theme picker
src/components/theme/ThemedMascot.tsx          # Theme-aware mascot
src/components/theme/LoginThemeSelector.tsx    # Login page theme preview
```

### Other Theme Components
```
src/components/theme/ValentinesFloatingHearts.tsx
src/components/theme/ValentinesGlobalEffects.tsx
src/components/theme/ValentinesMascot.tsx
src/components/theme/ValentinesWatermark.tsx
src/components/theme/ValentinesWelcomeBanner.tsx

src/components/theme/StPatricksFloatingIcons.tsx
src/components/theme/StPatricksGlobalEffects.tsx
src/components/theme/StPatricksMascot.tsx
src/components/theme/StPatricksWatermark.tsx
src/components/theme/StPatricksWelcomeBanner.tsx

src/components/theme/MatrixFloatingCode.tsx
src/components/theme/MatrixMascot.tsx
src/components/theme/MatrixWatermark.tsx
src/components/theme/MatrixWelcomeBanner.tsx

src/components/theme/OGWelcomeBanner.tsx
```

### Theme Assets (Images)
```
src/assets/retro-header-80s.png
src/assets/retro-header-80s-cutout.png
src/assets/retro-header-golden.png
src/assets/retro-header.png
src/assets/justachat-header-80s.png
src/assets/justachat-header-soft.png
src/assets/mascot-left.png
src/assets/mascot-right.png
src/assets/footer-mascots.png
src/assets/matrix/ascii-rabbit.png
src/assets/matrix/follow-rabbit.jpg
src/assets/matrix/matrix-code-bg.jpg
src/assets/matrix/system-failure.jpg
```

---

## 🎨 THEME CSS VARIABLES

Add these to `src/index.css` inside the appropriate theme class:

### .theme-retro80s (80s Retro/Memphis)
```css
.theme-retro80s {
  --background: 0 0% 5%;
  --foreground: 180 100% 50%;
  --primary: 180 100% 50%;
  --primary-foreground: 0 0% 0%;
  --secondary: 300 100% 50%;
  --secondary-foreground: 0 0% 100%;
  --accent: 60 100% 50%;
  --accent-foreground: 0 0% 0%;
  --muted: 0 0% 15%;
  --muted-foreground: 180 100% 40%;
  --card: 0 0% 8%;
  --card-foreground: 180 100% 50%;
  --border: 180 100% 50%;
  --input: 0 0% 15%;
  --ring: 300 100% 50%;
  --jac-bubble-user: 180 100% 15%;
  --jac-bubble-other: 300 100% 15%;
}
```

### .theme-jac (OG Theme)
```css
.theme-jac {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --card: 222 47% 14%;
  --card-foreground: 210 40% 98%;
  --border: 217 33% 25%;
  --input: 217 33% 17%;
  --ring: 224 76% 48%;
}
```

### .theme-valentines
```css
.theme-valentines {
  --background: 340 30% 12%;
  --foreground: 340 100% 95%;
  --primary: 340 82% 52%;
  --primary-foreground: 0 0% 100%;
  --secondary: 340 50% 25%;
  --secondary-foreground: 340 100% 95%;
  --accent: 0 70% 50%;
  --accent-foreground: 0 0% 100%;
  --muted: 340 30% 20%;
  --muted-foreground: 340 50% 70%;
  --card: 340 30% 15%;
  --card-foreground: 340 100% 95%;
  --border: 340 60% 40%;
  --input: 340 30% 20%;
  --ring: 340 82% 52%;
}
```

### .theme-stpatricks
```css
.theme-stpatricks {
  --background: 140 30% 8%;
  --foreground: 140 80% 90%;
  --primary: 140 70% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 45 80% 50%;
  --secondary-foreground: 0 0% 10%;
  --accent: 45 90% 55%;
  --accent-foreground: 0 0% 10%;
  --muted: 140 20% 15%;
  --muted-foreground: 140 40% 60%;
  --card: 140 25% 12%;
  --card-foreground: 140 80% 90%;
  --border: 140 50% 35%;
  --input: 140 20% 18%;
  --ring: 140 70% 45%;
}
```

### .theme-matrix
```css
.theme-matrix {
  --background: 120 100% 2%;
  --foreground: 120 100% 50%;
  --primary: 120 100% 40%;
  --primary-foreground: 0 0% 0%;
  --secondary: 120 50% 10%;
  --secondary-foreground: 120 100% 50%;
  --accent: 120 100% 30%;
  --accent-foreground: 0 0% 0%;
  --muted: 120 30% 8%;
  --muted-foreground: 120 60% 35%;
  --card: 120 50% 5%;
  --card-foreground: 120 100% 50%;
  --border: 120 100% 25%;
  --input: 120 30% 8%;
  --ring: 120 100% 40%;
}
```

---

## 🔧 THEME CONTEXT (ThemeContext.tsx)

Key exports:
- `ThemeName` type: `'jac' | 'retro80s' | 'valentines' | 'stpatricks' | 'matrix'`
- `useTheme()` hook returns: `{ theme, setTheme, previewTheme, themes, isLoading }`
- `ThemeProvider` component wraps the app

---

## 📝 HOW TO ADD A NEW THEME

1. Add theme name to `ThemeName` type in `ThemeContext.tsx`
2. Add theme to `THEMES` array in `ThemeContext.tsx`
3. Add CSS variables in `src/index.css` under `.theme-yourtheme`
4. Update `isValidTheme()` function
5. Update `applyThemeClass()` to include new class
6. Create theme-specific components in `src/components/theme/`
7. Add global effects component if needed (see `ValentinesGlobalEffects.tsx`)
8. Import and render in `App.tsx`

---

## 🚀 QUICK START

```bash
# Clone the repo
git clone <your-github-url>
cd <project-folder>

# Install dependencies
npm install

# Start dev server
npm run dev

# Edit theme files, changes hot-reload
# Push to GitHub to sync back to Lovable
git add .
git commit -m "Theme updates"
git push
```

---

## 📋 MEMPHIS DESIGN NOTES (80s Retro)

**Color Palette:**
- Cyan: #00FFFF (primary)
- Magenta: #FF00FF (secondary)
- Yellow: #FFFF00 (accent)
- Black: #000000 (background)
- White: #FFFFFF (text on dark)

**Visual Elements:**
- Geometric shapes: circles, triangles, zigzags
- Grid & dot patterns
- Confetti & squiggles
- Bold offset shadows (4px 4px 0 #000)
- No glows - flat colors only
- Terminal brackets for navigation: [ BUTTON ]
- VT323 monospace font

**Mascots:**
- PC/CRT monitor (cyan border)
- Floppy disk (magenta border)
- Boombox, VHS tape options

---

*Generated by Justachat Theme System*
