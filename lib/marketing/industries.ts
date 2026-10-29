export interface Industry {
  id: string;
  label: string;
}

export const INDUSTRIES: Industry[] = [
  { id: "tinting", label: "Window Tinting" },
  { id: "detailing", label: "Auto Detailing" },
  { id: "ppf", label: "PPF & Wraps" },
  { id: "epoxy", label: "Epoxy Flooring" },
  { id: "landscaping", label: "Landscaping" },
  { id: "power-washing", label: "Power Washing" },
  { id: "home-services", label: "Home Services" },
  { id: "dental", label: "Dental" },
  { id: "med-spa", label: "Med Spa / Beauty" },
  { id: "insurance", label: "Insurance" },
  { id: "real-estate", label: "Real Estate" },
  { id: "roofing", label: "Roofing" },
  { id: "hvac", label: "HVAC" },
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
