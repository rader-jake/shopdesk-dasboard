"use client";

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl leading-none tracking-wide md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  );
}

export function RefreshButton() {
  const { refresh } = useDashboard();
  return (
    <Button onClick={() => void refresh()} aria-label="Refresh">
      <RefreshCw className="size-3.5" />
      <span className="max-sm:hidden">Refresh</span>
    </Button>
  );
}
