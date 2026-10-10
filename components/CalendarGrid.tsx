"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Ban, CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { AppointmentModal } from "@/components/calendar/AppointmentModal";
import { SlotModal, type SlotRef } from "@/components/calendar/SlotModal";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { EmptyState, Notice, Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import { ApiError, getCalendarWeek, unblockSlot } from "@/lib/api";
import { customerName } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { addDays, firstName, fmtDay, hourLabel, mondayOf, todayIn } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";

const key = (date: string, hour: number) => `${date}|${hour}`;

function hourIn(tz: string, at: number): number {
  return parseInt(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(at), 10);
}

export function CalendarGrid() {
  const { shop, refresh } = useDashboard();
  const toast = useToast();
  const schedule = shop.schedule;
  const manage = hasFeature(shop, "calendarManagement");
  const tz = shop.timezone;

  const [weekStart, setWeekStart] = useState(() => mondayOf(todayIn(tz)));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [slot, setSlot] = useState<SlotRef | null>(null);
  const [appointment, setAppointment] = useState<CalendarEvent | null>(null);
  const [blocked, setBlocked] = useState<CalendarEvent | null>(null);
  const [unblocking, setUnblocking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getCalendarWeek(shop.adminSecret, weekStart);
        if (cancelled) return;
        setEvents(next);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Couldn’t load the calendar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shop.adminSecret, weekStart, reloadKey]);

  // Keep the grid (and "is this slot in the past?") fresh while the tab is open.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setNow(Date.now());
      setReloadKey((k) => k + 1);
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const load = (week: string) => {
    setLoading(true);
    setWeekStart(week);
    setReloadKey((k) => k + 1);
  };

  const slotHours = useMemo(() => new Set((schedule?.slots ?? []).map((s) => s.hour)), [schedule]);
  const byCell = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const e of events) if (!map.has(key(e.date, e.hour))) map.set(key(e.date, e.hour), e);
    return map;
  }, [events]);
  const outsideSlots = useMemo(() => events.filter((e) => !slotHours.has(e.hour)), [events, slotHours]);

  if (!schedule) return <EmptyState icon={CalendarDays}>This shop doesn’t have a schedule configured.</EmptyState>;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = todayIn(tz, new Date(now));
  const nowHour = hourIn(tz, now);
  const isPast = (date: string, hour: number) => date < today || (date === today && hour <= nowHour);

  const weekLabel = `${fmtDay(weekStart, { month: "short", day: "numeric" })} – ${fmtDay(addDays(weekStart, 6), { month: "short", day: "numeric", year: "numeric" })}`;

  const onBooked = async (booked: SlotRef) => {
    // The backend says "success" even if the Google Calendar insert fails, so re-read the
    // calendar and confirm the event is really there before telling the user it worked.
    const fresh = await getCalendarWeek(shop.adminSecret, weekStart);
    setEvents(fresh);
    void refresh();
    const landed = fresh.some((e) => e.date === booked.date && e.hour === booked.hour && !e.isBlocked);
    if (landed) toast("Appointment booked");
    else toast("Saved on the lead, but the calendar event didn’t appear — check the Google Calendar connection.", "error");
  };

  const reload = async () => {
    setReloadKey((k) => k + 1);
  };

  const doUnblock = async () => {
    if (!blocked) return;
    setUnblocking(true);
    try {
      await unblockSlot(shop.adminSecret, blocked.id);
      setBlocked(null);
      setReloadKey((k) => k + 1);
      toast("Slot unblocked");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn’t unblock that slot", "error");
    } finally {
      setUnblocking(false);
    }
  };

  return (
    <section aria-label="Schedule">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => load(addDays(weekStart, -7))} aria-label="Previous week">
          <ChevronLeft className="size-4" />
        </Button>
        <Button onClick={() => load(mondayOf(todayIn(tz)))}>Today</Button>
        <Button onClick={() => load(addDays(weekStart, 7))} aria-label="Next week">
          <ChevronRight className="size-4" />
        </Button>
        <div className="order-first w-full text-center font-display text-xl md:order-none md:w-auto md:flex-1 md:text-left md:pl-2">{weekLabel}</div>
        <Button onClick={() => load(weekStart)} aria-label="Refresh calendar" className="md:ml-auto">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          <span className="max-sm:hidden">Refresh</span>
        </Button>
      </div>

      {error && <Notice>{error}</Notice>}

      {loading && events.length === 0 && !error ? (
        <Spinner label="Loading schedule…" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-line">
          <div className="grid grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] gap-px md:grid-cols-[4.5rem_repeat(7,minmax(0,1fr))]">
            <div className="bg-surface" />
            {days.map((d) => (
              <div key={d} className={cn("bg-surface px-1 py-2.5 text-center md:px-2", d === today && "bg-accent/10")}>
                <div className="text-[9px] font-semibold tracking-wider text-muted uppercase md:text-[11px]">
                  {fmtDay(d, { weekday: "short" })}
                </div>
                <div className={cn("font-display text-base md:text-xl", d === today && "text-accent")}>{fmtDay(d, { day: "numeric" })}</div>
              </div>
            ))}

            {schedule.slots.map((s) => (
              <Fragment key={s.hour}>
                <div className="flex items-center justify-center bg-surface px-0.5 font-mono text-[9px] text-muted md:text-[11px]">
                  {s.label}
                </div>
                {days.map((d) => {
                  const ev = byCell.get(key(d, s.hour));
                  const past = isPast(d, s.hour);
                  const cellLabel = `${fmtDay(d, { weekday: "short", month: "short", day: "numeric" })} ${s.label}`;
                  const base = "flex min-h-14 w-full items-stretch bg-surface p-1 md:min-h-16 md:p-1.5";

                  if (ev?.isBlocked) {
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!manage}
                        onClick={() => setBlocked(ev)}
                        aria-label={`${cellLabel}: blocked`}
                        className={cn(base, d === today && "bg-accent/[0.03]", "disabled:cursor-default")}
                      >
                        <span className="flex w-full items-center justify-center gap-1 rounded-md border border-danger/25 bg-danger/10 text-[9px] font-semibold text-danger md:text-[11px]">
                          <Ban className="size-3" />
                          <span className="max-md:hidden">Blocked</span>
                        </span>
                      </button>
                    );
                  }

                  if (ev) {
                    const name = customerName(ev.summary, schedule.eventPrefixes);
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!manage}
                        onClick={() => setAppointment(ev)}
                        aria-label={`${cellLabel}: booked, ${name}`}
                        className={cn(base, d === today && "bg-accent/[0.03]", "disabled:cursor-default")}
                      >
                        <span className="flex w-full min-w-0 flex-col justify-center rounded-md border border-accent/25 bg-accent/10 px-1 py-1 text-left leading-tight md:px-2">
                          <span className="truncate text-[9px] font-semibold text-accent md:text-xs">
                            <span className="md:hidden">{firstName(name)}</span>
                            <span className="max-md:hidden">{name}</span>
                          </span>
                          <span className="truncate text-[9px] text-muted max-md:hidden">{hourLabel(ev.hour)}</span>
                        </span>
                      </button>
                    );
                  }

                  const open = manage && !past;
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!open}
                      onClick={() => setSlot({ date: d, hour: s.hour })}
                      aria-label={`${cellLabel}: ${past ? "past" : "open"}`}
                      className={cn(base, d === today && "bg-accent/[0.03]", "group disabled:cursor-default", past && "opacity-40")}
                    >
                      <span
                        className={cn(
                          "flex w-full items-center justify-center rounded-md border border-dashed border-text/10 text-xs text-text/20 transition",
                          open && "group-hover:border-accent/40 group-hover:text-accent/60",
                        )}
                      >
                        {open ? "+" : ""}
                      </span>
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-accent/40" /> Customer booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-danger/40" /> Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-dashed border-text/30" /> Available
        </span>
      </div>

      {outsideSlots.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">Other calendar events this week</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-sm">
            {outsideSlots.map((e) => (
              <li key={e.id} className="flex items-baseline gap-3 px-4 py-2.5">
                <span className="w-32 shrink-0 font-mono text-xs text-muted">
                  {fmtDay(e.date, { weekday: "short", month: "short", day: "numeric" })} · {hourLabel(e.hour)}
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{e.summary || "Untitled event"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SlotModal slot={slot} onClose={() => setSlot(null)} onBooked={onBooked} onBlocked={reload} />
      <AppointmentModal event={appointment} onClose={() => setAppointment(null)} onChanged={async () => { setReloadKey((k) => k + 1); void refresh(); }} />
      <ConfirmDialog
        open={blocked !== null}
        title="Unblock this slot?"
        confirmLabel="Unblock"
        busy={unblocking}
        onConfirm={() => void doUnblock()}
        onCancel={() => setBlocked(null)}
      >
        {blocked && (
          <>
            {fmtDay(blocked.date, { weekday: "long", month: "long", day: "numeric" })} at {hourLabel(blocked.hour)} will be open for bookings again.
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
