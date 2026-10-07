"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-medium hover:border-ink"
    >
      {done ? "Copied ✓" : "Copy customer link"}
    </button>
  );
}

export function ConfirmButton({ label, message, className }: { label: string; message: string; className?: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {label}
    </button>
  );
}

/** Re-fetches the page every few seconds while background work (AI research) is running. */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
