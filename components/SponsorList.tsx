"use client";

import { useState } from "react";
import type { SponsorMatch, Status } from "@/lib/sponsors";

export const STATUSES: Status[] = ["Prospect", "Contacted", "Replied"];

const STATUS_STYLE: Record<Status, { dot: string; pill: string }> = {
  Prospect: { dot: "bg-ink-muted", pill: "bg-paper text-ink-soft border-line" },
  Contacted: { dot: "bg-[#b7791f]", pill: "bg-[#fbf3e2] text-[#7a5212] border-[#efdcb3]" },
  Replied: { dot: "bg-accent", pill: "bg-accent-soft text-accent border-[#c7d9cd]" },
};

export type Fit = "High" | "Medium" | "Low";

export function fitLevel(score: number): Fit {
  if (score >= 72) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

export const FIT_EXPLAINER =
  "An estimate of how closely the brand matches your topics, audience, location and audience size. It's a starting point for research, not a prediction of a yes.";

function FitBadge({ score }: { score: number }) {
  const level = fitLevel(score);
  const filled = level === "High" ? 3 : level === "Medium" ? 2 : 1;
  return (
    <div className="flex items-center gap-2" title={FIT_EXPLAINER}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`w-[4px] rounded-full ${i < filled ? "bg-accent" : "bg-line"}`} style={{ height: 6 + i * 4 }} />
        ))}
      </span>
      <span className="text-[13.5px] font-medium">
        {level}
        <span className="sr-only"> fit</span>
      </span>
    </div>
  );
}

function FitHeader() {
  return (
    <span className="group relative inline-flex items-center gap-1">
      <span className="eyebrow">Fit</span>
      <button type="button" aria-label="How fit is estimated" className="grid h-3.5 w-3.5 place-items-center rounded-full border border-line-strong font-mono text-[9px] text-ink-muted">
        ?
      </button>
      <span role="tooltip" className="pointer-events-none absolute left-0 top-6 z-10 w-64 rounded-lg bg-ink px-3 py-2.5 text-[12.5px] normal-case leading-relaxed tracking-normal text-paper opacity-0 shadow-lg transition group-focus-within:opacity-100 group-hover:opacity-100">
        {FIT_EXPLAINER}
      </span>
    </span>
  );
}

function StatusControl({
  value,
  onChange,
  company,
}: {
  value: Status;
  onChange?: (s: Status) => void;
  company: string;
}) {
  const style = STATUS_STYLE[value];
  return (
    <label className={`relative inline-flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-7 text-[12.5px] font-medium ${style.pill} ${onChange ? "cursor-pointer" : ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {value}
      {onChange && (
        <>
          <svg viewBox="0 0 12 12" className="pointer-events-none absolute right-2.5 h-3 w-3 opacity-60" aria-hidden>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <select
            aria-label={`Outreach status for ${company}`}
            value={value}
            onChange={(e) => onChange(e.target.value as Status)}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </>
      )}
    </label>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable — ignore */
        }
      }}
      className="shrink-0 rounded-full border border-line-strong px-3 py-1 text-[12px] font-medium text-ink-soft transition hover:border-ink hover:text-ink"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function Row({
  m,
  status,
  onStatus,
  open,
  onToggle,
}: {
  m: SponsorMatch;
  status: Status;
  onStatus?: (s: Status) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="group border-b border-line last:border-b-0">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="grid cursor-pointer grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 px-5 py-5 outline-none transition hover:bg-paper/60 focus-visible:bg-paper sm:px-6 md:grid-cols-[minmax(0,1.3fr)_7rem_minmax(0,2.6fr)_7.5rem_1rem] md:items-center"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-paper font-serif text-[17px] text-ink">
            {m.company.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium">{m.company}</div>
            <div className="text-[12.5px] text-ink-muted">{m.category}</div>
          </div>
        </div>

        <div className="justify-self-end md:justify-self-start">
          <FitBadge score={m.score} />
        </div>

        <p className="col-span-2 text-[14px] leading-relaxed text-ink-soft md:col-span-1 md:line-clamp-2">{m.why}</p>

        <div className="flex items-center justify-between md:block">
          <StatusControl value={status} onChange={onStatus} company={m.company} />
          <span className="text-[12.5px] text-ink-muted md:hidden">{open ? "Hide pitch" : "View pitch"}</span>
        </div>

        <svg viewBox="0 0 16 16" className={`hidden h-4 w-4 text-ink-muted transition md:block ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {open && (
        <div className="grid gap-6 px-5 pb-6 sm:px-6 md:grid-cols-[minmax(0,1.3fr)_7rem_minmax(0,2.6fr)_7.5rem_1rem] md:gap-x-4">
          <div className="hidden md:block" />
          <div className="hidden md:block" />
          <div className="space-y-5 md:col-span-3">
            <div>
              <div className="eyebrow mb-1.5">Recommended pitch angle</div>
              <p className="text-[14.5px] leading-relaxed">{m.angle}</p>
            </div>
            <div>
              <div className="eyebrow mb-1.5">Personalized outreach opener</div>
              <div className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4">
                <p className="flex-1 font-serif text-[18px] leading-snug">“{m.opener}”</p>
                <CopyButton text={m.opener} />
              </div>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {m.signals.map((s) => (
                <li key={s} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-ink-muted">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

export function SponsorList({
  matches,
  statuses,
  onStatus,
  defaultOpen,
}: {
  matches: SponsorMatch[];
  statuses?: Record<string, Status>;
  onStatus?: (id: string, s: Status) => void;
  defaultOpen?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_0_rgba(26,25,21,0.03),0_12px_40px_-24px_rgba(26,25,21,0.18)]">
      <div className="hidden grid-cols-[minmax(0,1.3fr)_7rem_minmax(0,2.6fr)_7.5rem_1rem] gap-x-4 border-b border-line px-6 py-3 md:grid">
        <span className="eyebrow">Company</span>
        <FitHeader />
        <span className="eyebrow">Why it fits</span>
        <span className="eyebrow">Status</span>
        <span />
      </div>
      <ul>
        {matches.map((m) => (
          <Row
            key={m.id}
            m={m}
            status={statuses?.[m.id] ?? "Prospect"}
            onStatus={onStatus ? (s) => onStatus(m.id, s) : undefined}
            open={openId === m.id}
            onToggle={() => setOpenId(openId === m.id ? null : m.id)}
          />
        ))}
      </ul>
    </div>
  );
}
