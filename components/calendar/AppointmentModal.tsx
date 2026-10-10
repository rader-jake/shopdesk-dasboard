"use client";

import { useState } from "react";
import { MessageSquare, Phone, Trash2 } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { AppointmentNotes } from "@/components/Notes";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import { ApiError, unblockSlot, updateLeadStatus } from "@/lib/api";
import { customerName, findLeadForEvent } from "@/lib/calendar";
import { BOOKED_STATUSES, fmtDay, fmtPhone, hourLabel, vehicleOf } from "@/lib/format";
import type { CalendarEvent, Lead } from "@/lib/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-sm last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="text-right [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}

/** Details for a booked slot, with shortcuts to the lead and a way to cancel. */
export function AppointmentModal({
  event,
  onClose,
  onChanged,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { shop, leads } = useDashboard();
  const prefixes = shop.schedule?.eventPrefixes ?? [];
  const name = event ? customerName(event.summary, prefixes) : "";
  const duration = shop.schedule?.durationHours ?? 2;

  return (
    <Modal
      open={event !== null}
      onClose={onClose}
      title={name || "Appointment"}
      subtitle={
        event
          ? `${fmtDay(event.date, { weekday: "long", month: "long", day: "numeric" })} · ${hourLabel(event.hour)} – ${hourLabel(event.hour + duration)}`
          : undefined
      }
    >
      {event && (
        <Details
          key={event.id}
          event={event}
          lead={findLeadForEvent(event, leads, prefixes)}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}

function Details({
  event,
  lead,
  onClose,
  onChanged,
}: {
  event: CalendarEvent;
  lead: Lead | undefined;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { shop, patchLead, openCallMode, openConversation } = useDashboard();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [revert, setRevert] = useState(true);
  const [busy, setBusy] = useState(false);

  const canRevert = !!lead && BOOKED_STATUSES.includes(lead.call_status ?? "");

  const cancel = async () => {
    setBusy(true);
    try {
      await unblockSlot(shop.adminSecret, event.id); // deletes the calendar event
      if (lead && canRevert && revert) {
        await updateLeadStatus(shop.adminSecret, lead.id, "pending");
        patchLead(lead.id, { call_status: "pending" });
      }
      await onChanged();
      toast("Appointment cancelled");
      onClose();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t cancel the appointment", "error");
      setBusy(false);
    }
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      {lead ? (
        <div className="mb-5">
          <Row label="Phone">{fmtPhone(lead.lead_phone)}</Row>
          <Row label="Vehicle">{vehicleOf(lead) || "—"}</Row>
          <Row label="Service">{lead.lead_special || "—"}</Row>
          <Row label="Status">
            <StatusBadge status={lead.call_status} />
          </Row>
          <Row label="Deposit">{lead.deposit_paid === 1 ? "Paid" : lead.deposit_sent === 1 ? "Link sent, not paid" : "Not requested"}</Row>
        </div>
      ) : (
        <p className="mb-5 rounded-xl border border-line bg-text/5 px-4 py-3 text-sm text-muted">
          No matching lead found — this appointment was probably added straight to the calendar.
        </p>
      )}

      {hasFeature(shop, "notes") && (
        <div className="mb-5 border-t border-line pt-5">
          <AppointmentNotes leadId={lead?.id ?? null} eventId={event.id} />
        </div>
      )}

      {confirming ? (
        <div className="space-y-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm leading-relaxed">
            This deletes the calendar event for {customerName(event.summary, shop.schedule?.eventPrefixes ?? [])}. It can’t be undone.
          </p>
          {canRevert && (
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={revert} onChange={(e) => setRevert(e.target.checked)} className="size-4 accent-[var(--accent)]" />
              Also move {lead!.lead_name} back to Pending
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => void cancel()} disabled={busy}>
              {busy ? "Cancelling…" : "Cancel appointment"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lead?.lead_phone && (
            <a
              href={`tel:${lead.lead_phone}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:brightness-110"
            >
              <Phone className="size-4" /> Call
            </a>
          )}
          {lead && (
            <Button
              onClick={() => {
                onClose();
                openConversation(lead.id);
              }}
            >
              <MessageSquare className="size-4" /> Open conversation
            </Button>
          )}
          {lead && hasFeature(shop, "callMode") && (
            <Button
              variant="accent-soft"
              onClick={() => {
                onClose();
                openCallMode(lead.id);
              }}
            >
              <Phone className="size-4" /> Call mode
            </Button>
          )}
          <Button variant="danger" className="sm:ml-auto" onClick={() => setConfirming(true)}>
            <Trash2 className="size-4" /> Cancel appointment
          </Button>
        </div>
      )}
    </div>
  );
}
