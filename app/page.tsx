import Link from "next/link";
import { Arrow, SiteFooter, SiteHeader } from "@/components/Chrome";
import { IntakeForm } from "@/components/IntakeForm";
import { PreviewList } from "@/components/PreviewList";
import { TRUST_NOTE } from "@/lib/config";

const AUDIENCES = ["Newsletters", "Student publications", "Podcasts", "Independent creators", "Local media", "Niche magazines"];

const STEPS = [
  {
    n: "01",
    title: "Tell us who you reach",
    body: "Your topics, your audience, your city, your rate. The details a sponsor would ask about anyway.",
  },
  {
    n: "02",
    title: "We research the brands that fit",
    body: "We look for companies that market to audiences like yours, then rate how closely each one fits your topics, audience, location and size.",
  },
  {
    n: "03",
    title: "You get a list ready to pitch",
    body: "Within 3 business days: why each brand fits, an angle worth proposing, a personalized opener, and who to contact where available.",
  },
];

const INCLUDED = [
  "20 researched sponsor prospects",
  "Why each brand fits your audience",
  "A recommended sponsorship and pitch angle",
  "A personalized outreach opener for each brand",
  "A suggested contact or person, where available",
  "Delivered within 3 business days",
];

const DFY_INCLUDED = [
  "Everything in the Sponsor List",
  "We send all 20 pitches for you",
  "A friendly follow-up to every brand",
  "Warm introductions to brands that say yes",
  "You approve the pitches before anything goes out",
  "10% only on sponsorships we help you land",
];

const FAQ = [
  {
    q: "I only have a few thousand readers. Is this for me?",
    a: "Yes, that's exactly who it's for. Plenty of brands prefer small, engaged, specific audiences over big general ones. We include local and niche sponsors that suit early-stage publications.",
  },
  {
    q: "What's the difference between the free preview and the $29 list?",
    a: "The free preview is generated instantly from your answers so you can see the format. The Founding Beta list is researched and prepared for you: 20 sponsor prospects, deeper reasoning, and a suggested contact or person where one is publicly available.",
  },
  {
    q: "Have these brands agreed to sponsor me?",
    a: "No. SponsorFlow identifies high-fit sponsorship prospects (companies worth pitching), not brands that have already agreed to sponsor your publication. Brand names in samples are examples only; no affiliation is implied.",
  },
  {
    q: "What does Done-for-you include?",
    a: "Everything in the Sponsor List, and then we do the outreach. We send a personal pitch to each of your 20 brands from our SponsorFlow address, clearly on behalf of your publication, follow up once, and introduce you directly to every brand that's interested. You see and approve the pitches before anything is sent.",
  },
  {
    q: "How does the 10% work?",
    a: "You only pay it if a brand we introduced signs a sponsorship with you within 12 months of our introduction. It's 10% of what that brand pays you, invoiced after you've been paid. No deal, no fee.",
  },
  {
    q: "How long does it take?",
    a: "Founding Beta lists are delivered within 3 business days, and we reply to every message within 1 business day. During the beta, we review every intake ourselves.",
  },
  {
    q: "What if it's not useful?",
    a: "If the list isn't useful, reply to the delivery email and we'll refund your $29.",
  },
  {
    q: "What happens after the beta?",
    a: "Founding Beta customers keep their $29 price for any future lists ordered during the beta.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-28">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-[12.5px] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Founding Beta — now open
            </p>
            <h1 className="font-serif text-[46px] leading-[1.02] tracking-[-0.01em] sm:text-[76px]">
              Find the brands that should <em className="text-accent">already</em> be sponsoring you.
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-ink-soft sm:text-[19px]">
              SponsorFlow researches brands, explains why they fit your audience, and writes the pitch — so small media teams can spend their time creating.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/beta" className="btn-primary">
                Find my sponsors <Arrow />
              </Link>
              <Link href="#start" className="btn-ghost">
                Try a free preview
              </Link>
            </div>
          </div>
        </section>

        {/* Product preview */}
        <section className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Sample preview</p>
              <p className="mt-1 text-[14px] text-ink-soft">
                For <span className="font-medium text-ink">The Quad Review</span> — a London student magazine, 8,500 readers
              </p>
            </div>
            <Link href="/dashboard" className="hidden shrink-0 text-[13.5px] text-ink-soft underline decoration-line-strong underline-offset-4 transition hover:text-ink sm:block">
              Open full dashboard
            </Link>
          </div>
          <PreviewList />
          <p className="mt-3 text-[12.5px] text-ink-muted">Tap a row to see the pitch. Change a status to track outreach.</p>
          <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted">{TRUST_NOTE}</p>
        </section>

        {/* Built for */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="eyebrow text-center">Built for small media teams</p>
          <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-x-3 gap-y-2 font-serif text-[22px] text-ink-soft sm:text-[26px]">
            {AUDIENCES.map((a, i) => (
              <li key={a} className="flex items-center gap-3">
                {a}
                {i < AUDIENCES.length - 1 && <span className="text-line-strong">/</span>}
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-line bg-card">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 font-serif text-[36px] leading-[1.08] sm:text-[48px]">
                Less cold-emailing into the void. More yeses.
              </h2>
            </div>
            <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((s) => (
                <li key={s.n} className="border-t border-ink pt-5">
                  <span className="font-mono text-[12px] text-ink-muted">{s.n}</span>
                  <h3 className="mt-3 text-[18px] font-medium">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Intake */}
        <section id="start" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <div className="lg:pt-4">
              <p className="eyebrow">Free preview</p>
              <h2 className="mt-3 font-serif text-[36px] leading-[1.08] sm:text-[48px]">See who should be sponsoring you.</h2>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">
                Answer a few questions for an instant preview of the kinds of brands that fit you. Want the researched version? That&apos;s the $29 Founding Beta list.
              </p>
              <dl className="mt-10 hidden space-y-5 text-[14.5px] lg:block">
                <div>
                  <dt className="font-medium">Private by default</dt>
                  <dd className="text-ink-soft">Your answers stay in your browser.</dd>
                </div>
                <div>
                  <dt className="font-medium">Specific beats big</dt>
                  <dd className="text-ink-soft">The clearer your audience, the sharper your matches.</dd>
                </div>
              </dl>
            </div>
            <IntakeForm />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">Founding Beta pricing</p>
              <h2 className="mt-3 font-serif text-[40px] leading-[1.05] sm:text-[56px]">Pick how much you want us to do.</h2>
              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-paper/70">
                Get the research and pitch it yourself, or let us pitch for you and introduce you to the brands that say yes. Founding Beta customers keep these prices for future lists during the beta.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {[
                {
                  name: "Sponsor List",
                  price: "$29",
                  note: "one-time",
                  blurb: "We research your sponsors. You send the pitches.",
                  items: INCLUDED,
                  cta: "Get my sponsor list",
                  href: "/beta?plan=list",
                  featured: false,
                },
                {
                  name: "Done-for-you",
                  price: "$49",
                  note: "+ 10% of deals we help land",
                  blurb: "We research your sponsors, pitch them for you, and connect you with the ones who say yes.",
                  items: DFY_INCLUDED,
                  cta: "Get Done-for-you",
                  href: "/beta?plan=dfy",
                  featured: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-2xl border p-7 sm:p-9 ${plan.featured ? "border-paper/40 bg-paper/[0.06]" : "border-paper/15"}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[19px] font-medium">{plan.name}</h3>
                    {plan.featured && (
                      <span className="rounded-full bg-highlight px-2.5 py-0.5 text-[12px] font-medium text-ink">New</span>
                    )}
                  </div>
                  <p className="mt-2 text-[14.5px] text-paper/65">{plan.blurb}</p>
                  <div className="mt-7 flex items-baseline gap-3">
                    <span className="font-serif text-[60px] leading-none">{plan.price}</span>
                    <span className="text-[14px] text-paper/60">{plan.note}</span>
                  </div>
                  <ul className="mt-7 flex-1 divide-y divide-paper/10 border-y border-paper/10">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 py-3 text-[15px]">
                        <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#9cc5ad]" aria-hidden>
                          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[15.5px] font-medium transition ${
                      plan.featured ? "bg-paper text-ink hover:bg-highlight" : "border border-paper/30 text-paper hover:bg-paper/10"
                    }`}
                  >
                    {plan.cta} <Arrow />
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-[12.5px] text-paper/50">Refund if the list isn&apos;t useful. Replies within 1 business day.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
          <h2 className="font-serif text-[36px] leading-tight sm:text-[44px]">Questions</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16.5px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong text-ink-muted transition group-open:rotate-45">
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
          <div className="rounded-3xl border border-line bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="mx-auto max-w-2xl font-serif text-[34px] leading-[1.08] sm:text-[52px]">
              Spend your time creating. <span className="text-ink-muted">Let the sponsors find their way to you.</span>
            </h2>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/beta" className="btn-primary">
                Find my sponsors <Arrow />
              </Link>
              <Link href="#start" className="btn-ghost">
                Try a free preview
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
