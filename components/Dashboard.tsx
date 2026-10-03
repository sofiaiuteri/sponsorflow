"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Arrow } from "@/components/Chrome";
import { FIT_EXPLAINER, STATUSES, SponsorList, fitLevel } from "@/components/SponsorList";
import { CTA_LABEL, TRUST_NOTE } from "@/lib/config";
import { DEMO_PROFILE, generateMatches, parseNumber, type Profile, type SponsorMatch, type Status } from "@/lib/sponsors";
import { PROFILE_KEY, statusKey, useHydrated, useStoredString } from "@/lib/storage";

type Filter = "All" | Status;

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function effectiveCpm(price: string, size: string) {
  const p = parseNumber(price);
  const s = parseNumber(size);
  if (!p || !s) return null;
  const symbol = price.match(/[£$€]/)?.[0] ?? "$";
  const cpm = (p / s) * 1000;
  return `${symbol}${cpm < 10 ? cpm.toFixed(2) : Math.round(cpm)}`;
}

function downloadCsv(name: string, matches: SponsorMatch[], statuses: Record<string, Status>) {
  const cols = ["Company", "Category", "Fit score", "Why it fits", "Suggested angle", "Outreach first line", "Status"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = matches.map((m) =>
    [m.company, m.category, m.score, m.why, m.angle, m.opener, statuses[m.id] ?? "Prospect"].map(esc).join(","),
  );
  const blob = new Blob([[cols.join(","), ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sponsors.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-card px-5 py-5 sm:px-6">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-serif text-[34px] leading-none tracking-tight">{value}</div>
      {note && <div className="mt-2 text-[12.5px] text-ink-muted">{note}</div>}
    </div>
  );
}

export function Dashboard() {
  const hydrated = useHydrated();
  const [rawProfile] = useStoredString(PROFILE_KEY);
  const saved = useMemo(() => parseJSON<Profile>(rawProfile), [rawProfile]);
  const profile = saved ?? DEMO_PROFILE;
  const isDemo = !saved;

  const [rawStatuses, setRawStatuses] = useStoredString(statusKey(profile.name));
  const statuses = useMemo(() => parseJSON<Record<string, Status>>(rawStatuses) ?? {}, [rawStatuses]);
  const setStatus = (id: string, s: Status) => setRawStatuses(JSON.stringify({ ...statuses, [id]: s }));

  const matches = useMemo(() => generateMatches(profile), [profile]);
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { All: matches.length, Prospect: 0, Contacted: 0, Replied: 0 };
    matches.forEach((m) => c[statuses[m.id] ?? "Prospect"]++);
    return c;
  }, [matches, statuses]);

  const visible = filter === "All" ? matches : matches.filter((m) => (statuses[m.id] ?? "Prospect") === filter);
  const strong = matches.filter((m) => fitLevel(m.score) === "High").length;
  const cpm = effectiveCpm(profile.price, profile.audienceSize);

  if (!hydrated) {
    return <div className="mx-auto h-[70vh] max-w-6xl px-5 sm:px-8" aria-busy />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      {isDemo && (
        <div className="mb-10 flex flex-col gap-3 rounded-xl border border-line bg-highlight/50 px-4 py-3 text-[14px] sm:flex-row sm:items-center sm:justify-between">
          <span>
            You&apos;re viewing a demo for <span className="font-medium">{DEMO_PROFILE.name}</span>.
          </span>
          <Link href="/#start" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            Run it for your publication <Arrow />
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Free preview · sponsor intelligence</p>
          <h1 className="mt-2 font-serif text-[38px] leading-[1.05] sm:text-[52px]">{profile.name}</h1>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-ink-soft">
            {[profile.url, profile.location, profile.audienceSize && `${profile.audienceSize} audience`]
              .filter(Boolean)
              .map((x, i) => (
                <span key={i} className="flex items-center gap-3">
                  {i > 0 && <span className="text-line-strong">·</span>}
                  {x}
                </span>
              ))}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => downloadCsv(profile.name, matches, statuses)} className="btn-ghost !px-4 !py-2 !text-[13.5px]">
            Export CSV
          </button>
          <Link href="/#start" className="btn-ghost !px-4 !py-2 !text-[13.5px]">
            Edit details
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        <Stat label="Prospects" value={String(matches.length)} note="Ranked by estimated fit" />
        <Stat label="High fit" value={String(strong)} note="Closest audience match" />
        <Stat label="Pipeline" value={`${counts.Contacted + counts.Replied}`} note={`${counts.Contacted} contacted · ${counts.Replied} replied`} />
        <Stat label="Your rate" value={profile.price || "—"} note={cpm ? `≈ ${cpm} per 1,000 audience` : "Add size & price to see CPM"} />
      </div>

      {/* Filters */}
      <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {(["All", ...STATUSES] as Filter[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] transition ${
                filter === f ? "bg-ink text-paper" : "text-ink-soft hover:bg-card hover:text-ink"
              }`}
            >
              {f} <span className={`ml-1 font-mono text-[11.5px] ${filter === f ? "text-paper/60" : "text-ink-muted"}`}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <p className="text-[12.5px] text-ink-muted">Statuses save automatically in this browser.</p>
      </div>

      <div className="mt-4">
        {visible.length ? (
          <SponsorList key={filter} matches={visible} statuses={statuses} onStatus={setStatus} defaultOpen={filter === "All" ? visible[0]?.id : undefined} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-[14.5px] text-ink-soft">
            No sponsors marked <span className="font-medium text-ink">{filter}</span> yet.
          </div>
        )}
      </div>

      <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted">
        {TRUST_NOTE} <span className="hidden sm:inline">Fit: {FIT_EXPLAINER}</span>
      </p>

      {/* Upsell */}
      <div className="mt-12 grid gap-8 rounded-2xl bg-ink px-6 py-10 text-paper sm:px-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">Founding Beta · $29</p>
          <h2 className="mt-2 font-serif text-[30px] leading-tight sm:text-[36px]">Want the researched version?</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-paper/70">
            This preview is generated instantly from your answers to show the format. Your Founding Beta list is researched and prepared for {isDemo ? "your publication" : profile.name}: 20 sponsor prospects, why each fits, a recommended pitch angle, a personalized opener, and a suggested contact where available — delivered within 3 business days.
          </p>
        </div>
        <Link href="/beta" className="inline-flex items-center justify-center gap-2 rounded-full bg-paper px-6 py-3.5 text-[15px] font-medium text-ink transition hover:bg-highlight">
          {CTA_LABEL}
        </Link>
      </div>
    </div>
  );
}
