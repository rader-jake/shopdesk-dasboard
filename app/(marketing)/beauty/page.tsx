import type { Metadata } from "next";
import Link from "next/link";
import BeautyForm from "./BeautyForm";
import s from "./beauty.module.css";

export const metadata: Metadata = {
  title: "ShopDesk Beauty — Your Own Custom Booking Page",
  description:
    "Get your own custom-branded booking system for just $25/month. No Acuity branding. Your logo, your colors, your business.",
};

const FEATURES = [
  { icon: "🎨", name: "Your Brand, Your Page", desc: "Your logo, your colors, your fonts. Clients feel like they're booking on YOUR website, not a third-party tool." },
  { icon: "📅", name: "Easy Online Booking", desc: "Clients pick a service, choose a time, and book — done in under a minute. No account creation required." },
  { icon: "🔄", name: "Calendar Sync", desc: "Automatically syncs with your Google Calendar or existing schedule. No double-bookings, no manual updates." },
  { icon: "📲", name: "SMS Reminders", desc: "Automatic text reminders before every appointment. Reduce no-shows without lifting a finger." },
  { icon: "💅", name: "Service Menu", desc: "List your services with descriptions, durations, and pricing. Clients know exactly what they're booking." },
  { icon: "📱", name: "Mobile-First", desc: "Looks perfect on every phone — because that's where 90% of your clients are booking from." },
];

const OLD = [
  "Generic Acuity-branded page",
  "Looks the same as everyone else",
  "Clients see Acuity's logo, not yours",
  "No SMS reminders unless you pay more",
  "Starts at $16/mo and goes up fast",
  "Feels impersonal and template-y",
];

const NEW = [
  "Custom-branded with YOUR logo and colors",
  "Looks like your own professional website",
  "Clients see your brand, not ours",
  "SMS appointment reminders included",
  "Just $25/mo — everything included",
  "Feels premium and uniquely yours",
];

const INCLUDES = [
  "Custom-branded booking page",
  "Your logo, colors, and branding",
  "Unlimited appointments",
  "Google Calendar sync",
  "SMS appointment reminders",
  "Mobile-optimized design",
  "Service menu with pricing",
  "Set up for you — same day",
];

export default function BeautyPage() {
  return (
    <div className={s.page}>
      <nav className={s.nav} aria-label="Main">
        <Link className={s["nav-brand"]} href="/beauty">
          <div className={s["nav-logo"]}>S</div>
          <div className={s["nav-name"]}>
            ShopDesk <span>Beauty</span>
          </div>
        </Link>
        <a href="#form" className={s["nav-cta"]}>
          Get Started →
        </a>
      </nav>

      <section className={s.hero}>
        <div className={`${s["hero-badge"]} ${s["fade-up"]}`}>✨ Built for beauty professionals</div>
        <h1 className={`${s["fade-up"]} ${s["fade-up-1"]}`}>
          Stop sending clients to <em>Acuity</em>
        </h1>
        <p className={`${s["fade-up"]} ${s["fade-up-2"]}`}>
          Get your own custom-branded booking page that actually looks and feels like your business. Your logo, your colors,
          your vibe — for just $25/month.
        </p>
        <a href="#form" className={`${s["hero-cta"]} ${s["fade-up"]} ${s["fade-up-3"]}`}>
          Get Your Booking Page →
        </a>
        <div className={`${s["hero-sub"]} ${s["fade-up"]} ${s["fade-up-4"]}`}>Set up today · No contracts · Cancel anytime</div>
      </section>

      <section className={s.compare} id="compare">
        <div className={s["compare-title"]}>What you have vs. what you could have</div>
        <div className={s["compare-sub"]}>Your booking page should match your brand, not Acuity&rsquo;s</div>
        <div className={s["compare-grid"]}>
          <div className={`${s["compare-card"]} ${s.old}`}>
            <div className={s["compare-label"]}>😐 Acuity Scheduling</div>
            <ul className={s["compare-list"]}>
              {OLD.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className={`${s["compare-card"]} ${s.new}`}>
            <div className={s["compare-label"]}>✨ ShopDesk Beauty</div>
            <ul className={s["compare-list"]}>
              {NEW.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={s.features} id="features">
        <div className={s["features-title"]}>Everything you need, nothing you don&rsquo;t</div>
        <div className={s["features-sub"]}>Simple, clean, built for beauty professionals</div>
        <div className={s["features-grid"]}>
          {FEATURES.map((f) => (
            <div className={s["feature-card"]} key={f.name}>
              <div className={s["feature-icon"]}>{f.icon}</div>
              <div className={s["feature-name"]}>{f.name}</div>
              <div className={s["feature-desc"]}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.pricing} id="pricing">
        <div className={s["pricing-title"]}>Simple pricing, no surprises</div>
        <div className={s["pricing-sub"]}>Everything included for one flat price</div>
        <div className={s["pricing-card"]}>
          <div className={s["pricing-tag"]}>Most Popular</div>
          <div className={s["pricing-amount"]}>
            <span className={s["pricing-dollar"]}>$25</span>
            <span className={s["pricing-period"]}>/month</span>
          </div>
          <div className={s["pricing-note"]}>No setup fees · No contracts · Cancel anytime</div>
          <ul className={s["pricing-includes"]}>
            {INCLUDES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <a href="#form">
            <button className={s["pricing-cta"]} type="button">
              Get Started Today →
            </button>
          </a>
          <div className={s["pricing-guarantee"]}>💛 Not happy? Get a full refund within 30 days</div>
        </div>
      </section>

      <BeautyForm />

      <footer>
        <div className={s["footer-brand"]}>
          ShopDesk <span>Beauty</span>
        </div>
        <div className={s["footer-text"]}>Custom booking pages for beauty professionals · Powered by shopdesk.ai</div>
      </footer>
    </div>
  );
}
