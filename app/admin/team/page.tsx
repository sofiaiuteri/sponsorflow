import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PendingButton } from "@/components/admin/ClientBits";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { APPLICATION_STATUSES, TEE_ROLES, type Application } from "@/lib/team";
import { updateApplication } from "../team-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "TEE Team · SponsorFlow", robots: { index: false, follow: false } };

const STATUS_STYLE: Record<string, string> = {
  New: "bg-accent-soft text-accent border-[#c7d9cd]",
  Interviewing: "bg-[#fbf3e2] text-[#7a5212] border-[#efdcb3]",
  Accepted: "bg-accent text-paper border-accent",
  Declined: "bg-paper text-ink-muted border-line",
};

export default async function TeamPage({ searchParams }: PageProps<"/admin/team">) {
  if (!(await isAdmin())) return <LoginForm />;
  const { role = "All", status = "All" } = (await searchParams) as { role?: string; status?: string };
  const all = (await sql`SELECT * FROM tee_applications ORDER BY (status = 'New') DESC, created_at DESC`) as Application[];
  const shown = all.filter((a) => (role === "All" || a.role === role) && (status === "All" || a.status === status));
  const count = (s: string) => all.filter((a) => a.status === s).length;
  const href = (r: string, s: string) => `/admin/team?role=${encodeURIComponent(r)}&status=${encodeURIComponent(s)}`;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[40px] leading-tight">TEE team applicants</h1>
            <p className="mt-1 text-[14px] text-ink-soft">
              From the Join page:{" "}
              <a href="https://theexperienceexchange.vercel.app/join" target="_blank" className="text-accent underline underline-offset-4">theexperienceexchange.vercel.app/join</a>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {APPLICATION_STATUSES.map((s) => (
            <Link key={s} href={href(role, status === s ? "All" : s)} className={`bg-card px-5 py-4 transition hover:bg-paper ${status === s ? "ring-2 ring-inset ring-ink" : ""}`}>
              <div className="eyebrow">{s}</div>
              <div className="mt-1 font-serif text-[30px] leading-none">{count(s)}</div>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {["All", ...TEE_ROLES].map((r) => (
            <Link
              key={r}
              href={href(r, status)}
              className={`rounded-full px-3 py-1.5 text-[13px] transition ${role === r ? "bg-ink text-paper" : "border border-line text-ink-soft hover:text-ink"}`}
            >
              {r} {r !== "All" && <span className="opacity-60">{all.filter((a) => a.role === r).length}</span>}
            </Link>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="mt-10 text-[15px] text-ink-soft">
            {all.length ? "No applicants match these filters." : "No applications yet. Share the Join page and send the recruiting emails to get the first ones in."}
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {shown.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[17px] font-medium">{a.name}</span>
                <span className="rounded-full border border-line px-2.5 py-0.5 text-[12px]">{a.role}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[12px] ${STATUS_STYLE[a.status] ?? ""}`}>{a.status}</span>
                <span className="ml-auto text-[12.5px] text-ink-muted">{new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <p className="mt-1 text-[13.5px] text-ink-soft">
                {[a.email, a.class_year && `Class of ${a.class_year}`, a.major, a.hours && `${a.hours} hrs/week`, a.instagram].filter(Boolean).join(" · ")}
              </p>
              {a.why && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{a.why}</p>}
              {a.samples && (
                <p className="mt-3 break-all text-[13.5px]">
                  <span className="font-medium">Samples: </span>
                  {a.samples.split(/[\s,]+/).filter(Boolean).map((s) =>
                    /^https?:\/\//.test(s) ? (
                      <a key={s} href={s} target="_blank" rel="noopener noreferrer" className="mr-2 text-accent underline underline-offset-4">{s.replace(/^https?:\/\//, "").slice(0, 50)}</a>
                    ) : (
                      <span key={s} className="mr-1">{s}</span>
                    ),
                  )}
                </p>
              )}
              <form action={updateApplication.bind(null, a.id)} className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                <div>
                  <label className="label">Status</label>
                  <select name="status" defaultValue={a.status} className="field !w-40">
                    {APPLICATION_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="min-w-[220px] flex-1">
                  <label className="label">Notes</label>
                  <input name="notes" defaultValue={a.notes} placeholder="Interview time, impressions…" className="field" />
                </div>
                <PendingButton label="Save" pendingLabel="Saving…" className="btn-primary !py-2.5" />
                <a
                  href={`mailto:${a.email}?subject=${encodeURIComponent("Your Experience Exchange application")}&body=${encodeURIComponent(`Hi ${a.name.split(/\s+/)[0]},\n\nThanks so much for applying to The Experience Exchange! `)}`}
                  className="btn-ghost !py-2.5"
                >
                  Email them
                </a>
              </form>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
