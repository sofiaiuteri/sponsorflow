import { TEE_ROLES, saveApplication } from "@/lib/team";

// Receives applications from the TEE site's Join page (a different domain, hence CORS).
const ALLOWED = ["https://theexperienceexchange.vercel.app", "http://localhost:3200"];

function cors(origin: string | null) {
  const allow = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", Vary: "Origin" };
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const headers = cors(request.headers.get("origin"));
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return Response.json({ ok: false, error: "Invalid request" }, { status: 400, headers });
  if (str(b.website, 200)) return Response.json({ ok: true }, { headers }); // honeypot: bots fill hidden fields

  const app = {
    name: str(b.name, 120),
    email: str(b.email, 200).toLowerCase(),
    school: str(b.school, 160),
    class_year: str(b.class_year, 40),
    major: str(b.major, 120),
    role: (TEE_ROLES as readonly string[]).includes(str(b.role, 80)) ? str(b.role, 80) : "Not sure yet",
    why: str(b.why, 3000),
    samples: str(b.samples, 1000),
    hours: str(b.hours, 40),
    instagram: str(b.instagram, 80),
  };
  if (!app.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) {
    return Response.json({ ok: false, error: "Please add your name and a valid email." }, { status: 400, headers });
  }
  await saveApplication(app);
  return Response.json({ ok: true }, { headers });
}
