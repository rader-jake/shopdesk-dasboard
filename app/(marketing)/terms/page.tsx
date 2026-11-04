import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/marketing/LegalPage";
import { CONTACT_EMAIL } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Terms of Service — ShopDesk",
  description: "The terms for using ShopDesk, including how our text messaging program works.",
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="November 4, 2026">
      <p>
        These terms apply to your use of shopdesk.ai and to any text messages you ask ShopDesk to send you. By using the site or
        opting in to our texts, you agree to them.
      </p>

      <h2>What ShopDesk is</h2>
      <p>
        ShopDesk builds AI text-message assistants for service businesses. The demo on our website sends you a short text
        conversation so you can see how an AI assistant answers a customer.
      </p>

      <h2>Text messaging program</h2>
      <ul>
        <li>
          <strong>Program:</strong> ShopDesk Demo &amp; Updates. When you enter your mobile number on our site and check the demo
          box, you agree to receive text messages from ShopDesk with your live AI demo, including the replies in that
          conversation.
        </li>
        <li>
          <strong>Marketing texts:</strong> if you also check the optional box, you agree to receive marketing text messages
          from ShopDesk about its services and offers. This box is optional. You get the demo whether or not you check it, and
          consent is not a condition of any purchase.
        </li>
        <li>
          <strong>Frequency:</strong> message frequency varies.
        </li>
        <li>
          <strong>Cost:</strong> message and data rates may apply. ShopDesk does not charge for the texts.
        </li>
        <li>
          <strong>Opt out:</strong> reply <strong>STOP</strong> at any time to stop receiving texts. You will get one message
          confirming you are unsubscribed.
        </li>
        <li>
          <strong>Help:</strong> reply <strong>HELP</strong> for help, or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
        <li>
          <strong>Carriers:</strong> carriers are not liable for delayed or undelivered messages.
        </li>
        <li>
          <strong>Privacy:</strong> see our <Link href="/privacy">Privacy Policy</Link>. We do not share mobile numbers or text
          opt-in consent with third parties or affiliates for their marketing or promotional purposes.
        </li>
      </ul>

      <h2>Your responsibilities</h2>
      <p>
        Enter only your own mobile number, or one you are authorized to use. Do not use the demo to send messages to someone
        else, to harass anyone, or to test the system in a way that disrupts it. We may limit or block use that looks abusive.
      </p>

      <h2>AI-generated messages</h2>
      <p>
        Replies in the demo are written by an AI and are provided for demonstration only. They may contain mistakes and are not
        professional advice or a binding offer.
      </p>

      <h2>Accounts and client dashboards</h2>
      <p>
        Clients who sign up for ShopDesk services are covered by their own service agreement, which controls if it conflicts
        with these terms.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        The site and the demo are provided &ldquo;as is&rdquo; without warranties of any kind. To the extent the law allows,
        ShopDesk is not liable for indirect or consequential damages arising from your use of the site or the demo.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows when they last changed. Continued use means you accept the update.</p>

      <h2>Contact</h2>
      <p>
        ShopDesk &middot; <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
