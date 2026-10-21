import type { Metadata } from "next";
import { AiCheckForm } from "@/components/AiCheckForm";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "Free AI visibility check · SponsorFlow",
  description: "Find out whether ChatGPT, Perplexity and Google AI recommend your business, and what they get wrong. Free one-page report.",
};

const POINTS = [
  ["Are you being recommended?", "We ask AI the questions your customers ask, like \"where should I buy hiking boots near me?\", and see whether your business comes up."],
  ["What AI gets wrong", "Hours, address, what you sell. AI pulls from listings all over the web, and they often disagree."],
  ["Your top fixes", "A short list of the changes that matter most, in plain English. Most take a few minutes."],
  ["One page, within 2 business days", "Free check, no strings. The report is yours to keep."],
];

export default function AiCheckPage() {
  return (
    <>
      <SiteHeader minimal />
      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Free AI visibility check</p>
            <h1 className="mt-3 font-serif text-[42px] leading-[1.04] sm:text-[60px]">Is ChatGPT recommending your business?</h1>
            <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-ink-soft">
              More and more customers skip the search results and just ask ChatGPT, Perplexity or Google&apos;s AI where to go. If AI doesn&apos;t know about you, or has your hours wrong, those customers end up somewhere else.
            </p>
            <dl className="mt-10 space-y-6">
              {POINTS.map(([t, d]) => (
                <div key={t} className="border-t border-line pt-4">
                  <dt className="text-[15.5px] font-medium">{t}</dt>
                  <dd className="mt-1 text-[14.5px] text-ink-soft">{d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 border-t border-line pt-4 text-[14px] leading-relaxed text-ink-soft">
              Hi, I&apos;m Sofia. I&apos;m a student at Washington and Lee, and I run{" "}
              <a href="https://theexperienceexchange.vercel.app" target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
                The Experience Exchange
              </a>
              , a student outdoor magazine. I started running these checks for local shops in Lexington and Charlottesville and kept finding the same problems, so now I&apos;m offering them to any small business that wants one.
            </p>
          </div>
          <AiCheckForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
