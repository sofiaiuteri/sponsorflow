import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { getAllLists } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { createList } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · SponsorFlow", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />;
  const lists = await getAllLists();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        <h1 className="font-serif text-[40px] leading-tight">Sponsor lists</h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">Every customer gets a private link to their list. Edit anything here and it updates for them right away.</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-card">
          {lists.length === 0 && <p className="px-6 py-10 text-center text-ink-soft">No lists yet.</p>}
          <ul className="divide-y divide-line">
            {lists.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/lists/${l.id}`} className="text-[16px] font-medium hover:underline">{l.publication}</Link>
                  <div className="text-[12.5px] text-ink-muted">
                    {l.plan === "dfy" ? "Done-for-you" : "Sponsor List"} · {l.total} prospects · {l.worked} worked · {l.customer_email || "no email"}
                  </div>
                </div>
                <Link href={`/l/${l.token}`} target="_blank" className="text-[13.5px] text-accent hover:underline">Customer view ↗</Link>
                <Link href={`/admin/lists/${l.id}`} className="rounded-full border border-line-strong px-3.5 py-1.5 text-[13px] font-medium hover:border-ink">Edit</Link>
              </li>
            ))}
          </ul>
        </div>

        <form action={createList} className="mt-10 rounded-2xl border border-line bg-card p-6 sm:p-8">
          <h2 className="text-[18px] font-medium">New list</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="publication">Publication</label>
              <input id="publication" name="publication" required className="field" placeholder="Headwaters Magazine" />
            </div>
            <div>
              <label className="label" htmlFor="customer_email">Customer email</label>
              <input id="customer_email" name="customer_email" type="email" className="field" placeholder="editor@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="summary">Short description</label>
              <input id="summary" name="summary" className="field" placeholder="Student environmental magazine at UVM, ~2,000 readers" />
            </div>
            <div>
              <label className="label" htmlFor="plan">Plan</label>
              <select id="plan" name="plan" className="field">
                <option value="list">Sponsor List ($29)</option>
                <option value="dfy">Done-for-you ($49 + 10%)</option>
              </select>
            </div>
          </div>
          <button className="btn-primary mt-6">Create list</button>
        </form>
      </main>
    </>
  );
}
