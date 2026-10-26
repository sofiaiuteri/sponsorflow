import { z } from "zod";
import { sql } from "@/lib/db";

// Shared weekly planner for TEE's social media team (Lily + Bryn), used by the unlisted
// page at theexperienceexchange.vercel.app/social-plan.html.
const CORS = {
  "Access-Control-Allow-Origin": "https://theexperienceexchange.vercel.app",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const Week = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = (max: number) => z.string().max(max).catch("");
const Row = z.object({ day: text(20), idea: text(500), type: text(60), platform: text(60), owner: text(40), status: text(40) });
const Body = z.object({ week: Week, rows: z.array(Row).max(40) });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const week = Week.safeParse(new URL(request.url).searchParams.get("week"));
  if (!week.success) return Response.json({ error: "Bad week" }, { status: 400, headers: CORS });
  const [row] = (await sql`SELECT rows, updated_at FROM tee_social_schedule WHERE week = ${week.data}`) as { rows: unknown; updated_at: string }[];
  return Response.json({ rows: row?.rows ?? null, updated_at: row?.updated_at ?? null }, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad data" }, { status: 400, headers: CORS });
  const { week, rows } = parsed.data;
  await sql`
    INSERT INTO tee_social_schedule (week, rows, updated_at) VALUES (${week}, ${JSON.stringify(rows)}::jsonb, now())
    ON CONFLICT (week) DO UPDATE SET rows = EXCLUDED.rows, updated_at = now()`;
  return Response.json({ ok: true }, { headers: CORS });
}
