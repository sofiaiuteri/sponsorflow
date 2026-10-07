"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { answerReply } from "@/lib/outreach";
import { researchList } from "@/lib/research";

const uuid = (v: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("Bad id");
  return v;
};

export async function sendAnswer(replyId: string, form: FormData) {
  await requireAdmin();
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  const result = await answerReply(uuid(replyId), body.slice(0, 8000));
  if (!result.ok) throw new Error(result.note);
  revalidatePath("/admin/inbox");
}

export async function setHandled(replyId: string, handled: boolean) {
  await requireAdmin();
  await sql`UPDATE inbound_replies SET handled = ${handled} WHERE id = ${uuid(replyId)}`;
  revalidatePath("/admin/inbox");
}

/** Builds a free 5-sponsor sample list for a publication that replied to SponsorFlow sales outreach. */
export async function createSample(replyId: string) {
  await requireAdmin();
  const [r] = (await sql`
    SELECT r.from_email, p.id AS prospect_id, p.brand, p.category, p.why, p.evidence
    FROM inbound_replies r JOIN prospects p ON p.id = r.prospect_id WHERE r.id = ${uuid(replyId)}`) as {
    from_email: string; prospect_id: string; brand: string; category: string; why: string; evidence: string;
  }[];
  if (!r) return;
  const existing = await sql`SELECT id FROM lists WHERE sample_for = ${r.prospect_id}`;
  if (existing.length) return;
  const profile = [`Type and location: ${r.category}`, r.why && `What they publish: ${r.why}`, r.evidence && `Website: ${r.evidence}`].filter(Boolean).join("\n");
  const [list] = (await sql`
    INSERT INTO lists (publication, summary, plan, customer_email, profile, sample_for, research_status, research_note)
    VALUES (${r.brand}, ${r.category}, 'sample', ${r.from_email}, ${profile}, ${r.prospect_id}, 'queued', 'Starting…')
    RETURNING id`) as { id: string }[];
  after(() => researchList(list.id, { count: 5 }));
  revalidatePath("/admin/inbox");
}
