import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PendingButton } from "@/components/admin/ClientBits";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { getListById, sql } from "@/lib/db";
import { FROM_ADDRESS, emailFrom, getCampaignEmails, getOrCreateCampaign, sendingReadiness } from "@/lib/outreach";
import { approveAll, saveCampaign, saveEmail, sendNow, setCampaignStatus, setEmailStatus, writeDrafts } from "../../../outreach-actions";

export const dynamic = "force-dynamic";
// Drafting 20 emails with AI and sending a batch both run inside these actions.
export const maxDuration = 300;
export const metadata: Metadata = { title: "Outreach · SponsorFlow", robots: { index: false, follow: false } };

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-paper text-ink-soft border-line",
  approved: "bg-[#e8eef7] text-[#2c4a73] border-[#cbd8ea]",
  sent: "bg-[#fbf3e2] text-[#7a5212] border-[#efdcb3]",
  replied: "bg-accent-soft text-accent border-[#c7d9cd]",
  failed: "bg-[#f8e1dd] text-[#a33a2b] border-[#efc4bc]",
  skipped: "bg-paper text-ink-muted border-line",
};

export default async function OutreachPage({ params }: PageProps<"/admin/lists/[id]/outreach">) {
  if (!(await isAdmin())) return <LoginForm />;
  const { id } = await params;
  const list = await getListById(id);
  if (!list) notFound();
  const campaign = await getOrCreateCampaign(list);
  const emails = await getCampaignEmails(campaign.id);
  const prospects = (await sql`SELECT brand, reach FROM prospects WHERE list_id = ${list.id}`) as { brand: string; reach: string }[];
  const noEmail = prospects.filter((p) => !emailFrom(p.reach));
  const readiness = sendingReadiness();

  const count = (s: string) => emails.filter((e) => e.status === s).length;
  const drafts = count("draft");
  const approved = count("approved");
  const hasUndrafted = prospects.some((p) => emailFrom(p.reach)) && emails.filter((e) => e.step === 1).length < prospects.filter((p) => emailFrom(p.reach)).length;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8">
        <Link href={`/admin/lists/${list.id}`} className="text-[13.5px] text-ink-soft hover:text-ink">← {list.publication}</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[40px] leading-tight">Outreach</h1>
            <p className="text-[14px] text-ink-soft">
              Sends from <span className="font-medium text-ink">{campaign.from_name} &lt;{FROM_ADDRESS}&gt;</span>. Replies are logged here and forwarded to{" "}
              {list.customer_email || "your inbox"}.
            </p>
          </div>
          <span className="rounded-full border border-line px-3 py-1 text-[13px] font-medium capitalize">{campaign.status}</span>
        </div>

        {!readiness.ready && (
          <div className="mt-6 rounded-xl border border-[#efdcb3] bg-[#fbf3e2] px-4 py-3 text-[14px] text-[#7a5212]">
            Sending is switched off until these are set up: <strong>{readiness.missing.join(" and ")}</strong>. You can still write and approve drafts.
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5">
          {[
            ["Drafts", drafts],
            ["Approved", approved],
            ["Sent", count("sent")],
            ["Replied", count("replied")],
            ["Failed", count("failed")],
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-5 py-4">
              <div className="eyebrow">{label}</div>
              <div className="mt-1 font-serif text-[30px] leading-none">{value}</div>
            </div>
          ))}
        </div>

        <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-5">
          {hasUndrafted && (
            <form action={writeDrafts.bind(null, list.id)}>
              <PendingButton label={emails.length ? "Write remaining drafts" : "Write drafts with AI"} pendingLabel="Writing drafts… (about a minute)" className="btn-primary" />
            </form>
          )}
          {drafts > 0 && (
            <form action={approveAll.bind(null, list.id, campaign.id)}>
              <PendingButton label={`Approve all ${drafts} drafts`} pendingLabel="Approving…" className="btn-ghost" />
            </form>
          )}
          {campaign.status !== "active" ? (
            <form action={setCampaignStatus.bind(null, list.id, campaign.id, "active")}>
              <PendingButton
                label={readiness.ready ? "Start sending" : "Start sending (when email is ready)"}
                pendingLabel="Starting…"
                disabled={!approved}
                className="btn-primary"
              />
            </form>
          ) : (
            <>
              <form action={setCampaignStatus.bind(null, list.id, campaign.id, "paused")}>
                <PendingButton label="Pause sending" pendingLabel="Pausing…" className="btn-ghost" />
              </form>
              <form action={sendNow.bind(null, list.id, campaign.id)}>
                <PendingButton label="Send today's batch now" pendingLabel="Sending…" className="btn-ghost" />
              </form>
            </>
          )}
          <p className="w-full text-[12.5px] text-ink-muted">
            Sends up to {campaign.daily_cap} emails per weekday (automatically at 10am Eastern), then {campaign.followups ? `one follow-up after ${campaign.followup_days} days to anyone who hasn't replied` : "no follow-ups"}. Brands that reply, unsubscribe or bounce are never emailed again.
          </p>
        </section>

        <details className="mt-4 rounded-2xl border border-line bg-card p-6">
          <summary className="cursor-pointer text-[15px] font-medium">Sender settings</summary>
          <form action={saveCampaign.bind(null, list.id)} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">From name</label>
              <input name="from_name" defaultValue={campaign.from_name} className="field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Emails per day</label>
                <input name="daily_cap" type="number" min={1} max={25} defaultValue={campaign.daily_cap} className="field" />
              </div>
              <div>
                <label className="label">Follow up after (days)</label>
                <input name="followup_days" type="number" min={2} max={14} defaultValue={campaign.followup_days} className="field" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[14px] sm:col-span-2">
              <input type="checkbox" name="followups" defaultChecked={campaign.followups} /> Send one follow-up to brands that haven&apos;t replied
            </label>
            <div className="sm:col-span-2">
              <label className="label">Who we are (the AI uses this in every draft)</label>
              <textarea name="sender_intro" rows={4} defaultValue={campaign.sender_intro} className="field resize-y" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Signature</label>
              <textarea name="signature" rows={3} defaultValue={campaign.signature} className="field resize-y" />
            </div>
            <div>
              <PendingButton label="Save settings" pendingLabel="Saving…" className="btn-primary" />
            </div>
          </form>
        </details>

        <h2 className="mt-10 text-[20px] font-medium">Emails ({emails.length})</h2>
        {emails.length === 0 && <p className="mt-2 text-[14px] text-ink-soft">No drafts yet. Click “Write drafts with AI” to create a personal email for every brand with a published email address.</p>}
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
          <ul className="divide-y divide-line">
            {emails.map((e) => {
              const editable = e.status === "draft" || e.status === "approved";
              return (
                <li key={e.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3.5 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {e.brand} {e.step === 2 && <span className="text-[12px] font-normal text-ink-muted">(follow-up)</span>}
                      </span>
                      <span className="hidden truncate text-[12.5px] text-ink-muted sm:block">{e.to_email}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[12px] capitalize ${STATUS_STYLE[e.status] ?? ""}`}>{e.status}</span>
                      {e.sent_at && <span className="text-[12px] text-ink-muted">{new Date(e.sent_at).toLocaleDateString()}</span>}
                    </summary>
                    <div className="border-t border-line bg-paper/40 px-6 py-5">
                      {e.error && <p className="mb-3 text-[13px] text-[#a33a2b]">{e.error}</p>}
                      {editable ? (
                        <form action={saveEmail.bind(null, list.id, e.id)}>
                          <label className="label">Subject</label>
                          <input name="subject" defaultValue={e.subject} className="field" />
                          <label className="label mt-3">Message</label>
                          <textarea name="body" rows={12} defaultValue={e.body} className="field resize-y text-[14px] leading-relaxed" />
                          <p className="mt-1 text-[12px] text-ink-muted">An unsubscribe line and mailing address are added automatically at the bottom.</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button name="approve" value="1" className="btn-primary">{e.status === "approved" ? "Save" : "Save & approve"}</button>
                            <button name="approve" value="0" className="btn-ghost">Save as draft</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="text-[14px] font-medium">{e.subject}</p>
                          <pre className="mt-2 whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-ink-soft">{e.body}</pre>
                        </>
                      )}
                      {editable && (
                        <form action={setEmailStatus.bind(null, list.id, e.id, "skipped")} className="mt-3">
                          <button className="text-[13px] text-ink-muted hover:text-ink hover:underline">Don&apos;t send this one</button>
                        </form>
                      )}
                      {e.status === "skipped" && (
                        <form action={setEmailStatus.bind(null, list.id, e.id, "draft")} className="mt-3">
                          <button className="text-[13px] text-accent hover:underline">Restore as draft</button>
                        </form>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </div>

        {noEmail.length > 0 && (
          <div className="mt-8 rounded-2xl border border-line bg-card p-6">
            <h2 className="text-[16px] font-medium">Reach these by contact form ({noEmail.length})</h2>
            <p className="mt-1 text-[13.5px] text-ink-soft">These brands only publish a contact form or page, so they can&apos;t be emailed automatically. Open the portal to copy each opening line and submit their form.</p>
            <ul className="mt-3 space-y-1 text-[14px]">
              {noEmail.map((p) => (
                <li key={p.brand}>
                  <span className="font-medium">{p.brand}</span>{" "}
                  {/^https?:\/\//.test(p.reach) ? (
                    <a href={p.reach} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">contact page ↗</a>
                  ) : (
                    <span className="text-ink-muted">{p.reach || "no contact found"}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
