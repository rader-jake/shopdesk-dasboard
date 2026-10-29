/** Body of the backend's POST /webhook/sms-only/shopdesk-demo (via our /api/demo route). */
export interface DemoPayload {
  first_name: string;
  phone: string;
  business_name: string;
  industry: string;
  /** Honeypot — must stay empty. */
  company_website?: string;
}
