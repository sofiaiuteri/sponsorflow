import { sendAllActive } from "@/lib/outreach";

// Daily send run (see vercel.json). Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true, results: await sendAllActive() });
}
