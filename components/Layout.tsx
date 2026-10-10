"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, MessageSquare, Phone, Users, type LucideIcon } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { hasFeature } from "@/config/shops";
import type { Feature } from "@/config/types";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { signOut } from "@/lib/session";

interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  feature: Feature;
}

export function BrandMark({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-accent font-display leading-none text-on-accent",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { shop, base } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = (
    [
      { href: base, label: "Conversations", short: "Chats", icon: MessageSquare, feature: "conversations" },
      { href: `${base}/calls`, label: "Call History", short: "Calls", icon: Phone, feature: "callHistory" },
      { href: `${base}/schedule`, label: "Schedule", short: "Schedule", icon: CalendarDays, feature: "schedule" },
      { href: `${base}/leads`, label: "Leads", short: "Leads", icon: Users, feature: "leads" },
    ] satisfies NavItem[]
  ).filter((item) => hasFeature(shop, item.feature));

  const handleSignOut = () => {
    signOut();
    router.replace(`/login?shop=${shop.id}`);
  };

  return (
    <div className="flex h-dvh flex-col bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line bg-surface px-3.5 sm:gap-3 sm:px-4 md:gap-4 md:px-7">
        <BrandMark name={shop.name} className="size-8 text-lg" />
        <div className="min-w-0 truncate font-display text-base tracking-wide sm:text-lg md:text-xl">{shop.name}</div>
        <div className="hidden h-5 w-px bg-line md:block" />
        <div className="hidden text-sm text-muted md:block">{shop.location}</div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap text-accent uppercase sm:px-3">
            <span className="animate-pulse-dot size-1.5 rounded-full bg-accent" />
            <span className="max-sm:hidden">AI Active</span>
            <span className="sm:hidden">AI</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-line px-3 py-1.5 text-xs whitespace-nowrap text-muted transition hover:border-line2 hover:text-text"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Main" className="hidden w-52 shrink-0 flex-col gap-1 border-r border-line bg-surface p-3 md:flex">
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Monitor</div>
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-accent/15 text-accent" : "text-muted hover:bg-text/5 hover:text-text",
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-auto space-y-1 px-3 py-3 text-[11px] text-muted">
            {shop.phone && <div>{shop.phone}</div>}
            <div className="opacity-70">
              Powered by <span className="font-semibold">shopdesk.ai</span>
            </div>
          </div>
        </nav>

        <main className="scroll-thin min-w-0 flex-1 overflow-y-auto px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition",
                active ? "text-accent" : "text-muted",
              )}
            >
              <item.icon className="size-[22px]" />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
