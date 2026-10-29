"use client";

import { m } from "framer-motion";
import { CLIENTS, FAQS, PLANS, RESULTS, STEPS, type Plan } from "@/lib/marketing/content";

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </m.div>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
      <h2 className="font-display text-3xl leading-tight tracking-tight text-text sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-base leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

export default function ProofAndPricing({ onRestart }: { onRestart: () => void }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
      className="border-t border-line bg-surface"
    >
      {/* Trusted by */}
      <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6" aria-labelledby="trusted-title">
        <h2 id="trusted-title" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Trusted by businesses across the country
        </h2>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {CLIENTS.map((c) => (
            <li key={c.name} className="text-center">
              <span className="font-display text-xl text-text sm:text-2xl">{c.name}</span>
              <span className="block text-xs text-muted">{c.place}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-bg px-4 py-16 sm:px-6" aria-labelledby="how-title">
        <div className="mx-auto max-w-5xl">
          <SectionTitle eyebrow="How it works" title="What you just experienced, running 24/7" />
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <FadeUp delay={i * 0.08} className="h-full rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-lg text-text">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold text-text">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
                </FadeUp>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16 sm:px-6" id="pricing" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-4xl">
          <SectionTitle eyebrow="Pricing" title="Simple pricing, no surprises" sub="No setup fees. No contracts. Cancel anytime." />
          <div className="grid gap-5 md:grid-cols-2">
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.name} delay={i * 0.1}>
                <PlanCard plan={plan} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Real results */}
      <section className="border-t border-line bg-bg px-4 py-16 sm:px-6" aria-labelledby="results-title">
        <div className="mx-auto max-w-5xl">
          <SectionTitle eyebrow="Real results" title="Businesses that stopped losing leads" />
          <div className="grid gap-5 md:grid-cols-2">
            {RESULTS.map((r, i) => (
              <FadeUp key={r.business} delay={i * 0.1}>
                <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
                  <header>
                    <h3 className="font-display text-2xl text-text">{r.business}</h3>
                    <p className="text-sm text-muted">
                      {r.person} &middot; {r.place}
                    </p>
                  </header>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">The challenge</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-text/85">{r.challenge}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">What changed</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-text/85">{r.change}</p>
                  <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
                    {r.stats.map((s) => (
                      <div key={s.label}>
                        <dt className="sr-only">{s.label}</dt>
                        <dd className="font-display text-2xl text-text">{s.value}</dd>
                        <p className="text-xs leading-snug text-muted" aria-hidden>
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </dl>
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6" aria-labelledby="faq-title">
        <div className="mx-auto max-w-2xl">
          <SectionTitle eyebrow="FAQ" title="Questions, answered" />
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-card">
            {FAQS.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 rounded-md text-left text-base font-semibold text-text">
                  {item.q}
                  <span className="text-xl leading-none text-muted transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[15px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line bg-text px-4 py-16 text-center sm:px-6">
        <FadeUp>
          <h2 className="font-display text-3xl leading-tight text-bg sm:text-4xl">Ready?</h2>
          <p className="mx-auto mt-3 max-w-md text-base text-bg/70">Scroll up and pick your industry.</p>
          <button type="button" onClick={onRestart} className="btn-lime mt-7">
            Pick your industry ↑
          </button>
        </FadeUp>
      </section>
    </m.div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl bg-surface p-7 sm:p-8 ${
 plan.featured ? "border-2 border-text shadow-lift" : "border border-line shadow-card"
 }`}
    >
      {plan.featured && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-text ring-1 ring-text/15">
          What you just tried
        </span>
      )}
      <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-6xl leading-none text-text">{plan.price}</span>
        <span className="text-base text-muted">/month</span>
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3 text-[15px] leading-snug text-text/85">
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent text-[11px] font-bold text-text" aria-hidden>
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href={plan.href}
        className={`mt-8 text-center ${plan.featured ? "btn-lime" : "inline-flex items-center justify-center rounded-full border border-text px-7 py-4 text-base font-semibold text-text transition hover:bg-text hover:text-bg"} `}
      >
        {plan.cta}
      </a>
      <p className="mt-3 text-center text-xs text-muted">{plan.footnote}</p>
    </div>
  );
}
