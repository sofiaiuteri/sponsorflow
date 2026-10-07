import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createHmac } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { sql, type List, type Prospect } from "./db";

// ---------- configuration ----------

export const SEND_DOMAIN = process.env.RESEND_EMAIL_DOMAIN || "sponsorflowhq.com";
export const FROM_ADDRESS = `sofia@${SEND_DOMAIN}`;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sponsorflow-self.vercel.app";
const FORWARD_TO = process.env.REPLY_FORWARD_TO || "sofiaiuteri@icloud.com";
/** Required by CAN-SPAM in every commercial email. Sending stays off until it's set. */
const MAILING_ADDRESS = process.env.MAILING_ADDRESS || "";

/** Statuses meaning the brand has engaged (or asked not to be contacted): never email them again automatically. */
const STOP_STATUSES = ["Replied", "Interested", "Sponsor", "Not now"];

export type Campaign = {
  id: string;
  list_id: string;
  status: "draft" | "active" | "paused" | "done";
  from_name: string;
  sender_intro: string;
  signature: string;
  daily_cap: number;
  followup_days: number;
  followups: boolean;
};

export type OutreachEmail = {
  id: string;
  campaign_id: string;
  prospect_id: string;
  step: number;
  to_email: string;
  subject: string;
  body: string;
  status: "draft" | "approved" | "sent" | "failed" | "skipped" | "replied";
  error: string;
  sent_at: string | null;
  brand?: string;
  prospect_status?: string;
};

export function sendingReadiness() {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY) missing.push("email service");
  if (!MAILING_ADDRESS) missing.push("mailing address");
  return { ready: missing.length === 0, missing };
}

let resendClient: Resend | null = null;
const resend = () => (resendClient ??= new Resend(process.env.RESEND_API_KEY));

/** First email address found in a prospect's "where to reach" field, if any. */
export function emailFrom(reach: string) {
  return reach.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? "";
}

// ---------- unsubscribe links ----------

export function unsubscribeToken(email: string) {
  return createHmac("sha256", process.env.ADMIN_SECRET ?? "").update(email.toLowerCase()).digest("base64url").slice(0, 32);
}

export function unsubscribeUrl(email: string) {
  return `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

export async function suppress(email: string, reason: string) {
  await sql`INSERT INTO suppressions (email, reason) VALUES (${email.toLowerCase()}, ${reason}) ON CONFLICT (email) DO NOTHING`;
}

// ---------- campaigns ----------

export async function getOrCreateCampaign(list: List) {
  const existing = (await sql`SELECT * FROM campaigns WHERE list_id = ${list.id}`) as Campaign[];
  if (existing[0]) return existing[0];
  const intro =
    list.publication === "The Experience Exchange"
      ? "I'm Sofia Iuteri, and I run The Experience Exchange, the student outdoor adventure magazine at Washington & Lee. We cover local trails, rivers and gear for W&L students and the Lexington community, in print and on Instagram (@expowlu). Local businesses like Walkabout Outfitter and Lex Running Shop already partner with us. Website: https://theexperienceexchange.vercel.app"
      : `I'm reaching out on behalf of ${list.publication}. ${list.summary}`;
  const signature =
    list.publication === "The Experience Exchange"
      ? "Sofia Iuteri\nFounder & Editor-in-Chief, The Experience Exchange\nhttps://theexperienceexchange.vercel.app"
      : `Sofia Iuteri\nSponsorFlow, on behalf of ${list.publication}`;
  const [row] = (await sql`
    INSERT INTO campaigns (list_id, sender_intro, signature) VALUES (${list.id}, ${intro}, ${signature})
    ON CONFLICT (list_id) DO UPDATE SET updated_at = now()
    RETURNING *`) as Campaign[];
  return row;
}

export async function getCampaignEmails(campaignId: string) {
  return (await sql`
    SELECT e.*, p.brand, p.status AS prospect_status FROM outreach_emails e
    JOIN prospects p ON p.id = e.prospect_id
    WHERE e.campaign_id = ${campaignId}
    ORDER BY e.step, p.position`) as OutreachEmail[];
}

// ---------- AI drafting ----------

const DraftSchema = z.object({
  emails: z.array(z.object({ brand: z.string(), subject: z.string(), body: z.string() })),
});

const DRAFT_SYSTEM = `You write first-touch sponsorship emails for small independent publications. Each email goes to one business and should read like a real person wrote it just for them.

Rules:
- 90 to 150 words in the body. Plain text, short paragraphs, no bullet points, no bold.
- Open with the specific opening line provided (you may lightly polish it), then who the sender is, then the one concrete sponsorship idea, then a low-pressure ask for a quick chat.
- Warm and personable, never salesy or generic. No exaggerated claims about audience size or results.
- Do not use em dashes or en dashes anywhere. Use commas and periods.
- Include the publication's website link once, naturally.
- End with the exact signature provided, on its own lines. Do not add anything after the signature.
- Subject lines: short, specific, lowercase-friendly, no clickbait (for example "The Experience Exchange x Twin River Outfitters").`;

async function draftWithAI(list: List, campaign: Campaign, prospects: (Prospect & { to: string })[]) {
  const client = new Anthropic();
  const items = prospects
    .map(
      (p, i) =>
        `${i + 1}. Brand: ${p.brand}\n   Category: ${p.category}\n   Why it fits: ${p.why}\n   Sponsorship idea: ${p.angle}\n   Opening line: ${p.opener}\n   Contact: ${p.contact}`,
    )
    .join("\n\n");
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 32000,
    system: DRAFT_SYSTEM,
    output_config: { effort: "medium", format: betaZodOutputFormat(DraftSchema) },
    messages: [
      {
        role: "user",
        content: `Publication: ${list.publication}\nAbout the sender (use this for the "who we are" part): ${campaign.sender_intro}\n\nSignature (end every email with exactly this):\n${campaign.signature}\n\nWrite one email for each of these businesses:\n\n${items}`,
      },
    ],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  return response.parsed_output?.emails ?? [];
}

const scrubDashes = (t: string) => t.replace(/\s*[—–]\s*/g, ", ");

/** Creates step-1 drafts for every prospect with a published email that doesn't have one yet. */
export async function draftCampaign(listId: string) {
  const [list] = (await sql`SELECT * FROM lists WHERE id = ${listId}`) as List[];
  if (!list) return { drafted: 0 };
  const campaign = await getOrCreateCampaign(list);
  const prospects = (await sql`
    SELECT p.* FROM prospects p
    WHERE p.list_id = ${listId}
      AND NOT EXISTS (SELECT 1 FROM outreach_emails e WHERE e.prospect_id = p.id AND e.step = 1)
    ORDER BY p.position`) as Prospect[];
  const targets = prospects.map((p) => ({ ...p, to: emailFrom(p.reach) })).filter((p) => p.to && !STOP_STATUSES.includes(p.status));
  if (!targets.length) return { drafted: 0 };

  let drafted = 0;
  for (let i = 0; i < targets.length; i += 10) {
    const batch = targets.slice(i, i + 10);
    const emails = await draftWithAI(list, campaign, batch);
    for (const p of batch) {
      const e = emails.find((x) => x.brand.trim().toLowerCase() === p.brand.trim().toLowerCase());
      if (!e) continue;
      await sql`
        INSERT INTO outreach_emails (campaign_id, prospect_id, step, to_email, subject, body)
        VALUES (${campaign.id}, ${p.id}, 1, ${p.to}, ${scrubDashes(e.subject)}, ${scrubDashes(e.body)})
        ON CONFLICT (prospect_id, step) DO NOTHING`;
      drafted++;
    }
  }
  return { drafted };
}

// ---------- sending ----------

function footer(email: string, publication: string, address = MAILING_ADDRESS) {
  return `\n\n\n--\nIf you'd rather not hear from us, just reply "no thanks" or unsubscribe here: ${unsubscribeUrl(email)}\n${publication} via SponsorFlow, ${address}`;
}

/**
 * Sends a copy of a draft to the owner's own inbox so they can see exactly what brands receive.
 * Allowed before a mailing address exists (it isn't sent to a brand); uses a visible placeholder.
 */
export async function sendTestCopy(emailId: string) {
  if (!process.env.RESEND_API_KEY) return { ok: false, note: "Email service isn't set up" };
  const [e] = (await sql`
    SELECT e.*, c.from_name, l.publication, l.customer_email FROM outreach_emails e
    JOIN campaigns c ON c.id = e.campaign_id JOIN lists l ON l.id = c.list_id
    WHERE e.id = ${emailId}`) as (OutreachEmail & { from_name: string; publication: string; customer_email: string })[];
  if (!e) return { ok: false, note: "Email not found" };
  const to = e.customer_email || FORWARD_TO;
  const { error } = await resend().emails.send({
    from: `${e.from_name} <${FROM_ADDRESS}>`,
    to: [to],
    subject: `[TEST] ${e.subject}`,
    text:
      `(Test copy. This would go to ${e.to_email}. Reply to it to see how replies get forwarded back to you.)\n\n` +
      e.body +
      footer(e.to_email, e.publication, MAILING_ADDRESS || "[your P.O. box address will appear here]"),
  });
  return error ? { ok: false, note: error.message } : { ok: true, note: `Test sent to ${to}` };
}

function followUpBody(signature: string) {
  return `Hi again,\n\nJust following up on my note below in case it got buried. I'd love to hear if a partnership could be a fit, and I'm happy to send more details or ideas.\n\nThanks so much,\n${signature}`;
}

async function sendOne(e: OutreachEmail, campaign: Campaign, publication: string) {
  const { data, error } = await resend().emails.send(
    {
      from: `${campaign.from_name} <${FROM_ADDRESS}>`,
      to: [e.to_email],
      subject: e.subject,
      text: e.body + footer(e.to_email, publication),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl(e.to_email)}>, <mailto:${FROM_ADDRESS}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "campaign", value: campaign.id },
        { name: "outreach", value: e.id },
      ],
    },
    { idempotencyKey: `outreach/${e.id}` },
  );
  if (error) {
    await sql`UPDATE outreach_emails SET status = 'failed', error = ${error.message.slice(0, 300)} WHERE id = ${e.id}`;
    return false;
  }
  await sql`UPDATE outreach_emails SET status = 'sent', resend_id = ${data?.id ?? null}, sent_at = now(), error = '' WHERE id = ${e.id}`;
  await sql`UPDATE prospects SET status = 'Contacted', updated_at = now() WHERE id = ${e.prospect_id} AND status = 'Prospect'`;
  return true;
}

/** Queues follow-ups for step-1 emails sent `followup_days` ago with no reply yet. */
async function queueFollowUps(campaign: Campaign) {
  if (!campaign.followups) return;
  await sql`
    INSERT INTO outreach_emails (campaign_id, prospect_id, step, to_email, subject, body, status)
    SELECT e.campaign_id, e.prospect_id, 2, e.to_email,
      CASE WHEN e.subject ILIKE 're:%' THEN e.subject ELSE 'Re: ' || e.subject END,
      ${followUpBody(campaign.signature)} || E'\\n\\n> ' || replace(e.body, E'\\n', E'\\n> '),
      'approved'
    FROM outreach_emails e JOIN prospects p ON p.id = e.prospect_id
    WHERE e.campaign_id = ${campaign.id} AND e.step = 1 AND e.status = 'sent'
      AND e.sent_at < now() - make_interval(days => ${campaign.followup_days})
      AND p.status = 'Contacted'
    ON CONFLICT (prospect_id, step) DO NOTHING`;
}

/** Sends today's batch for one campaign, respecting the daily cap, suppressions and replies. */
export async function sendCampaignBatch(campaignId: string) {
  const readiness = sendingReadiness();
  if (!readiness.ready) return { sent: 0, note: `Sending is off: missing ${readiness.missing.join(" and ")}` };

  const [campaign] = (await sql`SELECT * FROM campaigns WHERE id = ${campaignId}`) as Campaign[];
  if (!campaign || campaign.status !== "active") return { sent: 0, note: "Campaign isn't active" };
  const [list] = (await sql`SELECT * FROM lists WHERE id = ${campaign.list_id}`) as List[];

  await queueFollowUps(campaign);
  const [{ today }] = (await sql`
    SELECT count(*)::int AS today FROM outreach_emails
    WHERE campaign_id = ${campaignId} AND sent_at >= date_trunc('day', now())`) as { today: number }[];
  const room = Math.max(0, campaign.daily_cap - today);
  if (!room) return { sent: 0, note: "Daily limit reached" };

  const due = (await sql`
    SELECT e.* FROM outreach_emails e JOIN prospects p ON p.id = e.prospect_id
    WHERE e.campaign_id = ${campaignId} AND e.status = 'approved'
      AND p.status <> ALL(${STOP_STATUSES})
      AND lower(e.to_email) NOT IN (SELECT email FROM suppressions)
    ORDER BY e.step DESC, p.position
    LIMIT ${room}`) as OutreachEmail[];

  let sent = 0;
  for (const e of due) {
    if (await sendOne(e, campaign, list.publication)) sent++;
    await new Promise((r) => setTimeout(r, 1500)); // gentle pacing between sends
  }

  const [{ left }] = (await sql`
    SELECT count(*)::int AS left FROM outreach_emails WHERE campaign_id = ${campaignId} AND status IN ('approved', 'draft')`) as { left: number }[];
  const [{ waiting }] = (await sql`
    SELECT count(*)::int AS waiting FROM outreach_emails e JOIN prospects p ON p.id = e.prospect_id
    WHERE e.campaign_id = ${campaignId} AND e.step = 1 AND e.status = 'sent' AND p.status = 'Contacted'
      AND NOT EXISTS (SELECT 1 FROM outreach_emails f WHERE f.prospect_id = e.prospect_id AND f.step = 2)`) as { waiting: number }[];
  if (!left && (!campaign.followups || !waiting)) await sql`UPDATE campaigns SET status = 'done', updated_at = now() WHERE id = ${campaignId}`;
  return { sent, note: `Sent ${sent} today` };
}

export async function sendAllActive() {
  const active = (await sql`SELECT id FROM campaigns WHERE status = 'active'`) as { id: string }[];
  const results = [];
  for (const c of active) results.push({ id: c.id, ...(await sendCampaignBatch(c.id)) });
  return results;
}

// ---------- inbound replies and bounces ----------

const OPT_OUT = /\b(unsubscribe|no thanks|no thank you|remove me|stop emailing|not interested)\b/i;

export async function handleInboundReply(emailId: string, fromHeader: string, subject: string) {
  const from = emailFrom(fromHeader);
  const { data: email } = await resend().emails.receiving.get(emailId);
  const text = email?.text ?? "";

  const [match] = (await sql`
    SELECT e.id, e.prospect_id, l.customer_email, l.publication FROM outreach_emails e
    JOIN prospects p ON p.id = e.prospect_id JOIN lists l ON l.id = p.list_id
    WHERE lower(e.to_email) = ${from} AND e.status IN ('sent', 'replied')
    ORDER BY e.sent_at DESC NULLS LAST LIMIT 1`) as { id: string; prospect_id: string; customer_email: string; publication: string }[];

  if (match) {
    const optOut = OPT_OUT.test(text.split(/\n>|\nOn .+ wrote:/)[0] ?? "") || /^unsubscribe/i.test(subject);
    await sql`UPDATE outreach_emails SET status = 'replied' WHERE prospect_id = ${match.prospect_id} AND status = 'sent'`;
    await sql`UPDATE outreach_emails SET status = 'skipped' WHERE prospect_id = ${match.prospect_id} AND status IN ('approved', 'draft')`;
    await sql`
      UPDATE prospects SET status = ${optOut ? "Not now" : "Replied"},
        notes = trim(notes || E'\\n' || ${`[${new Date().toISOString().slice(0, 10)}] Replied by email${optOut ? " (asked not to be contacted)" : ""}`}),
        updated_at = now()
      WHERE id = ${match.prospect_id} AND status IN ('Prospect', 'Contacted')`;
    if (optOut) await suppress(from, "replied: opt-out");
  }

  // Forward everything to a real inbox so no reply is ever missed.
  const to = match?.customer_email || FORWARD_TO;
  await resend().emails.receiving.forward({ emailId, to, from: `SponsorFlow replies <replies@${SEND_DOMAIN}>` });
}

export async function handleBounce(fromHeaderTo: string[], reason: string) {
  for (const addr of fromHeaderTo) {
    const email = emailFrom(addr);
    if (!email) continue;
    await suppress(email, `bounced: ${reason}`.slice(0, 200));
    await sql`UPDATE outreach_emails SET status = 'failed', error = ${`Bounced: ${reason}`.slice(0, 300)} WHERE lower(to_email) = ${email} AND status = 'sent'`;
  }
}
