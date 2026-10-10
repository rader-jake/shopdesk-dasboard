import type { CallModeConfig } from "@/config/types";
import { firstName, vehicleOf } from "@/lib/format";

/** Call Mode content for Pure Vision Tints (ported from Jordy's dashboard). */
export const pureVisionCallMode: CallModeConfig = {
  script: (lead) => {
    const special = lead.lead_special || "Ceramic Special";
    const vehicle = vehicleOf(lead) || "vehicle";
    return `Hey ${firstName(lead.lead_name)}, this is Jake from Pure Vision Tints — you reached out about the ${special} for your ${vehicle}. Just wanted to check if you had any questions or if you're ready to get on the schedule!`;
  },

  facts: (lead) => [
    { text: "Ceramic Special: $299 — all sides + rear, HITEK Black Ceramic" },
    { text: "Special ends this Sunday — deposit locks in pricing" },
    { text: "Existing tint removal: FREE with any special" },
    { text: "About 1-2 hours · WiFi waiting room · drop-off available" },
    { text: "Hockley off 290, ~10 min from Cypress" },
    { text: "$20 deposit goes toward final price" },
    { label: "Booking page", text: "purevisiontints.com/book", href: "https://purevision-booking.vercel.app" },
    { label: "Google Reviews", text: "Leave a Review", href: "https://share.google/VSDq05imnu9Ii4o2m" },
    { label: "Instagram", text: "@purevisiontints", href: "https://www.instagram.com/pure.visionn" },
    ...((lead.lead_vehicle ?? "").toLowerCase().includes("tesla model 3")
      ? [{ label: "Tesla Model 3", text: "Special covers trunk glass only. Full rear window +$150", highlight: true }]
      : []),
  ],

  quickTexts: () => [
    {
      id: "booking",
      label: "Send booking link",
      icon: "link",
      text: "Here's our booking page — pick any time that works for you 👇",
      attachmentUrl: "https://purevision-booking.vercel.app",
    },
    {
      id: "reviews",
      label: "Send reviews",
      icon: "star",
      text: "Check out our Google reviews — over 125 5-star reviews from customers in the area 👇",
      attachmentUrl: "https://share.google/qKfUBaF14oplt1Yhy",
    },
    {
      id: "instagram",
      label: "Send Instagram",
      icon: "camera",
      text: "Check out our work on Instagram 👇",
      attachmentUrl: "https://www.instagram.com/pure.visionn",
    },
  ],
};
