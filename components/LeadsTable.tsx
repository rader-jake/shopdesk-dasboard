"use client";

import { Users } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { EmptyState, Notice, Spinner } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { hasFeature } from "@/config/shops";
import { ApiError, updateLeadStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import { SETTABLE_STATUSES, fmtDate, fmtPhone, fmtStatus, vehicleOf } from "@/lib/format";
import type { Lead } from "@/lib/types";

const COLS = "md:grid-cols-[1.3fr_1.2fr_1.1fr_1.1fr_1fr_1.1fr_0.7fr]";

export function LeadsTable() {
  const { shop, leads, status } = useDashboard();

  if (status === "loading") return <Spinner label="Loading leads…" />;
  if (status === "error") return <Notice>Couldn’t reach the server. We’ll keep retrying.</Notice>;
  if (!leads.length) {
    return (
      <EmptyState icon={Users}>
        No leads yet.{hasFeature(shop, "demoTrigger") ? " Trigger a demo lead from the Conversations page." : ""}
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className={cn("hidden gap-3 border-b border-line bg-text/[0.02] px-5 py-3 md:grid", COLS)}>
        {["Name", "Vehicle", "Service", "Phone", "Status", "Added", "Mode"].map((h) => (
          <div key={h} className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
            {h}
          </div>
        ))}
      </div>
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} />
      ))}
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const { shop, patchLead } = useDashboard();
  const toast = useToast();
  const current = lead.call_status ?? "pending";
  const manual = lead.manual_mode === 1;
  // Show statuses set elsewhere (e.g. "confirmed") even though they aren't hand-settable.
  const options: string[] = (SETTABLE_STATUSES as readonly string[]).includes(current)
    ? [...SETTABLE_STATUSES]
    : [...SETTABLE_STATUSES, current];

  const change = async (next: string) => {
    patchLead(lead.id, { call_status: next });
    try {
      await updateLeadStatus(shop.adminSecret, lead.id, next);
      toast(`Status updated to ${fmtStatus(next)}`);
    } catch (e) {
      patchLead(lead.id, { call_status: current }); // roll back
      toast(e instanceof ApiError ? e.message : "Couldn’t change status", "error");
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-b border-line px-4 py-3.5 text-sm transition-colors last:border-b-0 hover:bg-text/[0.025] md:gap-3 md:px-5",
        COLS,
      )}
    >
      <div className="min-w-0 font-semibold [overflow-wrap:anywhere]">{lead.lead_name || "—"}</div>

      {/* Desktop columns */}
      <div className="hidden min-w-0 truncate text-text/70 md:block">{vehicleOf(lead) || "—"}</div>
      <div className="hidden min-w-0 truncate text-text/70 md:block">{lead.lead_special || "—"}</div>
      <div className="hidden text-muted md:block">{fmtPhone(lead.lead_phone)}</div>

      <div>
        <select
          value={current}
          onChange={(e) => void change(e.target.value)}
          aria-label={`Status for ${lead.lead_name ?? "lead"}`}
          className="max-w-full rounded-lg border border-line bg-surface2 px-2.5 py-1.5 text-[13px] outline-none transition hover:border-line2 focus:border-accent/50"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {fmtStatus(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden text-xs text-muted md:block">{fmtDate(lead.created_at, shop.timezone)}</div>
      <div className="hidden md:block">
        <span className={cn("font-mono text-xs", manual ? "text-manual" : "text-muted")}>{manual ? "● Manual" : "● AI"}</span>
      </div>

      {/* Mobile summary line */}
      <div className="col-span-2 text-[12.5px] text-muted [overflow-wrap:anywhere] md:hidden">
        {[vehicleOf(lead), lead.lead_special, fmtPhone(lead.lead_phone)].filter(Boolean).join(" · ")}
        {manual ? " · Manual" : ""}
      </div>
    </div>
  );
}
