import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { enrichContacts } from "@/lib/research";

// Phase 2 of AI research (contact lookup), called by phase 1 so it gets its own time budget.
export const maxDuration = 300;

function authorized(request: Request) {
  const expected = `Bearer ${process.env.ADMIN_SECRET ?? ""}`;
  const got = request.headers.get("authorization") ?? "";
  return Boolean(process.env.ADMIN_SECRET) && got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });
  const { listId } = (await request.json().catch(() => ({}))) as { listId?: string };
  if (!listId || !/^[0-9a-f-]{36}$/i.test(listId)) return Response.json({ ok: false }, { status: 400 });
  after(() => enrichContacts(listId));
  return Response.json({ ok: true }, { status: 202 });
}
