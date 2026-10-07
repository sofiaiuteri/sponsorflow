import { SiteFooter, SiteHeader } from "@/components/Chrome";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <>
      <SiteHeader minimal />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
          <p className="eyebrow">Last updated {updated}</p>
          <h1 className="mt-3 font-serif text-[42px] leading-[1.05] sm:text-[56px]">{title}</h1>
          <p className="mt-6 text-[16.5px] leading-relaxed text-ink-soft">{intro}</p>
          {sections.map((s, i) => (
            <section key={s.heading} className="mt-10">
              <h2 className="text-[19px] font-medium">
                {i + 1}. {s.heading}
              </h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 40)} className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
