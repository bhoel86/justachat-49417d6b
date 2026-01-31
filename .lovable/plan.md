

# Revert 80s Changes + Add Theme Selector to Login Page

## Part 1: Revert Recent 80s Theme Changes

I'll undo the changes I made to the 80s retro banner on the login page:

**Files to modify:**

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Restore the simple 80s banner (remove neon frame, corner accents, tagline) |
| `src/index.css` | Remove the `@keyframes retroGlow` animation I added |

**Restoring to:**
```jsx
{isRetro && (
  <div className="absolute top-1 left-0 right-0 z-20 flex justify-center px-4">
    <div className="border-4 border-cyan-400 rounded-lg shadow-[...] bg-black/50 p-2">
      <img src={headerImg} alt="..." className="..." />
    </div>
  </div>
)}
```

---

## Part 2: Create Login Theme Selector

A new component that:
- Works for anyone (no owner check)
- Shows a themed icon button in the top-right corner
- Applies theme locally only (no database save attempts)

**New file:** `src/components/theme/LoginThemeSelector.tsx`

### Theme-Specific Icons

| Theme | Icon | Styling |
|-------|------|---------|
| OG (jac) | `Palette` | Standard purple/blue |
| 80s Retro | `Monitor` | Neon cyan with magenta glow |
| Valentine's | `Heart` | Pink with soft pulse |
| St. Patrick's | `Clover` | Emerald green with gold accent |
| Matrix | `Terminal` | Green with code glow |

### How It Works

1. Uses `useTheme()` to get current theme and themes list
2. Renders a dropdown with all themes
3. On selection, calls a new `previewTheme()` function that applies the theme locally without saving to database
4. Stores preview in localStorage so it persists on refresh

---

## Part 3: Update ThemeContext

Add a `previewTheme()` function to the context:

```typescript
previewTheme: (theme: ThemeName) => void;
```

This function:
- Applies the theme class to the document
- Saves to localStorage
- Does NOT try to save to database (avoiding RLS errors for non-owners)

---

## Part 4: Add to Login Page

Position the `LoginThemeSelector` in the top-right corner of `Auth.tsx`:

```jsx
<div className="absolute top-4 right-4 z-50">
  <LoginThemeSelector />
</div>
```

---

## Files to Modify

1. `src/pages/Auth.tsx` - Revert banner + add LoginThemeSelector
2. `src/index.css` - Remove retroGlow keyframes
3. `src/contexts/ThemeContext.tsx` - Add previewTheme function
4. **New:** `src/components/theme/LoginThemeSelector.tsx` - Theme selector for login page

