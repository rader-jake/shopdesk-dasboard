import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "@/components/marketing/Nav";
import { CONTACT_EMAIL } from "@/lib/marketing/content";

/** Shared shell for the Terms and Privacy pages. Section headings are <h2>; body text is plain <p>/<ul>. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl text-[15px] leading-relaxed text-text/90 [&_h2]:mt-9 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-text [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_a]:underline [&_a]:underline-offset-2">
          <h1 className="font-display text-4xl text-text sm:text-5xl">{title}</h1>
          <p className="text-sm text-muted">Last updated: {updated}</p>
          {children}
          <p className="mt-10 text-sm text-muted">
            Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.{" "}
            <Link href="/">Back to ShopDesk</Link>
          </p>
        </article>
      </main>
    </>
  );
}
