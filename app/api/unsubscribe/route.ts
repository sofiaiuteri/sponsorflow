import { timingSafeEqual } from "node:crypto";
import { suppress, unsubscribeToken } from "@/lib/outreach";

// One-click unsubscribe (RFC 8058): GET from the email footer link, POST from mail clients.
function valid(email: string, token: string) {
  const expected = unsubscribeToken(email);
  return Boolean(email && token) && token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("e") ?? "").toLowerCase();
  const token = url.searchParams.get("t") ?? "";
  if (!valid(email, token)) return null;
  await suppress(email, "unsubscribe link");
  return email;
}

export async function POST(request: Request) {
  return (await handle(request)) ? new Response("Unsubscribed") : new Response("Invalid link", { status: 400 });
}

export async function GET(request: Request) {
  const email = await handle(request);
  const body = email
    ? `<h1>You're unsubscribed</h1><p>${email.replace(/[<>&"]/g, "")} won't receive any more emails from us. Sorry for the bother!</p>`
    : `<h1>That link didn't work</h1><p>Reply to the email with "unsubscribe" and we'll remove you right away.</p>`;
  return new Response(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title><body style="font-family:-apple-system,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#1a1915;background:#f7f5f0">${body}</body>`,
    { status: email ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
