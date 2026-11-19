import { BOOKED_STATUSES, DEAD_STATUSES, normPhone, parseTs } from "@/lib/format";
import type { CallLog, Lead, Message } from "@/lib/types";

/**
 * Sorts a shop's leads for the power dialer so the ripest come first and nobody gets pestered.
 *
 * Ready to call, in this order:
 *   1. asked for a callback, or called us and we missed it
 *   2. replied, then went quiet      (or marked MIA), most recent reply first
 *   3. never replied, newest first
 * Held back (shown, but unchecked): texting us right now, called in the last day, tried several times
 * with no answer, already talked to, or gone stale (nothing said either way for longer than the chosen
 * window). Dead / opted-out / booked leads never appear.
 */
export type QueueGroup = "ready" | "texting" | "recent" | "tried" | "talked" | "stale";

export type ContactKind = "they texted" | "we texted" | "they called" | "we called" | "we spoke" | "came in";

export interface Candidate {
  lead: Lead;
  group: QueueGroup;
  /** The most recent time either side communicated (text, call, or the lead coming in), and how. */
  lastContact: { at: number; kind: ContactKind };
  /** Why it landed here, e.g. "Replied · quiet 3d". */
  reason: string;
  /** True for the leads most worth a call (callbacks, missed inbound calls, replied-then-quiet). */
  ripe: boolean;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const COOLDOWN_HOURS = 24;
const TEXTING_NOW_HOURS = 2;
export const MAX_NO_ANSWERS = 3;

const NEVER_CALL = [...DEAD_STATUSES, ...BOOKED_STATUSES, "claimed"];

function ago(ms: number): string {
  const h = ms / HOUR;
  if (h < 1) return "<1h";
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

/** Our own call attempts. Inbound calls and inbound voicemails are logged in the same table but aren't attempts. */
function isAttempt(log: CallLog): boolean {
  const notes = log.notes ?? "";
  return !notes.startsWith("Inbound") && !notes.startsWith("Voicemail");
}

function contactKindOf(log: CallLog): ContactKind {
  const notes = log.notes ?? "";
  if (notes.startsWith("Inbound") || notes.startsWith("Voicemail") || log.outcome === "missed_call") return "they called";
  if (["connected", "callback", "booked", "not_interested"].includes(log.outcome)) return "we spoke";
  return "we called";
}

/** `maxAgeDays`: ready leads with no contact in that long are moved to "stale". null = no limit. */
export function buildQueue(
  leads: Lead[],
  messagesByLead: Map<number, Message[]>,
  callLogs: CallLog[],
  maxAgeDays: number | null = null,
  now: number = Date.now(),
): Record<QueueGroup, Candidate[]> {
  const logsByLead = new Map<number, CallLog[]>();
  for (const log of callLogs) {
    if (log.lead_id === null) continue;
    const list = logsByLead.get(log.lead_id) ?? [];
    list.push(log);
    logsByLead.set(log.lead_id, list);
  }
  const time = (ts: string | null | undefined) => parseTs(ts)?.getTime() ?? 0;

  const out: Record<QueueGroup, Candidate[]> = { ready: [], texting: [], recent: [], tried: [], talked: [], stale: [] };
  const sortKey = new Map<number, [number, number]>(); // ready leads: [tier, recency]

  for (const lead of leads) {
    if (!normPhone(lead.lead_phone ?? "") || NEVER_CALL.includes(lead.call_status ?? "pending")) continue;

    const msgs = messagesByLead.get(lead.id) ?? [];
    const inbound = msgs.filter((m) => m.direction === "inbound");
    const lastInbound = inbound.reduce((t, m) => Math.max(t, time(m.created_at)), 0);
    const lastMessage = msgs.reduce((t, m) => Math.max(t, time(m.created_at)), 0);

    const logs = logsByLead.get(lead.id) ?? [];
    const lastTalked = logs.filter((l) => l.outcome === "connected").reduce((t, l) => Math.max(t, time(l.created_at)), 0);
    const lastCallback = logs.filter((l) => l.outcome === "callback").reduce((t, l) => Math.max(t, time(l.created_at)), 0);
    // They called us and nobody picked up (or they left a voicemail)
    const lastMissed = logs
      .filter((l) => l.outcome === "missed_call" || (l.outcome === "voicemail" && (l.notes ?? "").startsWith("Voicemail")))
      .reduce((t, l) => Math.max(t, time(l.created_at)), 0);
    const attempts = logs.filter(isAttempt);
    const lastAttempt = attempts.reduce((t, l) => Math.max(t, time(l.created_at)), 0);
    const noAnswers = attempts.filter((l) => l.outcome === "no_answer" || l.outcome === "voicemail").length;

    let lastContact: Candidate["lastContact"] = { at: time(lead.created_at), kind: "came in" };
    const consider = (at: number, kind: ContactKind) => {
      if (at > lastContact.at) lastContact = { at, kind };
    };
    for (const m of msgs) consider(time(m.created_at), m.direction === "inbound" ? "they texted" : "we texted");
    for (const l of logs) consider(time(l.created_at), contactKindOf(l));

    const add = (group: QueueGroup, reason: string, ripe = false) => {
      const stale = group === "ready" && maxAgeDays !== null && now - lastContact.at > maxAgeDays * DAY;
      const final = stale ? "stale" : group;
      out[final].push({ lead, group: final, reason, ripe, lastContact });
    };

    const calledUs = lastMissed > lastAttempt && lastMissed > lastTalked;

    // Picked up and talked (and didn't ask for a callback or call us again since): don't call them by accident
    if (lastTalked && lastTalked > lastCallback && lastTalked > lastMissed) {
      add("talked", `Talked ${ago(now - lastTalked)} ago`);
    } else if (inbound.length && now - lastMessage < TEXTING_NOW_HOURS * HOUR) {
      add("texting", "Texting right now");
    } else if (lastAttempt && now - lastAttempt < COOLDOWN_HOURS * HOUR && !calledUs) {
      add("recent", `Called ${ago(now - lastAttempt)} ago`);
    } else if (noAnswers >= MAX_NO_ANSWERS && !lastCallback && !calledUs) {
      add("tried", `${noAnswers} calls, no answer`);
    } else if (lastCallback || calledUs) {
      const callbackNewer = lastCallback >= lastMissed;
      add("ready", callbackNewer ? "Asked for a callback" : `Called us · missed ${ago(now - lastMissed)} ago`, true);
      sortKey.set(lead.id, [0, Math.max(lastCallback, lastMissed)]);
    } else if (inbound.length || lead.call_status === "mia") {
      const since = lastInbound || time(lead.created_at);
      add("ready", `Replied · quiet ${ago(now - since)}`, true);
      sortKey.set(lead.id, [1, since]);
    } else {
      add("ready", `No reply · added ${ago(now - time(lead.created_at))} ago`);
      sortKey.set(lead.id, [2, time(lead.created_at)]);
    }
  }

  // Ripest first; within a tier the freshest first
  out.ready.sort((a, b) => {
    const [ta, ra] = sortKey.get(a.lead.id)!;
    const [tb, rb] = sortKey.get(b.lead.id)!;
    return ta - tb || rb - ra;
  });
  for (const group of ["texting", "recent", "tried", "talked"] as const) out[group].sort((a, b) => b.lead.id - a.lead.id);
  out.stale.sort((a, b) => b.lastContact.at - a.lastContact.at);
  return out;
}
