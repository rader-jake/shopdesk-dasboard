/**
 * The exact wording shown next to the two opt-in checkboxes. Both the form and the /api/demo route read from
 * here, and the route sends the wording and version to the backend, so every lead's consent record names the
 * text they actually agreed to. Change the wording → bump CONSENT_VERSION.
 */
export const CONSENT_VERSION = "2026-11-04";

export const DEMO_CONSENT_TEXT =
  "I agree to receive text messages from ShopDesk with my live AI demo. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out.";

export const MARKETING_CONSENT_TEXT =
  "I agree to receive marketing text messages from ShopDesk about its services and offers. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out. Consent is not a condition of purchase.";
