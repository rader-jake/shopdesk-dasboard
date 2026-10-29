import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { mkSans, mkSerif } from "@/lib/marketing/fonts";

// The root layout hides the whole app from search engines (client dashboards). The public site is the exception.
export const metadata: Metadata = {
  metadataBase: new URL("https://shopdesk.ai"),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
};

/** Light "marketing" token scope (see globals.css) so the public pages reuse the dashboards' utility names. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${mkSerif.variable} ${mkSans.variable} marketing min-h-dvh bg-bg font-sans text-text`}>{children}</div>
  );
}
