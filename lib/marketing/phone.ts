/** US phone helpers shared by the demo funnel and the Beauty form. */

const NANP = /^[2-9]\d{2}[2-9]\d{6}$/;

/** Ten national digits from anything typed or pasted. A leading 1 is the country code (no US area code starts with 1). */
export function nationalDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("1")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** "5551234567" → "(555) 123-4567", progressively as the visitor types. */
export function formatPhone(input: string): string {
  const d = nationalDigits(input);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * onChange helper: reformats, and if the visitor backspaced over a formatting character
 * (so no digit changed) drops the last digit instead of leaving the cursor stuck.
 */
export function nextPhoneValue(previous: string, raw: string): string {
  let digits = nationalDigits(raw);
  if (raw.length < previous.length && digits === nationalDigits(previous)) digits = digits.slice(0, -1);
  return formatPhone(digits);
}

/** "+15551234567", or null when it isn't a plausible US number. */
export function toE164(display: string): string | null {
  const d = nationalDigits(display);
  return NANP.test(d) ? `+1${d}` : null;
}
