import type { CalendarEvent, CallLog, Lead, LeadNote, Message } from "@/lib/types";

/**
 * Backend base URL. Override with NEXT_PUBLIC_API_URL (build-time) to point a local
 * dev server at a local backend. Defaults to production.
 */
export const API = process.env.NEXT_PUBLIC_API_URL ?? "https://purevision-backend-production.up.railway.app";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageFrom(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.error === "string") return d.error;
    if (typeof d.response === "string") return d.response;
  }
  return undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${API}${path}`, init);
  } catch {
    throw new ApiError("Couldn’t reach the server", 0);
  }
  let data: unknown = null;
  try {
    data = await resp.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!resp.ok) throw new ApiError(messageFrom(data) ?? `Request failed (${resp.status})`, resp.status);
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Some /tools/* routes answer HTTP 200 with `success: false` — treat that as a failure. */
function assertSuccess<T extends { success?: boolean }>(data: T): T {
  if (data.success === false) throw new ApiError(messageFrom(data) ?? "The request didn’t go through", 200);
  return data;
}

const q = encodeURIComponent;

// ── Reads ─────────────────────────────────────────────────────────────────────

export function getLeads(shopId: string): Promise<Lead[]> {
  return request<Lead[]>(`/api/leads/${q(shopId)}`);
}

export function getConversations(shopId: string, password: string): Promise<Message[]> {
  return request<Message[]>(`/api/conversations/${q(shopId)}?password=${q(password)}`);
}

export function getCallLogs(shopId: string, password: string): Promise<CallLog[]> {
  return request<CallLog[]>(`/api/call-logs/${q(shopId)}?password=${q(password)}`);
}

export async function getCalendarWeek(secret: string, start: string): Promise<CalendarEvent[]> {
  const data = await request<{ events?: CalendarEvent[] }>(`/admin/calendar-week?secret=${q(secret)}&start=${q(start)}`);
  return data.events ?? [];
}

export type RevivableLead = Lead & { last_inbound: string | null; last_outbound: string | null; msg_count: number };

export function getRevivableLeads(secret: string): Promise<RevivableLead[]> {
  return request<RevivableLead[]>(`/admin/revivable-leads?secret=${q(secret)}`);
}

// ── Lead actions (admin) ──────────────────────────────────────────────────────

export function sendMessage(secret: string, leadId: number, message: string): Promise<void> {
  return post<{ success: boolean }>("/admin/send-message", { secret, lead_id: leadId, message }).then(() => undefined);
}

/** Sends a photo (base64 JPEG/PNG/GIF, no data: prefix) as an MMS, with an optional caption. Resolves to the stored photo's id. */
export function sendPhoto(secret: string, leadId: number, image: string, caption: string): Promise<string> {
  return post<{ success: boolean; media_id: string }>("/admin/send-photo", {
    secret,
    lead_id: leadId,
    image,
    caption,
  }).then((r) => r.media_id);
}

/** Sends `message` with `attachmentUrl` attached so the link is tappable. */
export function sendMessageWithLink(secret: string, leadId: number, message: string, attachmentUrl: string): Promise<void> {
  return post<{ success: boolean }>("/admin/send-message-with-link", {
    secret,
    lead_id: leadId,
    message,
    attachment_url: attachmentUrl,
  }).then(() => undefined);
}

export function toggleManualMode(secret: string, leadId: number, mode: number): Promise<void> {
  return post<{ success: boolean }>("/admin/toggle-manual-mode", { secret, lead_id: leadId, manual_mode: mode }).then(() => undefined);
}

export function updateLeadStatus(secret: string, leadId: number, status: string): Promise<void> {
  return post<{ success: boolean }>("/admin/update-lead-status", { secret, lead_id: leadId, status }).then(() => undefined);
}

export interface LogCallInput {
  lead_id: number;
  shop_id: string;
  lead_name: string | null;
  lead_phone: string | null;
  outcome: string;
  notes: string;
}

export function logCall(secret: string, data: LogCallInput): Promise<void> {
  return post<{ success: boolean }>("/admin/log-call", { secret, ...data }).then(() => undefined);
}

export function sendDiscount(secret: string, leadId: number, message: string): Promise<void> {
  return post<{ success: boolean }>("/admin/send-discount", { secret, lead_id: leadId, message }).then(() => undefined);
}

// ── Calendar ──────────────────────────────────────────────────────────────────

/** Blocks a slot by creating a "Blocked" calendar event. `date` is YYYY-MM-DD. */
export function blockSlot(secret: string, date: string, hour: number): Promise<void> {
  return post<{ success: boolean }>("/admin/block-slot", { secret, date, hour }).then(() => undefined);
}

/** Deletes a calendar event by id — used both to unblock a slot and to cancel an appointment. */
export function unblockSlot(secret: string, eventId: string): Promise<void> {
  return post<{ success: boolean }>("/admin/unblock-slot", { secret, eventId }).then(() => undefined);
}

export interface Availability {
  slots: string[];
  friendlyDate?: string;
  message: string;
}

export async function checkAvailability(date: string): Promise<Availability> {
  const data = await post<{ available_slots?: string[]; friendly_date?: string; response?: string }>(
    "/tools/get-availability",
    { date },
  );
  return { slots: data.available_slots ?? [], friendlyDate: data.friendly_date, message: data.response ?? "" };
}

export interface BookAppointmentInput {
  lead_name: string;
  lead_phone: string;
  lead_vehicle: string;
  lead_special: string;
  /** "YYYY-MM-DD HH:mm", shop-local. */
  appointment_time: string;
}

/**
 * Books the calendar event and marks the lead booked. Note the backend answers
 * `success: true` even when the calendar insert fails, so callers should refresh
 * the calendar rather than trust this alone.
 */
export async function bookAppointment(data: BookAppointmentInput): Promise<void> {
  assertSuccess(await post<{ success?: boolean; response?: string }>("/tools/book-appointment", data));
}

export async function sendDeposit(name: string, phone: string): Promise<void> {
  assertSuccess(await post<{ success?: boolean; response?: string }>("/tools/send-deposit", { lead_name: name, lead_phone: phone }));
}

// ── Demo trigger ──────────────────────────────────────────────────────────────

export interface DemoTriggerResult {
  received?: boolean;
  leadId?: number;
  duplicate?: boolean;
}

/** Fires a fake inbound lead; the backend texts the number after a 30–90s human-style delay. */
export function triggerDemo(shopId: string, payload: Record<string, string>): Promise<DemoTriggerResult> {
  return post<DemoTriggerResult>(`/webhook/sms-only/${q(shopId)}`, payload);
}

// ── Internal notes ────────────────────────────────────────────────────────────
// A customer's notes follow them across appointments and Call Mode; pass the lead
// id and/or the calendar event id to scope a read or a write.

export async function getNotes(secret: string, ref: { leadId?: number | null; eventId?: string | null }): Promise<LeadNote[]> {
  const params = new URLSearchParams({ secret });
  if (ref.leadId) params.set("lead_id", String(ref.leadId));
  if (ref.eventId) params.set("event_id", ref.eventId);
  const data = await request<{ notes: LeadNote[] }>(`/admin/notes?${params}`);
  return data.notes ?? [];
}

export interface AddNoteInput {
  leadId?: number | null;
  eventId?: string | null;
  body: string;
  author: string;
  source: "appointment" | "call";
}

export async function addNote(secret: string, input: AddNoteInput): Promise<LeadNote> {
  const data = await post<{ success: boolean; note: LeadNote }>("/admin/add-note", {
    secret,
    lead_id: input.leadId ?? undefined,
    event_id: input.eventId ?? undefined,
    body: input.body,
    author: input.author,
    source: input.source,
  });
  return data.note;
}

export function deleteNote(secret: string, noteId: number): Promise<void> {
  return post<{ success: boolean }>("/admin/delete-note", { secret, note_id: noteId }).then(() => undefined);
}
