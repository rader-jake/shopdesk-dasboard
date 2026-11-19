"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleStop, Pause, Phone, Play, SkipForward, ThumbsDown, Voicemail } from "lucide-react";
import { QUICK_ICONS } from "@/components/CallMode";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import type { QuickText } from "@/config/types";
import {
  ApiError,
  dialerAction,
  getActiveDialer,
  getDialer,
  logCall,
  sendMessage,
  sendMessageWithLink,
  startDialer,
  updateLeadStatus,
  type DialerAction,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { buildQueue, MAX_NO_ANSWERS, type Candidate, type QueueGroup } from "@/lib/dialer-queue";
import { firstName, fmtPhone, vehicleOf } from "@/lib/format";
import type { DialerSession, Lead } from "@/lib/types";

const POLL_MS = 1500;

const OUTCOME_LABEL: Record<string, string> = {
  connected: "Talked",
  no_answer: "No answer",
  voicemail: "Voicemail",
  skipped: "Skipped",
  failed: "Failed",
};

/** How far back "last contact" can be for a lead to count as ready. 1 month by default: a tint special goes cold fast. */
const WINDOWS: { label: string; days: number | null }[] = [
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "2 months", days: 60 },
  { label: "3 months", days: 90 },
  { label: "All", days: null },
];
const DEFAULT_WINDOW = 1;

/** Groups held back from the default queue, with why. They can still be ticked on purpose. */
const HELD_BACK: { key: Exclude<QueueGroup, "ready">; title: (window: string) => string; hint: string }[] = [
  { key: "texting", title: () => "Texting right now", hint: "Messaged in the last couple of hours — the AI is mid-conversation." },
  { key: "recent", title: () => "Called in the last 24 hours", hint: "Give them a day before trying again." },
  { key: "tried", title: () => `Tried ${MAX_NO_ANSWERS}+ times, never answered`, hint: "Probably not worth more calls right now." },
  { key: "talked", title: () => "Already talked", hint: "They picked up before. Only call again if you mean to." },
  { key: "stale", title: (w) => `No contact in over ${w}`, hint: "Probably gone cold. Pick any you still want." },
];

/** "Nov 12" (with the year if it isn't this year) in the shop's timezone. */
function shortDay(at: number, tz: string): string {
  const d = new Date(at);
  const sameYear = d.toLocaleDateString("en-US", { year: "numeric", timeZone: tz }) === new Date().toLocaleDateString("en-US", { year: "numeric", timeZone: tz });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: tz });
}

const blurb = (lead: Lead | undefined) => [lead && vehicleOf(lead), lead?.lead_special].filter(Boolean).join(" · ");

/** Power dialer: ring your cell once, then it dials leads one at a time and connects you when a person answers. */
export function Dialer() {
  const { shop, leads, messagesByLead, callLogs, status, openCallMode } = useDashboard();
  const toast = useToast();
  const [session, setSession] = useState<DialerSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<number> | null>(null);
  const [windowIdx, setWindowIdx] = useState(DEFAULT_WINDOW);
  const windowDays = WINDOWS[windowIdx].days;

  const groups = useMemo(() => buildQueue(leads, messagesByLead, callLogs, windowDays), [leads, messagesByLead, callLogs, windowDays]);
  // How many leads each window would leave ready, so the choice is visible before you make it
  const readyCounts = useMemo(
    () => WINDOWS.map((w) => buildQueue(leads, messagesByLead, callLogs, w.days).ready.length),
    [leads, messagesByLead, callLogs],
  );
  // By default: everyone who's ready, ripest first. The held-back groups start unchecked.
  const selected = useMemo(() => picked ?? new Set(groups.ready.map((c) => c.lead.id)), [picked, groups.ready]);
  const ordered = useMemo(() => [groups.ready, groups.texting, groups.recent, groups.tried, groups.talked, groups.stale].flat(), [groups]);

  // Pick up a session that's already running (page reload, second device)
  useEffect(() => {
    let live = true;
    getActiveDialer(shop.adminSecret, shop.id)
      .then((s) => live && setSession(s))
      .catch(() => undefined)
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
  }, [shop.adminSecret, shop.id]);

  // Follow the session while it's alive
  const sessionId = session && session.state !== "finished" ? session.id : null;
  useEffect(() => {
    if (!sessionId) return;
    const timer = setInterval(() => {
      getDialer(shop.adminSecret, sessionId)
        .then(setSession)
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [sessionId, shop.adminSecret]);

  const start = async () => {
    setBusy(true);
    try {
      const ids = ordered.filter((c) => selected.has(c.lead.id)).map((c) => c.lead.id);
      const result = await startDialer(shop.adminSecret, shop.id, ids);
      setSession(result.session);
      if (result.skipped) toast(`Left out ${result.skipped} ${result.skipped === 1 ? "lead" : "leads"} called within the last 2 hours`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t start the dialer", "error");
    } finally {
      setBusy(false);
    }
  };

  const act = useCallback(
    async (action: DialerAction) => {
      if (!session) return;
      try {
        setSession(await dialerAction(shop.adminSecret, session.id, action));
      } catch (e) {
        toast(e instanceof ApiError ? e.message : "That didn’t work", "error");
      }
    },
    [session, shop.adminSecret, toast],
  );

  if (checking || (status === "loading" && !session)) return <Spinner label="Loading your leads…" />;

  if (session && session.state !== "finished") return <Live session={session} act={act} onOpen={hasFeature(shop, "callMode") ? openCallMode : undefined} />;

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };
  const count = ordered.filter((c) => selected.has(c.lead.id)).length;
  const ripe = groups.ready.filter((c) => c.ripe).length;

  return (
    <>
      {session?.state === "finished" && <Summary session={session} />}
      <div className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        We&rsquo;ll ring your cell first. Pick up, and the dialer calls each lead in turn, skips answering machines, and connects you as soon as a
        person says hello. Calls run 8 AM–8 PM {shop.timezone.split("/")[1]?.replace("_", " ")} time and aren&rsquo;t recorded.
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Last contact within</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Last contact within">
          {WINDOWS.map((w, i) => (
            <button
              key={w.label}
              type="button"
              aria-pressed={windowIdx === i}
              onClick={() => {
                setWindowIdx(i);
                setPicked(null);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[13px] transition",
                windowIdx === i ? "border-accent/40 bg-accent/10 font-semibold text-accent" : "border-line text-muted hover:border-line2 hover:text-text",
              )}
            >
              {w.label} <span className="opacity-70">({readyCounts[i]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          <span className="font-semibold text-text">{groups.ready.length} ready</span>
          {ripe > 0 && <> · {ripe} are callbacks, missed calls or replied-then-quiet (listed first)</>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setPicked(new Set())}>
            Clear
          </Button>
          <Button variant="primary" disabled={busy || count === 0} onClick={() => void start()}>
            <Phone className="size-4" /> {busy ? "Starting…" : `Start dialer (${count})`}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {groups.ready.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted">Nobody is ready to call right now.</div>}
        {groups.ready.map((c) => (
          <Row key={c.lead.id} c={c} tz={shop.timezone} checked={selected.has(c.lead.id)} onToggle={() => toggle(c.lead.id)} />
        ))}
      </div>

      {HELD_BACK.map(({ key, title, hint }) =>
        groups[key].length === 0 ? null : (
          <details key={key} className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm md:px-5">
              <span className="font-semibold">
                {title(WINDOWS[windowIdx].label.toLowerCase())} <span className="font-normal text-muted">({groups[key].length})</span>
              </span>
              <span className="hidden text-xs text-muted sm:inline">{hint}</span>
            </summary>
            <div className="border-t border-line">
              {groups[key].map((c) => (
                <Row key={c.lead.id} c={c} tz={shop.timezone} checked={selected.has(c.lead.id)} onToggle={() => toggle(c.lead.id)} />
              ))}
            </div>
          </details>
        ),
      )}
    </>
  );
}

function Row({ c, tz, checked, onToggle }: { c: Candidate; tz: string; checked: boolean; onToggle: () => void }) {
  const { lead } = c;
  return (
    <label className="flex cursor-pointer items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-text/[0.025] md:px-5">
      <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={checked} onChange={onToggle} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold [overflow-wrap:anywhere]">{lead.lead_name || "—"}</div>
        <div className="text-xs text-muted [overflow-wrap:anywhere]">{blurb(lead) || "—"}</div>
        <div className="mt-0.5 text-xs text-muted/80">
          Last contact {shortDay(c.lastContact.at, tz)} · {c.lastContact.kind}
        </div>
      </div>
      <div className="text-right">
        <div className={cn("text-xs", c.ripe ? "font-semibold text-accent" : "text-muted")}>{c.reason}</div>
        <div className="text-xs text-muted">{fmtPhone(lead.lead_phone)}</div>
      </div>
    </label>
  );
}

function Live({ session, act, onOpen }: { session: DialerSession; act: (a: DialerAction) => Promise<void>; onOpen?: (leadId: number) => void }) {
  const { shop, leads, patchLead, refresh } = useDashboard();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [killed, setKilled] = useState<Set<number>>(new Set());

  const run = async (a: DialerAction) => {
    setPending(true);
    await act(a);
    setPending(false);
  };

  const s = session.state;
  const waiting = s === "wrapup" || s === "paused" || s === "between";
  const lead = leads.find((l) => l.id === session.current?.lead_id);
  const onCall = s === "connected" || s === "wrapup";
  const quickTexts = onCall && lead ? (shop.callMode?.quickTexts(lead) ?? []) : [];
  const isKilled = !!lead && (killed.has(lead.id) || ["dead", "opted_out"].includes(lead.call_status ?? ""));

  const sendQuick = async (q: QuickText) => {
    if (!lead) return;
    setSending(q.id);
    try {
      if (q.attachmentUrl) await sendMessageWithLink(shop.adminSecret, lead.id, q.text, q.attachmentUrl);
      else await sendMessage(shop.adminSecret, lead.id, q.text);
      void refresh();
      toast(`Sent to ${firstName(lead.lead_name)} ✓`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t send that", "error");
    } finally {
      setSending(null);
    }
  };

  // They said they're not interested: kill the lead and log it, without hanging up on them
  const notInterested = async () => {
    if (!lead) return;
    try {
      await updateLeadStatus(shop.adminSecret, lead.id, "dead");
      await logCall(shop.adminSecret, {
        lead_id: lead.id,
        shop_id: shop.id,
        lead_name: lead.lead_name,
        lead_phone: lead.lead_phone,
        outcome: "not_interested",
        notes: "Power dialer · said not interested",
      });
      patchLead(lead.id, { call_status: "dead" });
      setKilled((prev) => new Set(prev).add(lead.id));
      toast(`${firstName(lead.lead_name)} marked dead — follow-ups cancelled`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t update the lead", "error");
    }
  };

  return (
    <div className="rounded-xl border border-accent/25 bg-surface p-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-semibold tracking-[0.1em] uppercase">Power dialer</span>
        <span>
          {Math.min(session.index + 1, session.total)} / {session.total}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className={cn("size-2.5 shrink-0 rounded-full", s === "connected" ? "bg-ok" : s === "dialing" ? "animate-pulse-dot bg-accent" : "bg-muted")} />
        <div className="min-w-0">
          <div className="font-display text-2xl [overflow-wrap:anywhere]">{session.current?.name ?? "Getting ready…"}</div>
          <div className="text-sm text-muted">{session.current ? fmtPhone(session.current.phone) : " "}</div>
          {blurb(lead) && <div className="mt-0.5 text-sm text-text/80 [overflow-wrap:anywhere]">{blurb(lead)}</div>}
        </div>
      </div>
      <p className="mt-3 text-sm" role="status">
        {session.message}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {s === "wrapup" && (
          <>
            <Button variant="primary" disabled={pending} onClick={() => void run("next")}>
              <SkipForward className="size-4" /> Next lead
            </Button>
            {onOpen && session.current && (
              <Button variant="accent-soft" onClick={() => onOpen(session.current!.lead_id)}>
                Open Call Mode
              </Button>
            )}
          </>
        )}
        {s === "paused" && (
          <Button variant="primary" disabled={pending} onClick={() => void run("resume")}>
            <Play className="size-4" /> Resume
          </Button>
        )}
        {(s === "dialing" || s === "connected") && (
          <Button disabled={pending} onClick={() => void run("skip")}>
            <SkipForward className="size-4" /> {s === "connected" ? "End call & next" : "Skip"}
          </Button>
        )}
        {(s === "dialing" || s === "connected" || s === "between") && !session.paused && (
          <Button disabled={pending} onClick={() => void run("pause")}>
            <Pause className="size-4" /> Pause after this
          </Button>
        )}
        {session.paused && !waiting && <span className="self-center text-xs text-muted">Will pause after this call</span>}
        <Button variant="danger" disabled={pending} onClick={() => void run("stop")}>
          <CircleStop className="size-4" /> Stop
        </Button>
      </div>

      {onCall && lead && (
        <div className="mt-5 border-t border-line pt-4">
          {quickTexts.length > 0 && (
            <>
              <div className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Text {firstName(lead.lead_name)}</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickTexts.map((q) => {
                  const Icon = QUICK_ICONS[q.icon];
                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={sending !== null}
                      onClick={() => void sendQuick(q)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface2 px-3 py-3 text-[13px] transition hover:border-line2 disabled:opacity-50"
                    >
                      <Icon className="size-4 shrink-0 text-accent" /> {sending === q.id ? "Sending…" : q.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="mt-3">
            <Button variant="danger" size="sm" disabled={isKilled} onClick={() => void notInterested()}>
              <ThumbsDown className="size-3.5" /> {isKilled ? "Marked dead" : "Not interested — kill lead"}
            </Button>
          </div>
        </div>
      )}

      {session.results.length > 0 && (
        <ul className="mt-6 divide-y divide-line border-t border-line text-sm">
          {[...session.results].reverse().map((r, i) => (
            <li key={`${r.lead_id}-${i}`} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">{r.name}</span>
              <span className={cn("text-xs", r.outcome === "connected" ? "text-ok" : "text-muted")}>
                {r.outcome === "voicemail" && <Voicemail className="mr-1 inline size-3.5" />}
                {OUTCOME_LABEL[r.outcome] ?? r.outcome}
                {r.outcome === "connected" && r.seconds ? ` · ${Math.round(r.seconds / 60) || 1} min` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Summary({ session }: { session: DialerSession }) {
  const talked = session.results.filter((r) => r.outcome === "connected").length;
  return (
    <div className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm">
      <div className="font-semibold">Last session: {session.message}</div>
      <div className="mt-1 text-muted">
        {session.results.length} dialed · {talked} talked · everything is in Call History.
      </div>
    </div>
  );
}
