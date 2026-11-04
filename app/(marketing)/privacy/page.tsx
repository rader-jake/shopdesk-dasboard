import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/marketing/LegalPage";
import { CONTACT_EMAIL } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Privacy Policy — ShopDesk",
  description: "What ShopDesk collects when you request a demo, how we use it, and your choices.",
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 4, 2026">
      <p>
        This policy explains what ShopDesk collects when you use shopdesk.ai or request a demo, how we use it, and the choices you
        have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>What you enter:</strong> your business name, industry, answers to our short questions, and your mobile phone
          number. The Beauty page also asks for your name and email.
        </li>
        <li>
          <strong>Your text conversation:</strong> the messages we send you and the replies you send back.
        </li>
        <li>
          <strong>Proof of your consent:</strong> which text-message boxes you checked, the exact wording you agreed to, and when
          you agreed, along with your IP address, browser details and the page you were on.
        </li>
        <li>
          <strong>Basic technical data:</strong> standard server logs such as IP address and browser type.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To send you the demo you asked for and continue the conversation if you reply.</li>
        <li>To send you marketing texts only if you checked the optional marketing box.</li>
        <li>To keep a record of your consent, prevent abuse, and improve the product.</li>
        <li>To respond when you contact us.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        We use service providers to run ShopDesk: a messaging provider (Twilio) to send and receive texts, an AI provider
        (Anthropic) to write the replies in your conversation, and hosting providers to run our site and servers. They handle data
        only to provide those services to us.
      </p>
      <p>
        We do not sell your personal information. We do not share mobile phone numbers or text-message opt-in consent with third
        parties or affiliates for their marketing or promotional purposes.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          Reply <strong>STOP</strong> to any text to stop receiving messages. Reply <strong>HELP</strong> for help.
        </li>
        <li>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to ask for a copy of your information or to have it
          deleted. We may keep a record that you opted out so we honor it.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep demo conversations and consent records for as long as we need them to provide the service, handle complaints and
        meet legal obligations, then delete or anonymize them.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable safeguards to protect your information, but no method of transmission or storage is completely secure.
      </p>

      <h2>Children</h2>
      <p>ShopDesk is for businesses and is not directed to children under 13.</p>

      <h2>Changes</h2>
      <p>
        We may update this policy. The date at the top shows when it last changed. See also our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        ShopDesk &middot; <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
