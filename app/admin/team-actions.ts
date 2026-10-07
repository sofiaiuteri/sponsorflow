"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { sql } from "@/lib/db";
import { APPLICATION_STATUSES } from "@/lib/team";

export async function updateApplication(id: string, form: FormData) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Bad id");
  const status = String(form.get("status") ?? "");
  await sql`
    UPDATE tee_applications SET
      status = ${(APPLICATION_STATUSES as readonly string[]).includes(status) ? status : "New"},
      notes = ${String(form.get("notes") ?? "").slice(0, 4000)},
      updated_at = now()
    WHERE id = ${id}`;
  revalidatePath("/admin/team");
}
