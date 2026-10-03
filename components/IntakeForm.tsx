"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Arrow } from "@/components/Chrome";
import type { Profile } from "@/lib/sponsors";
import { PROFILE_KEY, writeStorage } from "@/lib/storage";

const FIELDS: {
  key: keyof Profile;
  label: string;
  placeholder: string;
  hint?: string;
  textarea?: boolean;
  half?: boolean;
  required?: boolean;
}[] = [
  { key: "name", label: "Publication or project name", placeholder: "The Quad Review", required: true, half: true },
  { key: "url", label: "Website", placeholder: "thequadreview.com", half: true },
  { key: "niche", label: "Niche & topics", placeholder: "Student life, campus news, culture, careers", hint: "Comma-separated works best.", required: true },
  { key: "audience", label: "Who reads, listens or watches?", placeholder: "University students aged 18–25 who care about culture, climate and landing their first job", textarea: true, required: true },
  { key: "location", label: "Location", placeholder: "London, UK", half: true },
  { key: "audienceSize", label: "Approx. audience size", placeholder: "8,500 subscribers", half: true },
  { key: "price", label: "Current sponsorship price", placeholder: "£250 per issue — or “not sure yet”" },
];

const EMPTY: Profile = { name: "", url: "", niche: "", audience: "", location: "", audienceSize: "", price: "" };

export function IntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    writeStorage(PROFILE_KEY, JSON.stringify(form));
    // A short beat so the transition feels deliberate rather than instant.
    setTimeout(() => router.push("/dashboard"), 650);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-card p-5 shadow-[0_12px_40px_-24px_rgba(26,25,21,0.18)] sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
            <label htmlFor={f.key} className="label">
              {f.label}
              {!f.required && <span className="font-normal text-ink-muted"> · optional</span>}
            </label>
            {f.textarea ? (
              <textarea id={f.key} rows={3} required={f.required} placeholder={f.placeholder} value={form[f.key]} onChange={set(f.key)} className="field resize-none leading-relaxed" />
            ) : (
              <input id={f.key} required={f.required} placeholder={f.placeholder} value={form[f.key]} onChange={set(f.key)} className="field" />
            )}
            {f.hint && <p className="mt-1.5 text-[12.5px] text-ink-muted">{f.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-[12.5px] text-ink-muted sm:text-left">Free instant preview · no account needed</p>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
              Building your preview…
            </>
          ) : (
            <>
              See my free preview <Arrow />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
