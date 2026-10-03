"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow } from "@/components/Chrome";
import { CHECKOUT_URL, submitLead } from "@/lib/config";
import type { Profile } from "@/lib/sponsors";
import { PROFILE_KEY, useStoredString } from "@/lib/storage";

type Intent = "list" | "question";

export function BetaForm() {
  const [rawProfile] = useStoredString(PROFILE_KEY);
  const [intent, setIntent] = useState<Intent>("list");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  let profile: Partial<Profile> = {};
  try {
    profile = rawProfile ? JSON.parse(rawProfile) : {};
  } catch {}

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setState("sending");
    try {
      await submitLead({ ...data, intent, profile });
      if (intent === "list" && CHECKOUT_URL) {
        const url = new URL(CHECKOUT_URL);
        if (typeof data.email === "string") url.searchParams.set("prefilled_email", data.email);
        window.location.href = url.toString();
        return;
      }
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center sm:p-12">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-5 font-serif text-[32px] leading-tight">
          {intent === "list" ? "You're on the founding list." : "Message received."}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-soft">
          {intent === "list"
            ? "We'll reply within 1 business day with payment details and next steps. Your list arrives within 3 business days of payment."
            : "We'll reply within 1 business day."}
        </p>
        <Link href="/dashboard" className="btn-ghost mt-8">
          Back to my dashboard
        </Link>
      </div>
    );
  }

  return (
    <form key={rawProfile ?? "empty"} id="contact" onSubmit={onSubmit} className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 shadow-[0_12px_40px_-24px_rgba(26,25,21,0.18)] sm:p-8">
      <fieldset>
        <legend className="label">I&apos;d like to…</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-paper p-1">
          {(
            [
              ["list", "Get my 20 matches"],
              ["question", "Ask a question"],
            ] as [Intent, string][]
          ).map(([v, label]) => (
            <label
              key={v}
              className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-[14px] font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                intent === v ? "bg-card text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              <input type="radio" name="intent" value={v} checked={intent === v} onChange={() => setIntent(v)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="label">Your name</label>
          <input id="fullName" name="fullName" required autoComplete="name" className="field" placeholder="Alex Morgan" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="alex@thequadreview.com" />
        </div>
        <div>
          <label htmlFor="publication" className="label">Publication</label>
          <input id="publication" name="publication" required={intent === "list"} defaultValue={profile.name} className="field" placeholder="The Quad Review" />
        </div>
        <div>
          <label htmlFor="website" className="label">Website <span className="font-normal text-ink-muted">· optional</span></label>
          <input id="website" name="website" defaultValue={profile.url} className="field" placeholder="thequadreview.com" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="label">
            {intent === "list" ? "Anything we should know?" : "Your question"}
            {intent === "list" && <span className="font-normal text-ink-muted"> · optional</span>}
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required={intent === "question"}
            className="field resize-none leading-relaxed"
            placeholder={intent === "list" ? "Brands you've worked with, brands to avoid, sponsorship formats you offer…" : "How can we help?"}
          />
        </div>
      </div>

      {profile.name && intent === "list" && (
        <p className="mt-5 rounded-lg bg-paper px-3.5 py-2.5 text-[13px] text-ink-soft">
          We&apos;ll include the details you entered for <span className="font-medium text-ink">{profile.name}</span> — no need to repeat them.
        </p>
      )}

      {state === "error" && (
        <p role="alert" className="mt-5 text-[13.5px] text-[#a33a2b]">
          Something went wrong sending that. Please try again in a moment.
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className="btn-primary mt-7 w-full">
        {state === "sending" ? "Sending…" : intent === "list" ? (
          <>
            {CHECKOUT_URL ? "Continue to payment — $29" : "Reserve my founding spot — $29"} <Arrow />
          </>
        ) : (
          "Send message"
        )}
      </button>
      {intent === "list" && (
        <p className="mt-3 text-center text-[12.5px] text-ink-muted">
          {CHECKOUT_URL ? "Secure checkout. Refund if the list isn't useful." : "No payment yet — we'll confirm by email first."}
        </p>
      )}
    </form>
  );
}
