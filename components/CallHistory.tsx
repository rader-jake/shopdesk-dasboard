"use client";

import { useMemo } from "react";
import { Phone } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { PageHeader, RefreshButton } from "@/components/PageHeader";
import { StatCard } from "@/components/StatsRow";
import { EmptyState, Notice, Spinner } from "@/components/ui/states";
import { hasFeature } from "@/config/shops";
import { cn } from "@/lib/cn";
import { fmtDate, fmtPhone, parseTs, todayIn } from "@/lib/format";

const OUTCOMES: Record<string, { label: string; style: string }> = {
  booked: { label: "Booked", style: "border-ok/30 bg-ok/10 text-ok" },
  callback: { label: "Call back", style: "border-line bg-text/5 text-muted" },
  no_answer: { label: "No answer", style: "border-warn/30 bg-warn/10 text-warn" },
  not_interested: { label: "Not interested", style: "border-line2 bg-text/5 text-muted" },
};

export function CallHistory() {
  const { shop, callLogs, leads, status, openCallMode } = useDashboard();
  const tz = shop.timezone;
  const canOpen = hasFeature(shop, "callMode");

  const stats = useMemo(() => {
    const today = todayIn(tz);
    const total = callLogs.length;
    const booked = callLogs.filter((l) => l.outcome === "booked").length;
    const todayCount = callLogs.filter((l) => {
      const d = parseTs(l.created_at);
      return d && todayIn(tz, d) === today;
    }).length;
    return { total, booked, today: todayCount, rate: total ? Math.round((booked / total) * 100) : 0 };
  }, [callLogs, tz]);

  const leadIds = useMemo(() => new Set(leads.map((l) => l.id)), [leads]);
  const loading = status === "loading";
  const show = (v: string | number) => (loading ? "—" : v);

  return (
    <>
      <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard accent value={show(stats.total)} label="Total calls" />
        <StatCard value={show(stats.booked)} label="Booked" />
        <StatCard value={show(stats.today)} label="Today" />
        <StatCard value={show(`${stats.rate}%`)} label="Booking rate" />
      </div>

      <PageHeader
        title="Call History"
        subtitle={canOpen ? "Calls logged from Call Mode · tap one to reopen that lead" : "Calls logged from Call Mode"}
        actions={<RefreshButton />}
      />

      {loading ? (
        <Spinner label="Loading call history…" />
      ) : status === "error" ? (
        <Notice>Couldn’t reach the server. We’ll keep retrying.</Notice>
      ) : callLogs.length === 0 ? (
        <EmptyState icon={Phone}>No calls logged yet. Use Call Mode on a conversation to start tracking.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="hidden grid-cols-[1.4fr_0.9fr_1.6fr_0.9fr] gap-3 border-b border-line bg-text/[0.02] px-5 py-3 md:grid">
            {["Contact", "Outcome", "Notes", "Date"].map((h) => (
              <div key={h} className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
                {h}
              </div>
            ))}
          </div>
          {callLogs.map((log) => {
            const outcome = OUTCOMES[log.outcome] ?? { label: log.outcome, style: "border-line bg-text/5 text-muted" };
            const clickable = canOpen && log.lead_id !== null && leadIds.has(log.lead_id);
            const Row = clickable ? "button" : "div";
            return (
              <Row
                key={log.id}
                {...(clickable ? { type: "button" as const, onClick: () => openCallMode(log.lead_id!) } : {})}
                className={cn(
                  "grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3.5 text-left text-sm last:border-b-0 md:grid-cols-[1.4fr_0.9fr_1.6fr_0.9fr] md:gap-3 md:px-5",
                  clickable && "transition-colors hover:bg-text/[0.03]",
                )}
              >
                <div className="min-w-0">
                  <div className="font-semibold [overflow-wrap:anywhere]">{log.lead_name || "Unknown"}</div>
                  <div className="text-xs text-muted">{fmtPhone(log.lead_phone)}</div>
                </div>
                <div>
                  <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", outcome.style)}>
                    {outcome.label}
                  </span>
                </div>
                <div className="col-span-2 min-w-0 text-[13px] text-muted [overflow-wrap:anywhere] md:col-span-1 md:truncate">{log.notes || "—"}</div>
                <div className="col-span-2 text-xs text-muted md:col-span-1">{fmtDate(log.created_at, tz)}</div>
              </Row>
            );
          })}
        </div>
      )}
    </>
  );
}
