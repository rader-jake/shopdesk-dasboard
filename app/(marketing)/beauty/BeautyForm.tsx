"use client";

import { useState, type FormEvent } from "react";
import { nextPhoneValue, toE164 } from "@/lib/marketing/phone";
import { requestDemo } from "@/lib/marketing/demo-client";
import s from "./beauty.module.css";

const SERVICES = [
  "Facials & Skincare",
  "Lashes & Brows",
  "Waxing",
  "Microblading & PMU",
  "Nails",
  "Hair",
  "Body Treatments",
  "Multiple Services",
];

const CURRENT_TOOLS = [
  "Acuity Scheduling",
  "Square Appointments",
  "Vagaro",
  "Booksy",
  "GlossGenius",
  "Instagram DMs",
  "Nothing",
  "Other",
];

// Labels shown in the dropdown where they differ from the value sent to the backend.
const CURRENT_LABELS: Record<string, string> = {
  "Instagram DMs": "Instagram DMs only",
  Nothing: "Nothing — I need a system",
};

export default function BeautyForm() {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [services, setServices] = useState("");
  const [current, setCurrent] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!name.trim() || !business.trim() || !phone.trim() || !email.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    const e164 = toE164(phone);
    if (!e164) {
      setError("Please enter a valid US phone number");
      return;
    }
    setSending(true);
    setError("");
    // Same payload shape the original page sent to the ShopDesk backend.
    const result = await requestDemo({
      first_name: name.trim(),
      phone: e164,
      business_name: business.trim(),
      industry: `Beauty | ${services} | Currently using: ${current} | Email: ${email.trim()}`,
      company_website: honeypot,
    });
    setSending(false);
    if (result.ok) setDone(true);
    else setError(result.error || "Something went wrong — please try again");
  }

  return (
    <section className={s["form-section"]} id="form">
      <div className={s["form-title"]}>Let&rsquo;s build your booking page</div>
      <div className={s["form-sub"]}>Fill this out and we&rsquo;ll set everything up for you today</div>
      <div className={s["form-card"]}>
        {done ? (
          <div className={s["form-success"]} role="status">
            <div className={s["form-success-icon"]}>🎉</div>
            <div className={s["form-success-title"]}>You&rsquo;re in!</div>
            <div className={s["form-success-text"]}>
              We&rsquo;ll reach out within a few hours to get your branding assets and have your custom booking page live today.
              Check your texts!
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className={s["form-group"]}>
              <label className={s["form-label"]} htmlFor="fName">
                Your Name *
              </label>
              <input id="fName" className={s["form-input"]} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Johnson" autoComplete="name" />
            </div>
            <div className={s["form-group"]}>
              <label className={s["form-label"]} htmlFor="fBusiness">
                Business Name *
              </label>
              <input
                id="fBusiness"
                className={s["form-input"]}
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Glow Aesthetics Studio"
                autoComplete="organization"
              />
            </div>
            <div className={s["form-group"]}>
              <label className={s["form-label"]} htmlFor="fPhone">
                Phone Number *
              </label>
              <input
                id="fPhone"
                className={s["form-input"]}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => setPhone((prev) => nextPhoneValue(prev, e.target.value))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className={s["form-group"]}>
              <label className={s["form-label"]} htmlFor="fEmail">
                Email *
              </label>
              <input
                id="fEmail"
                className={s["form-input"]}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@glowstudio.com"
              />
            </div>
            <div className={s["form-group"]}>
              <label className={s["form-label"]} htmlFor="fServices">
                What services do you offer?
              </label>
              <select id="fServices" className={s["form-select"]} value={services} onChange={(e) => setServices(e.target.value)}>
                <option value="">Select your primary service</option>
                {SERVICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={s["form-group"]}>
              <label className={s["form-label"]} htmlFor="fCurrent">
                Do you currently use Acuity or another booking tool?
              </label>
              <select id="fCurrent" className={s["form-select"]} value={current} onChange={(e) => setCurrent(e.target.value)}>
                <option value="">Select one</option>
                {CURRENT_TOOLS.map((v) => (
                  <option key={v} value={v}>
                    {CURRENT_LABELS[v] ?? v}
                  </option>
                ))}
              </select>
            </div>
            {/* Honeypot: invisible to people, tempting to bots. */}
            <input
              type="text"
              name="company_website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              style={{ position: "absolute", left: -9999, width: 0, height: 0, opacity: 0 }}
            />
            <button className={s["form-btn"]} type="submit" disabled={sending}>
              {sending ? "Submitting..." : "Get My Booking Page →"}
            </button>
            <div className={s["form-note"]}>
              We&rsquo;ll reach out within a few hours to get your branding and have you live today. By submitting you agree to
              receive texts from ShopDesk at this number. Msg &amp; data rates may apply. Reply STOP to opt out.
            </div>
            <div role="alert" style={{ fontSize: 12, color: "#d44", textAlign: "center", marginTop: 10, minHeight: 18 }}>
              {error}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
