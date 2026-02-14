/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 * 
 * Direct REST helpers for Supabase — bypasses the JS client which can hang
 * in certain environments. All admin pages should use these instead of
 * supabase.from().
 */

import { supabase } from '@/integrations/supabase/client';

const getConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL as string,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
});

/** Cached access token — updated by auth state listener, never blocks on getSession() */
let _cachedAccessToken: string | null = null;

// Listen for auth changes to keep token cached (non-blocking)
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedAccessToken = session?.access_token || null;
});

// Also try to seed the cache once on load (fire-and-forget, never awaited in hot path)
supabase.auth.getSession().then(({ data }) => {
  _cachedAccessToken = data?.session?.access_token || null;
}).catch(() => {});

/** Attempt a single token refresh — returns fresh token or null */
async function tryRefreshToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    _cachedAccessToken = data.session.access_token;
    return data.session.access_token;
  } catch {
    return null;
  }
}

export const restHeaders = (accessToken?: string | null) => {
  const { key } = getConfig();
  return {
    'apikey': key,
    'Authorization': `Bearer ${accessToken || key}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
};

/** GET rows from a table via REST. Returns parsed JSON array. 
 *  If no accessToken is provided, automatically fetches the current session token. */
export async function restSelect<T = any>(
  table: string,
  query: string,
  accessToken?: string | null,
  timeoutMs = 8000,
): Promise<T[]> {
  const { url } = getConfig();
  // Use cached token if none provided (never blocks on getSession)
  const token = accessToken ?? _cachedAccessToken;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: restHeaders(token),
      signal: controller.signal,
    });

    // Auto-retry on 401 with refreshed token
    if (res.status === 401 && !accessToken) {
      const freshToken = await tryRefreshToken();
      if (freshToken) {
        res = await fetch(`${url}/rest/v1/${table}?${query}`, {
          headers: restHeaders(freshToken),
          signal: controller.signal,
        });
      }
    }
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`REST SELECT ${table} failed (${res.status}): ${text}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 200)}`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(`REST SELECT ${table} timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/** DELETE rows from a table via REST. */
export async function restDelete(
  table: string,
  filter: string,
  accessToken?: string | null,
): Promise<boolean> {
  const { url } = getConfig();
  const token = accessToken ?? _cachedAccessToken;
  let res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: restHeaders(token),
  });
  if (res.status === 401 && !accessToken) {
    const freshToken = await tryRefreshToken();
    if (freshToken) {
      res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
        method: 'DELETE',
        headers: restHeaders(freshToken),
      });
    }
  }
  return res.ok;
}

/** INSERT rows into a table via REST. Returns inserted rows. */
export async function restInsert<T = any>(
  table: string,
  body: Record<string, any>,
  accessToken?: string | null,
): Promise<T[]> {
  const { url } = getConfig();
  const token = accessToken ?? _cachedAccessToken;
  let res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...restHeaders(token),
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 && !accessToken) {
    const freshToken = await tryRefreshToken();
    if (freshToken) {
      res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...restHeaders(freshToken),
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(body),
      });
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST INSERT ${table} failed (${res.status}): ${text}`);
  }

  return res.json();
}

/** PATCH (update) rows in a table via REST. */
export async function restUpdate(
  table: string,
  filter: string,
  body: Record<string, any>,
  accessToken?: string | null,
): Promise<boolean> {
  const { url } = getConfig();
  const token = accessToken ?? _cachedAccessToken;
  let res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      ...restHeaders(token),
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401 && !accessToken) {
    const freshToken = await tryRefreshToken();
    if (freshToken) {
      res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
        method: 'PATCH',
        headers: {
          ...restHeaders(freshToken),
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(body),
      });
    }
  }
  return res.ok;
}

/** Call an edge function via REST. */
export async function restInvokeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>,
  accessToken?: string | null,
  timeoutMs = 15000,
): Promise<T> {
  const { url } = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        ...restHeaders(accessToken),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Edge function ${functionName} failed (${res.status}): ${text}`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(`Edge function ${functionName} timed out`);
    }
    throw err;
  }
}
