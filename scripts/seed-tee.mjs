// Loads The Experience Exchange's own sponsor list (the SponsorFlow test case).
// Usage: node --env-file=.env.local scripts/seed-tee.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const prospects = JSON.parse(readFileSync(new URL("./tee-prospects.json", import.meta.url), "utf8"));
const order = { High: 0, Medium: 1, Low: 2 };
prospects.sort((a, b) => order[a.fit] - order[b.fit]);

const existing = await sql`SELECT id, token FROM lists WHERE publication = 'The Experience Exchange'`;
if (existing.length) {
  console.log("already seeded:", existing[0].token);
  process.exit(0);
}
const [list] = await sql`
  INSERT INTO lists (publication, summary, plan, customer_email)
  VALUES ('The Experience Exchange', 'Student outdoor adventure magazine at Washington & Lee, Lexington VA. Readers: W&L students and the Rockbridge community.', 'dfy', 'sofiaiuteri@icloud.com')
  RETURNING id, token`;
for (const [i, p] of prospects.entries()) {
  await sql`
    INSERT INTO prospects (list_id, position, brand, category, fit, why, angle, opener, contact, reach, evidence)
    VALUES (${list.id}, ${i}, ${p.brand}, ${p.category}, ${p.fit}, ${p.why}, ${p.angle}, ${p.opener}, ${p.contact}, ${p.reach}, ${p.evidence})`;
}
console.log("seeded", prospects.length, "prospects; token:", list.token);
