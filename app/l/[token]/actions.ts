"use server";

import { STATUSES, sql, type ProspectStatus } from "@/lib/db";

// Customers can only change status and notes, and only on prospects in their own list.
export async function updateProspect(token: string, prospectId: string, patch: { status?: string; notes?: string }) {
  if (!/^[0-9a-f-]{36}$/i.test(prospectId)) throw new Error("Bad id");
  const status = patch.status && (STATUSES as readonly string[]).includes(patch.status) ? (patch.status as ProspectStatus) : null;
  const notes = typeof patch.notes === "string" ? patch.notes.slice(0, 4000) : null;

  const rows = await sql`
    UPDATE prospects p SET
      status = COALESCE(${status}, p.status),
      notes = COALESCE(${notes}, p.notes),
      updated_at = now()
    FROM lists l
    WHERE p.id = ${prospectId} AND p.list_id = l.id AND l.token = ${token}
    RETURNING p.id`;
  if (!rows.length) throw new Error("Not found");
}
