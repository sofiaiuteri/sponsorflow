import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service · SponsorFlow" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 7, 2026"
      intro="These terms explain what you get when you use SponsorFlow and what we ask of you. SponsorFlow is a project of The Experience Exchange, operated by Sofia Iuteri. By ordering, you agree to these terms. Questions? Email sofia@sponsorflowhq.com."
      sections={[
        {
          heading: "What SponsorFlow does",
          body: [
            "SponsorFlow researches businesses that may be a good fit to sponsor your publication, newsletter or podcast, and gives you an online list with why each one fits, a suggested sponsorship idea, an opening line and a published contact where we can find one.",
            "SponsorFlow identifies sponsorship prospects. It does not guarantee that any business will reply, agree to sponsor you, or pay you. Listing a business does not mean it has agreed to anything or is affiliated with us.",
          ],
        },
        {
          heading: "Founding Beta plans and delivery",
          body: [
            "Sponsor List ($29, one-time): a researched list of about 20 sponsor prospects delivered as a private online list, usually within hours and always within 3 business days of payment.",
            "Done-for-you ($49 up front plus 10% of sponsorships we help you land): everything in the Sponsor List, plus we write and send personal outreach emails to the businesses on your list on your behalf, send one follow-up, and introduce you to businesses that reply with interest.",
            "Founding Beta customers keep their beta prices for future lists ordered during the beta.",
          ],
        },
        {
          heading: "Refunds",
          body: ["If your list isn't useful, reply to your delivery email within 14 days and we'll refund your up-front payment. Stripe's processing fee may not be returned to us, but we'll refund the full amount you paid."],
        },
        {
          heading: "Done-for-you outreach on your behalf",
          body: [
            "You authorize SponsorFlow to contact the businesses on your list about sponsoring your publication. Emails are sent from a SponsorFlow address, clearly say who they're from and which publication they're about, include an unsubscribe option and a postal address, and follow applicable email laws. We contact each business at most twice (one first email and one follow-up) and never email anyone who has asked us not to.",
            "We'll show you the pitches before outreach starts, and you can edit or remove any of them. You're responsible for the accuracy of the information you give us about your publication, audience and rates.",
          ],
        },
        {
          heading: "The 10% success fee (Done-for-you only)",
          body: [
            "If a business that we introduced to you, or that replied to outreach we sent on your behalf, enters a sponsorship, advertising or partnership agreement with you within 12 months of our first contact with that business, you agree to pay SponsorFlow 10% of the cash amounts you receive under that agreement during those 12 months.",
            "You agree to let us know when such an agreement is made. We'll invoice you after you've been paid, and invoices are due within 30 days. Non-cash sponsorships (for example free products) carry no fee unless we agree otherwise in writing. No deal means no fee.",
          ],
        },
        {
          heading: "Your responsibilities",
          body: ["Please give us accurate information, use the list and our messages lawfully, and don't use SponsorFlow to send spam or to misrepresent your publication. You decide which sponsorships to accept and are responsible for your agreements with sponsors."],
        },
        {
          heading: "Your list and our content",
          body: ["You may use your list and the messages we write for your own publication. Please don't resell or publicly share your list. Your private list link is for you and your team only."],
        },
        {
          heading: "Limitation of liability",
          body: [
            "SponsorFlow is provided as is during the beta. Business details come from public sources and may change, and while we work to keep them accurate, we can't guarantee they're complete or current.",
            "To the fullest extent allowed by law, our total liability for any claim related to SponsorFlow is limited to the amount you paid us for the order the claim relates to.",
          ],
        },
        {
          heading: "Changes and contact",
          body: ["We may update these terms as SponsorFlow grows. If we make important changes, we'll update the date above, and changes won't apply to orders already placed. Contact: sofia@sponsorflowhq.com."],
        },
      ]}
    />
  );
}
