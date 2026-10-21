"use client";

import { useState } from "react";
import { Arrow } from "@/components/Chrome";

export function AiCheckForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/ai-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || "");
        throw new Error("failed");
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
        <h2 className="mt-5 font-serif text-[32px] leading-tight">Thanks, you&apos;re on the list!</h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-soft">
          You&apos;ll get your report within 2 business days. If I have a question about your business, I&apos;ll email you first.
        </p>
      </div>
    );
  }

  return (
    <form id="check" onSubmit={onSubmit} className="self-start scroll-mt-24 rounded-2xl border border-line bg-card p-5 shadow-[0_12px_40px_-24px_rgba(26,25,21,0.18)] sm:p-8">
      <p className="text-[15.5px] font-medium">Request your free check</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="business" className="label">Business name</label>
          <input id="business" name="business" required className="field" placeholder="Blue Ridge Bike Co." />
        </div>
        <div>
          <label htmlFor="kind" className="label">Type of business</label>
          <input id="kind" name="kind" required className="field" placeholder="Bike shop, café, outfitter…" />
        </div>
        <div>
          <label htmlFor="city" className="label">City or town</label>
          <input id="city" name="city" required className="field" placeholder="Lexington, VA" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="website" className="label">Website <span className="font-normal text-ink-muted">· optional</span></label>
          <input id="website" name="website" className="field" placeholder="blueridgebike.com" />
        </div>
        <div>
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" name="name" required autoComplete="name" className="field" placeholder="Alex Morgan" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="alex@blueridgebike.com" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="label">
            What do customers usually ask about you? <span className="font-normal text-ink-muted">· optional</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="field resize-none leading-relaxed"
            placeholder="Do you do repairs? Are you open Sundays? Where can I rent a bike near campus?"
          />
        </div>
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="nickname">Leave this empty</label>
          <input id="nickname" name="nickname" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {state === "error" && (
        <p role="alert" className="mt-5 text-[13.5px] text-[#a33a2b]">
          {error || "Something went wrong sending that. Please try again in a moment."}
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className="btn-primary mt-7 w-full">
        {state === "sending" ? "Sending…" : <>Get my free report <Arrow /></>}
      </button>
      <p className="mt-3 text-center text-[12.5px] text-ink-muted">Free check, no strings. Your report arrives within 2 business days.</p>
    </form>
  );
}
