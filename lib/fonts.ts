import { Bebas_Neue, DM_Mono, DM_Sans, DM_Serif_Display, Fraunces, Inter, Outfit } from "next/font/google";
import type { FontName, ShopTheme } from "@/config/types";

/**
 * next/font requires literal options at module scope (no spreads, no shared
 * constants), so every supported font is declared here explicitly. The `variable`
 * names must match FONT_VAR / MONO_VAR in lib/theme.ts.
 *
 * A shop picks two fonts by name in its config; `fontClassName` applies only those
 * two (plus mono) to that shop's wrapper. `preload: false` keeps unused fonts from
 * being downloaded eagerly.
 */
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", display: "swap", preload: false, variable: "--font-dm-serif" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dm-sans" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "swap", preload: false, variable: "--font-bebas" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-fraunces" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false, variable: "--font-dm-mono" });

const FONTS: Record<FontName, { variable: string }> = {
  "DM Serif Display": dmSerif,
  "DM Sans": dmSans,
  "Bebas Neue": bebas,
  Outfit: outfit,
  Inter: inter,
  Fraunces: fraunces,
};

/** Class names that define the CSS variables for a theme's fonts. */
export function fontClassName(theme: ShopTheme): string {
  const vars = new Set([FONTS[theme.displayFont].variable, FONTS[theme.bodyFont].variable, dmMono.variable]);
  return [...vars].join(" ");
}
