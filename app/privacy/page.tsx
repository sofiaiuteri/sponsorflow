import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy · SponsorFlow" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 7, 2026"
      intro="This policy explains what information SponsorFlow collects, why, and the choices you have. SponsorFlow is a project of The Experience Exchange, operated by Sofia Iuteri. Contact: sofia@sponsorflowhq.com."
      sections={[
        {
          heading: "What we collect",
          body: [
            "When you order or contact us: your name, email address, publication name and website, and the details you share about your topics, audience, location, size and rates.",
            "Payments are handled by Stripe. We receive confirmation of your payment and your email address, but we never see or store your card details.",
            "The free preview stores your answers in your own browser so you can come back to them. It isn't sent to us unless you place an order.",
            "For your sponsor list, we collect publicly available business information, such as company names and the contact details businesses publish for marketing or partnership inquiries.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To research and deliver your sponsor list, send Done-for-you outreach you've asked for, email you about your order, provide support, and improve SponsorFlow. We don't sell your information.",
            "To research sponsors and write pitches, we send your publication's details to our AI provider (Anthropic) to process on our behalf.",
          ],
        },
        {
          heading: "Businesses we contact",
          body: [
            "If we contact your business on behalf of a publication, we used contact details your business published. Every email includes an unsubscribe link. If you unsubscribe or ask us to stop, we add your address to a do-not-contact list and won't email you again from any campaign.",
          ],
        },
        {
          heading: "Service providers",
          body: [
            "We use trusted providers to run SponsorFlow: Vercel (hosting), Neon (database), Resend (email sending and receiving), Stripe (payments), Formspree (form notifications) and Anthropic (AI research). They process information only to provide their services to us.",
          ],
        },
        {
          heading: "Cookies",
          body: ["We don't use advertising or tracking cookies. The admin area uses a necessary sign-in cookie, and the free preview uses your browser's local storage."],
        },
        {
          heading: "Keeping and deleting information",
          body: [
            "We keep order and list information while you're a customer and for as long as needed for accounting and the Done-for-you fee period. You can ask us to access, correct or delete your information at any time by emailing sofia@sponsorflowhq.com.",
          ],
        },
        {
          heading: "Children",
          body: ["SponsorFlow is meant for people running publications and isn't directed to children under 13."],
        },
        {
          heading: "Changes",
          body: ["If we update this policy, we'll change the date above. Questions are always welcome at sofia@sponsorflowhq.com."],
        },
      ]}
    />
  );
}
