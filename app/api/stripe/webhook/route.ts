import { after } from "next/server";
import Stripe from "stripe";
import { markPaid, notifyUnmatchedPayment } from "@/lib/orders";
import { researchList } from "@/lib/research";

// Stripe calls this when a Payment Link checkout completes; research starts automatically.
export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(payload, request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid" && session.client_reference_id) {
      const list = await markPaid(session.client_reference_id, session.customer_details?.email ?? "", session.amount_total);
      if (list) after(() => researchList(list.id));
    } else if (session.payment_status === "paid") {
      await notifyUnmatchedPayment(session.customer_details?.email ?? "", session.amount_total);
    }
  }
  return new Response("OK");
}
