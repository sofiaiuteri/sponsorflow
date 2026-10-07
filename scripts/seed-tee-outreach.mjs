// Loads The Experience Exchange's hand-reviewed pitches as outreach drafts.
// Usage: node --env-file=.env.local scripts/seed-tee-outreach.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const pitches = JSON.parse(readFileSync(new URL("./tee-pitches.json", import.meta.url), "utf8"));
const [list] = await sql`SELECT * FROM lists WHERE publication = 'The Experience Exchange'`;
const intro = "I'm Sofia Iuteri, and I run The Experience Exchange, the student outdoor adventure magazine at Washington & Lee. We cover local trails, rivers and gear for W&L students and the Lexington community, in print and on Instagram (@expowlu). Local businesses like Walkabout Outfitter and Lex Running Shop already partner with us. Website: https://theexperienceexchange.vercel.app";
const signature = "Sofia Iuteri\nFounder & Editor-in-Chief, The Experience Exchange\nhttps://theexperienceexchange.vercel.app";
const [campaign] = await sql`
  INSERT INTO campaigns (list_id, sender_intro, signature) VALUES (${list.id}, ${intro}, ${signature})
  ON CONFLICT (list_id) DO UPDATE SET updated_at = now() RETURNING *`;
const prospects = await sql`SELECT id, brand, reach FROM prospects WHERE list_id = ${list.id}`;
const emailOf = (s) => s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? "";
let n = 0;
for (const p of pitches) {
  const prospect = prospects.find((x) => x.brand === p.pub);
  const to = prospect && emailOf(prospect.reach);
  if (!to) continue;
  await sql`
    INSERT INTO outreach_emails (campaign_id, prospect_id, step, to_email, subject, body)
    VALUES (${campaign.id}, ${prospect.id}, 1, ${to}, ${p.subject.replace(" × ", " x ")}, ${p.message})
    ON CONFLICT (prospect_id, step) DO NOTHING`;
  n++;
}
console.log("drafts loaded:", n, "of", pitches.length, "(the rest use contact forms)");
