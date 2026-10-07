import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AutoRefresh, PendingButton } from "@/components/admin/ClientBits";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { replyPreview } from "@/lib/outreach";
import { createSample, sendAnswer, setHandled } from "../inbox-actions";

export const dynamic = "force-dynamic";
// Creating a free sample runs AI research in the background after the click.
export const maxDuration = 300;
export const metadata: Metadata = { title: "Inbox · SponsorFlow", robots: { index: false, follow: false } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sponsorflowhq.com";

type Row = {
  id: string;
  from_email: string;
  from_name: string;
  subject: string;
  body: string;
  handled: boolean;
  answered_at: string | null;
  received_at: string;
  brand: string | null;
  campaign_pub: string | null;
  sample_token: string | null;
  sample_status: string | null;
  sample_count: number | null;
};

function suggested(r: Row) {
  const first = r.from_name.split(/\s+/)[0] || "there";
  if (r.campaign_pub === "SponsorFlow" && r.sample_token && r.sample_status === "done") {
    return `Hi ${first},\n\nThanks so much for getting back to me! Here are 5 businesses that would be a great fit to sponsor ${r.brand}, each with why it fits, a sponsorship idea, an opening line and who to contact:\n${SITE}/l/${r.sample_token}\n\nIf they're helpful, the full list of 20 is $29 and arrives within a day: ${SITE}/beta?plan=list\nAnd if you'd rather we send the pitches for you, that's our Done-for-you plan.\n\nBest,\nSofia`;
  }
  if (r.campaign_pub === "SponsorFlow") {
    return `Hi ${first},\n\nThanks so much for getting back to me! I'm putting together your 5 free sponsor matches for ${r.brand} now and will send them over shortly.\n\nBest,\nSofia`;
  }
  return `Hi ${first},\n\nThanks so much for getting back to me!\n\n\n\nBest,\nSofia`;
}

export default async function InboxPage() {
  if (!(await isAdmin())) return <LoginForm />;
  const rows = (await sql`
    SELECT r.*, p.brand, l.publication AS campaign_pub,
      s.token AS sample_token, s.research_status AS sample_status,
      (SELECT count(*) FROM prospects sp WHERE sp.list_id = s.id)::int AS sample_count
    FROM inbound_replies r
    LEFT JOIN prospects p ON p.id = r.prospect_id
    LEFT JOIN lists l ON l.id = r.list_id
    LEFT JOIN lists s ON s.sample_for = r.prospect_id
    ORDER BY r.handled, r.received_at DESC
    LIMIT 100`) as Row[];
  const busy = rows.some((r) => r.sample_status === "queued" || r.sample_status === "running");

  return (
    <>
      <AdminHeader />
      <AutoRefresh active={busy} />
      <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8">
        <h1 className="font-serif text-[40px] leading-tight">Inbox</h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          Every reply to sofia@sponsorflowhq.com lands here (and is forwarded to your iCloud). Answer right from this page.
        </p>

        {rows.length === 0 && <p className="mt-10 text-[15px] text-ink-soft">No replies yet. They usually arrive 1 to 3 days after an email goes out.</p>}

        <ul className="mt-8 space-y-4">
          {rows.map((r) => {
            const tag = r.campaign_pub === "SponsorFlow" ? "SponsorFlow sales" : (r.campaign_pub ?? "Other");
            return (
              <li key={r.id} className={`rounded-2xl border bg-card p-5 sm:p-6 ${r.handled ? "border-line opacity-70" : "border-ink/30"}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {!r.handled && <span className="h-2 w-2 rounded-full bg-accent" aria-label="New" />}
                  <span className="font-medium">{r.brand ?? (r.from_name || r.from_email)}</span>
                  <span className="text-[13px] text-ink-muted">
                    {r.from_name ? `${r.from_name} · ` : ""}
                    {r.from_email}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[12px]">{tag}</span>
                  <span className="ml-auto text-[12.5px] text-ink-muted">
                    {new Date(r.received_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-2 text-[13.5px] font-medium text-ink-soft">{r.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{replyPreview(r.body) || "(no text)"}</pre>
                {r.answered_at && <p className="mt-2 text-[12.5px] text-accent">✓ You replied {new Date(r.answered_at).toLocaleDateString()}</p>}

                {r.campaign_pub === "SponsorFlow" && (
                  <div className="mt-4 rounded-xl bg-paper px-4 py-3 text-[13.5px]">
                    {!r.sample_status ? (
                      <form action={createSample.bind(null, r.id)} className="flex flex-wrap items-center gap-3">
                        <span className="text-ink-soft">Interested? Make them a free sample:</span>
                        <PendingButton
                          label="Create free 5-sponsor sample"
                          pendingLabel="Starting…"
                          className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-medium text-paper hover:bg-ink"
                        />
                      </form>
                    ) : r.sample_status === "done" ? (
                      <span>
                        ✓ Free sample ready ({r.sample_count} sponsors):{" "}
                        <Link href={`/l/${r.sample_token}`} target="_blank" className="text-accent underline underline-offset-4">
                          open it
                        </Link>
                        . The reply below includes the link.
                      </span>
                    ) : r.sample_status === "error" ? (
                      <span className="text-[#a33a2b]">Sample research failed. Try again from Lists.</span>
                    ) : (
                      <span className="text-ink-soft">Researching their free sample (about 2 to 4 minutes). This page updates by itself.</span>
                    )}
                  </div>
                )}

                <details className="mt-4" open={!r.handled && !r.answered_at}>
                  <summary className="cursor-pointer text-[13.5px] font-medium text-ink-soft">Reply</summary>
                  <form action={sendAnswer.bind(null, r.id)} className="mt-3">
                    <textarea
                      key={`${r.sample_status}-${r.sample_token}`}
                      name="body"
                      rows={9}
                      defaultValue={suggested(r)}
                      className="field resize-y text-[14px] leading-relaxed"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <PendingButton label={`Send to ${r.from_email}`} pendingLabel="Sending…" className="btn-primary" />
                      <span className="text-[12px] text-ink-muted">Sends from sofia@sponsorflowhq.com, threaded with their email.</span>
                    </div>
                  </form>
                </details>
                <form action={setHandled.bind(null, r.id, !r.handled)} className="mt-3">
                  <button className="text-[12.5px] text-ink-muted hover:text-ink hover:underline">{r.handled ? "Mark as new" : "Mark as done"}</button>
                </form>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
