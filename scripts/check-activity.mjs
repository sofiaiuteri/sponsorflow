// Prints replies and paid orders that arrived since the last run (for monitoring from Claude Code).
// Usage: node --env-file=.env.local scripts/check-activity.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const stateFile = `${homedir()}/.sponsorflow-last-check`;
let since;
try { since = readFileSync(stateFile, "utf8").trim(); } catch { since = new Date().toISOString(); }
const now = new Date().toISOString();

const replies = await sql`
  SELECT r.from_email, r.from_name, r.subject, r.body, p.brand, l.publication AS campaign
  FROM inbound_replies r LEFT JOIN prospects p ON p.id = r.prospect_id LEFT JOIN lists l ON l.id = r.list_id
  WHERE r.received_at > ${since} ORDER BY r.received_at`;
const orders = await sql`SELECT publication, plan, amount_cents, customer_email FROM lists WHERE paid_at > ${since} ORDER BY paid_at`;
writeFileSync(stateFile, now);

if (!replies.length && !orders.length) {
  console.log(`NOTHING NEW since ${since}`);
} else {
  for (const o of orders) console.log(`ORDER: ${o.publication} paid $${(o.amount_cents / 100).toFixed(2)} (${o.plan === "dfy" ? "Done-for-you" : "Sponsor List"}) by ${o.customer_email}`);
  for (const r of replies) {
    const first = (r.body.split(/\n>|\nOn .{5,200} wrote:/)[0] || "").replace(/\s+/g, " ").trim().slice(0, 140);
    const who = r.brand || r.from_name || r.from_email;
    const tag = r.campaign === "SponsorFlow" ? "SponsorFlow sales" : r.campaign || "other";
    console.log(`REPLY: ${who} [${tag}] <${r.from_email}>: "${first}"`);
  }
}
