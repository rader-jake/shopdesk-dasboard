import { NextResponse } from "next/server";
import { clientIp, rateLimited } from "@/lib/marketing/rate-limit";

// The backend lead webhook. Called from here (not the browser) so it works from any origin —
// production, Vercel previews, localhost — without touching the backend's CORS allowlist.
const DEMO_API_URL =
  process.env.DEMO_API_URL ?? "https://purevision-backend-production.up.railway.app/webhook/sms-only/shopdesk-demo";

const US_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

/** Trim, drop control characters/newlines, cap the length. */
function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  // Honeypot: real visitors never see this field. Pretend it worked so bots don't adapt.
  if (clean(body.company_website, 200)) return NextResponse.json({ ok: true });

  const first_name = clean(body.first_name, 80);
  const business_name = clean(body.business_name, 80);
  const industry = clean(body.industry, 300);
  const phone = clean(body.phone, 16);

  if (!first_name || !business_name || !industry) {
    return NextResponse.json({ ok: false, error: "Please fill in every field." }, { status: 400 });
  }
  if (!US_E164.test(phone)) {
    return NextResponse.json({ ok: false, error: "Enter a valid US mobile number." }, { status: 400 });
  }

  // Each submission texts a real phone: cap per visitor and per number.
  if (rateLimited(`ip:${clientIp(req)}`, 6, 10 * 60_000) || rateLimited(`phone:${phone}`, 2, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Too many tries — give it a few minutes and try again." },
      { status: 429 },
    );
  }

  try {
    const res = await fetch(DEMO_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name, phone, business_name, industry }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    const data = (await res.json().catch(() => ({}))) as { duplicate?: boolean };
    return NextResponse.json({ ok: true, duplicate: Boolean(data.duplicate) });
  } catch (err) {
    console.error("[api/demo] backend request failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "We couldn't send your demo just now. Please try again." },
      { status: 502 },
    );
  }
}
