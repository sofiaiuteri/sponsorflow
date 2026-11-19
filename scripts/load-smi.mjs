// Loads SMI Consulting outreach (~/smi-outreach/emails.json) as DRAFT emails in a paused campaign.
// Nothing is sent: the cron only sends status 'approved' emails in 'active' campaigns.
// Skips anyone already emailed by any campaign or on the suppression list. Safe to re-run.
// Usage: node --env-file=.env.local scripts/load-smi.mjs [--dry]
import fs from "node:fs";
import os from "node:os";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const dry = process.argv.includes("--dry");
const emails = JSON.parse(fs.readFileSync(`${os.homedir()}/smi-outreach/emails.json`, "utf8"));

const prior = new Set(
  (await sql`SELECT lower(to_email) AS e FROM outreach_emails UNION SELECT lower(email) FROM suppressions`).map((r) => r.e),
);
const fresh = emails.filter((e) => !prior.has(e.to.toLowerCase()));
console.log(`${emails.length} drafted, ${emails.length - fresh.length} already contacted or suppressed, ${fresh.length} to load`);
if (dry) process.exit(0);

let [list] = await sql`SELECT id FROM lists WHERE publication = 'SMI Consulting'`;
if (!list) {
  [list] = await sql`
    INSERT INTO lists (publication, summary, website)
    VALUES ('SMI Consulting', 'Outreach to small businesses for websites and automation', 'https://smi-consulting.vercel.app')
    RETURNING id`;
}
let [campaign] = await sql`SELECT * FROM campaigns WHERE list_id = ${list.id}`;
if (!campaign) {
  [campaign] = await sql`
    INSERT INTO campaigns (list_id, status, from_name, sender_intro, signature, daily_cap, followup_days, followups)
    VALUES (${list.id}, 'paused', 'Sofia Iuteri', 'SMI Consulting', ${"Best,\nSofia Iuteri\nFounder, SMI Consulting"}, 20, 4, true)
    RETURNING *`;
}
const have = new Set((await sql`SELECT lower(reach) AS r FROM prospects WHERE list_id = ${list.id}`).map((r) => r.r));
const todo = fresh.filter((e) => !have.has(e.to.toLowerCase()));
const [{ start }] = await sql`SELECT coalesce(max(position), 0) AS start FROM prospects WHERE list_id = ${list.id}`;

for (let i = 0; i < todo.length; i += 100) {
  const chunk = todo.slice(i, i + 100);
  const rows = await sql.query(
    `INSERT INTO prospects (list_id, position, brand, category, contact, reach, evidence, notes)
     SELECT $1, * FROM unnest($2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[])
     RETURNING id, reach`,
    [
      list.id,
      chunk.map((_, j) => start + i + j + 1),
      chunk.map((e) => e.name),
      chunk.map((e) => e.segment),
      chunk.map((e) => e.contact || ""),
      chunk.map((e) => e.to),
      chunk.map((e) => e.website),
      chunk.map((e) => `${e.variant} | subject ${e.subject_option} | ${e.issue_code || "no issue"} | ${e.town || ""} | ${e.phone || ""}`),
    ],
  );
  const byEmail = Object.fromEntries(rows.map((r) => [r.reach.toLowerCase(), r.id]));
  await sql.query(
    `INSERT INTO outreach_emails (campaign_id, prospect_id, step, to_email, subject, body, status)
     SELECT $1, * , 'draft' FROM unnest($2::uuid[], $3::int[], $4::text[], $5::text[], $6::text[])
     ON CONFLICT (prospect_id, step) DO NOTHING`,
    [
      campaign.id,
      chunk.map((e) => byEmail[e.to.toLowerCase()]),
      chunk.map(() => 1),
      chunk.map((e) => e.to),
      chunk.map((e) => e.subject),
      chunk.map((e) => e.body),
    ],
  );
  console.log(`loaded ${Math.min(i + 100, todo.length)}/${todo.length}`);
}
console.log(`Done. Campaign ${campaign.id} is '${campaign.status}' (nothing sends until it's active and emails are approved).`);
