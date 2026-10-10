"use client";

import { useMemo } from "react";
import { useDashboard } from "@/components/DashboardProvider";
import { BOOKED_STATUSES } from "@/lib/format";
import { cn } from "@/lib/cn";

export function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-surface px-5 py-4">
      <div className={cn("absolute inset-x-0 bottom-0 h-0.5 bg-accent transition-opacity", accent ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
      <div className={cn("font-display text-4xl leading-none tracking-wide md:text-5xl", accent && "text-accent")}>{value}</div>
      <div className="mt-2 text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{label}</div>
    </div>
  );
}

export function StatsRow() {
  const { leads, messagesByLead, status } = useDashboard();

  const stats = useMemo(() => {
    const texted = leads.filter((l) => (messagesByLead.get(l.id)?.length ?? 0) > 0);
    const replied = texted.filter((l) => messagesByLead.get(l.id)!.some((m) => m.direction === "inbound")).length;
    return {
      total: leads.length,
      replied,
      booked: leads.filter((l) => BOOKED_STATUSES.includes(l.call_status ?? "")).length,
      noReply: texted.length - replied,
    };
  }, [leads, messagesByLead]);

  const show = (n: number) => (status === "loading" ? "—" : n);

  return (
    <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard accent value={show(stats.total)} label="Total Leads" />
      <StatCard value={show(stats.replied)} label="Replied" />
      <StatCard value={show(stats.booked)} label="Booked" />
      <StatCard value={show(stats.noReply)} label="No Reply" />
    </div>
  );
}
