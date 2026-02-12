/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 * 
 * Direct REST helpers for Supabase — bypasses the JS client which can hang
 * in certain environments. All admin pages should use these instead of
 * supabase.from().
 */

const getConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL as string,
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
});

export const restHeaders = (accessToken?: string | null) => {
  const { key } = getConfig();
  return {
    'apikey': key,
    'Authorization': `Bearer ${accessToken || key}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
};

/** GET rows from a table via REST. Returns parsed JSON array. */
export async function restSelect<T = any>(
  table: string,
  query: string,
  accessToken?: string | null,
  timeoutMs = 8000,
): Promise<T[]> {
  const { url } = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: restHeaders(accessToken),
      signal: controller.signal,
    });
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
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: restHeaders(accessToken),
  });
  return res.ok;
}

/** INSERT rows into a table via REST. Returns inserted rows. */
export async function restInsert<T = any>(
  table: string,
  body: Record<string, any>,
  accessToken?: string | null,
): Promise<T[]> {
  const { url } = getConfig();
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...restHeaders(accessToken),
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });

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
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: {
      ...restHeaders(accessToken),
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
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
