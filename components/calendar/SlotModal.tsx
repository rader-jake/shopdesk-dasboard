"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Ban, CalendarCheck } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import { ApiError, blockSlot, bookAppointment, sendDeposit } from "@/lib/api";
import { cn } from "@/lib/cn";
import { DEAD_STATUSES, fmtDay, fmtPhone, hourLabel, normPhone, pad2, vehicleOf } from "@/lib/format";

export interface SlotRef {
  date: string; // YYYY-MM-DD, shop-local
  hour: number; // 24h
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-base outline-none transition placeholder:text-muted/60 focus:border-accent/50";
const labelCls = "mb-1.5 block text-[11px] font-semibold tracking-[0.1em] text-muted uppercase";

/** Opens when an empty slot is tapped: book an appointment there, or block the time off. */
export function SlotModal({
  slot,
  onClose,
  onBooked,
  onBlocked,
}: {
  slot: SlotRef | null;
  onClose: () => void;
  onBooked: (slot: SlotRef) => Promise<void>;
  onBlocked: () => Promise<void>;
}) {
  return (
    <Modal
      open={slot !== null}
      onClose={onClose}
      title="Open slot"
      subtitle={slot ? `${fmtDay(slot.date, { weekday: "long", month: "long", day: "numeric" })} · ${hourLabel(slot.hour)}` : undefined}
    >
      {slot && <SlotForm slot={slot} onClose={onClose} onBooked={onBooked} onBlocked={onBlocked} />}
    </Modal>
  );
}

function SlotForm({
  slot,
  onClose,
  onBooked,
  onBlocked,
}: {
  slot: SlotRef;
  onClose: () => void;
  onBooked: (slot: SlotRef) => Promise<void>;
  onBlocked: () => Promise<void>;
}) {
  const { shop, leads } = useDashboard();
  const toast = useToast();
  const canDeposit = hasFeature(shop, "deposits");

  const [tab, setTab] = useState<"book" | "block">("book");
  const [leadId, setLeadId] = useState<string>("new");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [service, setService] = useState("");
  const [deposit, setDeposit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pickable = useMemo(
    () =>
      leads
        .filter((l) => l.lead_phone && !DEAD_STATUSES.includes(l.call_status ?? ""))
        .sort((a, b) => (a.lead_name ?? "").localeCompare(b.lead_name ?? "")),
    [leads],
  );

  const pickLead = (id: string) => {
    setLeadId(id);
    const lead = pickable.find((l) => String(l.id) === id);
    if (lead) {
      setName(lead.lead_name ?? "");
      setPhone(lead.lead_phone ?? "");
      setVehicle(vehicleOf(lead));
      setService(lead.lead_special ?? "");
    } else {
      setName("");
      setPhone("");
      setVehicle("");
      setService("");
    }
  };

  const book = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const existing = pickable.find((l) => String(l.id) === leadId);
    // For an existing lead keep their stored number exactly — the backend matches leads by it.
    const phoneValue = existing ? existing.lead_phone! : normPhone(phone);
    if (!name.trim()) return setError("Enter the customer’s name.");
    if (!phoneValue) return setError("Enter a valid 10-digit US phone number.");

    setBusy(true);
    try {
      await bookAppointment({
        lead_name: name.trim(),
        lead_phone: phoneValue,
        lead_vehicle: vehicle.trim() || "your vehicle",
        lead_special: service.trim(),
        appointment_time: `${slot.date} ${pad2(slot.hour)}:00`,
      });
      if (deposit) {
        try {
          await sendDeposit(name.trim(), phoneValue);
        } catch (err) {
          toast(`Booked, but the deposit link failed: ${err instanceof ApiError ? err.message : "unknown error"}`, "error");
        }
      }
      await onBooked(slot); // refreshes the calendar and confirms the event really landed
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t book that slot.");
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    setError("");
    setBusy(true);
    try {
      await blockSlot(shop.adminSecret, slot.date, slot.hour);
      await onBlocked();
      toast("Slot blocked");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn’t block that slot.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface2 p-1" role="tablist">
        {(
          [
            ["book", "Book appointment", CalendarCheck],
            ["block", "Block time", Ban],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setError("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition",
              tab === key ? "bg-accent text-on-accent" : "text-muted hover:text-text",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "book" ? (
        <form onSubmit={book} className="space-y-4">
          <div>
            <label htmlFor="slot-customer" className={labelCls}>
              Customer
            </label>
            <select id="slot-customer" value={leadId} onChange={(e) => pickLead(e.target.value)} className={inputCls}>
              <option value="new">New customer…</option>
              {pickable.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lead_name} · {fmtPhone(l.lead_phone)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="slot-name" className={labelCls}>
                Name
              </label>
              <input id="slot-name" value={name} onChange={(e) => setName(e.target.value)} readOnly={leadId !== "new"} className={inputCls} placeholder="Alex Kim" />
            </div>
            <div>
              <label htmlFor="slot-phone" className={labelCls}>
                Phone
              </label>
              <input
                id="slot-phone"
                type="tel"
                inputMode="tel"
                value={leadId === "new" ? phone : fmtPhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={leadId !== "new"}
                className={inputCls}
                placeholder="(832) 555-0123"
              />
            </div>
            <div>
              <label htmlFor="slot-vehicle" className={labelCls}>
                Vehicle
              </label>
              <input id="slot-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={inputCls} placeholder="2022 Tesla Model 3" />
            </div>
            <div>
              <label htmlFor="slot-service" className={labelCls}>
                Service
              </label>
              <input id="slot-service" value={service} onChange={(e) => setService(e.target.value)} className={inputCls} placeholder="Ceramic Special" />
            </div>
          </div>
          {canDeposit && (
            <label className="flex cursor-pointer items-center gap-3 text-sm text-text/80">
              <input type="checkbox" checked={deposit} onChange={(e) => setDeposit(e.target.checked)} className="size-4 accent-[var(--accent)]" />
              Text them the deposit link too
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Booking…" : "Book appointment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-text/80">
            Blocking adds a “Blocked” event to the calendar so the AI and the booking page won’t offer this time. You can unblock it later from here.
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void block()} disabled={busy}>
              {busy ? "Blocking…" : "Block this slot"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
