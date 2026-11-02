import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Privacy · VaaniStore",
  description: "What VaaniStore stores, why, and how to delete it.",
};

/*
 * Plain-language privacy notice describing what this code actually does.
 * Have it reviewed (and add your legal entity + grievance officer details)
 * before a public launch — this is not legal advice.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@example.com";

export default function PrivacyPage() {
  return (
    <main className="text-ink mx-auto max-w-2xl space-y-6 px-5 py-10 leading-relaxed">
      <Link href="/" aria-label="VaaniStore home">
        <Logo />
      </Link>
      <h1 className="font-display pt-4 text-4xl font-semibold tracking-tight">Privacy</h1>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold">What we store</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your login email (or Google account email), via Supabase.</li>
          <li>
            Your shop details: name, address, hours, phone/WhatsApp, UPI ID, products and photos.
            Published shop pages are public — anyone with the link can see them.
          </li>
          <li>
            A draft of your shop on your own phone (browser storage), so you don&apos;t lose work.
          </li>
          <li>
            Anonymous counts for shop owners: page visits and taps on Call, WhatsApp, Directions and
            Order, plus which products were in an order. No customer names, phone numbers, IP
            addresses, locations or cookies are stored.
          </li>
          <li>
            A customer&apos;s cart is kept only in their own browser until they send it on WhatsApp.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Your voice</h2>
        <p>
          We don&apos;t store voice recordings. In Chrome, your browser turns speech into text
          (Google provides that service to the browser). In other browsers the recording is sent
          once to Groq to turn it into text and is not kept by us. The text is sent to Google Gemini
          to fill in your shop details.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Who processes data</h2>
        <p>
          Supabase (database, login, photos), Vercel (hosting), Google Gemini and Groq (AI). We
          don&apos;t sell your data or show ads.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold">Deleting your data</h2>
        <p>
          In the dashboard, tap <strong>Delete my shop permanently</strong>. Your shop page and
          photos are removed immediately. To also delete your login, email{" "}
          <a className="text-brand-600 underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
