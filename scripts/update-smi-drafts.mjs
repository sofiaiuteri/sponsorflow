// Replaces subject/body of SMI Consulting DRAFT first emails with the latest ~/smi-outreach/emails.json. Never touches sent emails.
import fs from "node:fs"; import os from "node:os"; import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const E = JSON.parse(fs.readFileSync(`${os.homedir()}/smi-outreach/emails.json`, "utf8"));
const [c] = await sql`SELECT c.id FROM campaigns c JOIN lists l ON l.id = c.list_id WHERE l.publication = 'SMI Consulting'`;
let n = 0;
for (let i = 0; i < E.length; i += 200) {
  const ch = E.slice(i, i + 200);
  const r = await sql.query(
    `UPDATE outreach_emails o SET subject = u.s, body = u.b FROM unnest($2::text[], $3::text[], $4::text[]) AS u(e, s, b)
     WHERE o.campaign_id = $1 AND o.step = 1 AND o.status IN ('draft','approved') AND lower(o.to_email) = u.e RETURNING o.id`,
    [c.id, ch.map((e) => e.to.toLowerCase()), ch.map((e) => e.subject), ch.map((e) => e.body)]);
  n += r.length;
}
console.log(`updated ${n} of ${E.length} drafts`);
