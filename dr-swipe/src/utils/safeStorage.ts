/**
 * localStorage wrapper that never throws.
 *
 * Direct localStorage access crashes the app on mount in contexts where
 * storage is blocked (Safari private browsing inside webviews, cookies
 * disabled, quota exceeded). Falls back to an in-memory map so the session
 * still works — persistence is simply lost for that session.
 */
const memory = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memory.delete(key);
    }
  },
};
