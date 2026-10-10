import type { Lead } from "@/lib/types";

/** Everything a dashboard can turn on or off per shop. */
export type Feature =
  | "conversations"
  | "callHistory"
  | "schedule"
  | "leads"
  | "callMode"
  | "deposits"
  | "reviveMode"
  | "calendarManagement"
  | "notes"
  | "demoTrigger";

/** Fonts the app knows how to load (see lib/fonts.ts). A typo here is a compile error. */
export type FontName =
  | "DM Serif Display"
  | "DM Sans"
  | "Bebas Neue"
  | "Outfit"
  | "Inter"
  | "Fraunces";

export interface ShopTheme {
  accent: string;
  accentDark: string;
  surface: string;
  surface2: string;
  bg: string;
  displayFont: FontName;
  bodyFont: FontName;
}

/** A line in Call Mode's "Quick facts". */
export interface CallFact {
  text: string;
  /** Optional prefix, e.g. "Booking page". */
  label?: string;
  href?: string;
  /** Draws attention (orange marker), e.g. a vehicle-specific caveat. */
  highlight?: boolean;
}

/** A one-tap text the rep can send from Call Mode. */
export interface QuickText {
  id: string;
  label: string;
  icon: "link" | "star" | "camera" | "pin" | "tag" | "message";
  text: string;
  /** If set, sent through Blooio as an attachment so the link is tappable. */
  attachmentUrl?: string;
}

/** Shop-specific Call Mode content. Only used when the "callMode" feature is on. */
export interface CallModeConfig {
  script: (lead: Lead) => string;
  facts: (lead: Lead) => CallFact[];
  quickTexts: (lead: Lead) => QuickText[];
}

export interface ScheduleConfig {
  /** Bookable slots shown as rows in the week grid. `hour` is 24h, shop-local. */
  slots: { label: string; hour: number }[];
  /** How long a booking occupies on the calendar (display only — the backend decides). */
  durationHours: number;
  /** Calendar event titles look like "<prefix><customer name>". */
  eventPrefixes: string[];
}

export interface ReviveConfig {
  /** The text a dead/MIA lead receives. */
  message: (lead: Lead) => string;
}

export interface DemoTriggerConfig {
  /** Field name the backend's fieldMapping reads the vehicle/interest from. */
  vehicleField: string;
  vehicleLabel: string;
  vehiclePlaceholder: string;
  /** If present, shows a service dropdown sent as `lead_special_override`. */
  services?: string[];
  serviceLabel?: string;
}

export interface Shop {
  /** Matches the backend shop_id. Filled in from the key by defineShops(). */
  id: string;
  name: string;
  location: string;
  timezone: string;
  username: string;
  password: string;
  /** Passed as ?password= to the /api/conversations and /api/call-logs routes. */
  smsPassword: string;
  /** Sent as `secret` to /admin/* routes. */
  adminSecret: string;
  theme: ShopTheme;
  features: Feature[];
  /**
   * Informational only. The backend currently reads one calendar from its own
   * GOOGLE_CALENDAR_ID env var and ignores anything sent from here.
   */
  calendarId?: string;
  phone?: string;
  /** First name shown in the manual-message placeholder, e.g. "Type a message as Jordy". */
  owner?: string;
  /** [SEND_PHOTO: key] tags the AI can send → image/video URL. */
  photos?: Record<string, string>;
  demoTrigger?: DemoTriggerConfig;
  callMode?: CallModeConfig;
  schedule?: ScheduleConfig;
  revive?: ReviveConfig;
}
