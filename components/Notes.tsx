"use client";

import { useCallback, useEffect, useState } from "react";
import { StickyNote, X } from "lucide-react";
import { useDashboard } from "@/components/DashboardProvider";
import { Button } from "@/components/ui/button";
import { ApiError, addNote, deleteNote, getNotes } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate } from "@/lib/format";
import type { LeadNote } from "@/lib/types";

/**
 * Loads a customer's internal notes. Mount it under a `key` that changes with the
 * lead/appointment so state resets cleanly.
 */
export function useNotes(
  ref: { leadId?: number | null; eventId?: string | null },
  source: "appointment" | "call",
  enabled = true,
) {
  const { shop } = useDashboard();
  const { leadId, eventId } = ref;
  const [notes, setNotes] = useState<LeadNote[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getNotes(shop.adminSecret, { leadId, eventId })
      .then((n) => !cancelled && setNotes(n))
      .catch((e) => !cancelled && setLoadError(e instanceof ApiError ? e.message : "Couldn’t load notes"));
    return () => {
      cancelled = true;
    };
  }, [enabled, shop.adminSecret, leadId, eventId]);

  /** Saves a note and puts it at the top of the list. Throws ApiError on failure. */
  const add = useCallback(
    async (body: string) => {
      const note = await addNote(shop.adminSecret, { leadId, eventId, body, author: shop.owner ?? "Staff", source });
      setNotes((prev) => [note, ...(prev ?? [])]);
    },
    [shop.adminSecret, shop.owner, leadId, eventId, source],
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteNote(shop.adminSecret, id);
      setNotes((prev) => (prev ?? []).filter((n) => n.id !== id));
    },
    [shop.adminSecret],
  );

  return { notes, loadError, add, remove };
}

type NotesApi = ReturnType<typeof useNotes>;

interface NotesSectionProps extends NotesApi {
  draft: string;
  onDraft: (value: string) => void;
  /** The appointment the notes are being viewed from, so notes from elsewhere get a tag. */
  eventId?: string | null;
}

/** The notes box + list. The parent owns the draft so Call Mode can save it with an outcome. */
export function NotesSection({ notes, loadError, add, remove, draft, onDraft, eventId }: NotesSectionProps) {
  const { shop } = useDashboard();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const submit = async () => {
    const body = draft.trim();
    if (!body) {
      setError("Type a note first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await add(body);
      onDraft("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t save the note");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: number) => {
    setError(null);
    try {
      await remove(id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t delete the note");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3">
        <div className="flex items-center gap-2 font-display text-lg">
          <StickyNote className="size-4 text-accent" aria-hidden />
          Notes
          {notes && notes.length > 0 && <span className="font-sans text-xs text-muted">({notes.length})</span>}
        </div>
        <div className="text-[11px] text-muted">Internal · never sent to the customer</div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Add a note for the team…"
          aria-label="New note"
          className="min-h-11 w-full min-w-0 flex-1 resize-y rounded-xl border border-line bg-surface2 px-3.5 py-2.5 text-base outline-none placeholder:text-muted/60 focus:border-accent/50 sm:text-sm"
        />
        <Button variant="primary" onClick={() => void submit()} disabled={saving} className="shrink-0">
          {saving ? "Saving…" : "Add note"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {loadError ? (
          <li className="text-xs text-danger">Couldn’t load notes: {loadError}</li>
        ) : notes === null ? (
          <li className="text-xs text-muted">Loading…</li>
        ) : notes.length === 0 ? (
          <li className="text-xs text-muted">No notes yet. Add the first one above.</li>
        ) : (
          notes.map((n) => {
            const tag = n.source === "call" ? "Call" : n.event_id && n.event_id === eventId ? null : "Appointment";
            return (
              <li key={n.id} className="rounded-xl border border-line border-l-2 border-l-accent bg-text/[0.03] px-3.5 py-2.5">
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted">
                  <span>
                    <span className="font-medium text-text/75">{n.author ?? "Staff"}</span> · {fmtDate(n.created_at, shop.timezone)}
                    {tag && <> · {tag}</>}
                  </span>
                  {confirmId === n.id ? (
                    <span className="flex shrink-0 items-center gap-2">
                      Delete?
                      <button type="button" onClick={() => void confirmDelete(n.id)} className="font-semibold text-danger hover:underline">
                        Yes
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className="hover:text-text">
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(n.id)}
                      aria-label="Delete note"
                      className={cn("shrink-0 rounded p-0.5 transition hover:text-danger")}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap">{n.body}</p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

/** Self-contained notes for an appointment. */
export function AppointmentNotes({ leadId, eventId }: { leadId: number | null; eventId: string }) {
  const api = useNotes({ leadId, eventId }, "appointment");
  const [draft, setDraft] = useState("");
  return <NotesSection {...api} draft={draft} onDraft={setDraft} eventId={eventId} />;
}
