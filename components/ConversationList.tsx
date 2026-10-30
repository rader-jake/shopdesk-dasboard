"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, ImagePlus, MessageSquare, Phone, Send, X } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { MessageBubble } from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm";
import { EmptyState, Notice, Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import { ApiError, sendMessage, sendPhoto, toggleManualMode, updateLeadStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  BOOKED_STATUSES,
  DEAD_STATUSES,
  fmtDate,
  fmtPhone,
  initials,
  parseTs,
  previewText,
  vehicleOf,
} from "@/lib/format";
import { photoToBase64 } from "@/lib/image";
import type { Lead, Message } from "@/lib/types";

type Bucket = "replied" | "noReply" | "booked" | "mia" | "dead";
type FilterKey = "all" | Bucket;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "replied", label: "Replied" },
  { key: "noReply", label: "No Reply" },
  { key: "booked", label: "Booked" },
  { key: "mia", label: "MIA" },
  { key: "dead", label: "Dead" },
];

const hasInbound = (msgs: Message[]) => msgs.some((m) => m.direction === "inbound");

function bucketOf(lead: Lead, msgs: Message[]): Bucket {
  const s = lead.call_status ?? "pending";
  if (DEAD_STATUSES.includes(s)) return "dead";
  if (BOOKED_STATUSES.includes(s)) return "booked";
  if (s === "mia") return "mia";
  return hasInbound(msgs) ? "replied" : "noReply";
}

/** A lead that never answered and has been waiting 30+ minutes — worth a phone call. */
function needsCall(lead: Lead, msgs: Message[]): boolean {
  if (hasInbound(msgs)) return false;
  if (["booked", "confirmed", "dead", "opted_out"].includes(lead.call_status ?? "")) return false;
  const first = parseTs(msgs[0]?.created_at);
  return !!first && Date.now() - first.getTime() > 30 * 60 * 1000;
}

/** Time of the newest message, as a number (0 if unparseable) so sorting never depends on string formats. */
function lastActivity(msgs: Message[]): number {
  return parseTs(msgs[msgs.length - 1]?.created_at)?.getTime() ?? 0;
}

export function ConversationList() {
  const { shop, leads, messagesByLead, status, conversationsError, focusLeadId, clearFocus } = useDashboard();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [handledFocus, setHandledFocus] = useState<number | null>(null);
  const cardRefs = useRef(new Map<number, HTMLDivElement>());

  // Another page asked us to open a specific lead (e.g. "Open conversation" from the calendar).
  if (focusLeadId !== null && focusLeadId !== handledFocus) {
    setHandledFocus(focusLeadId);
    setOpenId(focusLeadId);
    setFilter("all");
  } else if (focusLeadId === null && handledFocus !== null) {
    setHandledFocus(null);
  }
  useEffect(() => {
    if (focusLeadId === null) return;
    cardRefs.current.get(focusLeadId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    clearFocus();
  }, [focusLeadId, clearFocus, leads.length]);

  const withMessages = useMemo(() => leads.filter((l) => (messagesByLead.get(l.id)?.length ?? 0) > 0), [leads, messagesByLead]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: withMessages.length, replied: 0, noReply: 0, booked: 0, mia: 0, dead: 0 };
    for (const l of withMessages) c[bucketOf(l, messagesByLead.get(l.id)!)]++;
    return c;
  }, [withMessages, messagesByLead]);

  const visible = useMemo(() => {
    const list = filter === "all" ? withMessages : withMessages.filter((l) => bucketOf(l, messagesByLead.get(l.id)!) === filter);
    // Strictly newest activity first, in every tab. (Don't rank "has replied" above recency:
    // a reply from last week would then outrank a message that arrived a minute ago.)
    const last = new Map(list.map((l) => [l.id, lastActivity(messagesByLead.get(l.id)!)]));
    return [...list].sort((a, b) => last.get(b.id)! - last.get(a.id)! || b.id - a.id);
  }, [withMessages, messagesByLead, filter]);

  return (
    <section aria-label="Conversations">
      <div className="scroll-thin -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium transition",
              filter === f.key
                ? "border-accent/35 bg-accent/15 text-accent"
                : "border-line bg-text/5 text-muted hover:bg-text/10 hover:text-text",
            )}
          >
            {f.label}
            <span className={cn("rounded-full px-1.5 text-[11px]", filter === f.key ? "bg-accent/20" : "bg-text/10")}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {conversationsError !== null && (
        <Notice>Couldn’t load conversations (HTTP {conversationsError}). Lead data is still live.</Notice>
      )}

      {status === "loading" ? (
        <Spinner label="Loading conversations…" />
      ) : status === "error" ? (
        <Notice>Couldn’t reach the server. We’ll keep retrying.</Notice>
      ) : visible.length === 0 ? (
        <EmptyState icon={MessageSquare}>
          {leads.length === 0
            ? hasFeature(shop, "demoTrigger")
              ? "No conversations yet — trigger a demo lead above to see the AI in action."
              : "No conversations yet."
            : "No conversations in this category."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((lead) => (
            <ConversationCard
              key={lead.id}
              lead={lead}
              msgs={messagesByLead.get(lead.id)!}
              open={openId === lead.id}
              onToggle={() => setOpenId((cur) => (cur === lead.id ? null : lead.id))}
              register={(el) => {
                if (el) cardRefs.current.set(lead.id, el);
                else cardRefs.current.delete(lead.id);
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ConversationCard({
  lead,
  msgs,
  open,
  onToggle,
  register,
}: {
  lead: Lead;
  msgs: Message[];
  open: boolean;
  onToggle: () => void;
  register: (el: HTMLDivElement | null) => void;
}) {
  const { shop, openCallMode } = useDashboard();
  const manual = lead.manual_mode === 1;
  const last = msgs[msgs.length - 1];
  const callNow = hasFeature(shop, "callMode") && needsCall(lead, msgs);

  return (
    <div
      ref={register}
      className={cn(
        "overflow-hidden rounded-xl border bg-surface transition-colors",
        open ? "border-accent/40 bg-accent/5" : manual ? "border-manual/40" : "border-line hover:border-line2 hover:bg-surface2",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex items-center gap-3 px-4 py-3.5 md:px-5"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-display text-sm text-accent">
          {initials(lead.lead_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <span className="min-w-0 max-w-full text-[15px] font-semibold [overflow-wrap:anywhere]">{lead.lead_name || "Unknown"}</span>
            <StatusBadge status={lead.call_status} />
            {callNow && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  openCallMode(lead.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    openCallMode(lead.id);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-warn hover:bg-warn/20"
              >
                <Flame className="size-3" /> Call now
              </span>
            )}
          </div>
          <div className="truncate text-[13px] text-muted">{previewText(last.body)}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="font-mono text-[10.5px] text-muted">{fmtDate(last.created_at, shop.timezone)}</div>
          <div className="rounded-full bg-accent px-2 text-[11px] font-semibold text-on-accent">{msgs.length}</div>
          {manual && (
            <div className="rounded-full border border-manual/30 bg-manual/15 px-2 text-[10.5px] font-semibold text-manual">Manual</div>
          )}
        </div>
      </div>

      {open && <Thread lead={lead} msgs={msgs} />}
    </div>
  );
}

function Thread({ lead, msgs }: { lead: Lead; msgs: Message[] }) {
  const { shop, refresh, patchLead, addMessage, openCallMode } = useDashboard();
  const toast = useToast();
  const manual = lead.manual_mode === 1;
  const dead = DEAD_STATUSES.includes(lead.call_status ?? "");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [photo, setPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [confirmKill, setConfirmKill] = useState(false);
  const [killing, setKilling] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Keep the newest message in view, unless the user has scrolled up to read history.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  const flipMode = async () => {
    const next = manual ? 0 : 1;
    try {
      await toggleManualMode(shop.adminSecret, lead.id, next);
      patchLead(lead.id, { manual_mode: next });
      toast(next ? "Manual mode — the AI won’t reply to this lead" : "AI is back in charge of this lead");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t switch mode", "error");
    }
  };

  const clearPhoto = () => {
    setPhoto((p) => {
      if (p) URL.revokeObjectURL(p.previewUrl);
      return null;
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const send = async () => {
    const message = draft.trim();
    if ((!message && !photo) || sending) return;
    setSending(true);
    try {
      if (photo) {
        const mediaId = await sendPhoto(shop.adminSecret, lead.id, await photoToBase64(photo.file), message);
        clearPhoto();
        addMessage({ lead_id: lead.id, direction: "outbound", body: `${message ? message + "\n" : ""}[MEDIA: ${mediaId}]` });
      } else {
        await sendMessage(shop.adminSecret, lead.id, message);
        addMessage({ lead_id: lead.id, direction: "outbound", body: message });
      }
      setDraft("");
      stickToBottom.current = true;
      setTimeout(() => void refresh(), 1200); // pick up the server's copy
    } catch (e) {
      toast(e instanceof ApiError || e instanceof Error ? e.message : "Message failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  const kill = async () => {
    setKilling(true);
    try {
      await updateLeadStatus(shop.adminSecret, lead.id, "dead");
      patchLead(lead.id, { call_status: "dead" });
      setConfirmKill(false);
      toast("Lead marked dead — follow-ups cancelled");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t update the lead", "error");
    } finally {
      setKilling(false);
    }
  };

  return (
    <div className="border-t border-line">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-text/[0.02] px-4 py-3 md:px-5">
        <div className="min-w-44 flex-1">
          <div className="text-sm font-semibold [overflow-wrap:anywhere]">
            {lead.lead_name} · {fmtPhone(lead.lead_phone)}
          </div>
          <div className="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]">
            {vehicleOf(lead) || "—"} · {lead.lead_special || "—"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void flipMode()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition",
              manual ? "border-manual/30 bg-manual/10 text-manual" : "border-accent/25 bg-accent/10 text-accent",
            )}
          >
            <span className={cn("size-1.5 rounded-full", manual ? "bg-manual" : "bg-accent")} />
            {manual ? "Manual mode" : "AI active"}
          </button>
          {hasFeature(shop, "callMode") && (
            <Button variant="accent-soft" size="sm" onClick={() => openCallMode(lead.id)}>
              <Phone className="size-3.5" /> Call mode
            </Button>
          )}
          {!dead && (
            <Button variant="danger" size="sm" onClick={() => setConfirmKill(true)}>
              <X className="size-3.5" /> Kill lead
            </Button>
          )}
        </div>
      </div>

      <div ref={scrollerRef} onScroll={onScroll} className="scroll-thin flex max-h-96 flex-col gap-3.5 overflow-y-auto px-4 py-4 md:px-5">
        {msgs.map((m) => (
          <MessageBubble key={m.id} message={m} leadName={lead.lead_name} />
        ))}
      </div>

      {manual && (
        <div className="border-t border-line bg-manual/5 px-4 py-3 md:px-5">
          {photo && (
            <div className="mb-2.5 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={photo.previewUrl} alt="Photo to send" className="size-16 rounded-lg border border-line object-cover" />
              <button
                type="button"
                onClick={clearPhoto}
                aria-label="Remove photo"
                className="flex size-8 items-center justify-center rounded-full border border-line text-muted transition hover:text-text"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                clearPhoto();
                setPhoto({ file, previewUrl: URL.createObjectURL(file) });
              }}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={sending}
              aria-label="Attach a photo"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-manual/25 bg-text/5 text-manual transition hover:bg-manual/10 disabled:opacity-50"
            >
              <ImagePlus className="size-[18px]" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder={photo ? "Add a caption (optional)…" : shop.owner ? `Type a message as ${shop.owner}…` : "Type a message…"}
              aria-label="Message"
              className="max-h-24 min-h-11 flex-1 resize-none rounded-xl border border-manual/25 bg-text/5 px-3.5 py-2.5 text-base leading-snug outline-none placeholder:text-muted/70 focus:border-manual/50 [field-sizing:content]"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || (!draft.trim() && !photo)}
              aria-label={photo ? "Send photo" : "Send message"}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-manual text-black transition hover:brightness-110 disabled:opacity-50"
            >
              <Send className="size-[18px]" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmKill}
        title="Kill this lead?"
        confirmLabel="Mark as dead"
        danger
        busy={killing}
        onConfirm={() => void kill()}
        onCancel={() => setConfirmKill(false)}
      >
        {lead.lead_name} will be marked dead and all scheduled follow-ups for them will be cancelled.
      </ConfirmDialog>
    </div>
  );
}
