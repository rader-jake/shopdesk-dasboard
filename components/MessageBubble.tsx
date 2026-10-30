"use client";

import { useDashboard } from "@/components/DashboardProvider";
import { API } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtDate, initials } from "@/lib/format";
import type { Message } from "@/lib/types";

type Part = { kind: "text"; text: string } | { kind: "media"; key: string; url: string; video: boolean };

/**
 * Splits a message into text and media: `[SEND_PHOTO: key]` (the AI's hosted photos, looked up in the
 * shop config) and `[MEDIA: id]` (a photo sent from the dashboard, served by the backend). Unknown keys are dropped.
 * Everything is returned as data and rendered as React nodes, so message text is
 * always escaped — nothing a customer types can inject markup.
 */
export function parseMessageBody(body: string, photos: Record<string, string>): Part[] {
  const parts: Part[] = [];
  const re = /\[(SEND_PHOTO|MEDIA): (\w+)\]/g;
  let last = 0;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    if (m.index > last) parts.push({ kind: "text", text: body.slice(last, m.index) });
    const url = m[1] === "MEDIA" ? `${API}/media/${m[2]}` : Object.hasOwn(photos, m[2]) ? photos[m[2]] : undefined;
    if (url) parts.push({ kind: "media", key: m[2], url, video: /\.(mp4|mov)$/i.test(url) });
    last = m.index + m[0].length;
  }
  if (last < body.length) parts.push({ kind: "text", text: body.slice(last) });
  return parts;
}

export function MessageBody({ body }: { body: string }) {
  const { shop } = useDashboard();
  const parts = parseMessageBody(body ?? "", shop.photos ?? {});
  const hasContent = parts.some((p) => p.kind === "media" || p.text.trim());
  if (!hasContent) return <span className="text-muted">[photo]</span>;
  return (
    <>
      {parts.map((p, i) =>
        p.kind === "text" ? (
          <span key={i}>{i === 0 ? p.text.trimStart() : p.text}</span>
        ) : p.video ? (
          <video key={i} src={p.url} controls muted playsInline className="mt-1.5 block w-full max-w-[220px] rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- remote URLs from shop config, unknown dimensions
          <img key={i} src={p.url} alt="" loading="lazy" className="mt-1.5 block w-full max-w-[220px] rounded-lg" />
        ),
      )}
    </>
  );
}

export function MessageBubble({ message, leadName }: { message: Message; leadName: string | null }) {
  const { shop } = useDashboard();
  const out = message.direction === "outbound";

  return (
    <div className={cn("flex items-start gap-2.5", !out && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[9.5px] font-semibold",
          out ? "bg-accent/15 text-accent" : "bg-text/10 text-muted",
        )}
      >
        {out ? initials(shop.name) : initials(leadName)}
      </div>
      <div className={cn("flex max-w-[78%] flex-col", !out && "items-end")}>
        <div
          className={cn(
            "px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere]",
            out
              ? "rounded-[3px_14px_14px_14px] border border-accent/20 bg-accent/10"
              : "rounded-[14px_3px_14px_14px] border border-line bg-text/5",
          )}
        >
          <MessageBody body={message.body} />
        </div>
        <div className="mt-1 font-mono text-[10.5px] text-muted/80">{fmtDate(message.created_at, shop.timezone)}</div>
      </div>
    </div>
  );
}
