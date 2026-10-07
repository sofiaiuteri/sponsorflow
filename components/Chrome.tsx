import Link from "next/link";
import { CTA_LABEL } from "@/lib/config";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-0.5 text-[19px] tracking-tight" aria-label="SponsorFlow home">
      <span className="font-semibold">Sponsor</span>
      <span className="font-serif text-[22px] italic text-accent">flow</span>
      <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-accent transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        {!minimal && (
          <nav className="hidden items-center gap-8 text-[14px] text-ink-soft md:flex">
            <Link href="/#how" className="transition hover:text-ink">How it works</Link>
            <Link href="/dashboard" className="transition hover:text-ink">Sample list</Link>
            <Link href="/#pricing" className="transition hover:text-ink">Pricing</Link>
          </nav>
        )}
        <Link href="/beta" className="rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper transition hover:bg-accent">
          <span className="sm:hidden">20 matches — $29</span>
          <span className="hidden sm:inline">{CTA_LABEL}</span>
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-[13.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Logo />
          <span>
            Sponsorship research for small media, by{" "}
            <a href="https://theexperienceexchange.vercel.app" target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
              The Experience Exchange
            </a>
            .
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/#start" className="hover:text-ink">Free preview</Link>
          <Link href="/beta" className="hover:text-ink">Founding Beta — $29</Link>
          <Link href="/beta#contact" className="hover:text-ink">Contact</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <span>© {new Date().getFullYear()} SponsorFlow</span>
        </div>
      </div>
    </footer>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`h-4 w-4 ${className}`} aria-hidden>
      <path d="M3 8h10m0 0L9 4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
