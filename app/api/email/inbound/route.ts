import { Resend } from "resend";
import { handleBounce, handleInboundReply, markDelivered } from "@/lib/outreach";

// Resend webhook: replies to sofia@<domain> (email.received) and bounces/complaints.
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const payload = await request.text();

  let event;
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    if (event.type === "email.received") {
      await handleInboundReply(event.data.email_id, event.data.from, event.data.subject);
    } else if (event.type === "email.delivered") {
      await markDelivered(event.data.email_id);
    } else if (event.type === "email.bounced") {
      await handleBounce(event.data.to, event.data.bounce?.message ?? "bounce");
    } else if (event.type === "email.complained") {
      await handleBounce(event.data.to, "spam complaint");
    }
  } catch (err) {
    console.error("[inbound]", err);
    return new Response("Error", { status: 500 }); // Resend retries on non-2xx
  }
  return new Response("OK");
}
