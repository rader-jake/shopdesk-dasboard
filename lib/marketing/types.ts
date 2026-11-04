/** Body of the backend's POST /webhook/sms-only/shopdesk-demo (via our /api/demo route). */
export interface DemoPayload {
  first_name: string;
  phone: string;
  business_name: string;
  industry: string;
  /** Box 1 (required): agrees to the demo texts. Box 2 (optional): agrees to marketing texts. */
  consent_demo: boolean;
  consent_marketing: boolean;
  /** Honeypot — must stay empty. */
  company_website?: string;
}
