"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, MessageSquare, Send } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { ApiError, triggerDemo } from "@/lib/api";
import { cn } from "@/lib/cn";
import { normPhone } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-line bg-surface2 px-3.5 py-3 text-base outline-none transition placeholder:text-muted/60 focus:border-accent/50";
const labelCls = "mb-1.5 block text-[11px] font-semibold tracking-[0.1em] text-muted uppercase";

interface Tracking {
  leadId: number;
  name: string;
  startedAt: number;
}

/** Fires a fake inbound lead at this shop so you can watch the AI text a real phone. */
export function DemoTrigger() {
  const { shop, messagesByLead, refresh, pollFast, openConversation } = useDashboard();
  const config = shop.demoTrigger;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [service, setService] = useState(config?.services?.[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "warn" } | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const msgs = tracking ? (messagesByLead.get(tracking.leadId) ?? []) : [];
  const textSent = msgs.some((m) => m.direction === "outbound");
  const replied = msgs.some((m) => m.direction === "inbound");

  // Tick once a second only while we're waiting for the opening text.
  useEffect(() => {
    if (!tracking || textSent) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [tracking, textSent]);

  if (!config) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const first = name.trim();
    const number = normPhone(phone);
    if (!first) return setMessage({ text: "Enter a first name.", kind: "error" });
    if (!number) return setMessage({ text: "Enter a valid 10-digit US mobile number.", kind: "error" });

    setBusy(true);
    try {
      const payload: Record<string, string> = { first_name: first, phone: number, [config.vehicleField]: vehicle.trim() };
      if (config.services) payload.lead_special_override = service;
      const res = await triggerDemo(shop.id, payload);

      if (res.duplicate) {
        setMessage({ text: `That number is already in the demo (lead #${res.leadId}) — try a different number.`, kind: "warn" });
        return;
      }
      if (typeof res.leadId !== "number") throw new ApiError("The server didn’t confirm the lead was created.", 200);

      setTracking({ leadId: res.leadId, name: first, startedAt: Date.now() });
      setNow(Date.now());
      setName("");
      setPhone("");
      setVehicle("");
      pollFast(10 * 60 * 1000);
      void refresh();
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Something went wrong — please try again.", kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const elapsed = tracking ? Math.max(0, Math.round((now - tracking.startedAt) / 1000)) : 0;

  return (
    <section className="relative mb-8 rounded-2xl border border-line bg-surface p-5 md:p-6" aria-label="Demo trigger">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <h2 className="font-display text-2xl">Trigger a demo lead</h2>
      <p className="mt-1 text-sm text-muted">Use your own number — the AI texts it like a brand-new inquiry, 30–90 seconds after you send.</p>

      <form onSubmit={submit} autoComplete="off" className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="demo-name" className={labelCls}>
              First name
            </label>
            <input id="demo-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Alex" required />
          </div>
          <div>
            <label htmlFor="demo-phone" className={labelCls}>
              Mobile number
            </label>
            <input
              id="demo-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              placeholder="(555) 555-0123"
              required
            />
          </div>
          <div>
            <label htmlFor="demo-vehicle" className={labelCls}>
              {config.vehicleLabel}
            </label>
            <input id="demo-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={inputCls} placeholder={config.vehiclePlaceholder} />
          </div>
          {config.services && (
            <div>
              <label htmlFor="demo-service" className={labelCls}>
                {config.serviceLabel ?? "Service"}
              </label>
              <select id="demo-service" value={service} onChange={(e) => setService(e.target.value)} className={inputCls}>
                {config.services.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" disabled={busy} className="px-6 py-3">
            <Send className="size-4" /> {busy ? "Sending…" : "Send demo text"}
          </Button>
          <p role="status" className={cn("min-h-5 text-sm", message?.kind === "warn" ? "text-accent" : "text-danger")}>
            {message?.text}
          </p>
        </div>
      </form>

      {tracking && (
        <div className="mt-6 border-t border-line pt-5" aria-live="polite">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">Demo in progress</div>
            <button type="button" onClick={() => setTracking(null)} className="text-xs text-muted hover:text-text">
              Dismiss
            </button>
          </div>
          <ol className="space-y-4">
            <Step done label="Lead received" sub={`${tracking.name} was added`} />
            <Step
              done={textSent}
              active={!textSent}
              label="Opening text sent"
              sub={textSent ? "Check your phone" : elapsed > 180 ? "Taking longer than usual — check the backend" : `Arrives within 30–90 seconds · ${elapsed}s`}
            />
            <Step
              done={replied}
              active={textSent && !replied}
              label={replied ? "You replied — the AI is responding" : "Reply to the text"}
              sub={replied ? "Open the conversation to watch it live" : textSent ? "Text anything back to see the AI respond" : "Waiting for the first text"}
              last
            />
          </ol>
          {textSent && (
            <Button variant="accent-soft" className="mt-5" onClick={() => openConversation(tracking.leadId)}>
              <MessageSquare className="size-4" /> Open conversation
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function Step({ done, active, label, sub, last }: { done?: boolean; active?: boolean; label: string; sub: string; last?: boolean }) {
  return (
    <li className="relative flex items-start gap-3.5">
      {!last && <span className="absolute top-6 bottom-[-1rem] left-[11px] w-px bg-line" />}
      <span
        className={cn(
          "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
          done ? "border-accent bg-accent text-on-accent" : active ? "border-accent bg-surface" : "border-line2 bg-surface",
        )}
      >
        {done ? <Check className="size-3.5" /> : active ? <span className="animate-pulse-dot size-2 rounded-full bg-accent" /> : null}
      </span>
      <div>
        <div className={cn("text-sm font-medium", !done && !active && "text-muted/60")}>{label}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
    </li>
  );
}
