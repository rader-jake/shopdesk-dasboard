import type { CSSProperties } from "react";
import type { FontName, ShopTheme } from "@/config/types";

/** CSS variable each font is exposed as (declared in lib/fonts.ts). */
export const FONT_VAR: Record<FontName, string> = {
  "DM Serif Display": "--font-dm-serif",
  "DM Sans": "--font-dm-sans",
  "Bebas Neue": "--font-bebas",
  Outfit: "--font-outfit",
  Inter: "--font-inter",
  Fraunces: "--font-fraunces",
};

const FONT_FALLBACK: Record<FontName, string> = {
  "DM Serif Display": "Georgia, serif",
  "DM Sans": "system-ui, sans-serif",
  "Bebas Neue": "Impact, sans-serif",
  Outfit: "system-ui, sans-serif",
  Inter: "system-ui, sans-serif",
  Fraunces: "Georgia, serif",
};

export const MONO_VAR = "--font-dm-mono";

function fontStack(name: FontName): string {
  return `var(${FONT_VAR[name]}), ${FONT_FALLBACK[name]}`;
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** White text on the accent if it's readable (WCAG 4:1+), otherwise near-black. */
export function onAccent(accent: string): string {
  const contrastWithWhite = 1.05 / (luminance(accent) + 0.05);
  return contrastWithWhite >= 4 ? "#ffffff" : "#0a0a0a";
}

/**
 * Turns a shop's theme into CSS custom properties. Applied as an inline style on
 * the page wrapper (server-rendered, so there's no flash of the wrong brand).
 * Tailwind utilities like `bg-accent` and `text-muted` read these (see globals.css).
 */
export function themeStyle(theme: ShopTheme): CSSProperties {
  return {
    "--bg": theme.bg,
    "--surface": theme.surface,
    "--surface2": theme.surface2,
    "--accent": theme.accent,
    "--accent-dark": theme.accentDark,
    "--on-accent": onAccent(theme.accent),
    "--display-stack": fontStack(theme.displayFont),
    "--body-stack": fontStack(theme.bodyFont),
  } as CSSProperties;
}
