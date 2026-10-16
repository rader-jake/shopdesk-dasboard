"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getCallLogs, getConversations, getLeads } from "@/lib/api";
import { hasFeature } from "@/config/shops";
import type { Shop } from "@/config/types";
import { parseTs } from "@/lib/format";
import type { CallLog, Lead, Message } from "@/lib/types";

const SLOW_POLL_MS = 15_000;
const FAST_POLL_MS = 5_000;

interface DashboardContextValue {
  shop: Shop;
  /** Base path for this shop's pages, e.g. "/pure-vision-tints". */
  base: string;
  leads: Lead[];
  messages: Message[];
  messagesByLead: Map<number, Message[]>;
  callLogs: CallLog[];
  /** "loading" only until the first successful fetch. */
  status: "loading" | "ready" | "error";
  /** HTTP status if the conversations request failed (e.g. 401 = wrong password), else null. */
  conversationsError: number | null;
  refresh: () => Promise<void>;
  /** Optimistically update a lead in memory (the server call is the caller's job). */
  patchLead: (id: number, patch: Partial<Lead>) => void;
  /** Optimistically append a message in memory. */
  addMessage: (m: Pick<Message, "lead_id" | "direction" | "body">) => void;
  /** Poll every few seconds for a while (e.g. while waiting for a demo text to arrive). */
  pollFast: (ms: number) => void;
  callModeLeadId: number | null;
  openCallMode: (leadId: number) => void;
  closeCallMode: () => void;
  /** Lead whose conversation should be opened when the conversations page mounts. */
  focusLeadId: number | null;
  clearFocus: () => void;
  openConversation: (leadId: number) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}

export function DashboardProvider({ shop, children }: { shop: Shop; children: ReactNode }) {
  const router = useRouter();
  const base = `/${shop.id}`;
  const wantsCallLogs = hasFeature(shop, "callHistory");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [status, setStatus] = useState<DashboardContextValue["status"]>("loading");
  const [conversationsError, setConversationsError] = useState<number | null>(null);
  const [callModeLeadId, setCallModeLeadId] = useState<number | null>(null);
  const [focusLeadId, setFocusLeadId] = useState<number | null>(null);
  const fastUntil = useRef(0);
  const hasData = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [leadsResult, messagesResult, logsResult] = await Promise.allSettled([
        getLeads(shop.id),
        getConversations(shop.id, shop.smsPassword),
        wantsCallLogs ? getCallLogs(shop.id, shop.smsPassword) : Promise.resolve([] as CallLog[]),
      ]);

      if (leadsResult.status === "rejected") throw leadsResult.reason;
      setLeads(Array.isArray(leadsResult.value) ? leadsResult.value : []);

      if (messagesResult.status === "fulfilled") {
        setMessages(Array.isArray(messagesResult.value) ? messagesResult.value : []);
        setConversationsError(null);
      } else {
        const code = (messagesResult.reason as { status?: number })?.status;
        setConversationsError(typeof code === "number" ? code : 0);
      }

      if (logsResult.status === "fulfilled") setCallLogs(Array.isArray(logsResult.value) ? logsResult.value : []);

      hasData.current = true;
      setStatus("ready");
    } catch {
      // Keep showing the last good data if we already have some.
      if (!hasData.current) setStatus("error");
    }
  }, [shop.id, shop.smsPassword, wantsCallLogs]);

  // Initial load + auto-refresh (faster while pollFast is active; paused when the tab is hidden).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (document.visibilityState === "visible" || !hasData.current) await refresh();
      if (cancelled) return;
      timer = setTimeout(tick, Date.now() < fastUntil.current ? FAST_POLL_MS : SLOW_POLL_MS);
    };
    void tick();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const patchLead = useCallback((id: number, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const addMessage = useCallback((m: Pick<Message, "lead_id" | "direction" | "body">) => {
    setMessages((prev) => [
      ...prev,
      { ...m, id: -Date.now(), created_at: new Date().toISOString().slice(0, 19).replace("T", " ") },
    ]);
  }, []);

  const pollFast = useCallback((ms: number) => {
    fastUntil.current = Math.max(fastUntil.current, Date.now() + ms);
  }, []);

  const openConversation = useCallback(
    (leadId: number) => {
      setFocusLeadId(leadId);
      router.push(base);
    },
    [router, base],
  );

  const messagesByLead = useMemo(() => {
    const map = new Map<number, Message[]>();
    for (const m of messages) {
      const list = map.get(m.lead_id);
      if (list) list.push(m);
      else map.set(m.lead_id, [m]);
    }
    // Oldest → newest. The server sorts by whole seconds, so messages sent in the same second
    // (e.g. a quick reply) can come back in either order; the id breaks the tie. Optimistic
    // messages (negative ids) haven't been saved yet, so they go last.
    const order = (m: Message) => (m.id < 0 ? Number.MAX_SAFE_INTEGER : m.id);
    for (const list of map.values()) {
      list.sort((a, b) => (parseTs(a.created_at)?.getTime() ?? 0) - (parseTs(b.created_at)?.getTime() ?? 0) || order(a) - order(b));
    }
    return map;
  }, [messages]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      shop,
      base,
      leads,
      messages,
      messagesByLead,
      callLogs,
      status,
      conversationsError,
      refresh,
      patchLead,
      addMessage,
      pollFast,
      callModeLeadId,
      openCallMode: setCallModeLeadId,
      closeCallMode: () => setCallModeLeadId(null),
      focusLeadId,
      clearFocus: () => setFocusLeadId(null),
      openConversation,
    }),
    [shop, base, leads, messages, messagesByLead, callLogs, status, conversationsError, refresh, patchLead, addMessage, pollFast, callModeLeadId, focusLeadId, openConversation],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
