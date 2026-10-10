import { cn } from "@/lib/cn";
import { fmtStatus } from "@/lib/format";

// Full class strings (not built dynamically) so Tailwind can see them.
const STATUS_STYLES: Record<string, string> = {
  pending: "border-line bg-text/5 text-muted",
  sms_fallback: "border-accent/25 bg-accent/10 text-accent",
  booked: "border-ok/30 bg-ok/10 text-ok",
  confirmed: "border-ok/30 bg-ok/10 text-ok",
  completed: "border-line bg-text/5 text-muted",
  calling: "border-manual/30 bg-manual/10 text-manual",
  mia: "border-warn/30 bg-warn/10 text-warn",
  dead: "border-line2 bg-text/5 text-muted",
  opted_out: "border-danger/30 bg-danger/10 text-danger",
};

export function StatusBadge({ status, className }: { status: string | null; className?: string }) {
  const key = status ?? "pending";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_STYLES[key] ?? STATUS_STYLES.pending,
        className,
      )}
    >
      {fmtStatus(key)}
    </span>
  );
}
