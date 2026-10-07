import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { sql, type List } from "./db";
import { onResearchComplete, onResearchFailed } from "./orders";

// AI sponsor research: (1) Claude researches with live web search and writes notes,
// (2) a second call turns those notes into validated structured prospects for the portal.
const client = new Anthropic();
const MODEL = "claude-opus-5-5";
// Refusal fallback: if a safety classifier declines, the API re-runs on a fallback model automatically.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

const ProspectSchema = z.object({
  brand: z.string(),
  category: z.string(),
  fit: z.enum(["High", "Medium", "Low"]),
  why: z.string(),
  angle: z.string(),
  opener: z.string(),
  contact: z.string(),
  reach: z.string(),
  evidence: z.string(),
});
const ResultSchema = z.object({ prospects: z.array(ProspectSchema) });

const researchSystem = (count: number) => `You research sponsorship prospects for small independent media: student publications, newsletters and podcasts. Your list is delivered to the publication as a paid product, so every entry must be real, current and genuinely useful.

Find exactly ${count} sponsor prospects for the publication described by the user. Use web search to verify each one.

What makes a good list:
- A mix of roughly half local or regional businesses and organizations near the publication, and half regional or national brands with a believable reason to reach this exact audience (student or ambassador programs, past sponsorship of similar media or events, products the audience already uses).
- Only real, currently operating businesses. Check that their site or social accounts show activity within the last year.
- Prefer prospects with evidence they already sponsor, advertise with, or partner with community, student or creator projects.
- Skip anything already listed as excluded. Skip alcohol, tobacco, vaping, gambling and similar brands when the audience includes people under 21.

For each prospect, record:
- Brand and category.
- Fit: High, Medium or Low for this audience.
- Why it fits: one or two specific sentences about this audience, not generic praise.
- Pitch angle: one concrete sponsorship idea (a sponsored guide, feature, giveaway, issue sponsorship, event or segment).
- Opening line: one warm, specific sentence the publication could start its email with. Write like a person, not a marketer. Do not use em dashes.
- Suggested contact: a role, or a named person only if the business itself publishes that person as its marketing, partnerships or community contact.
- Where to reach them: if you happen to see a published email, contact form or partnerships page while researching, record it. Otherwise write "TBD". A second pass looks up contacts, so don't spend searches on them now.
- Evidence: a URL that shows why they fit.

If you cannot verify a detail, say so in that field rather than inventing it. Finish with all ${count} prospects written out clearly.`;

function profileText(list: List, exclude: string[]) {
  return [
    `Publication: ${list.publication}`,
    list.summary && `About: ${list.summary}`,
    list.profile && `Details from the publication:\n${list.profile}`,
    exclude.length ? `Excluded (already on their list or existing sponsors): ${exclude.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function runWebResearch(prompt: string, count: number) {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  let final: Anthropic.Beta.BetaMessage | null = null;

  // Server-side web search can pause long turns (pause_turn); resume until the model finishes.
  for (let turn = 0; turn < 4; turn++) {
    final = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 32000,
        system: researchSystem(count),
        output_config: { effort: "medium" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: count <= 5 ? 6 : 12 }],
        messages,
        ...FALLBACK,
      })
      .finalMessage();
    if (final.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: final.content });
  }

  if (!final) throw new Error("No response from research model");
  if (final.stop_reason === "refusal") throw new Error("The research request was declined.");
  const notes = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!notes) throw new Error("Research returned no notes");
  return notes;
}

async function structure(notes: string) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(ResultSchema) },
    messages: [
      {
        role: "user",
        content: `Convert these sponsor research notes into the structured format. Keep every verified detail and URL exactly as written, keep wording close to the notes, and replace any em dashes with commas or periods. Leave a field empty if the notes don't have it.\n\n<notes>\n${notes}\n</notes>`,
      },
    ],
    ...FALLBACK,
  });
  if (!response.parsed_output) throw new Error("Could not structure the research notes");
  return response.parsed_output.prospects;
}

/**
 * Starts phase 2 in a fresh serverless invocation (its own time budget) by calling our own route.
 * Falls back to running inline when no site URL is configured (local scripts).
 */
async function queueContactLookup(listId: string) {
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";
  if (!base || !process.env.ADMIN_SECRET) return enrichContacts(listId);
  const res = await fetch(`${base}/api/research/contacts`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.ADMIN_SECRET}` },
    body: JSON.stringify({ listId }),
  });
  if (!res.ok) throw new Error(`Couldn't start contact lookup (${res.status})`);
}

export async function researchList(listId: string, { count = 20 }: { count?: number } = {}) {
  const [list] = (await sql`SELECT * FROM lists WHERE id = ${listId}`) as List[];
  if (!list) return;
  await sql`UPDATE lists SET research_status = 'running', research_note = 'Researching sponsors…', updated_at = now() WHERE id = ${listId}`;

  try {
    const existing = (await sql`SELECT brand FROM prospects WHERE list_id = ${listId}`) as { brand: string }[];
    const notes = await runWebResearch(profileText(list, existing.map((e) => e.brand)), count);
    const prospects = await structure(notes);

    const seen = new Set(existing.map((e) => e.brand.toLowerCase()));
    const order = { High: 0, Medium: 1, Low: 2 };
    const fresh = prospects.slice(0, count).filter((p) => p.brand && !seen.has(p.brand.toLowerCase())).sort((a, b) => order[a.fit] - order[b.fit]);

    const [{ start }] = (await sql`SELECT coalesce(max(position), -1) + 1 AS start FROM prospects WHERE list_id = ${listId}`) as { start: number }[];
    for (const [i, p] of fresh.entries()) {
      await sql`
        INSERT INTO prospects (list_id, position, brand, category, fit, why, angle, opener, contact, reach, evidence)
        VALUES (${listId}, ${start + i}, ${p.brand}, ${p.category}, ${p.fit}, ${p.why}, ${p.angle}, ${p.opener}, ${p.contact}, ${p.reach}, ${p.evidence})`;
    }
    await sql`
      UPDATE lists SET research_status = 'running', research_note = ${`Added ${fresh.length} prospects. Finding contacts next…`}, researched_at = now(), updated_at = now()
      WHERE id = ${listId}`;
    await queueContactLookup(listId);
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? `AI service error (${err.status})` : err instanceof Error ? err.message : "Unknown error";
    console.error("[research]", listId, err);
    await sql`UPDATE lists SET research_status = 'error', research_note = ${message.slice(0, 300)}, updated_at = now() WHERE id = ${listId}`;
    await onResearchFailed(listId, message);
  }
}

// ---------- Phase 2: contact lookup ----------

const ContactSchema = z.object({
  contacts: z.array(z.object({ brand: z.string(), contact: z.string(), reach: z.string() })),
});

const CONTACT_SYSTEM = `You find the right published contact for sponsorship outreach. For each business listed, search the web and read its site to find who handles marketing, partnerships, sponsorships, donations or community giving, and where to reach them.

Rules:
- Only use contact details the business itself publishes for contact (its own website or official pages). Never guess, construct or infer an email address from a name or pattern.
- Prefer, in order: a published partnerships, sponsorship or marketing email; a sponsorship, donation or community-giving form URL; a general contact email; a general contact form URL.
- Contact: the role or team (for example "Marketing team" or "Community giving"), or a named person only if the business publishes that person as the contact.
- If you truly can't find anything, give the business's main contact page URL and say so.

Finish by listing every business with its contact and where to reach them.`;

async function lookupContacts(batch: { brand: string; category: string; evidence: string }[], publication: string) {
  const list = batch.map((b) => `- ${b.brand} (${b.category})${b.evidence ? `, related page: ${b.evidence}` : ""}`).join("\n");
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Find sponsorship contacts for these businesses, for outreach from ${publication}:\n${list}` },
  ];
  let final: Anthropic.Beta.BetaMessage | null = null;
  for (let turn = 0; turn < 3; turn++) {
    final = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 16000,
        system: CONTACT_SYSTEM,
        output_config: { effort: "medium" },
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 10 },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 10 },
        ],
        messages,
        ...FALLBACK,
      })
      .finalMessage();
    if (final.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: final.content });
  }
  const notes = (final?.content ?? [])
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!notes.trim()) return [];

  const parsed = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "low", format: betaZodOutputFormat(ContactSchema) },
    messages: [
      {
        role: "user",
        content: `Extract each business's contact and where to reach them (email or URL) from these notes. Copy emails and URLs exactly. Use the brand names as listed: ${batch.map((b) => b.brand).join("; ")}.\n\n<notes>\n${notes}\n</notes>`,
      },
    ],
    ...FALLBACK,
  });
  return parsed.parsed_output?.contacts ?? [];
}

const needsContact = (reach: string) => !reach.trim() || /^(tbd|not checked|unknown|n\/a)/i.test(reach.trim()) || !/[@.]/.test(reach);

export async function enrichContacts(listId: string) {
  const [list] = (await sql`SELECT * FROM lists WHERE id = ${listId}`) as List[];
  if (!list) return;
  const rows = (await sql`SELECT id, brand, category, evidence, reach FROM prospects WHERE list_id = ${listId}`) as {
    id: string; brand: string; category: string; evidence: string; reach: string;
  }[];
  const todo = rows.filter((r) => needsContact(r.reach));
  if (!todo.length) {
    await sql`UPDATE lists SET research_status = 'done', updated_at = now() WHERE id = ${listId}`;
    await onResearchComplete(listId);
    return;
  }
  await sql`UPDATE lists SET research_status = 'running', research_note = ${`Finding contacts for ${todo.length} brands…`}, updated_at = now() WHERE id = ${listId}`;

  const batches: (typeof todo)[] = [];
  for (let i = 0; i < todo.length; i += 5) batches.push(todo.slice(i, i + 5));
  const results = await Promise.allSettled(batches.map((b) => lookupContacts(b, list.publication)));

  let found = 0;
  for (const r of results) {
    if (r.status !== "fulfilled") {
      console.error("[contacts]", listId, r.reason);
      continue;
    }
    for (const c of r.value) {
      const row = todo.find((t) => t.brand.toLowerCase() === c.brand.toLowerCase());
      if (!row || !c.reach.trim()) continue;
      await sql`UPDATE prospects SET contact = ${c.contact}, reach = ${c.reach}, updated_at = now() WHERE id = ${row.id}`;
      found++;
    }
  }
  await sql`
    UPDATE lists SET research_status = 'done', research_note = ${`Research complete: contacts found for ${found} of ${todo.length} brands`}, updated_at = now()
    WHERE id = ${listId}`;
  await onResearchComplete(listId);
}
