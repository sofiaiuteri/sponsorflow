"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { updateProspect } from "@/app/l/[token]/actions";
import type { List, Prospect } from "@/lib/db";

const STATUSES = ["Prospect", "Contacted", "Replied", "Interested", "Sponsor", "Not now"] as const;

const STATUS_STYLE: Record<string, string> = {
  Prospect: "bg-paper text-ink-soft border-line",
  Contacted: "bg-[#fbf3e2] text-[#7a5212] border-[#efdcb3]",
  Replied: "bg-[#e8eef7] text-[#2c4a73] border-[#cbd8ea]",
  Interested: "bg-accent-soft text-accent border-[#c7d9cd]",
  Sponsor: "bg-accent text-paper border-accent",
  "Not now": "bg-paper text-ink-muted border-line",
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

function FitBadge({ fit }: { fit: string }) {
  const filled = fit === "High" ? 3 : fit === "Medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-2" title={`${fit} fit`}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`w-[4px] rounded-full ${i < filled ? "bg-accent" : "bg-line"}`} style={{ height: 6 + i * 4 }} />
        ))}
      </span>
      <span className="text-[13px] font-medium">{fit}</span>
    </span>
  );
}

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="shrink-0 rounded-full border border-line-strong px-3 py-1 text-[12px] font-medium text-ink-soft transition hover:border-ink hover:text-ink"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

function Card({ p, token, publication, onChange }: { p: Prospect; token: string; publication: string; onChange: (patch: Partial<Prospect>) => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(p.notes);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const save = (patch: { status?: string; notes?: string }) => {
    setError("");
    onChange(patch as Partial<Prospect>);
    start(async () => {
      try {
        await updateProspect(token, p.id, patch);
      } catch {
        setError("Couldn't save. Check your connection and try again.");
      }
    });
  };

  const mailto = isEmail(p.reach)
    ? `mailto:${p.reach}?subject=${encodeURIComponent(`${publication} × ${p.brand}`)}&body=${encodeURIComponent(`Hi ${p.brand} team,\n\n${p.opener}\n\n`)}`
    : "";

  return (
    <li className="border-b border-line last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-paper font-serif text-[17px]">{p.brand.charAt(0)}</span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-medium">{p.brand}</span>
            <span className="block truncate text-[12.5px] text-ink-muted">{p.category}</span>
          </span>
        </button>
        <FitBadge fit={p.fit} />
        <label className={`relative inline-flex items-center rounded-full border py-1 pl-3 pr-7 text-[12.5px] font-medium ${STATUS_STYLE[p.status] ?? STATUS_STYLE.Prospect}`}>
          {p.status}
          <svg viewBox="0 0 12 12" className="pointer-events-none absolute right-2.5 h-3 w-3 opacity-60" aria-hidden>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <select aria-label={`Status for ${p.brand}`} value={p.status} onChange={(e) => save({ status: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0">
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setOpen(!open)} className="text-[12.5px] text-ink-muted hover:text-ink">
          {open ? "Hide" : "Details"}
        </button>
      </div>

      {open && (
        <div className="grid gap-5 px-5 pb-6 sm:px-6 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div>
              <div className="eyebrow mb-1">Why it fits</div>
              <p className="text-[14.5px] leading-relaxed text-ink-soft">{p.why}</p>
            </div>
            <div>
              <div className="eyebrow mb-1">Pitch idea</div>
              <p className="text-[14.5px] leading-relaxed">{p.angle}</p>
            </div>
            <div>
              <div className="eyebrow mb-1">Opening line</div>
              <div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4">
                <p className="flex-1 font-serif text-[17px] leading-snug">“{p.opener}”</p>
                <Copy text={p.opener} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="eyebrow mb-1">Who to contact</div>
              <p className="text-[14.5px]">{p.contact || "General inbox"}</p>
              {p.reach && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {mailto ? (
                    <>
                      <a href={mailto} className="rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-paper hover:bg-accent">
                        Email them
                      </a>
                      <span className="text-[13px] text-ink-soft">{p.reach}</span>
                      <Copy text={p.reach} label="Copy email" />
                    </>
                  ) : (
                    <a href={p.reach} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-paper hover:bg-accent">
                      Open contact page
                    </a>
                  )}
                </div>
              )}
            </div>
            {p.evidence && (
              <div>
                <div className="eyebrow mb-1">Why we picked them</div>
                <a href={p.evidence} target="_blank" rel="noopener noreferrer" className="break-all text-[13.5px] text-accent underline underline-offset-4">
                  {p.evidence.replace(/^https?:\/\//, "").slice(0, 70)}
                </a>
              </div>
            )}
            <div>
              <label htmlFor={`notes-${p.id}`} className="eyebrow mb-1 block">
                Your notes
              </label>
              <textarea
                id={`notes-${p.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => notes !== p.notes && save({ notes })}
                rows={3}
                placeholder="Who you talked to, what they said, next steps…"
                className="field resize-none text-[14px]"
              />
              <p className="mt-1 text-[12px] text-ink-muted">{pending ? "Saving…" : error || "Saves automatically."}</p>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function Portal({ token, list, initial }: { token: string; list: List; initial: Prospect[] }) {
  const [prospects, setProspects] = useState(initial);
  const [q, setQ] = useState("");
  const [fit, setFit] = useState("All");
  const [status, setStatus] = useState("All");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return prospects.filter(
      (p) =>
        (fit === "All" || p.fit === fit) &&
        (status === "All" || p.status === status) &&
        (!needle || `${p.brand} ${p.category} ${p.why}`.toLowerCase().includes(needle)),
    );
  }, [prospects, q, fit, status]);

  const count = (s: string) => prospects.filter((p) => p.status === s).length;
  const stats = [
    ["Prospects", prospects.length, "On your list"],
    ["High fit", prospects.filter((p) => p.fit === "High").length, "Start with these"],
    ["Contacted", prospects.length - count("Prospect"), `${count("Replied") + count("Interested")} replied`],
    ["Sponsors", count("Sponsor"), "Deals landed"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow">Sponsor list</p>
      <h1 className="mt-2 font-serif text-[38px] leading-[1.05] sm:text-[52px]">{list.publication}</h1>
      {list.summary && <p className="mt-3 max-w-2xl text-[15px] text-ink-soft">{list.summary}</p>}

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {stats.map(([label, value, note]) => (
          <div key={label} className="bg-card px-5 py-5 sm:px-6">
            <div className="eyebrow">{label}</div>
            <div className="mt-2 font-serif text-[34px] leading-none">{value}</div>
            <div className="mt-2 text-[12.5px] text-ink-muted">{note}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brands…" aria-label="Search brands" className="field sm:max-w-xs" />
        <div className="flex gap-1 overflow-x-auto">
          {["All", "High", "Medium", "Low"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFit(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] transition ${fit === f ? "bg-ink text-paper" : "text-ink-soft hover:bg-card hover:text-ink"}`}
            >
              {f === "All" ? "All fits" : `${f} fit`}
            </button>
          ))}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="field sm:ml-auto sm:w-auto">
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_12px_40px_-24px_rgba(26,25,21,0.18)]">
        {visible.length ? (
          <ul>
            {visible.map((p) => (
              <Card
                key={p.id}
                p={p}
                token={token}
                publication={list.publication}
                onChange={(patch) => setProspects((all) => all.map((x) => (x.id === p.id ? { ...x, ...patch } : x)))}
              />
            ))}
          </ul>
        ) : (
          <p className="px-6 py-14 text-center text-[14.5px] text-ink-soft">No brands match those filters.</p>
        )}
      </div>

      <p className="mt-4 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted">
        These are high-fit sponsorship prospects identified for your audience, not brands that have already agreed to sponsor you. Your
        statuses and notes save automatically and only you (and SponsorFlow) can see them.
      </p>

      {list.plan === "sample" && (
        <div className="mt-10 grid gap-6 rounded-2xl bg-ink px-6 py-8 text-paper sm:px-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="font-serif text-[28px] leading-tight">This is a free sample of 5</h2>
            <p className="mt-2 max-w-xl text-[14.5px] text-paper/70">
              Your full list has 20 sponsors researched for {list.publication}, each with why it fits, a pitch idea, an opening line and who to contact. Delivered within 3 business days, refund if it isn&apos;t useful.
            </p>
          </div>
          <Link href="/beta?plan=list" className="inline-flex items-center justify-center rounded-full bg-paper px-6 py-3 text-[15px] font-medium text-ink hover:bg-highlight">
            Get all 20 for $29
          </Link>
        </div>
      )}

      {list.plan === "list" && (
        <div className="mt-10 grid gap-6 rounded-2xl bg-ink px-6 py-8 text-paper sm:px-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="font-serif text-[28px] leading-tight">Want us to pitch these for you?</h2>
            <p className="mt-2 max-w-xl text-[14.5px] text-paper/70">
              With Done-for-you, we send the pitches, follow up, and introduce you to the brands that say yes.
            </p>
          </div>
          <Link href="/beta?plan=dfy" className="inline-flex items-center justify-center rounded-full bg-paper px-6 py-3 text-[15px] font-medium text-ink hover:bg-highlight">
            Upgrade to Done-for-you
          </Link>
        </div>
      )}
    </div>
  );
}
