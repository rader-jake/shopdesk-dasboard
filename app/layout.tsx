import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// No default `title` on purpose: /login exports its own, and each shop's tab title is set per client
// in ShopApp. A title here would be re-applied by Next on every navigation, overwriting the shop's.
export const metadata: Metadata = {
  description: "Lead conversations, calls and scheduling.",
  // Client dashboards shouldn't show up in search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
