import { DM_Sans, DM_Serif_Display } from "next/font/google";

/**
 * Fonts for the public site (/, /beauty). Separate from lib/fonts.ts on purpose: the dashboards load
 * their fonts lazily (`preload: false`), but the landing page needs these on first paint.
 * Only the marketing layout imports this file, so dashboard pages never preload these.
 */
export const mkSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-mk-serif" });
export const mkSans = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-mk-sans" });
