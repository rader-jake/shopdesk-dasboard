import type { Metadata } from "next";
import Link from "next/link";
import DemoFunnel from "@/components/marketing/DemoFunnel";
import MotionProvider from "@/components/marketing/MotionProvider";
import Nav, { Wordmark } from "@/components/marketing/Nav";
import { CONTACT_EMAIL } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "ShopDesk — See an AI texting your leads, live on your phone",
  description:
    "Pick your industry, answer three questions, and get a live AI demo texted to your phone in about a minute. No signup, no credit card.",
  openGraph: {
    title: "See ShopDesk work on your phone",
    description: "Get a live AI demo texted to your phone in about a minute.",
    url: "https://shopdesk.ai",
    siteName: "ShopDesk",
    type: "website",
  },
};

export default function Home() {
  return (
    <MotionProvider>
      <Nav />
      <main>
        <DemoFunnel />
      </main>
      <footer className="border-t border-line bg-bg px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <Wordmark className="text-lg" />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
            <Link href="/beauty" className="rounded hover:text-text">
              ShopDesk Beauty
            </Link>
            <Link href="/login" className="rounded hover:text-text">
              Client Login
            </Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="rounded hover:text-text">
              {CONTACT_EMAIL}
            </a>
          </nav>
          <p>&copy; ShopDesk.ai</p>
        </div>
      </footer>
    </MotionProvider>
  );
}
