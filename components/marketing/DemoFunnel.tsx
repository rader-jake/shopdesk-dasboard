"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CHALLENGES, INDUSTRIES, LEAD_VOLUMES, possessive, type Industry } from "@/lib/marketing/industries";
import { formatPhone, nextPhoneValue, toE164 } from "@/lib/marketing/phone";
import { requestDemo } from "@/lib/marketing/demo-client";

// Pricing, results and FAQ only load once a demo has actually been sent.
const ProofAndPricing = dynamic(() => import("./ProofAndPricing"), { ssr: false });

type Step = "industry" | "name" | "volume" | "challenge" | "phone" | "sent";

const QUESTION_STEPS: Step[] = ["name", "volume", "challenge", "phone"];
const PREVIOUS: Partial<Record<Step, Step>> = {
  name: "industry",
  volume: "name",
  challenge: "volume",
  phone: "challenge",
  sent: "phone",
};

const slide = {
  initial: (dir: number) => ({ opacity: 0, y: dir > 0 ? 28 : -20 }),
  animate: { opacity: 1, y: 0 },
  exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -20 : 20 }),
};

export default function DemoFunnel() {
  const [step, setStep] = useState<Step>("industry");
  const [dir, setDir] = useState(1);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [business, setBusiness] = useState("");
  const [volume, setVolume] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [alreadySent, setAlreadySent] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstRender = useRef(true);

  const go = useCallback((next: Step, direction: 1 | -1 = 1) => {
    setDir(direction);
    setStep(next);
  }, []);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Bring the new step into view (the grid is tall, the questions are short).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (step === "industry") window.scrollTo({ top: 0, behavior: "smooth" });
    else stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const back = () => {
    const prev = PREVIOUS[step];
    if (!prev) return;
    setError("");
    go(prev, -1);
  };

  const pickIndustry = (item: Industry) => {
    setIndustry(item);
    go("name");
  };

  const submitName = (e: FormEvent) => {
    e.preventDefault();
    if (business.trim()) go("volume");
  };

  const choose = (setter: (v: string) => void, value: string, next: Step) => {
    setter(value);
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => go(next), 220); // long enough to see the tap register
  };

  const submitPhone = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !industry) return;
    const e164 = toE164(phone);
    if (!e164) {
      setError("Enter a valid 10-digit US mobile number.");
      return;
    }
    setSending(true);
    setError("");
    const name = business.trim();
    const result = await requestDemo({
      first_name: name,
      phone: e164,
      business_name: name,
      industry: `${industry.label} | ${volume} leads/mo | Challenge: ${challenge}`,
      company_website: honeypot,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAlreadySent(result.duplicate);
    setUnlocked(true);
    go("sent");
  };

  const restart = () => {
    setIndustry(null);
    setBusiness("");
    setVolume(null);
    setChallenge(null);
    setPhone("");
    setError("");
    setAlreadySent(false);
    go("industry", -1);
  };

  const questionNumber = QUESTION_STEPS.indexOf(step) + 1;

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pt-20" aria-labelledby="hero-title">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(200,255,0,0.22),rgba(250,250,248,0))]"
          aria-hidden
        />
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent ring-1 ring-text/20" aria-hidden />
            Live demo · no signup · no credit card
          </p>
          <h1
            id="hero-title"
            className="font-display text-[2.6rem] leading-[1.05] tracking-tight text-text sm:text-6xl"
          >
            See it work on your <span className="mark">phone</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Pick your industry. Answer 3 questions. Get a live AI demo in 60 seconds.
          </p>
        </div>

        <div ref={stageRef} className="mx-auto mt-10 min-h-[380px] max-w-3xl scroll-mt-24 sm:mt-12">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {step === "industry" && (
              <m.div
                key="industry"
                custom={dir}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <p className="mb-4 text-center text-sm font-medium text-muted">What kind of business do you run?</p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {INDUSTRIES.map((item) => (
                    <li key={item.id}>
                      <m.button
                        type="button"
                        onClick={() => pickIndustry(item)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 24 }}
                        className="group flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-3 py-5 text-center shadow-card transition-colors hover:border-text hover:bg-accent/15 sm:min-h-[120px]"
                      >
                        <span className="text-3xl" aria-hidden>
                          {item.emoji}
                        </span>
                        <span className="text-[15px] font-semibold leading-tight text-text">{item.label}</span>
                      </m.button>
                    </li>
                  ))}
                </ul>
              </m.div>
            )}

            {step !== "industry" && step !== "sent" && industry && (
              <m.div
                key={step}
                custom={dir}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-9"
              >
                <div className="mb-7 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={back}
                    className="-ml-2 rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:text-text"
                  >
                    ← Back
                  </button>
                  <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium text-muted">
                    {industry.emoji} {industry.label}
                  </span>
                </div>

                <div className="mb-7 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={questionNumber} aria-label={`Step ${questionNumber} of 4`}>
                  {QUESTION_STEPS.map((s, i) => (
                    <span
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < questionNumber ? "bg-text" : "bg-line"}`}
                    />
                  ))}
                </div>

                {step === "name" && (
                  <form onSubmit={submitName}>
                    <h2 className="font-display text-3xl leading-tight text-text sm:text-4xl">What&rsquo;s your business called?</h2>
                    <label htmlFor="business" className="sr-only">
                      Business name
                    </label>
                    <input
                      id="business"
                      className="field mt-6"
                      value={business}
                      onChange={(e) => setBusiness(e.target.value)}
                      placeholder="e.g. Lone Star Tint"
                      maxLength={60}
                      autoComplete="organization"
                      enterKeyHint="next"
                      autoFocus
                    />
                    <button type="submit" className="btn-lime mt-5 w-full" disabled={!business.trim()}>
                      Next →
                    </button>
                  </form>
                )}

                {step === "volume" && (
                  <div>
                    <h2 className="font-display text-3xl leading-tight text-text sm:text-4xl">How many leads do you get per month?</h2>
                    <Options options={LEAD_VOLUMES} selected={volume} onPick={(v) => choose(setVolume, v, "challenge")} cols />
                  </div>
                )}

                {step === "challenge" && (
                  <div>
                    <h2 className="font-display text-3xl leading-tight text-text sm:text-4xl">What&rsquo;s your biggest challenge with leads?</h2>
                    <Options options={CHALLENGES} selected={challenge} onPick={(v) => choose(setChallenge, v, "phone")} />
                  </div>
                )}

                {step === "phone" && (
                  <form onSubmit={submitPhone} noValidate>
                    <h2 className="font-display text-3xl leading-tight text-text sm:text-4xl">
                      Let&rsquo;s show you what {possessive(business.trim())} customers would experience
                    </h2>
                    <label htmlFor="phone" className="sr-only">
                      Your mobile number
                    </label>
                    <input
                      id="phone"
                      className="field mt-6 text-center text-2xl tracking-wide"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => {
                        setPhone((prev) => nextPhoneValue(prev, e.target.value));
                        setError("");
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby="phone-help"
                      autoFocus
                    />
                    {/* Honeypot: invisible to people, tempting to bots. */}
                    <input
                      type="text"
                      name="company_website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="absolute -left-[9999px] h-0 w-0 opacity-0"
                    />
                    <p id="phone-help" role="alert" className="mt-3 min-h-[1.25rem] text-center text-sm text-red-700">
                      {error}
                    </p>
                    <button type="submit" className="btn-lime mt-2 w-full text-lg" disabled={sending}>
                      {sending ? "Sending…" : "Send me a demo →"}
                    </button>
                    <p className="mt-4 text-center text-sm font-medium text-text">No signup. No credit card. Just a text.</p>
                    <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                      By tapping send you agree to receive a text conversation from ShopDesk at this number. Msg &amp; data
                      rates may apply. Reply STOP to opt out.
                    </p>
                  </form>
                )}
              </m.div>
            )}

            {step === "sent" && (
              <m.div
                key="sent"
                custom={dir}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 text-center shadow-lift sm:p-12"
                aria-live="polite"
              >
                <PulsingPhone />
                <h2 className="mt-6 font-display text-4xl leading-tight text-text">
                  {alreadySent ? "You already have a demo" : "Check your phone"}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">
                  {alreadySent ? (
                    <>
                      We&rsquo;ve already started a demo with this number. Find the text from ShopDesk and keep replying
                      &mdash; or try a different number.
                    </>
                  ) : (
                    <>
                      Our AI just texted you as if you were a lead for <strong className="font-semibold text-text">{business.trim()}</strong>.
                      Reply to it and watch what happens.
                    </>
                  )}
                </p>
                {!alreadySent && (
                  <p className="mt-4 text-sm text-muted">
                    Sent to {formatPhone(phone)} &middot; it can take up to a minute to arrive.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    go("phone", -1);
                  }}
                  className="mt-6 rounded-lg px-2 py-1 text-sm font-medium text-muted underline underline-offset-4 transition hover:text-text"
                >
                  Wrong number? Use a different one
                </button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {unlocked && <ProofAndPricing onRestart={restart} />}
    </>
  );
}

function Options({
  options,
  selected,
  onPick,
  cols = false,
}: {
  options: string[];
  selected: string | null;
  onPick: (value: string) => void;
  cols?: boolean;
}) {
  return (
    <ul className={`mt-6 grid gap-3 ${cols ? "grid-cols-2" : "grid-cols-1"}`}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <li key={option}>
            <m.button
              type="button"
              onClick={() => onPick(option)}
              whileTap={{ scale: 0.98 }}
              aria-pressed={active}
              className={`w-full rounded-2xl border px-5 py-4 text-left text-base font-semibold transition-colors ${
 active ? "border-text bg-accent text-text" : "border-line bg-surface text-text hover:border-text hover:bg-accent/15"
 }`}
            >
              {option}
            </m.button>
          </li>
        );
      })}
    </ul>
  );
}

function PulsingPhone() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center" aria-hidden>
      <m.span
        className="absolute inset-0 rounded-full bg-accent"
        animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <m.span
        className="absolute inset-3 rounded-full bg-accent"
        animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
      />
      <m.span
        className="relative text-5xl"
        animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        📱
      </m.span>
    </div>
  );
}
