"use client";

import { useState } from "react";
import {
  CalendarCheck,
  CalendarSearch,
  Camera,
  CircleDollarSign,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { NotesSection, useNotes } from "@/components/Notes";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import type { QuickText } from "@/config/types";
import {
  ApiError,
  bookAppointment,
  checkAvailability,
  logCall,
  sendDeposit,
  sendMessage,
  sendMessageWithLink,
  updateLeadStatus,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { firstName, fmtPhone, initials, pad2, slotLabelToHour, todayIn, vehicleOf } from "@/lib/format";
import type { Lead } from "@/lib/types";

const QUICK_ICONS: Record<QuickText["icon"], LucideIcon> = {
  link: Link2,
  star: Star,
  camera: Camera,
  pin: MapPin,
  tag: Tag,
  message: MessageSquare,
};

/** Mounted once for the whole dashboard; opened by anything that calls `openCallMode(leadId)`. */
export function CallMode() {
  const { leads, callModeLeadId, closeCallMode } = useDashboard();
  const lead = leads.find((l) => l.id === callModeLeadId) ?? null;
  return (
    <Modal
      open={lead !== null}
      onClose={closeCallMode}
      title={lead?.lead_name ?? "Call mode"}
      subtitle={lead ? [vehicleOf(lead) || "Vehicle not given", lead.lead_special || "General inquiry"].join(" · ") : undefined}
    >
      {lead && <CallBody key={lead.id} lead={lead} />}
    </Modal>
  );
}

const OUTCOMES = [
  { key: "booked", label: "Booked", tone: "ok" },
  { key: "callback", label: "Call back later", tone: "neutral" },
  { key: "no_answer", label: "No answer", tone: "neutral" },
  { key: "not_interested", label: "Not interested", tone: "danger" },
] as const;

function CallBody({ lead }: { lead: Lead }) {
  const { shop, messagesByLead, refresh, closeCallMode } = useDashboard();
  const toast = useToast();
  const config = shop.callMode;
  const canSchedule = hasFeature(shop, "schedule");
  const canDeposit = hasFeature(shop, "deposits");
  const notesOn = hasFeature(shop, "notes");

  // With the notes feature this draft is saved as an internal note; without it, it only goes in the call log.
  const [notes, setNotes] = useState("");
  const notesApi = useNotes({ leadId: lead.id }, "call", notesOn);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [busy, setBusy] = useState(false);

  const [showAvail, setShowAvail] = useState(false);
  const [date, setDate] = useState(() => todayIn(shop.timezone));
  const [slots, setSlots] = useState<string[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [picked, setPicked] = useState<{ date: string; label: string } | null>(null);

  if (!config) return <div className="px-6 py-8 text-sm text-muted">Call Mode isn’t set up for this shop yet.</div>;

  const msgs = messagesByLead.get(lead.id) ?? [];
  const lastIn = [...msgs].reverse().find((m) => m.direction === "inbound");
  const lastReply = lastIn
    ? `Last reply: “${lastIn.body.replace(/\s+/g, " ").slice(0, 80)}${lastIn.body.length > 80 ? "…" : ""}”`
    : "No reply yet";
  const phone = lead.lead_phone;

  /** Runs an action with a shared busy flag and status line. */
  const run = async (label: string, action: () => Promise<string>) => {
    setBusy(true);
    setStatus({ text: `${label}…` });
    try {
      setStatus({ text: await action() });
    } catch (e) {
      setStatus({ text: e instanceof ApiError ? e.message : "Something went wrong — try again", error: true });
    } finally {
      setBusy(false);
    }
  };

  const sendQuick = (q: QuickText) =>
    run("Sending", async () => {
      if (q.attachmentUrl) await sendMessageWithLink(shop.adminSecret, lead.id, q.text, q.attachmentUrl);
      else await sendMessage(shop.adminSecret, lead.id, q.text);
      void refresh();
      return `Sent to ${firstName(lead.lead_name)} ✓`;
    });

  const search = async () => {
    if (!date) return;
    setChecking(true);
    setPicked(null);
    try {
      setSlots((await checkAvailability(date)).slots);
    } catch (e) {
      setSlots(null);
      setStatus({ text: e instanceof ApiError ? e.message : "Couldn’t check availability", error: true });
    } finally {
      setChecking(false);
    }
  };

  const book = () => {
    if (!picked || !phone) {
      setStatus({ text: "Check availability and pick a slot first", error: true });
      return Promise.resolve();
    }
    const hour = slotLabelToHour(picked.label);
    if (hour === null) {
      setStatus({ text: `Couldn’t read the time “${picked.label}”`, error: true });
      return Promise.resolve();
    }
    return run("Booking", async () => {
      await bookAppointment({
        lead_name: lead.lead_name ?? "Customer",
        lead_phone: phone,
        lead_vehicle: vehicleOf(lead) || "your vehicle",
        lead_special: lead.lead_special ?? "",
        appointment_time: `${picked.date} ${pad2(hour)}:00`,
      });
      void refresh();
      return `Booked for ${picked.label} on ${picked.date} ✓`;
    });
  };

  const outcome = async (key: (typeof OUTCOMES)[number]["key"]) => {
    setBusy(true);
    try {
      // Only "booked" and "not interested" change the lead's status; the others just get logged.
      if (key === "booked") await updateLeadStatus(shop.adminSecret, lead.id, "booked");
      if (key === "not_interested") await updateLeadStatus(shop.adminSecret, lead.id, "dead");
      // Keep what was typed as an internal note too, so it shows up in the notes list.
      if (notesOn && notes.trim()) await notesApi.add(notes.trim()).catch(() => undefined);
      await logCall(shop.adminSecret, {
        lead_id: lead.id,
        shop_id: shop.id,
        lead_name: lead.lead_name,
        lead_phone: lead.lead_phone,
        outcome: key,
        notes: notes.trim(),
      });
      const done = {
        booked: "Booked — call logged",
        callback: "Call back later — call logged",
        no_answer: "No answer — logged, AI follow-ups continue",
        not_interested: "Lead killed — call logged",
      }[key];
      toast(done);
      void refresh();
      closeCallMode();
    } catch (e) {
      setStatus({ text: e instanceof ApiError ? e.message : "Couldn’t save the call", error: true });
      setBusy(false);
    }
  };

  const actionBtn =
    "flex flex-col items-center gap-1.5 rounded-xl border border-line bg-text/[0.03] px-2 py-3.5 text-center text-xs font-medium transition hover:border-accent/30 hover:bg-accent/10 disabled:opacity-50";

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-line px-5 py-3.5 sm:px-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-display text-lg text-accent">
          {initials(lead.lead_name)}
        </div>
        <div className="min-w-0 flex-1 font-mono text-base">{fmtPhone(phone)}</div>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110"
          >
            <Phone className="size-4" /> Tap to call
          </a>
        )}
      </div>
      <p className="border-b border-line px-5 py-2.5 text-xs text-muted sm:px-6">{lastReply}</p>

      <Section label="Your script">
        <p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3.5 text-sm leading-relaxed text-text/85 italic">
          “{config.script(lead)}”
        </p>
      </Section>

      <Section label="Quick facts">
        <ul className="space-y-1.5">
          {config.facts(lead).map((f, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-text/75">
              <span className={cn("shrink-0", f.highlight ? "text-warn" : "text-accent")}>▸</span>
              <span>
                {f.label && <span className={cn(f.highlight && "font-semibold text-warn")}>{f.label}: </span>}
                {f.href ? (
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                    {f.text}
                  </a>
                ) : (
                  f.text
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section label="Quick actions">
        <div className="grid grid-cols-3 gap-2">
          {canSchedule && (
            <button type="button" className={actionBtn} onClick={() => setShowAvail((v) => !v)} aria-expanded={showAvail}>
              <CalendarSearch className="size-5 text-accent" /> Check availability
            </button>
          )}
          {canDeposit && (
            <button
              type="button"
              className={actionBtn}
              disabled={busy || !phone}
              onClick={() =>
                void run("Sending deposit link", async () => {
                  await sendDeposit(lead.lead_name ?? "Customer", phone!);
                  return "Deposit link sent ✓";
                })
              }
            >
              <CircleDollarSign className="size-5 text-accent" /> Send deposit
            </button>
          )}
          {canSchedule && (
            <button type="button" className={actionBtn} disabled={busy || !picked} onClick={() => void book()}>
              <CalendarCheck className="size-5 text-accent" /> Book appt.
            </button>
          )}
          {config.quickTexts(lead).map((q) => {
            const Icon = QUICK_ICONS[q.icon];
            return (
              <button key={q.id} type="button" className={actionBtn} disabled={busy} onClick={() => void sendQuick(q)}>
                <Icon className="size-5 text-accent" /> {q.label}
              </button>
            );
          })}
        </div>

        {showAvail && (
          <div className="mt-3 rounded-xl border border-line bg-text/[0.03] p-3.5">
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                min={todayIn(shop.timezone)}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Date to check"
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface2 px-3 py-2 text-base outline-none focus:border-accent/50"
              />
              <button
                type="button"
                onClick={() => void search()}
                disabled={checking || !date}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-50"
              >
                {checking ? "Checking…" : "Search"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {slots === null ? (
                <span className="text-xs text-muted">Pick a date and tap Search.</span>
              ) : slots.length === 0 ? (
                <span className="text-xs text-muted">No slots available that day.</span>
              ) : (
                slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setPicked({ date, label: s });
                      setStatus({ text: `Selected ${s} on ${date} — tap Book appt.` });
                    }}
                    aria-pressed={picked?.label === s && picked.date === date}
                    className={cn(
                      "rounded-lg border px-3.5 py-1.5 text-sm font-medium transition",
                      picked?.label === s && picked.date === date
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-accent/25 bg-accent/5 text-accent hover:bg-accent/15",
                    )}
                  >
                    {s}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <p role="status" className={cn("mt-3 min-h-5 text-center text-sm", status.error ? "text-danger" : "text-accent")}>
          {status.text}
        </p>
      </Section>

      <Section label="Call outcome">
        <div className="grid grid-cols-2 gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              type="button"
              disabled={busy}
              onClick={() => void outcome(o.key)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm font-medium transition disabled:opacity-50",
                o.tone === "ok" && "border-ok/30 text-ok hover:bg-ok/10",
                o.tone === "danger" && "border-danger/30 text-danger hover:bg-danger/10",
                o.tone === "neutral" && "border-line text-muted hover:bg-text/5 hover:text-text",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Section>

      {notesOn ? (
        <div className="px-5 py-4 sm:px-6">
          <NotesSection {...notesApi} draft={notes} onDraft={setNotes} />
        </div>
      ) : (
        <Section label="Notes" last>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes about the call… (saved to the call log, never texted to the customer)"
            aria-label="Call notes"
            className="w-full resize-none rounded-xl border border-line bg-surface2 px-3.5 py-3 text-base outline-none placeholder:text-muted/60 focus:border-accent/50"
          />
        </Section>
      )}
    </div>
  );
}

function Section({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("px-5 py-4 sm:px-6", !last && "border-b border-line")}>
      <div className="mb-2.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</div>
      {children}
    </div>
  );
}
