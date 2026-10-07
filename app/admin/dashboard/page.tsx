import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { getMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard · SponsorFlow", robots: { index: false, follow: false } };

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

function Delta({ now, before, unit = "" }: { now: number; before: number; unit?: string }) {
  if (!now && !before) return <span className="text-ink-muted">No activity yet</span>;
  const diff = now - before;
  return (
    <span className="text-ink-muted">
      {diff === 0 ? "Same as" : diff > 0 ? `▲ ${unit}${Math.abs(diff)} vs` : `▼ ${unit}${Math.abs(diff)} vs`} last week
    </span>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: React.ReactNode }) {
  return (
    <div className="bg-card px-5 py-5 sm:px-6">
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-serif text-[36px] leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-[12.5px]">{note}</div>
    </div>
  );
}

const PIPELINE = ["Prospect", "Contacted", "Replied", "Interested", "Sponsor", "Not now"];

export default async function DashboardPage() {
  if (!(await isAdmin())) return <LoginForm />;
  const m = await getMetrics();
  const maxDaily = Math.max(1, ...m.daily.map((d) => d.sent));
  const pipeline = PIPELINE.map((s) => ({ status: s, n: m.teePipeline.find((p) => p.status === s)?.n ?? 0 }));
  const maxPipe = Math.max(1, ...pipeline.map((p) => p.n));

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        <h1 className="font-serif text-[40px] leading-tight">Business dashboard</h1>
        <p className="mt-1 text-[14px] text-ink-soft">Everything at a glance. Weeks start on Monday.</p>

        {/* Headline numbers */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-5">
          <Tile label="Revenue this week" value={money(m.revenue.this_week)} note={<Delta now={m.revenue.this_week / 100} before={m.revenue.last_week / 100} unit="$" />} />
          <Tile
            label="Total revenue"
            value={money(m.revenue.total)}
            note={<span className="text-ink-muted">{m.revenue.orders} orders · {m.revenue.list_orders} List, {m.revenue.dfy_orders} Done-for-you</span>}
          />
          <Tile label="Emails sent this week" value={String(m.email.sent_this_week)} note={<Delta now={m.email.sent_this_week} before={m.email.sent_last_week} />} />
          <Tile label="Delivered" value={pct(m.email.delivered, m.email.sent)} note={<span className="text-ink-muted">{m.email.delivered} of {m.email.sent} emails</span>} />
          <Tile label="Reply rate" value={pct(m.email.replied, m.email.sent)} note={<span className="text-ink-muted">{m.email.replied} replies · {m.unsubscribed} unsubscribed</span>} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Emails per day */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-[15px] font-medium">Emails sent per day</h2>
            <p className="text-[12.5px] text-ink-muted">Last 14 days, all campaigns</p>
            <div className="mt-6 flex h-40 items-end gap-[2px] border-b border-line">
              {m.daily.map((d) => {
                const label = new Date(`${d.day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center" title={`${label}: ${d.sent} sent`}>
                    <div
                      className="w-full max-w-[22px] rounded-t-[4px] bg-accent transition group-hover:bg-ink"
                      style={{ height: d.sent ? `${Math.max(4, (d.sent / maxDaily) * 100)}%` : 0 }}
                    />
                    {d.sent === maxDaily && d.sent > 0 && <span className="absolute -top-5 text-[11px] font-medium tabular-nums">{d.sent}</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-ink-muted">
              <span>{new Date(`${m.daily[0].day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span>Today</span>
            </div>
          </section>

          {/* TEE pipeline */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-[15px] font-medium">TEE sponsor pipeline</h2>
            <p className="text-[12.5px] text-ink-muted">SponsorFlow tested on our own magazine</p>
            <ul className="mt-5 space-y-2.5">
              {pipeline.map((p) => (
                <li key={p.status} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-[13.5px]">
                  <span className="text-ink-soft">{p.status}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${(p.n / maxPipe) * 100}%` }} />
                  </span>
                  <span className="text-right font-medium tabular-nums">{p.n}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Campaigns */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
          <div className="px-6 pt-5">
            <h2 className="text-[15px] font-medium">Outreach campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[640px] text-left text-[13.5px]">
              <thead>
                <tr className="border-y border-line text-ink-muted">
                  {["Campaign", "Status", "Sent", "Delivered", "Replied", "Reply rate", "Follow-ups", "Queued", "Failed"].map((h) => (
                    <th key={h} className="px-6 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {m.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-3 font-medium">{c.publication === "SponsorFlow" ? "SponsorFlow sales" : c.publication}</td>
                    <td className="px-6 py-3 capitalize">{c.status}</td>
                    <td className="px-6 py-3 tabular-nums">{c.sent}</td>
                    <td className="px-6 py-3 tabular-nums">{c.delivered}</td>
                    <td className="px-6 py-3 tabular-nums">{c.replied}</td>
                    <td className="px-6 py-3 tabular-nums">{pct(c.replied, c.sent)}</td>
                    <td className="px-6 py-3 tabular-nums">{c.followups}</td>
                    <td className="px-6 py-3 tabular-nums">{c.queued}</td>
                    <td className="px-6 py-3 tabular-nums">{c.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Customers */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-[15px] font-medium">Customers</h2>
            {m.customers.length === 0 ? (
              <p className="mt-3 text-[14px] text-ink-soft">No paid orders yet. When someone buys, they show up here with their list status.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line text-[13.5px]">
                {m.customers.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                    <Link href={`/admin/lists/${c.id}`} className="font-medium hover:underline">{c.publication}</Link>
                    <span className="text-ink-muted">{c.plan === "dfy" ? "Done-for-you" : "List"} · {money(c.amount_cents ?? 0)}</span>
                    <span className="ml-auto text-ink-muted">{c.notified_at ? "Delivered" : c.research_status === "error" ? "Research failed" : "Researching"}</span>
                  </li>
                ))}
              </ul>
            )}
            {m.revenue.abandoned > 0 && (
              <p className="mt-3 text-[12.5px] text-ink-muted">{m.revenue.abandoned} people started an order in the last 30 days but didn&apos;t pay.</p>
            )}
          </section>

          {/* Replies + costs */}
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="text-[15px] font-medium">Latest replies</h2>
            {m.recentReplies.length === 0 ? (
              <p className="mt-3 text-[14px] text-ink-soft">No replies yet. Replies usually come 1 to 3 days after an email, and follow-ups go out on day 4.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line text-[13.5px]">
                {m.recentReplies.map((r) => (
                  <li key={`${r.publication}-${r.brand}`} className="flex items-center gap-3 py-2.5">
                    <span className="font-medium">{r.brand}</span>
                    <span className="text-ink-muted">{r.publication === "SponsorFlow" ? "SponsorFlow sales" : r.publication}</span>
                    <span className="ml-auto rounded-full border border-line px-2.5 py-0.5 text-[12px]">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <h2 className="mt-8 text-[15px] font-medium">Running costs</h2>
            <ul className="mt-2 space-y-1 text-[13.5px] text-ink-soft">
              <li>AI research: {m.researched} lists so far, about ${m.researched} total</li>
              <li>Domain: $11.25 a year · P.O. box: paid separately</li>
              <li>Hosting, database, email: $0 on free plans</li>
              <li>Stripe: 2.9% + 30¢ per sale</li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
