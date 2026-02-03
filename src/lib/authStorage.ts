/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

/**
 * Force-clear the Supabase auth token from browser storage.
 *
 * Why: In some environments, calling auth.signOut() can return 403 session_not_found,
 * and the client may not clear local storage reliably, causing immediate re-login.
 */
export function clearAuthStorage() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

  const storages: Array<Storage | undefined> = [
    typeof window !== "undefined" ? window.localStorage : undefined,
    typeof window !== "undefined" ? window.sessionStorage : undefined,
  ];

  for (const storage of storages) {
    if (!storage) continue;

    // Remove known key first
    if (projectId) {
      storage.removeItem(`sb-${projectId}-auth-token`);
    }

    // Then remove any auth token keys just in case the ref differs
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k) continue;
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) keysToRemove.push(k);
    }
    for (const k of keysToRemove) storage.removeItem(k);
  }
}
