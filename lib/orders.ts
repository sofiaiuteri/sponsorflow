import { Resend } from "resend";
import { sql, type List } from "./db";
import { FROM_ADDRESS, draftCampaign } from "./outreach";

// Automatic order flow: order form -> pending list -> Stripe payment -> research -> "your list is ready" email.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sponsorflowhq.com";
const OWNER_EMAIL = process.env.REPLY_FORWARD_TO || "sofiaiuteri@icloud.com";

let client: Resend | null = null;
async function mail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY || !to) return;
  client ??= new Resend(process.env.RESEND_API_KEY);
  const { error } = await client.emails.send({ from: `Sofia at SponsorFlow <${FROM_ADDRESS}>`, to: [to], subject, text });
  if (error) console.error("[orders] email failed", to, error.message);
}

export type OrderInput = {
  plan: "list" | "dfy";
  fullName: string;
  email: string;
  publication: string;
  website: string;
  topics: string;
  audience: string;
  location: string;
  audienceSize: string;
  currentPrice: string;
  notes: string;
};

export async function createPendingOrder(o: OrderInput) {
  const profile = [
    o.topics && `Topics: ${o.topics}`,
    o.audience && `Audience: ${o.audience}`,
    o.location && `Location: ${o.location}`,
    o.audienceSize && `Audience size: ${o.audienceSize}`,
    o.currentPrice && `Current sponsorship rate: ${o.currentPrice}`,
    o.website && `Website: ${o.website}`,
    o.notes && `Notes from the publication: ${o.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
  const summary = [o.topics, o.location].filter(Boolean).join(" · ");
  const [row] = (await sql`
    INSERT INTO lists (publication, summary, plan, customer_email, contact_name, website, profile, order_status)
    VALUES (${o.publication}, ${summary}, ${o.plan}, ${o.email}, ${o.fullName}, ${o.website}, ${profile}, 'pending')
    RETURNING id`) as { id: string }[];
  return row.id;
}

const portalUrl = (list: List) => `${SITE}/l/${list.token}`;
const firstName = (list: List) => list.contact_name.split(/\s+/)[0] || "there";

/** Called from the Stripe webhook. Returns the list only the first time payment is recorded. */
export async function markPaid(orderId: string, email: string, amountCents: number | null) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const rows = (await sql`
    UPDATE lists SET order_status = 'paid', paid_at = now(), amount_cents = ${amountCents},
      customer_email = CASE WHEN customer_email = '' THEN ${email} ELSE customer_email END,
      plan = CASE WHEN ${amountCents ?? 0} >= 4900 THEN 'dfy' ELSE plan END,
      updated_at = now()
    WHERE id = ${orderId} AND order_status <> 'paid'
    RETURNING *`) as List[];
  const list = rows[0];
  if (!list) return null;

  const dfy = list.plan === "dfy";
  await mail(
    list.customer_email,
    `We're researching sponsors for ${list.publication}`,
    `Hi ${firstName(list)},\n\nThanks so much for your order! We've started researching sponsors for ${list.publication}. You'll get an email with a link to your sponsor list as soon as it's ready, usually within a few hours and always within 3 business days.${
      dfy ? "\n\nSince you chose Done-for-you, we'll also write a personal pitch for each brand. We'll check in before anything goes out." : ""
    }\n\nIf there's anything we should know (brands you've worked with, brands to avoid, the kinds of sponsorships you offer), just reply to this email.\n\nThanks,\nSofia\nSponsorFlow`,
  );
  await mail(
    OWNER_EMAIL,
    `New order: ${list.publication} (${dfy ? "Done-for-you" : "Sponsor List"}, $${((amountCents ?? 0) / 100).toFixed(2)})`,
    `${list.contact_name || "Someone"} (${list.customer_email}) just paid for ${list.publication}.\n\nResearch has started automatically. Their portal: ${portalUrl(list)}\nAdmin: ${SITE}/admin/lists/${list.id}\n\nDetails they gave:\n${list.profile || "(none)"}`,
  );
  return list;
}

/** Called when research (including contact lookup) finishes. Emails paid customers their link once. */
export async function onResearchComplete(listId: string) {
  // Free samples: tell the owner it's ready to send from the inbox.
  const [sample] = (await sql`
    UPDATE lists SET notified_at = now() WHERE id = ${listId} AND plan = 'sample' AND notified_at IS NULL RETURNING *`) as List[];
  if (sample) {
    await mail(OWNER_EMAIL, `Free sample ready: ${sample.publication}`, `The 5-sponsor sample for ${sample.publication} is ready: ${portalUrl(sample)}\n\nSend it from your inbox (a reply is pre-written for you): ${SITE}/admin/inbox`);
    return;
  }
  const [list] = (await sql`
    UPDATE lists SET notified_at = now()
    WHERE id = ${listId} AND order_status = 'paid' AND notified_at IS NULL
    RETURNING *`) as List[];
  if (!list) return;
  const [{ total, high }] = (await sql`
    SELECT count(*)::int AS total, count(*) FILTER (WHERE fit = 'High')::int AS high FROM prospects WHERE list_id = ${listId}`) as {
    total: number;
    high: number;
  }[];

  const dfy = list.plan === "dfy";
  if (dfy) {
    try {
      await draftCampaign(listId);
    } catch (err) {
      console.error("[orders] drafting failed", listId, err);
    }
  }

  await mail(
    list.customer_email,
    `Your sponsor list for ${list.publication} is ready`,
    `Hi ${firstName(list)},\n\nGood news, your SponsorFlow list is ready:\n${portalUrl(list)}\n\nIt has ${total} sponsor prospects picked for your audience, including ${high} high-fit brands. For each one you'll find why it fits, a sponsorship idea, an opening line you can use, and who to contact. Start with the high-fit brands, and use the status and notes to keep track as you reach out.\n\nThis link is private to you, so please don't share it publicly.${
      dfy ? "\n\nNext, we'll send you the pitches we've written so you can look them over before anything goes out." : "\n\nWant us to send the pitches for you? Reply and ask about Done-for-you."
    }\n\nIf the list isn't useful, reply and we'll refund you. And if you land a sponsor, we'd love to hear about it!\n\nSofia\nSponsorFlow`,
  );
  await mail(
    OWNER_EMAIL,
    `List delivered: ${list.publication}${dfy ? " (drafts ready to review)" : ""}`,
    `${list.publication}'s list (${total} prospects) was emailed to ${list.customer_email}.\n\nPortal: ${portalUrl(list)}\n${dfy ? `Review and approve their pitches: ${SITE}/admin/lists/${list.id}/outreach` : `Admin: ${SITE}/admin/lists/${list.id}`}`,
  );
}

/** A payment arrived without a matching order (e.g. someone used the Stripe link directly). */
export async function notifyUnmatchedPayment(email: string, amountCents: number | null) {
  await mail(
    OWNER_EMAIL,
    `Payment received without order details ($${((amountCents ?? 0) / 100).toFixed(2)})`,
    `${email || "Someone"} paid through Stripe but didn't come through the order form, so research didn't start automatically.\n\nReply to them for their publication details, then create their list in admin: ${SITE}/admin`,
  );
}

/** Alert the owner when research fails for a paying customer, so the order never silently stalls. */
export async function onResearchFailed(listId: string, reason: string) {
  const [list] = (await sql`SELECT * FROM lists WHERE id = ${listId} AND order_status = 'paid'`) as List[];
  if (!list) return;
  const credits = /credit|billing|balance|\(400\)/i.test(reason);
  await mail(
    OWNER_EMAIL,
    `Action needed: research failed for ${list.publication}`,
    `Research for a paid order (${list.publication}, ${list.customer_email}) didn't finish.\n\nReason: ${reason}${
      credits ? "\n\nThis usually means the Anthropic API credits ran out. Add credits at https://console.anthropic.com (Settings > Billing), then click \"Research\" again:" : "\n\nTry again here:"
    } ${SITE}/admin/lists/${list.id}`,
  );
}
