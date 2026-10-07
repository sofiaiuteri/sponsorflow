"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { endSession, passwordMatches, requireAdmin, startSession } from "@/lib/admin";
import { FITS, STATUSES, sql } from "@/lib/db";
import { researchList } from "@/lib/research";
import { researchRecruiting } from "@/lib/recruit";

const text = (f: FormData, k: string, max = 4000) => String(f.get(k) ?? "").trim().slice(0, max);
const fit = (v: string) => ((FITS as readonly string[]).includes(v) ? v : "Medium");
const status = (v: string) => ((STATUSES as readonly string[]).includes(v) ? v : "Prospect");
const uuid = (v: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("Bad id");
  return v;
};

export async function login(_: unknown, form: FormData) {
  if (!passwordMatches(text(form, "password", 200))) return { error: "Wrong password." };
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

export async function createList(form: FormData) {
  await requireAdmin();
  const publication = text(form, "publication", 200);
  if (!publication) return;
  const [row] = await sql`
    INSERT INTO lists (publication, summary, plan, customer_email, profile, kind, website)
    VALUES (${publication}, ${text(form, "summary")}, ${text(form, "plan", 20) === "dfy" ? "dfy" : "list"}, ${text(form, "customer_email", 200)}, ${text(form, "profile")},
      ${text(form, "kind", 20) === "recruiting" ? "recruiting" : "sponsors"}, ${text(form, "website", 300)})
    RETURNING id`;
  redirect(`/admin/lists/${row.id}`);
}

export async function updateList(id: string, form: FormData) {
  await requireAdmin();
  await sql`
    UPDATE lists SET publication = ${text(form, "publication", 200)}, summary = ${text(form, "summary")},
      plan = ${text(form, "plan", 20) === "dfy" ? "dfy" : "list"}, customer_email = ${text(form, "customer_email", 200)}, profile = ${text(form, "profile")}, website = ${text(form, "website", 300)}, updated_at = now()
    WHERE id = ${uuid(id)}`;
  revalidatePath(`/admin/lists/${id}`);
}

export async function startResearch(id: string) {
  await requireAdmin();
  const rows = await sql`
    UPDATE lists SET research_status = 'queued', research_note = 'Starting…', updated_at = now()
    WHERE id = ${uuid(id)} AND research_status NOT IN ('queued', 'running')
    RETURNING id`;
  // Runs after the response is sent, within this route's maxDuration (set on the page).
  const [list] = (await sql`SELECT kind FROM lists WHERE id = ${id}`) as { kind: string }[];
  if (rows.length) after(() => (list?.kind === "recruiting" ? researchRecruiting(id) : researchList(id)));
  revalidatePath(`/admin/lists/${id}`);
}

export async function deleteList(id: string) {
  await requireAdmin();
  await sql`DELETE FROM lists WHERE id = ${uuid(id)}`;
  redirect("/admin");
}

function prospectFields(form: FormData) {
  return {
    brand: text(form, "brand", 200),
    category: text(form, "category", 200),
    fit: fit(text(form, "fit", 20)),
    why: text(form, "why"),
    angle: text(form, "angle"),
    opener: text(form, "opener"),
    contact: text(form, "contact", 300),
    reach: text(form, "reach", 500),
    evidence: text(form, "evidence", 500),
    status: status(text(form, "status", 30)),
    notes: text(form, "notes"),
  };
}

export async function saveProspect(listId: string, prospectId: string | null, form: FormData) {
  await requireAdmin();
  const p = prospectFields(form);
  if (!p.brand) return;
  if (prospectId) {
    await sql`
      UPDATE prospects SET brand = ${p.brand}, category = ${p.category}, fit = ${p.fit}, why = ${p.why}, angle = ${p.angle},
        opener = ${p.opener}, contact = ${p.contact}, reach = ${p.reach}, evidence = ${p.evidence}, status = ${p.status},
        notes = ${p.notes}, updated_at = now()
      WHERE id = ${uuid(prospectId)} AND list_id = ${uuid(listId)}`;
  } else {
    await sql`
      INSERT INTO prospects (list_id, position, brand, category, fit, why, angle, opener, contact, reach, evidence, status, notes)
      VALUES (${uuid(listId)}, (SELECT coalesce(max(position), -1) + 1 FROM prospects WHERE list_id = ${listId}),
        ${p.brand}, ${p.category}, ${p.fit}, ${p.why}, ${p.angle}, ${p.opener}, ${p.contact}, ${p.reach}, ${p.evidence}, ${p.status}, ${p.notes})`;
  }
  await sql`UPDATE lists SET updated_at = now() WHERE id = ${listId}`;
  revalidatePath(`/admin/lists/${listId}`);
}

export async function deleteProspect(listId: string, prospectId: string) {
  await requireAdmin();
  await sql`DELETE FROM prospects WHERE id = ${uuid(prospectId)} AND list_id = ${uuid(listId)}`;
  revalidatePath(`/admin/lists/${listId}`);
}

// Minimal CSV/TSV parser (handles quoted fields) for pasting rows from a spreadsheet.
function parseRows(input: string) {
  const delim = input.split("\n")[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

export async function importProspects(listId: string, form: FormData) {
  await requireAdmin();
  const rows = parseRows(text(form, "rows", 200_000));
  if (rows.length < 2) return;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (names: string[]) => header.findIndex((h) => names.some((n) => h.startsWith(n)));
  const idx = {
    brand: col(["brand", "company", "name"]), category: col(["category", "type"]), fit: col(["fit"]),
    why: col(["why"]), angle: col(["pitch angle", "angle", "pitch"]), opener: col(["opener", "outreach opener", "first line"]),
    contact: col(["suggested contact", "contact person", "contact"]), reach: col(["where to reach", "reach", "email"]), evidence: col(["evidence", "source"]),
  };
  if (idx.brand < 0) return;
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const [{ start }] = (await sql`SELECT coalesce(max(position), -1) + 1 AS start FROM prospects WHERE list_id = ${uuid(listId)}`) as { start: number }[];
  let n = 0;
  for (const r of rows.slice(1)) {
    const brand = get(r, idx.brand);
    if (!brand) continue;
    await sql`
      INSERT INTO prospects (list_id, position, brand, category, fit, why, angle, opener, contact, reach, evidence)
      VALUES (${listId}, ${start + n}, ${brand}, ${get(r, idx.category)}, ${fit(get(r, idx.fit))}, ${get(r, idx.why)}, ${get(r, idx.angle)},
        ${get(r, idx.opener)}, ${get(r, idx.contact)}, ${get(r, idx.reach)}, ${get(r, idx.evidence)})`;
    n++;
  }
  revalidatePath(`/admin/lists/${listId}`);
}
