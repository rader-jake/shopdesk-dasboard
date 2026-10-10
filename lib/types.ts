/** Row shapes returned by the backend (SQLite columns, snake_case). */

export interface Lead {
  id: number;
  shop_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  lead_vehicle: string | null;
  lead_special: string | null;
  call_status: string | null;
  call_id?: string | null;
  call_attempts?: number | null;
  /** "YYYY-MM-DD HH:mm" in the shop's local time, set when an appointment is booked. */
  booked_at: string | null;
  deposit_sent?: number | null;
  deposit_paid?: number | null;
  /** 1 = a human is handling it and the AI stays quiet. */
  manual_mode: number | null;
  /** SQLite CURRENT_TIMESTAMP — UTC, no zone suffix. */
  created_at: string;
}

export interface Message {
  id: number;
  lead_id: number;
  direction: "inbound" | "outbound";
  body: string;
  /** SQLite CURRENT_TIMESTAMP — UTC, no zone suffix. */
  created_at: string;
}

export interface CallLog {
  id: number;
  lead_id: number | null;
  shop_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  outcome: string;
  notes: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  /** ISO timestamp from Google Calendar. */
  start: string;
  /** Hour of day in the backend's timezone (Central). */
  hour: number;
  /** YYYY-MM-DD in the backend's timezone (Central). */
  date: string;
  isBlocked: boolean;
}

/** Internal staff note (never sent to the customer). */
export interface LeadNote {
  id: number;
  lead_id: number | null;
  /** Google Calendar event id, when the note was written from an appointment. */
  event_id: string | null;
  body: string;
  author: string | null;
  source: "appointment" | "call";
  /** ISO timestamp (UTC). */
  created_at: string;
}

export type LeadStatus =
  | "pending"
  | "sms_fallback"
  | "booked"
  | "confirmed"
  | "completed"
  | "mia"
  | "dead"
  | "opted_out"
  | "calling";
