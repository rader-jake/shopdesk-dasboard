import { useMemo, useSyncExternalStore } from "react";

/**
 * Client-side session, same idea as the old dashboards: the signed-in shop's id is kept
 * in sessionStorage (cleared when the tab closes). Credentials are looked up from the
 * shop config by id, never stored.
 */
const KEY = "shopdesk_session";
const EVENT = "shopdesk-session-change";

export function signIn(shopId: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ shopId }));
  } catch {
    /* storage blocked — user will just land back on the login page */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function signOut(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * The signed-in shop id.
 *  - `undefined` → not known yet (server render / first hydration pass)
 *  - `null`      → nobody is signed in
 *  - `string`    → the signed-in shop's id
 */
export function useSessionShopId(): string | null | undefined {
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, getSnapshot, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as { shopId?: unknown };
      return typeof parsed.shopId === "string" ? parsed.shopId : null;
    } catch {
      return null;
    }
  }, [raw]);
}
