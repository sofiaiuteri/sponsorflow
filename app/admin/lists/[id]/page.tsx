import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmButton, CopyLink } from "@/components/admin/ClientBits";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin";
import { FITS, STATUSES, getListById, getProspects, type Prospect } from "@/lib/db";
import { deleteList, deleteProspect, importProspects, saveProspect, updateList } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit list · SponsorFlow", robots: { index: false, follow: false } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sponsorflow-self.vercel.app";

function ProspectFields({ p }: { p?: Prospect }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label">Brand</label>
        <input name="brand" required defaultValue={p?.brand} className="field" />
      </div>
      <div>
        <label className="label">Category</label>
        <input name="category" defaultValue={p?.category} className="field" />
      </div>
      <div>
        <label className="label">Fit</label>
        <select name="fit" defaultValue={p?.fit ?? "Medium"} className="field">
          {FITS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" defaultValue={p?.status ?? "Prospect"} className="field">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Why it fits</label>
        <textarea name="why" rows={2} defaultValue={p?.why} className="field resize-y" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Pitch idea</label>
        <textarea name="angle" rows={2} defaultValue={p?.angle} className="field resize-y" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Opening line</label>
        <textarea name="opener" rows={2} defaultValue={p?.opener} className="field resize-y" />
      </div>
      <div>
        <label className="label">Who to contact</label>
        <input name="contact" defaultValue={p?.contact} className="field" />
      </div>
      <div>
        <label className="label">Where to reach (email or URL)</label>
        <input name="reach" defaultValue={p?.reach} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Evidence link</label>
        <input name="evidence" defaultValue={p?.evidence} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Notes</label>
        <textarea name="notes" rows={2} defaultValue={p?.notes} className="field resize-y" />
      </div>
    </div>
  );
}

export default async function EditListPage({ params }: PageProps<"/admin/lists/[id]">) {
  if (!(await isAdmin())) return <LoginForm />;
  const { id } = await params;
  const list = await getListById(id);
  if (!list) notFound();
  const prospects = await getProspects(list.id);
  const url = `${SITE}/l/${list.token}`;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-8">
        <Link href="/admin" className="text-[13.5px] text-ink-soft hover:text-ink">← All lists</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-[40px] leading-tight">{list.publication}</h1>
          <div className="flex flex-wrap gap-2">
            <CopyLink url={url} />
            <Link href={`/l/${list.token}`} target="_blank" className="rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-paper hover:bg-accent">
              Customer view ↗
            </Link>
          </div>
        </div>
        <p className="mt-1 break-all text-[12.5px] text-ink-muted">{url}</p>

        <details className="mt-8 rounded-2xl border border-line bg-card p-6">
          <summary className="cursor-pointer text-[15px] font-medium">List details</summary>
          <form action={updateList.bind(null, list.id)} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Publication</label>
              <input name="publication" required defaultValue={list.publication} className="field" />
            </div>
            <div>
              <label className="label">Customer email</label>
              <input name="customer_email" defaultValue={list.customer_email} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Short description</label>
              <input name="summary" defaultValue={list.summary} className="field" />
            </div>
            <div>
              <label className="label">Plan</label>
              <select name="plan" defaultValue={list.plan} className="field">
                <option value="list">Sponsor List ($29)</option>
                <option value="dfy">Done-for-you ($49 + 10%)</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button className="btn-primary">Save details</button>
            </div>
          </form>
          <form action={deleteList.bind(null, list.id)} className="mt-6 border-t border-line pt-4">
            <ConfirmButton label="Delete this list" message={`Delete ${list.publication} and all its prospects? This can't be undone.`} className="text-[13px] text-[#a33a2b] hover:underline" />
          </form>
        </details>

        <h2 className="mt-10 text-[20px] font-medium">Prospects ({prospects.length})</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
          <ul className="divide-y divide-line">
            {prospects.map((p) => (
              <li key={p.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 truncate font-medium">{p.brand}</span>
                    <span className="hidden text-[12.5px] text-ink-muted sm:block">{p.category}</span>
                    <span className="text-[12.5px] font-medium">{p.fit}</span>
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-[12px]">{p.status}</span>
                    <span className="text-[12px] text-ink-muted group-open:hidden">Edit</span>
                  </summary>
                  <div className="border-t border-line bg-paper/40 px-6 py-5">
                    <form action={saveProspect.bind(null, list.id, p.id)}>
                      <ProspectFields p={p} />
                      <button className="btn-primary mt-5">Save</button>
                    </form>
                    <form action={deleteProspect.bind(null, list.id, p.id)} className="mt-3">
                      <ConfirmButton label="Delete prospect" message={`Delete ${p.brand}?`} className="text-[13px] text-[#a33a2b] hover:underline" />
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>

        <details className="mt-6 rounded-2xl border border-line bg-card p-6">
          <summary className="cursor-pointer text-[15px] font-medium">+ Add a prospect</summary>
          <form action={saveProspect.bind(null, list.id, null)} className="mt-5">
            <ProspectFields />
            <button className="btn-primary mt-5">Add prospect</button>
          </form>
        </details>

        <details className="mt-4 rounded-2xl border border-line bg-card p-6">
          <summary className="cursor-pointer text-[15px] font-medium">Paste many from a spreadsheet</summary>
          <form action={importProspects.bind(null, list.id)} className="mt-4">
            <p className="text-[13.5px] text-ink-soft">
              Copy rows from Google Sheets or Excel, including the header row. Recognized columns: Brand, Category, Fit, Why, Pitch angle, Opener,
              Suggested contact, Where to reach, Evidence.
            </p>
            <textarea name="rows" rows={6} className="field mt-3 font-mono text-[12.5px]" placeholder={"Brand\tCategory\tFit\tWhy it fits\t…"} />
            <button className="btn-primary mt-4">Import rows</button>
          </form>
        </details>
      </main>
    </>
  );
}
