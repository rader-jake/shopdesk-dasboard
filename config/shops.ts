import type { Shop, ShopTheme } from "@/config/types";
import { proAutoCallMode } from "@/config/call-mode/pro-auto";
import { pureVisionCallMode } from "@/config/call-mode/pure-vision";

/**
 * One entry per client. To onboard a new client, add an entry here (and the
 * matching shop on the backend) — no new pages or components needed.
 *
 * ⚠️ Credentials live in this file, so they ship to every visitor's browser.
 *    That matches how the old HTML dashboards worked, but see the README
 *    before pointing real customer data at a public deployment.
 */
function defineShops(shops: Record<string, Omit<Shop, "id">>): Record<string, Shop> {
  return Object.fromEntries(Object.entries(shops).map(([id, shop]) => [id, { id, ...shop }]));
}

export const SHOPS: Record<string, Shop> = defineShops({
  "pure-vision-tints": {
    name: "Pure Vision Tints",
    location: "Hockley, TX",
    timezone: "America/Chicago",
    username: "jordy",
    password: "purevision2026",
    smsPassword: "purevision2026",
    adminSecret: "purevision2026",
    theme: {
      accent: "#c8ff00",
      accentDark: "#4a5a00",
      surface: "#1a1a18",
      surface2: "#232320",
      bg: "#111110",
      displayFont: "DM Serif Display",
      bodyFont: "DM Sans",
    },
    features: [
      "conversations",
      "callHistory",
      "schedule",
      "leads",
      "callMode",
      "deposits",
      "reviveMode",
      "calendarManagement",
      // The backend's /admin/notes routes are scoped to Pure Vision Tints for now.
      "notes",
    ],
    calendarId: "primary",
    phone: "(832) 741-1485",
    owner: "Jordy",
    photos: {
      ceramic_special_video: "https://shopdesk.ai/tints/ceramic-special.gif",
      shade_levels: "https://shopdesk.ai/tints/shade-levels.png",
    },
    schedule: {
      slots: [
        { label: "9 AM", hour: 9 },
        { label: "11 AM", hour: 11 },
        { label: "1 PM", hour: 13 },
        { label: "3 PM", hour: 15 },
        { label: "5 PM", hour: 17 },
      ],
      durationHours: 2,
      eventPrefixes: ["Tint Appointment — "],
    },
    callMode: pureVisionCallMode,
    revive: {
      // Copied verbatim from Jordy's dashboard. Note the prices/film here ($395/$545, Xpel XR Black)
      // differ from the current Call Mode special ($299, HITEK) — update before using.
      message: (lead) =>
        `Hey ${lead.lead_name}! We just had a cancellation this week at Pure Vision Tints and Jordy wants to fill the slot. He's offering:\n\n🔥 All windows + rear + visor — $350 (normally $395)\n🔥 Full package with front windshield — $500 (normally $545)\n\nXpel XR Black ceramic, lifetime warranty, same premium service. This is first come first served — once the slots fill up this deal's gone. Want me to lock you in?`,
    },
  },

  "pro-auto-designs": {
    name: "Pro Auto Design",
    location: "Sacramento, CA",
    timezone: "America/Los_Angeles",
    username: "proauto",
    password: "proauto2026",
    smsPassword: "proauto2026",
    adminSecret: "purevision2026",
    theme: {
      accent: "#d4a843",
      accentDark: "#5a4418",
      surface: "#141414",
      surface2: "#1e1e1e",
      bg: "#0a0a0a",
      displayFont: "DM Serif Display",
      bodyFont: "DM Sans",
    },
    features: ["conversations", "leads", "demoTrigger", "callMode"],
    phone: "(916) 844-6905",
    callMode: proAutoCallMode,
    demoTrigger: {
      vehicleField: "Vehicle Information",
      vehicleLabel: "Vehicle",
      vehiclePlaceholder: "2022 Tesla Model 3",
      serviceLabel: "Service",
      services: ["Nano-Ceramic Tint", "Nano-Carbon Tint", "Ceramic Coating", "Paintless Dent Repair", "General Inquiry"],
    },
  },

  "southwest-epoxy": {
    name: "Southwest Epoxy",
    location: "Houston, TX",
    timezone: "America/Chicago",
    username: "ling",
    password: "southwestepoxy",
    smsPassword: "southwestepoxy",
    adminSecret: "purevision2026",
    theme: {
      accent: "#f97316",
      accentDark: "#7c2d12",
      surface: "#1a1510",
      surface2: "#231e16",
      bg: "#110e0a",
      displayFont: "Bebas Neue",
      bodyFont: "Outfit",
    },
    features: ["conversations", "leads"],
    owner: "Ling",
    photos: {
      completed_garage: "https://shopdesk.ai/epoxy/completed-garage-1.jpg",
      completed_garage_2: "https://shopdesk.ai/epoxy/completed-garage-2.jpg",
      completed_garage_3: "https://shopdesk.ai/epoxy/completed-garage-3.jpg",
      color_chart: "https://shopdesk.ai/epoxy/color-chart.jpg",
      recent_job: "https://shopdesk.ai/epoxy/completed-garage-1.jpg",
    },
  },

  "apex-window-tinting": {
    name: "Apex Window Tinting",
    location: "Reno, NV",
    timezone: "America/Los_Angeles",
    username: "apex",
    password: "apex2026",
    smsPassword: "apex2026",
    adminSecret: "purevision2026",
    theme: {
      accent: "#1e6fff",
      accentDark: "#0a2a66",
      surface: "#12151c",
      surface2: "#1a1e28",
      bg: "#0a0c10",
      displayFont: "Bebas Neue",
      bodyFont: "Inter",
    },
    features: ["conversations", "leads", "demoTrigger"],
    demoTrigger: {
      vehicleField: "Vehicle Information",
      vehicleLabel: "Vehicle",
      vehiclePlaceholder: "2021 Honda Accord",
      serviceLabel: "Special",
      services: ["Summer Special", "Value Special"],
    },
  },

  "backyard-fun-pools": {
    name: "Backyard Fun Pools",
    location: "Katy, TX",
    timezone: "America/Chicago",
    username: "randall",
    password: "backyardfun",
    smsPassword: "backyardfun2026",
    adminSecret: "purevision2026",
    theme: {
      accent: "#0ea5e9",
      accentDark: "#0c4a6e",
      surface: "#0f1b2d",
      surface2: "#162336",
      bg: "#0a1220",
      displayFont: "Fraunces",
      bodyFont: "Outfit",
    },
    features: ["conversations", "leads", "demoTrigger"],
    owner: "Randall",
    photos: {
      classic_layout: "https://shopdesk.ai/pools/classic-layout.png",
      cloud_layout: "https://shopdesk.ai/pools/cloud-layout.png",
      pool_color_chart: "https://shopdesk.ai/pools/color-chart.png",
      completed_pool: "https://shopdesk.ai/pools/completed-pool.png",
      cool_breeze_layout: "https://shopdesk.ai/pools/cool-breeze-layout.png",
      plunge_pool: "https://shopdesk.ai/pools/plunge-pool.png",
      roman_layout: "https://shopdesk.ai/pools/roman-layout.png",
      tuscany_layout: "https://shopdesk.ai/pools/tuscany-layout.png",
    },
    demoTrigger: {
      vehicleField: "interest",
      vehicleLabel: "Interest",
      vehiclePlaceholder: "Pool + Spa",
    },
  },
});

/** Neutral ShopDesk look for screens shown before we know which shop is signing in. */
export const DEFAULT_THEME: ShopTheme = {
  accent: "#c8ff00",
  accentDark: "#4a5a00",
  surface: "#161615",
  surface2: "#1f1f1d",
  bg: "#0c0c0b",
  displayFont: "DM Serif Display",
  bodyFont: "DM Sans",
};

export function getShop(id: string | null | undefined): Shop | undefined {
  return id && Object.hasOwn(SHOPS, id) ? SHOPS[id] : undefined;
}

export function hasFeature(shop: Shop, feature: Shop["features"][number]): boolean {
  return shop.features.includes(feature);
}

/** Client-side credential check against the shop config. */
export function findShopByCredentials(username: string, password: string): Shop | undefined {
  const u = username.trim().toLowerCase();
  return Object.values(SHOPS).find((s) => s.username.toLowerCase() === u && s.password === password);
}
