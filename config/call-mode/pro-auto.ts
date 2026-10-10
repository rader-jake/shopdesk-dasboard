import type { CallFact, CallModeConfig } from "@/config/types";
import { firstName, vehicleOf } from "@/lib/format";
import type { Lead } from "@/lib/types";

/** Pricing and shop details come from the Pro Auto Design system prompt. */

type Kind = "ceramic" | "carbon" | "coating" | "pdr" | "general";

function kindOf(lead: Lead): Kind {
  const s = (lead.lead_special ?? "").toLowerCase();
  if (s.includes("dent") || s.includes("pdr")) return "pdr";
  if (s.includes("coating")) return "coating"; // before "ceramic": "Ceramic Coating" contains both
  if (s.includes("carbon")) return "carbon";
  if (s.includes("ceramic") || s.includes("tint")) return "ceramic";
  return "general";
}

const SERVICE_PHRASE: Record<Kind, string> = {
  ceramic: "Nano-Ceramic window tint",
  carbon: "Nano-Carbon window tint",
  coating: "a ceramic coating",
  pdr: "paintless dent repair",
  general: "your inquiry",
};

const SERVICE_FACTS: Record<Kind, string[]> = {
  ceramic: [
    "Nano-Ceramic, full vehicle: Coupe/Sedan $299–$379 · SUV $319–$399 · Truck/Minivan $319–$399",
    "Best heat rejection — great for Sacramento summers",
    "Front two doors (clear, 99% UV) $129–$159 · Windshield strip $79–$129",
    "Old film removal from $99",
  ],
  carbon: [
    "Nano-Carbon, full vehicle: Coupe/Sedan $199–$279 · SUV $219–$299 · Truck/Minivan $219–$299",
    "Solid performance at a lower price — ceramic blocks more heat",
    "Front two doors $99–$129 · Windshield strip $59–$99",
    "Old film removal from $99",
  ],
  coating: [
    "Coat healthy paint: Sedan $599–$799 · SUV $699–$899 · Truck $799–$999",
    "Polish + coat: $899–$1,199 · $999–$1,399 · $1,199–$1,599",
    "Full correction + coat from $1,499 · $1,699 · $1,899",
    "Wheels, glass & trim add-on $149–$299",
  ],
  pdr: [
    "Door ding (quarter size) $95–$150 · Medium (golf ball) $150–$250",
    "Large dent or crease (fist) $250–$450 · Extra dent, same panel from $50",
    "Hail damage: free estimate, assessed panel by panel",
    "Ask them to text a photo of the dent for an accurate quote",
  ],
  general: [
    "Window tint from $199 · Ceramic coating from $599 · Paintless dent repair from $95",
    "Ask what they drive first — it sets the price tier",
    "Always quote a range; the in-person quote finalizes it",
  ],
};

const SHOP_FACTS: string[] = [
  "1972 Fulton Ave, Sacramento · Mon–Sat 9–6, Sun 10–4 · (916) 844-6905",
  "Manufacturer-backed lifetime warranty — bubbling, discoloration, peeling",
  "Every vehicle metered + CVC 26708 compliance certificate (California legal)",
  "Tesla specialists — metal-free ceramic film, phone key & GPS unaffected",
  "640+ five-star Google reviews · BBB accredited · same-week appointments",
  "Full-vehicle tint takes about 2–3 hours",
];

const PRICING_TEXT: Record<Kind, string> = {
  ceramic:
    "Nano-Ceramic full-vehicle tint runs $299–$399 depending on the vehicle (Nano-Carbon is $199–$299). Exact pricing depends on coverage — happy to quote your specific car.",
  carbon:
    "Nano-Carbon full-vehicle tint runs $199–$299 depending on the vehicle (Nano-Ceramic, our best heat rejection, is $299–$399). Exact pricing depends on coverage.",
  coating:
    "Ceramic coating starts at $599–$799 for a sedan, $699–$899 for an SUV, $799–$999 for a truck (coat healthy paint). Polish + coat and full correction packages are available too — exact pricing depends on paint condition.",
  pdr: "Door dings run $95–$150, medium dents $150–$250, and larger dents or creases $250–$450. Send a photo of the dent and we'll confirm your exact price.",
  general:
    "Window tint starts at $199, ceramic coating at $599, and paintless dent repair at $95 — exact pricing depends on your vehicle. What are you looking to get done?",
};

export const proAutoCallMode: CallModeConfig = {
  script: (lead) => {
    const vehicle = vehicleOf(lead);
    return `Hi ${firstName(lead.lead_name)}, I'm calling from Pro Auto Design in Sacramento — you reached out about ${SERVICE_PHRASE[kindOf(lead)]} for ${vehicle ? `your ${vehicle}` : "your vehicle"}. Do you have a quick minute? I'd love to answer any questions and see if we can get you on the schedule this week.`;
  },

  facts: (lead): CallFact[] => [
    ...SERVICE_FACTS[kindOf(lead)].map((text) => ({ text })),
    ...SHOP_FACTS.map((text, i) => ({ text, label: i === 0 ? "Shop" : undefined })),
  ],

  quickTexts: (lead) => {
    const k = kindOf(lead);
    return [
      { id: "pricing", label: "Text pricing", icon: "tag", text: PRICING_TEXT[k] },
      {
        id: "address",
        label: "Text address & hours",
        icon: "pin",
        text: "Pro Auto Design is at 1972 Fulton Ave, Sacramento, CA 95825 — open Mon–Sat 9AM–6PM, Sun 10AM–4PM. Stop by anytime for a free in-person quote!",
      },
      {
        id: "photos",
        label: "Ask for photos",
        icon: "camera",
        text:
          k === "pdr"
            ? "Can you text me a photo of the dent? That way we can give you an accurate quote before you come in."
            : "Can you text me a photo of your vehicle? That helps us give you the most accurate quote.",
      },
    ];
  },
};
