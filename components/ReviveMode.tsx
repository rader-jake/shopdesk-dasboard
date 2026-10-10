"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mail, SkipForward, Sparkles } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Notice, Spinner } from "@/components/ui/states";
import { ApiError, getRevivableLeads, sendDiscount, type RevivableLead } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtPhone, fmtStatus, previewText, vehicleOf } from "@/lib/format";

/** Button + overlay that walks through dead/MIA leads from the last 30 days and offers each a discount. */
export function ReviveMode() {
  const { refresh } = useDashboard();
  const [open, setOpen] = useState(false);
  const sentAny = useRef(false);

  const close = () => {
    setOpen(false);
    if (sentAny.current) {
      sentAny.current = false;
      void refresh();
    }
  };

  return (
    <>
      <Button variant="accent-soft" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" /> Revive dead leads
      </Button>
      <Modal open={open} onClose={close} title="Revive Mode" subtitle="Review each lead before sending">
        {open && <ReviveFlow onSent={() => (sentAny.current = true)} onDone={close} />}
      </Modal>
    </>
  );
}

type LoadState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; leads: RevivableLead[] };

function ReviveFlow({ onSent, onDone }: { onSent: () => void; onDone: () => void }) {
  const { shop, messagesByLead } = useDashboard();
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [sent, setSent] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>({ text: "" });

  useEffect(() => {
    let cancelled = false;
    getRevivableLeads(shop.adminSecret)
      .then((leads) => !cancelled && setLoad({ kind: "ready", leads }))
      .catch((e) => !cancelled && setLoad({ kind: "error", message: e instanceof ApiError ? e.message : "Couldn’t load leads" }));
    return () => {
      cancelled = true;
    };
  }, [shop.adminSecret]);

  if (!shop.revive) return <div className="px-6 py-10 text-center text-sm text-muted">Revive Mode isn’t set up for this shop.</div>;
  if (load.kind === "loading") return <Spinner label="Finding leads worth reviving…" />;
  if (load.kind === "error") return <div className="p-6"><Notice>{load.message}</Notice></div>;

  const { leads } = load;
  if (leads.length === 0) {
    return <div className="px-6 py-12 text-center text-sm text-muted">No revivable leads in the last 30 days.</div>;
  }

  if (index >= leads.length) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-ok/15 text-ok">
          <Check className="size-6" />
        </div>
        <div className="text-lg font-semibold">All done!</div>
        <p className="mt-1 text-sm text-muted">
          Sent {sent} · Skipped {skipped}
        </p>
        <Button className="mt-6" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }

  const lead = leads[index];
  const message = shop.revive.message(lead);
  const history = (messagesByLead.get(lead.id) ?? []).slice(-6);
  const remaining = leads.length - index;

  const next = () => {
    setIndex((i) => i + 1);
    setFeedback({ text: "" });
  };

  const send = async () => {
    setSending(true);
    setFeedback({ text: "Sending…" });
    try {
      await sendDiscount(shop.adminSecret, lead.id, message);
      onSent();
      setSent((n) => n + 1);
      setFeedback({ text: `Sent to ${lead.lead_name} ✓` });
      setTimeout(next, 1100);
    } catch (e) {
      setFeedback({ text: e instanceof ApiError ? e.message : "Failed to send", error: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-xs text-muted sm:px-6">
        <span>{remaining} remaining</span>
        <span className="font-mono">
          {sent} sent · {skipped} skipped
        </span>
      </div>

      <div className="border-b border-line px-5 py-4 sm:px-6">
        <div className="font-display text-2xl [overflow-wrap:anywhere]">{lead.lead_name}</div>
        <div className="mt-1 text-xs text-muted [overflow-wrap:anywhere]">
          {[vehicleOf(lead) || "No vehicle", lead.lead_special || "No special", fmtPhone(lead.lead_phone), fmtStatus(lead.call_status), `${lead.msg_count || 0} messages`].join(" · ")}
        </div>
      </div>

      <div className="border-b border-line px-5 py-4 sm:px-6">
        <Label>Recent conversation</Label>
        <div className="scroll-thin max-h-40 space-y-2 overflow-y-auto rounded-xl border border-line bg-text/[0.02] p-3 text-xs leading-relaxed">
          {history.length === 0 ? (
            <span className="text-muted">No messages found.</span>
          ) : (
            history.map((m) => (
              <div key={m.id}>
                <div className="text-[9px] font-semibold tracking-wider text-muted uppercase">{m.direction === "outbound" ? "AI" : lead.lead_name}</div>
                <div className={cn("[overflow-wrap:anywhere]", m.direction === "outbound" ? "text-accent" : "text-text")}>
                  {previewText(m.body).slice(0, 150)}
                  {m.body.length > 150 ? "…" : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-b border-line px-5 py-4 sm:px-6">
        <Label>Message preview — what they’ll receive</Label>
        <p className="rounded-xl border border-accent/15 bg-accent/5 px-4 py-3.5 text-[13px] leading-relaxed whitespace-pre-wrap text-text/80">{message}</p>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          <Button
            disabled={sending}
            onClick={() => {
              setSkipped((n) => n + 1);
              next();
            }}
            className="py-3"
          >
            <SkipForward className="size-4" /> Skip this lead
          </Button>
          <Button variant="primary" disabled={sending} onClick={() => void send()} className="py-3">
            <Mail className="size-4" /> Send offer
          </Button>
        </div>
        <p role="status" className={cn("mt-3 min-h-5 text-center text-sm", feedback.error ? "text-danger" : "text-accent")}>
          {feedback.text}
        </p>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{children}</div>;
}
