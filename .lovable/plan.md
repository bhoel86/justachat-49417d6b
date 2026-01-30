

## VPS Google Sign-In Fix

The Google Sign-In on the VPS keeps looping back to the login page because the OAuth callback tokens in the URL are not being detected and processed before the page redirects.

### What's Happening

1. You click "Sign in with Google" on justachat.net
2. Google authenticates you and redirects back to `https://justachat.net/#access_token=...&refresh_token=...`
3. **Problem**: The page loads, sees no user session, and immediately redirects to `/home` BEFORE the tokens in the URL hash can be processed
4. This clears the URL hash containing your login tokens, causing the loop

### The Fix (3 Parts)

**Part 1: Update the Supabase Client**
Add `detectSessionInUrl: true` so the client automatically parses OAuth tokens from the URL hash.

```text
File: src/integrations/supabase/client.ts

Add to auth config:
  detectSessionInUrl: true
```

**Part 2: Pause Redirects During OAuth Callback**
Modify the Home.tsx and Index.tsx pages to detect when there's an `access_token` in the URL hash and pause automatic redirects until the session is established.

```text
Files: src/pages/Home.tsx, src/pages/Index.tsx

Add check before redirecting:
  - If URL hash contains "access_token", wait for session
  - Don't redirect to /home while OAuth is processing
```

**Part 3: VPS Deployment Script**
A single script to pull the changes and rebuild.

---

### Deployment Steps

After I make these changes:

1. **Push to GitHub** - The changes will sync automatically
2. **Run this on VPS:**
```bash
cd /var/www/justachat && git pull origin main && rm -rf dist && npm run build
```

---

### Technical Details

**Supabase Client Change:**
```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // NEW: Parse OAuth tokens from URL
  }
});
```

**OAuth Callback Detection (Home.tsx/Index.tsx):**
```typescript
// Check if we're processing an OAuth callback
const hasOAuthCallback = window.location.hash.includes('access_token');

useEffect(() => {
  // Don't redirect while processing OAuth callback
  if (hasOAuthCallback) return;
  
  if (!loading && !user) {
    navigate("/home");
  }
}, [user, loading, navigate, hasOAuthCallback]);
```

