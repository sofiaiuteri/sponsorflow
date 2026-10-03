import type { Metadata } from "next";
import { BetaForm } from "@/components/BetaForm";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { TRUST_NOTE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Founding Beta — SponsorFlow",
};

const POINTS = [
  ["20 researched sponsor prospects", "Chosen for your audience, not pulled from a generic database."],
  ["Why, angle, opener — and who to contact", "Why each brand fits, a recommended pitch angle, a personalized opener, and a suggested contact or person where available."],
  ["Delivered within 3 business days", "As a shareable sheet. Refund if the list isn't useful."],
];

export default function BetaPage() {
  return (
    <>
      <SiteHeader minimal />
      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Founding Beta · $29</p>
            <h1 className="mt-3 font-serif text-[42px] leading-[1.04] sm:text-[60px]">Get 20 sponsor matches.</h1>
            <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-ink-soft">
              Tell us where to send it. We&apos;ll research the brands that best fit your audience, prepare your list, and write a first pitch line for each one.
            </p>
            <dl className="mt-10 space-y-6">
              {POINTS.map(([t, d]) => (
                <div key={t} className="border-t border-line pt-4">
                  <dt className="text-[15.5px] font-medium">{t}</dt>
                  <dd className="mt-1 text-[14.5px] text-ink-soft">{d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-[12.5px] leading-relaxed text-ink-muted">{TRUST_NOTE}</p>
          </div>
          <BetaForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
