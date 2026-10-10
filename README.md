# ShopDesk Dashboard

One Next.js app that serves every ShopDesk client's dashboard. A shop's entry in
[`config/shops.ts`](config/shops.ts) drives its branding, nav, features, and Call Mode content.

| URL                      | What                                    | Needs feature        |
| ------------------------ | --------------------------------------- | -------------------- |
| `/login?shop=<id>`       | Shared sign-in, themed for that shop    | —                    |
| `/<shopId>`              | Conversations (+ stats, demo trigger)   | `conversations`      |
| `/<shopId>/calls`        | Call history                            | `callHistory`        |
| `/<shopId>/schedule`     | Week calendar, book/block/cancel        | `schedule`           |
| `/<shopId>/leads`        | All leads, status management            | `leads`              |

A page whose feature isn't enabled for that shop renders the 404 page.

## Running it locally

```bash
npm install
npm run dev                # http://localhost:3000
```

> ⚠️ **By default this talks to the live production backend.** Signing in as a real client and
> clicking things (Send message, Kill lead, Call Mode texts, Revive…) acts on real customers.
> To develop against a local backend instead:
>
> ```bash
> NEXT_PUBLIC_API_URL=http://localhost:3055 npm run dev
> ```
>
> Use `localhost:3000` for the dev server — it's on the backend's CORS allowlist.

`npm run build` type-checks, lints, and prerenders every shop's pages.

## Features (flags in `shop.features`)

`conversations` · `callHistory` · `schedule` · `leads` · `callMode` · `deposits` · `reviveMode` ·
`calendarManagement` · `notes` · `demoTrigger`

- `callMode` adds the Call Mode button and "Call now" badge. Its script, quick facts and one-tap texts
  come from `shop.callMode` (see `config/call-mode/`). Availability/booking buttons also need `schedule`;
  the deposit button needs `deposits`.
- `calendarManagement` makes the schedule interactive (book, block, unblock, appointment details, cancel).
  Without it the calendar is read-only.
- `reviveMode` adds the "Revive dead leads" flow to the Schedule page (needs `shop.revive`).
- `notes` adds internal staff notes (appointment details + Call Mode). Notes are saved on the backend per customer, so a note
  written in Call Mode also shows on that customer's appointments. Without the flag, Call Mode's note box only goes in the call log.
  The backend's `/admin/notes` routes are currently scoped to Pure Vision Tints, so only enable it for that shop for now.
- `demoTrigger` adds the demo card to the Conversations page (needs `shop.demoTrigger`).

## Adding a client

1. Add an entry to `SHOPS` in `config/shops.ts` (copy a similar shop). Pick fonts from the `FontName` list
   (adding a new font = one line each in `lib/fonts.ts` and `lib/theme.ts`).
2. Add the shop to `SHOP_CONFIGS` on the backend, plus its system prompt, and — if it isn't using the
   generic route — a `/api/conversations/<shopId>` route whose password matches `smsPassword`.
3. Deploy.

The same `shop.id` must be used here and as the backend `shop_id`.

## Things to know

**Credentials ship to the browser.** `config/shops.ts` contains every client's login, SMS password, and the
shared admin secret, and it is bundled into the JavaScript every visitor downloads. That matches how the old
single-file dashboards worked, but with one app, *any* visitor — including one client — can read *every*
client's credentials. Moving the login check server-side (a route handler that returns only the signed-in
shop's secrets) is the natural next step before real client data is behind a public URL.

**Backend CORS.** The backend only accepts browser requests from a short allowlist of origins. Add the
production dashboard origin (e.g. `https://dashboard.shopdesk.ai`) and any Vercel preview origins to its
`cors` config, or every POST (toggle mode, send message, kill, book, demo trigger) will be blocked by the
browser, while reads keep working.

**Timezones.** Message and lead timestamps are shown in `shop.timezone`. The calendar endpoints report
dates/hours in the backend's timezone (Central), so a shop with a `schedule` should use a Central timezone.

**`calendarId`** in a shop's config is informational: the backend reads a single calendar from its own env.

## Layout

```
app/                  routes (login, [shopId]/…), root layout
components/           Layout, ConversationList, CallMode, CalendarGrid, LeadsTable, CallHistory,
                      ReviveMode, DemoTrigger, StatsRow, MessageBubble, LoginScreen, calendar/*, ui/*
config/               shops.ts, types.ts, call-mode/*
lib/                  api.ts (all backend calls), format.ts, theme.ts, fonts.ts, session.ts, calendar.ts
```

Theming: each shop's colors and fonts are applied as CSS variables on its page wrapper (server-rendered,
so there's no flash of the wrong brand); Tailwind utilities such as `bg-accent` and `text-muted` read them.
