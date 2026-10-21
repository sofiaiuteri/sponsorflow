import { z } from "zod";
import { saveAiCheck } from "@/lib/aicheck";

const text = (max: number) => z.string().trim().max(max).catch("");
const Body = z.object({
  business: z.string().trim().min(1).max(200),
  website: text(300),
  city: z.string().trim().min(1).max(160),
  kind: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  notes: text(2000),
  nickname: text(200), // honeypot: hidden from people, bots fill it in
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Please fill in your business, city, type of business, name and a valid email." }, { status: 400 });
  }
  const { nickname, ...req } = parsed.data;
  if (nickname) return Response.json({ ok: true });
  await saveAiCheck(req);
  return Response.json({ ok: true });
}
