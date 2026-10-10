import { BOOKED_STATUSES, pad2 } from "@/lib/format";
import type { CalendarEvent, Lead } from "@/lib/types";

/** "Tint Appointment — Alex Kim" → "Alex Kim". Falls back to splitting on " — ". */
export function customerName(summary: string, prefixes: string[]): string {
  for (const p of prefixes) if (summary.startsWith(p)) return summary.slice(p.length).trim();
  const i = summary.indexOf(" — ");
  return (i >= 0 ? summary.slice(i + 3) : summary).trim();
}

/**
 * Calendar events carry only a title and time, so to show phone/vehicle/etc. we match
 * the event to a lead: same booking slot + same name, else the only lead booked in
 * that slot, else a booked lead with that name.
 */
export function findLeadForEvent(event: CalendarEvent, leads: Lead[], prefixes: string[]): Lead | undefined {
  const name = customerName(event.summary, prefixes).toLowerCase();
  const slotKey = `${event.date} ${pad2(event.hour)}`;
  const inSlot = leads.filter((l) => l.booked_at?.startsWith(slotKey));
  const nameMatch = (l: Lead) => (l.lead_name ?? "").trim().toLowerCase() === name;
  return (
    inSlot.find(nameMatch) ??
    (inSlot.length === 1 ? inSlot[0] : undefined) ??
    leads.find((l) => BOOKED_STATUSES.includes(l.call_status ?? "") && nameMatch(l))
  );
}
