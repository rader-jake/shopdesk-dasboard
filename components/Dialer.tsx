"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleStop, Pause, Phone, Play, SkipForward, Voicemail } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import { ApiError, dialerAction, getActiveDialer, getDialer, startDialer, type DialerAction } from "@/lib/api";
import { cn } from "@/lib/cn";
import { DEAD_STATUSES, BOOKED_STATUSES, fmtPhone, normPhone, vehicleOf } from "@/lib/format";
import type { DialerSession } from "@/lib/types";

const POLL_MS = 1500;
const NOT_CALLABLE = [...DEAD_STATUSES, ...BOOKED_STATUSES, "claimed"];

const OUTCOME_LABEL: Record<string, string> = {
  connected: "Talked",
  no_answer: "No answer",
  voicemail: "Voicemail",
  skipped: "Skipped",
  failed: "Failed",
};

/** Power dialer: ring your cell once, then it dials leads one at a time and connects you when a person answers. */
export function Dialer() {
  const { shop, leads, messagesByLead, openCallMode } = useDashboard();
  const toast = useToast();
  const [session, setSession] = useState<DialerSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<number> | null>(null);

  // Leads that can be called, newest first
  const callable = useMemo(
    () =>
      leads
        .filter((l) => normPhone(l.lead_phone ?? "") && !NOT_CALLABLE.includes(l.call_status ?? "pending"))
        .sort((a, b) => b.id - a.id),
    [leads],
  );
  // By default: everyone who hasn't texted back yet
  const selected = useMemo(
    () => picked ?? new Set(callable.filter((l) => !(messagesByLead.get(l.id) ?? []).some((m) => m.direction === "inbound")).map((l) => l.id)),
    [picked, callable, messagesByLead],
  );

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
      setSession(await startDialer(shop.adminSecret, shop.id, callable.filter((l) => selected.has(l.id)).map((l) => l.id)));
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

  if (checking) return <Spinner label="Checking for a running session…" />;

  if (session && session.state !== "finished") return <Live session={session} act={act} onOpen={hasFeature(shop, "callMode") ? openCallMode : undefined} />;

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };
  const count = callable.filter((l) => selected.has(l.id)).length;

  return (
    <>
      {session?.state === "finished" && <Summary session={session} />}
      <div className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        We&rsquo;ll ring your cell first. Pick up, and the dialer calls each lead in turn, skips answering machines, and connects you as soon as a
        person says hello. Calls run 8 AM–8 PM {shop.timezone.split("/")[1]?.replace("_", " ")} time and aren&rsquo;t recorded.
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          {count} of {callable.length} leads selected
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setPicked(new Set(callable.map((l) => l.id)))}>
            Select all
          </Button>
          <Button size="sm" onClick={() => setPicked(new Set())}>
            Clear
          </Button>
          <Button variant="primary" disabled={busy || count === 0} onClick={() => void start()}>
            <Phone className="size-4" /> {busy ? "Starting…" : `Start dialer (${count})`}
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {callable.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted">No leads with a callable number.</div>}
        {callable.map((lead) => (
          <label
            key={lead.id}
            className="flex cursor-pointer items-center gap-3 border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-text/[0.025] md:px-5"
          >
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold [overflow-wrap:anywhere]">{lead.lead_name || "—"}</div>
              <div className="text-xs text-muted [overflow-wrap:anywhere]">{[vehicleOf(lead), lead.lead_special].filter(Boolean).join(" · ") || "—"}</div>
            </div>
            <div className="text-xs text-muted">{fmtPhone(lead.lead_phone)}</div>
          </label>
        ))}
      </div>
    </>
  );
}

function Live({ session, act, onOpen }: { session: DialerSession; act: (a: DialerAction) => Promise<void>; onOpen?: (leadId: number) => void }) {
  const [pending, setPending] = useState(false);
  const run = async (a: DialerAction) => {
    setPending(true);
    await act(a);
    setPending(false);
  };
  const s = session.state;
  const waiting = s === "wrapup" || s === "paused" || s === "between";

  return (
    <div className="rounded-xl border border-accent/25 bg-surface p-5">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-semibold tracking-[0.1em] uppercase">Power dialer</span>
        <span>
          {Math.min(session.index + 1, session.total)} / {session.total}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className={cn("size-2.5 rounded-full", s === "connected" ? "bg-ok" : s === "dialing" ? "animate-pulse-dot bg-accent" : "bg-muted")} />
        <div className="min-w-0">
          <div className="font-display text-2xl [overflow-wrap:anywhere]">{session.current?.name ?? "Getting ready…"}</div>
          <div className="text-sm text-muted">{session.current ? fmtPhone(session.current.phone) : " "}</div>
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
