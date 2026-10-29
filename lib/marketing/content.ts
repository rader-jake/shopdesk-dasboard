/**
 * Copy for the "after the demo" section. Everything here comes from ShopDesk's existing pages
 * (the original landing page and the Beauty page) — nothing is invented. Edit freely.
 */

export const CONTACT_EMAIL = "hello@shopdesk.ai";

export const CLIENTS = [
  { name: "Pure Vision Tints", place: "Hockley, TX" },
  { name: "Southwest Epoxy Flooring", place: "Houston, TX" },
];

export const STEPS = [
  {
    title: "A lead comes in",
    body: "From your Facebook ad, your website form, anywhere. ShopDesk texts them within 60 seconds — before they call someone else.",
  },
  {
    title: "The AI runs the conversation",
    body: "It answers pricing questions, handles objections and follows up automatically until they're ready to book.",
  },
  {
    title: "It lands on your calendar",
    body: "When they're ready, ShopDesk checks your real calendar and books the appointment. You just show up.",
  },
];

export interface Plan {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  footnote: string;
}

export const PLANS: Plan[] = [
  {
    name: "Booking Page",
    price: "$25",
    blurb: "Your own branded booking page — no Acuity logo.",
    features: [
      "Custom-branded page: your logo, colors and fonts",
      "Online booking in under a minute, no client accounts",
      "Google Calendar sync",
      "SMS appointment reminders",
      "Service menu with pricing",
      "Set up for you — same day",
    ],
    cta: "Get a booking page",
    href: `mailto:${CONTACT_EMAIL}?subject=Booking%20Page%20%2825%2Fmo%29`,
    footnote: "No contracts · cancel anytime · 30-day refund",
  },
  {
    name: "AI Lead Manager",
    price: "$297",
    blurb: "The AI you just texted with, working your leads 24/7.",
    features: [
      "Instant SMS follow-up on every lead",
      "AI manages the full conversation",
      "Calendar sync and automatic booking",
      "Automatic follow-ups when they go quiet",
      "Lead pipeline dashboard",
      "A dedicated AI specialist for your business",
      "Up to 200 leads a month",
    ],
    cta: "Get the AI Lead Manager",
    href: `mailto:${CONTACT_EMAIL}?subject=AI%20Lead%20Manager%20%28%24297%2Fmo%29`,
    featured: true,
    footnote: "Cancel anytime · money-back guarantee",
  },
];

export interface Result {
  business: string;
  person: string;
  place: string;
  challenge: string;
  change: string;
  stats: { value: string; label: string }[];
}

export const RESULTS: Result[] = [
  {
    business: "Pure Vision Tints",
    person: "Jordy Chen",
    place: "Hockley, TX",
    challenge:
      "Leads were coming in faster than Jordy could handle. A receptionist couldn't follow up fast enough, so leads went cold.",
    change:
      "ShopDesk took over the lead flow. Every Facebook lead gets a text within 60 seconds, and the AI answers pricing questions and books straight into his calendar.",
    stats: [
      { value: "60s", label: "lead to first contact" },
      { value: "$0", label: "receptionist overhead" },
      { value: "100%", label: "of leads followed up" },
    ],
  },
  {
    business: "Southwest Epoxy Flooring",
    person: "Ling",
    place: "Houston, TX",
    challenge:
      "Facebook ads brought in solid lead volume, but manual follow-up was slow and leads moved on to the next company.",
    change:
      "ShopDesk plugged into the Facebook lead flow. Every inquiry gets an instant text, and the AI qualifies the project, collects the address and books a free estimate.",
    stats: [
      { value: "Instant", label: "lead response" },
      { value: "Auto", label: "calendar bookings" },
      { value: "Zero", label: "leads lost to slow follow-up" },
    ],
  },
];

export const FAQS = [
  {
    q: "How fast does it text a new lead?",
    a: "Within 60 seconds of the lead coming in, day or night. That speed is the whole point — the first business to reply usually wins the job.",
  },
  {
    q: "What does it cost?",
    a: "The Booking Page is $25 a month. The AI Lead Manager is $297 a month for up to 200 leads. No setup fees, no contracts, and you can cancel anytime.",
  },
  {
    q: "How long until I'm live?",
    a: "In under 24 hours. We set everything up for you, so there's nothing to build or learn on your end.",
  },
  {
    q: "Does it actually book appointments?",
    a: "Yes. It checks your real calendar and books the time with the customer, so there's no back-and-forth for you to handle.",
  },
  {
    q: "Can I step in and talk to a lead myself?",
    a: "Anytime. Every conversation shows up in your dashboard, and you can take over from the AI whenever you like.",
  },
  {
    q: "I just got a demo text. How do I stop it?",
    a: "Reply STOP to the text and it will stop. The demo is just one conversation so you can see how it feels.",
  },
];
