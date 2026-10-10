import type { Lead } from "@/lib/types";

/**
 * SQLite's CURRENT_TIMESTAMP is UTC ("YYYY-MM-DD HH:MM:SS") with no zone marker.
 * `new Date()` would read that as *local* time, so we pin it to UTC first.
 */
export function parseTs(ts: string | null | undefined): Date | null {
  if (!ts) return null;
  let s = String(ts);
  if (!/(Z|[+-]\d\d:?\d\d)$/i.test(s)) s = s.replace(" ", "T") + "Z";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Oct 7, 3:42 PM" in the given IANA timezone. */
export function fmtDate(ts: string | null | undefined, tz: string): string {
  const d = parseTs(ts);
  if (!d) return "—";
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
  return `${day}, ${time}`;
}

export function fmtPhone(p: string | null | undefined): string {
  if (!p) return "—";
  const d = p.replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

/** Turns whatever a person typed into +1XXXXXXXXXX, or null if it isn't a US number. */
export function normPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d[0] === "1") return "+" + d;
  return null;
}

export function initials(name: string | null | undefined): string {
  const parts = String(name ?? "?").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
}

export function firstName(name: string | null | undefined): string {
  return String(name ?? "there").trim().split(/\s+/)[0] || "there";
}

/** The backend stores the literal "your vehicle" when none was given. Treat that as empty. */
export function vehicleOf(lead: Pick<Lead, "lead_vehicle">): string {
  const v = lead.lead_vehicle;
  return v && v !== "your vehicle" ? v : "";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  sms_fallback: "SMS Sent",
  calling: "Calling",
  booked: "Booked",
  confirmed: "Confirmed",
  completed: "Completed",
  mia: "No Response",
  dead: "Dead",
  opted_out: "Opted Out",
};
export function fmtStatus(s: string | null | undefined): string {
  return STATUS_LABELS[s ?? "pending"] ?? String(s);
}

/** Statuses the backend's /admin/update-lead-status accepts and that make sense to set by hand. */
export const SETTABLE_STATUSES = ["pending", "sms_fallback", "booked", "completed", "mia", "dead", "opted_out"] as const;

export const TERMINAL_STATUSES = ["booked", "confirmed", "dead", "mia", "opted_out"];
export const DEAD_STATUSES = ["dead", "opted_out"];
export const BOOKED_STATUSES = ["booked", "confirmed"];

// ── Calendar date helpers (all work on "YYYY-MM-DD" strings, no local-timezone surprises) ──

/** Today's date as YYYY-MM-DD in the given timezone. */
export function todayIn(tz: string, now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: tz });
}

function toUtcNoon(s: string): Date {
  return new Date(`${s}T12:00:00Z`);
}

export function addDays(s: string, n: number): string {
  const d = toUtcNoon(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `s`. */
export function mondayOf(s: string): string {
  const dow = toUtcNoon(s).getUTCDay(); // 0 = Sunday
  return addDays(s, dow === 0 ? -6 : 1 - dow);
}

export function fmtDay(s: string, opts: Intl.DateTimeFormatOptions): string {
  return toUtcNoon(s).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

/** "9AM" / "1 PM" / "12pm" → 9 / 13 / 12. Returns null if it doesn't look like a time. */
export function slotLabelToHour(label: string): number | null {
  const m = /^\s*(\d{1,2})\s*(AM|PM)\s*$/i.exec(label);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (m[2].toUpperCase() === "PM") h += 12;
  return h;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function hourLabel(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${suffix}`;
}

/** [SEND_PHOTO: key] → readable placeholder for one-line previews. */
export function previewText(body: string): string {
  return body.replace(/\[SEND_PHOTO: \w+\]/g, "[photo]").replace(/\s+/g, " ").trim() || "—";
}
