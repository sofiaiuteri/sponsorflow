import { createPendingOrder, type OrderInput } from "@/lib/orders";

// Saves an order before checkout so the Stripe payment can be matched back to it (client_reference_id).
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const order: OrderInput = {
    plan: body.plan === "dfy" ? "dfy" : "list",
    fullName: str(body.fullName, 120),
    email: str(body.email, 200).toLowerCase(),
    publication: str(body.publication, 200),
    website: str(body.website, 300),
    topics: str(body.topics),
    audience: str(body.audience, 1000),
    location: str(body.location, 200),
    audienceSize: str(body.audienceSize, 100),
    currentPrice: str(body.currentPrice, 100),
    notes: str(body.notes, 2000),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email) || !order.publication) {
    return Response.json({ ok: false, error: "Email and publication are required" }, { status: 400 });
  }
  if (body.acceptTerms !== true) return Response.json({ ok: false, error: "Please accept the terms" }, { status: 400 });

  const orderId = await createPendingOrder(order);
  return Response.json({ ok: true, orderId });
}
