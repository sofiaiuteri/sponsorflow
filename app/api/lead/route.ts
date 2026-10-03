// Minimal lead sink for the MVP: logs submissions so they show up in your
// hosting provider's function logs. Swap for NEXT_PUBLIC_FORM_ENDPOINT
// (Formspree etc.) when you want leads in your inbox.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    return Response.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  console.log("[sponsorflow:lead]", JSON.stringify(body));
  return Response.json({ ok: true });
}
