"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { getListById, sql } from "@/lib/db";
import { draftCampaign, getOrCreateCampaign, sendCampaignBatch, sendTestCopy } from "@/lib/outreach";

const uuid = (v: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("Bad id");
  return v;
};
const path = (listId: string) => `/admin/lists/${listId}/outreach`;

export async function saveCampaign(listId: string, form: FormData) {
  await requireAdmin();
  const list = await getListById(uuid(listId));
  if (!list) return;
  const c = await getOrCreateCampaign(list);
  const cap = Math.min(25, Math.max(1, Number(form.get("daily_cap")) || 8));
  const days = Math.min(14, Math.max(2, Number(form.get("followup_days")) || 4));
  await sql`
    UPDATE campaigns SET from_name = ${String(form.get("from_name") ?? "").trim().slice(0, 80) || "Sofia Iuteri"},
      sender_intro = ${String(form.get("sender_intro") ?? "").trim().slice(0, 2000)},
      signature = ${String(form.get("signature") ?? "").trim().slice(0, 500)},
      daily_cap = ${cap}, followup_days = ${days}, followups = ${form.get("followups") === "on"}, updated_at = now()
    WHERE id = ${c.id}`;
  revalidatePath(path(listId));
}

export async function writeDrafts(listId: string) {
  await requireAdmin();
  await draftCampaign(uuid(listId));
  revalidatePath(path(listId));
}

export async function saveEmail(listId: string, emailId: string, form: FormData) {
  await requireAdmin();
  await sql`
    UPDATE outreach_emails SET subject = ${String(form.get("subject") ?? "").trim().slice(0, 200)},
      body = ${String(form.get("body") ?? "").trim().slice(0, 6000)},
      status = CASE WHEN ${form.get("approve") === "1"} THEN 'approved' ELSE status END
    WHERE id = ${uuid(emailId)} AND status IN ('draft', 'approved')`;
  revalidatePath(path(listId));
}

export async function setEmailStatus(listId: string, emailId: string, status: "approved" | "draft" | "skipped") {
  await requireAdmin();
  await sql`UPDATE outreach_emails SET status = ${status} WHERE id = ${uuid(emailId)} AND status IN ('draft', 'approved', 'skipped')`;
  revalidatePath(path(listId));
}

export async function approveAll(listId: string, campaignId: string) {
  await requireAdmin();
  await sql`UPDATE outreach_emails SET status = 'approved' WHERE campaign_id = ${uuid(campaignId)} AND status = 'draft'`;
  revalidatePath(path(listId));
}

export async function setCampaignStatus(listId: string, campaignId: string, status: "active" | "paused") {
  await requireAdmin();
  await sql`UPDATE campaigns SET status = ${status}, updated_at = now() WHERE id = ${uuid(campaignId)}`;
  // Starting sends the first batch right away instead of waiting for tomorrow's scheduled run.
  if (status === "active") await sendCampaignBatch(campaignId);
  revalidatePath(path(listId));
}

export async function sendNow(listId: string, campaignId: string) {
  await requireAdmin();
  await sendCampaignBatch(uuid(campaignId));
  revalidatePath(path(listId));
}

export async function sendTest(listId: string, emailId: string) {
  await requireAdmin();
  const result = await sendTestCopy(uuid(emailId));
  if (!result.ok) throw new Error(result.note);
  revalidatePath(path(listId));
}
