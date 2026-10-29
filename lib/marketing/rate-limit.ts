/**
 * Best-effort in-memory limiter. On Vercel each serverless instance has its own memory, so this only
 * blunts casual abuse — real protection against someone texting strangers belongs on the backend.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

/** True when `key` has used up `limit` hits in the current `windowMs`. Counts this call. */
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    hits.forEach((v, k) => {
      if (v.resetAt <= now) hits.delete(k);
    });
  }
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
