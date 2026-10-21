import { Resend } from "resend";
import { sql } from "./db";
import { FROM_ADDRESS } from "./outreach";

// Free AI visibility check requests from /ai-check. Sofia runs the check (~/geo-checks) and emails the report.
const OWNER_EMAIL = process.env.REPLY_FORWARD_TO || "sofiaiuteri@icloud.com";

export type AiCheckRequest = {
  business: string; website: string; city: string; kind: string; name: string; email: string; notes: string;
};

export async function saveAiCheck(r: AiCheckRequest) {
  const [row] = (await sql`
    INSERT INTO ai_check_requests (business, website, city, kind, name, email, notes)
    VALUES (${r.business}, ${r.website}, ${r.city}, ${r.kind}, ${r.name}, ${r.email}, ${r.notes})
    RETURNING id`) as { id: string }[];

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `SponsorFlow AI checks <${FROM_ADDRESS}>`,
      to: [OWNER_EMAIL],
      replyTo: r.email,
      subject: `New AI visibility check: ${r.business} (${r.city})`,
      text: `${r.name} (${r.email}) asked for a free AI visibility check.\n\nBusiness: ${r.business}\nType: ${r.kind}\nCity: ${r.city}\nWebsite: ${r.website || "-"}\n\nWhat customers usually ask:\n${r.notes || "-"}\n\nPromised: report within 2 business days. Reply to this email to reach them.`,
    });
    if (error) console.error("[ai-check] notify failed", error.message);
  }
  return row.id;
}
