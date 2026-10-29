export interface Industry {
  id: string;
  emoji: string;
  label: string;
}

export const INDUSTRIES: Industry[] = [
  { id: "tinting", emoji: "🔧", label: "Window Tinting" },
  { id: "detailing", emoji: "✨", label: "Auto Detailing" },
  { id: "ppf", emoji: "🛡️", label: "PPF & Wraps" },
  { id: "epoxy", emoji: "🏠", label: "Epoxy Flooring" },
  { id: "landscaping", emoji: "🌿", label: "Landscaping" },
  { id: "power-washing", emoji: "💧", label: "Power Washing" },
  { id: "home-services", emoji: "🔨", label: "Home Services" },
  { id: "dental", emoji: "🦷", label: "Dental" },
  { id: "med-spa", emoji: "💆", label: "Med Spa / Beauty" },
  { id: "insurance", emoji: "📋", label: "Insurance" },
  { id: "roofing", emoji: "🏗️", label: "Roofing" },
  { id: "hvac", emoji: "⚡", label: "HVAC" },
];

export const LEAD_VOLUMES = ["Under 20", "20-50", "50-100", "100+"];

export const CHALLENGES = [
  "Responding fast enough",
  "Following up consistently",
  "Getting them to book",
  "All of the above",
];

/** "Glow Studio" → "Glow Studio's", "Chris Tints" → "Chris Tints'" */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}
