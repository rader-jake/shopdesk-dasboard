import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "accent-soft" | "danger" | "manual";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent font-semibold hover:brightness-110",
  ghost: "border border-line text-muted hover:border-line2 hover:text-text",
  "accent-soft": "border border-accent/25 bg-accent/10 text-accent hover:bg-accent/20",
  danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
  manual: "border border-manual/30 bg-manual/10 text-manual hover:bg-manual/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

export function Button({ variant = "ghost", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg whitespace-nowrap transition disabled:cursor-default disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
