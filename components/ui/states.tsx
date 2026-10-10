import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="px-5 py-12 text-center text-sm text-muted" role="status">
      <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-line2 border-t-accent" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, children, action }: { icon: LucideIcon; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-5 py-14 text-center text-sm text-muted">
      <Icon className="mx-auto mb-3 size-8 opacity-40" />
      <div>{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{children}</div>;
}
