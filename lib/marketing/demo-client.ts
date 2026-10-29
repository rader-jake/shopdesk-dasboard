import type { DemoPayload } from "@/lib/marketing/types";

export type DemoResult = { ok: true; duplicate: boolean } | { ok: false; error: string };

/** Sends a demo request through our own /api/demo route (which forwards to the ShopDesk backend). */
export async function requestDemo(payload: DemoPayload): Promise<DemoResult> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 15_000);
  try {
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: timeout.signal,
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; duplicate?: boolean } | null;
    if (res.ok && data?.ok) return { ok: true, duplicate: Boolean(data.duplicate) };
    return { ok: false, error: data?.error ?? "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "Couldn't reach us — check your connection and try again." };
  } finally {
    clearTimeout(timer);
  }
}
